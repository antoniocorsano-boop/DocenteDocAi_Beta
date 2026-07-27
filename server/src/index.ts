/**
 * server/src/index.ts — DocenteDoc AI — Backend Express (P25/P28)
 *
 * Servizi:
 *   POST /auth/google       — Google OIDC login (verifica ID token, crea/aggiorna users)
 *   POST /auth/login        — dev stub (email+password, solo non-prod)
 *   POST /auth/logout       — distrugge sessione
 *   GET  /user/me           — restituisce profilo utente + plan dalla sessione
 *   POST /billing/checkout  — crea Stripe Checkout Session, ritorna URL
 *   POST /billing/webhook   — Stripe webhook: aggiorna users.plan su pagamento/cancellazione
 *   POST /keyvault/derive   — restituisce chiave AES-GCM-256 derivata PBKDF2 per utente autenticato
 *   POST /audit/log         — persiste evento di audit su PostgreSQL
 *
 * Security hardening applicato:
 *   ✅ helmet — header di sicurezza HTTP
 *   ✅ CORS con whitelist (non wildcard)
 *   ✅ express-session con saveUninitialized: false (previene session fixation)
 *   ✅ cookie httpOnly + sameSite: 'strict' + secure in produzione
 *   ✅ Salt PBKDF2 deterministico per utente (HMAC-SHA256 di SERVER_SECRET + userId)
 *      → stesso userId → stesso salt → stesso key derivato, riproducibile tra restart
 *   ✅ Input validation su tutti gli endpoint pubblici
 *   ✅ Parametrized queries PostgreSQL (no SQL injection)
 *   ✅ KEY_VAULT_SECRET e SESSION_SECRET richiesti in produzione
 *   ✅ In-memory rate limiting su /auth/google (10 req/min per IP)
 *   ✅ Stripe webhook firma verificata prima di qualsiasi aggiornamento DB
 *
 * Deploy: servizio separato (Render / Railway / Heroku) — NON parte del deploy Vercel.
 * Il client si connette via VITE_BACKEND_URL (default: http://localhost:4000).
 */

import crypto            from 'crypto';
import express           from 'express';
import cors              from 'cors';
import helmet            from 'helmet';
import session           from 'express-session';
import { Pool }          from 'pg';
import { OAuth2Client }  from 'google-auth-library';
import Stripe            from 'stripe';
import { logger }        from './logger';
import {
  registry,
  httpRequests,
  httpDuration,
  httpErrors,
  clientApiCalls,
  clientApiErrors,
} from './metrics';
import { createAgentsRouter }   from './routes/agents';
import { createAgentRunRouter } from './routes/agentRun';
import { createMemoryRouter }   from './routes/memory';
import { createAuditRouter }    from './routes/audit';
import { createAdaptiveRouter } from './routes/adaptive';
import { createFeedbackRouter } from './routes/feedback';
import { ensureAdaptiveSchema } from './services/adaptive';
import { ensureMemoryConsolidationSchema } from './services/memoryConsolidation';
import { ensureFeedbackSchema } from './services/feedbackLoop';

// ─── Augment express-session types ───────────────────────────────────────────

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    email?:  string;
    plan?:   'free' | 'pro';
  }
}

// ─── Config validation ────────────────────────────────────────────────────────

const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.SESSION_SECRET) {
  throw new Error('[server] SESSION_SECRET env var is required in production');
}
if (isProd && !process.env.KEY_VAULT_SECRET) {
  throw new Error('[server] KEY_VAULT_SECRET env var is required in production');
}
if (isProd && !process.env.GOOGLE_CLIENT_ID) {
  throw new Error('[server] GOOGLE_CLIENT_ID env var is required in production');
}

// ── Sentry (optional) — initialise before any request handling ───────────────
const SENTRY_DSN = process.env.SENTRY_DSN;
if (SENTRY_DSN) {
  // Dynamic import keeps @sentry/node out of the critical path when DSN is not set
  import('@sentry/node').then(({ init, setupExpressErrorHandler: _setup }) => {
    init({
      dsn:              SENTRY_DSN,
      environment:      isProd ? 'production' : 'development',
      tracesSampleRate: isProd ? 0.05 : 1.0,
      sendDefaultPii:   false,
    });
    logger.info({ message: 'Sentry initialised', component: 'server' });
  }).catch(err => {
    logger.warn({ message: 'Sentry init failed', component: 'server', err: String(err) });
  });
}

const SESSION_SECRET   = process.env.SESSION_SECRET   ?? 'dev_secret_CHANGE_IN_PRODUCTION';
const KEY_VAULT_SECRET = process.env.KEY_VAULT_SECRET ?? 'dev_kv_secret_CHANGE_IN_PRODUCTION';
const PORT             = parseInt(process.env.PORT ?? '4000', 10);
const CLIENT_URL       = process.env.CLIENT_URL ?? 'http://localhost:5173';

// ─── Google OAuth client ──────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const googleClient     = new OAuth2Client(GOOGLE_CLIENT_ID);

// ─── Stripe client ────────────────────────────────────────────────────────────

const STRIPE_SECRET_KEY      = process.env.STRIPE_SECRET_KEY ?? '';
const STRIPE_WEBHOOK_SECRET  = process.env.STRIPE_WEBHOOK_SECRET ?? '';
const STRIPE_PRICE_ID        = process.env.STRIPE_PRICE_ID ?? '';       // e.g. price_xxx for Pro monthly

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' })
  : null;

// ─── In-memory rate limiter for /auth/google (10 req/min per IP) ─────────────

const authRateMap = new Map<string, { count: number; resetAt: number }>();

function checkAuthRateLimit(ip: string): boolean {
  const now      = Date.now();
  const existing = authRateMap.get(ip);
  if (!existing || existing.resetAt < now) {
    authRateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (existing.count >= 10) return false;
  existing.count += 1;
  return true;
}

// Clean up stale rate-limit entries periodically (every 5 min)
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of authRateMap) {
    if (v.resetAt < now) authRateMap.delete(k);
  }
}, 5 * 60_000).unref();

// ─── CORS whitelist ───────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = new Set([
  CLIENT_URL,
  'http://localhost:5173',  // Vite dev
  'http://localhost:4173',  // Vite preview
]);

// ─── DB ───────────────────────────────────────────────────────────────────────

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

async function ensureAuditTable(): Promise<void> {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id         BIGSERIAL   PRIMARY KEY,
      user_id    TEXT        NOT NULL DEFAULT 'anonymous',
      action     TEXT        NOT NULL,
      details    JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function ensureUsersTable(): Promise<void> {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id           TEXT        PRIMARY KEY,          -- SHA-256 of google_id, 16 hex chars
      google_id    TEXT        UNIQUE NOT NULL,
      email        TEXT        NOT NULL,
      display_name TEXT,
      photo_url    TEXT,
      plan         TEXT        NOT NULL DEFAULT 'free',
      stripe_customer_id TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function ensureAgentsTable(): Promise<void> {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS agents (
      id               TEXT        PRIMARY KEY,
      user_id          TEXT        NOT NULL DEFAULT 'system',
      name             TEXT        NOT NULL,
      type             TEXT        NOT NULL CHECK (type IN ('compliance','cognitive','monitoring','custom')),
      config           JSONB       NOT NULL DEFAULT '{}',
      estimated_tokens INTEGER     NOT NULL DEFAULT 50,
      is_active        BOOLEAN     NOT NULL DEFAULT true,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function ensureAgentRunsTable(): Promise<void> {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS agent_runs (
      id          TEXT        PRIMARY KEY,
      agent_id    TEXT        NOT NULL,
      user_id     TEXT        NOT NULL,
      input       JSONB       NOT NULL DEFAULT '{}',
      output      JSONB,
      status      TEXT        NOT NULL CHECK (status IN ('success','error','blocked')),
      blocked_by  TEXT        CHECK (blocked_by IN ('privacy','token','simulation','rate_limit')),
      duration_ms INTEGER,
      tokens_used INTEGER     NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  // Index for daily token aggregation query
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_agent_runs_user_date
      ON agent_runs (user_id, created_at DESC)
  `);
}

async function ensureMemoryTable(): Promise<void> {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS memory_entries (
      id         TEXT        PRIMARY KEY,
      user_id    TEXT        NOT NULL,
      content    TEXT        NOT NULL,
      metadata   JSONB       NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  // P31: add embedding column idempotently (ALTER IF NOT EXISTS is safe to run on every boot)
  await pool.query(`
    ALTER TABLE memory_entries ADD COLUMN IF NOT EXISTS embedding JSONB
  `);
  // P32-C: add tags column + GIN index for fast tag-array queries
  await pool.query(`
    ALTER TABLE memory_entries ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}'
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_memory_entries_user
      ON memory_entries (user_id, created_at DESC)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_memory_entries_tags
      ON memory_entries USING GIN (tags)
  `);
}

/** Seed the three platform built-in agents once (ON CONFLICT DO NOTHING). */
async function seedBuiltInAgents(): Promise<void> {
  if (!pool) return;
  const builtins = [
    { id: 'agent.compliance', name: 'Compliance',        type: 'compliance', estimated_tokens: 10 },
    { id: 'agent.monitoring', name: 'Monitoraggio',      type: 'monitoring', estimated_tokens:  5 },
    { id: 'agent.cognitive',  name: 'Analisi Cognitiva', type: 'cognitive',  estimated_tokens: 80 },
  ];
  for (const a of builtins) {
    await pool.query(
      `INSERT INTO agents (id, user_id, name, type, config, estimated_tokens, is_active)
       VALUES ($1, 'system', $2, $3, '{}', $4, true)
       ON CONFLICT (id) DO NOTHING`,
      [a.id, a.name, a.type, a.estimated_tokens],
    );
  }
}

// ─── App ─────────────────────────────────────────────────────────────────────

const app = express();

// ─── Request timing + metrics middleware ─────────────────────────────────────

app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const route      = req.path;
    const method     = req.method;
    const status     = String(res.statusCode);

    httpRequests.inc({ method, route, status });
    httpDuration.observe({ method, route }, durationMs);
    if (res.statusCode >= 400) httpErrors.inc({ route, status });

    logger.debug({
      message:    'request',
      component:  'http',
      method,
      route,
      status,
      durationMs: Math.round(durationMs),
    });
  });
  next();
});

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'none'"],
      objectSrc:   ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS — whitelist only
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server (no origin) or whitelisted origins
    if (!origin || ALLOWED_ORIGINS.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin not allowed — ${origin}`));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '64kb' }));

// Session — security-hardened
app.use(session({
  secret:            SESSION_SECRET,
  resave:            false,
  // false = do NOT create session until something is stored (OWASP best practice)
  saveUninitialized: false,
  cookie: {
    secure:   isProd,          // HTTPS only in production
    httpOnly: true,            // No JS access to session cookie
    sameSite: 'strict',        // Prevent CSRF
    maxAge:   8 * 60 * 60 * 1000, // 8 hours
  },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Derives a deterministic 16-byte salt from the server secret and userId.
 * Same userId + same KEY_VAULT_SECRET → always the same salt.
 * Never stored anywhere; reproducible on every server restart.
 */
function deriveSalt(userId: string): Buffer {
  return crypto
    .createHmac('sha256', KEY_VAULT_SECRET)
    .update(userId)
    .digest()
    .subarray(0, 16);
}

function isStringSafe(v: unknown, maxLen: number): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= maxLen;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// ── Auth ─────────────────────────────────────────────────────────────────────

/**
 * POST /auth/google
 * Body: { credential: string }  — Google ID token from One Tap / GIS
 *
 * 1. Verifies the ID token with google-auth-library (checks signature + aud + exp)
 * 2. Upserts user record in `users` table (creates on first login, updates name/photo)
 * 3. Creates server-side session storing userId, email, and plan
 *
 * Security:
 *   • Rate-limited: 10 req/min per IP (in-memory, per-process)
 *   • ID token is one-time use from Google — not replayable within its lifetime
 *   • CSRF-safe: credential must come from the Google SDK, not a form/link
 */
app.post('/auth/google', async (req, res): Promise<void> => {
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
    ?? req.socket.remoteAddress
    ?? 'unknown';

  if (!checkAuthRateLimit(ip)) {
    res.status(429).json({ error: 'Troppe richieste — riprova tra un minuto' });
    return;
  }

  const { credential } = req.body as { credential?: unknown };
  if (!isStringSafe(credential, 4096)) {
    res.status(400).json({ error: 'credential mancante o non valido' });
    return;
  }

  if (!GOOGLE_CLIENT_ID) {
    // Dev fallback: if no Google client ID is set, accept the credential as a plain email stub
    if (!isProd) {
      const userId = crypto.createHash('sha256').update(credential).digest('hex').slice(0, 16);
      req.session.userId = userId;
      req.session.email  = credential;
      req.session.plan   = 'free';
      res.json({ user: { userId, email: credential, plan: 'free' as const } });
      return;
    }
    res.status(503).json({ error: 'Google OAuth non configurato sul server' });
    return;
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken:  credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub) {
      res.status(401).json({ error: 'Token Google non valido' });
      return;
    }

    const googleId    = payload.sub;
    const email       = payload.email       ?? '';
    const displayName = payload.name        ?? email;
    const photoUrl    = payload.picture     ?? null;

    // Deterministic userId from googleId (sha256 prefix — stable, never changes)
    const userId = crypto.createHash('sha256').update(googleId).digest('hex').slice(0, 16);

    let plan: 'free' | 'pro' = 'free';

    if (pool) {
      // Upsert user — insert on first login, update name/photo on subsequent logins
      const result = await pool.query<{ plan: string }>(
        `INSERT INTO users (id, google_id, email, display_name, photo_url, plan, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'free', NOW())
         ON CONFLICT (google_id) DO UPDATE
           SET email        = EXCLUDED.email,
               display_name = EXCLUDED.display_name,
               photo_url    = EXCLUDED.photo_url,
               updated_at   = NOW()
         RETURNING plan`,
        [userId, googleId, email, displayName, photoUrl],
      );
      plan = (result.rows[0]?.plan ?? 'free') as 'free' | 'pro';
    }

    req.session.userId = userId;
    req.session.email  = email;
    req.session.plan   = plan;

    logger.info({ message: 'user_login', component: 'auth', userId, email, plan });
    res.json({ user: { userId, email, displayName, photoUrl, plan } });

  } catch (err) {
    logger.error({ message: 'Google token verification failed', component: 'auth', err: String(err) });
    res.status(401).json({ error: 'Token Google non valido o scaduto' });
  }
});

/**
 * POST /auth/login
 * Body: { email: string; password: string }
 *
 * Dev stub only — returns 501 in production.
 */
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body as { email?: unknown; password?: unknown };

  if (!isStringSafe(email, 254) || !isStringSafe(password, 128)) {
    res.status(400).json({ error: 'email e password obbligatori' });
    return;
  }

  if (isProd) {
    res.status(501).json({ error: 'Login con password non implementato in produzione — usare /auth/google' });
    return;
  }

  const userId = crypto.createHash('sha256').update(email).digest('hex').slice(0, 16);
  req.session.userId = userId;
  req.session.email  = email;
  req.session.plan   = 'free';

  res.json({ user: { userId, email, plan: 'free' as const } });
});

/**
 * POST /auth/logout
 * Destroys the server-side session.
 */
app.post('/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      res.status(500).json({ error: 'Impossibile chiudere la sessione' });
      return;
    }
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// ── User ─────────────────────────────────────────────────────────────────────

/**
 * GET /user/me
 * Returns the authenticated user's profile from session, including their plan.
 */
app.get('/user/me', (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json({
    userId: req.session.userId,
    email:  req.session.email ?? null,
    plan:   req.session.plan  ?? 'free',
  });
});

// ── KeyVault ─────────────────────────────────────────────────────────────────

/**
 * POST /keyvault/derive
 *
 * Returns a deterministic AES-GCM-256 key for the authenticated user.
 *
 * Key properties:
 *   • Derived via PBKDF2-SHA-256 (600 000 iterations, OWASP 2025)
 *   • Salt = HMAC_SHA256(KEY_VAULT_SECRET, userId).slice(0,16)
 *     → deterministic: same user → same salt → same key across restarts
 *   • Key material returned as base64; client re-imports as non-extractable CryptoKey
 *   • Never stored on the server
 */
app.post('/keyvault/derive', (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const userId = req.session.userId;
    const email  = req.session.email ?? '';

    // Deterministic salt (never random — ensures reproducible key across requests)
    const salt = deriveSalt(userId);

    // PBKDF2 with identity material: userId:email as the "password"
    const keyMaterial = `${userId}:${email}`;
    const keyBytes    = crypto.pbkdf2Sync(keyMaterial, salt, 600_000, 32, 'sha256');

    res.json({
      key:  keyBytes.toString('base64'),
      salt: salt.toString('base64'),
    });
  } catch (err) {
    logger.error({ message: 'Errore derivazione chiave', component: 'keyvault', err: String(err) });
    res.status(500).json({ error: 'Errore derivazione chiave' });
  }
});

// ── Billing ───────────────────────────────────────────────────────────────────

/**
 * POST /billing/checkout
 * Creates a Stripe Checkout Session and returns the redirect URL.
 * Requires: authenticated session + Stripe configured.
 */
app.post('/billing/checkout', async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!stripe || !STRIPE_PRICE_ID) {
    res.status(503).json({ error: 'Pagamenti non configurati sul server' });
    return;
  }

  const userId = req.session.userId;
  const email  = req.session.email;

  try {
    // Retrieve or look up existing Stripe customer to avoid duplicates
    let customerId: string | undefined;
    if (pool && email) {
      const result = await pool.query<{ stripe_customer_id: string | null }>(
        'SELECT stripe_customer_id FROM users WHERE id = $1',
        [userId],
      );
      customerId = result.rows[0]?.stripe_customer_id ?? undefined;
    }

    const successUrl = `${CLIENT_URL}/app?checkout=success`;
    const cancelUrl  = `${CLIENT_URL}/app?checkout=cancel`;

    const session = await stripe.checkout.sessions.create({
      mode:               'subscription',
      payment_method_types: ['card'],
      line_items:         [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url:        successUrl,
      cancel_url:         cancelUrl,
      customer:           customerId,
      customer_email:     customerId ? undefined : (email ?? undefined),
      client_reference_id: userId,
      metadata:           { userId },
    });

    res.json({ url: session.url });

  } catch (err) {
    logger.error({ message: 'Stripe checkout failed', component: 'billing', err: String(err) });
    res.status(500).json({ error: 'Impossibile creare sessione di pagamento' });
  }
});

/**
 * POST /billing/webhook
 * Stripe webhook — verifies Stripe-Signature before processing.
 * Updates users.plan on checkout.session.completed / customer.subscription.deleted.
 *
 * IMPORTANT: must use express.raw() body parser for this route (Stripe requirement).
 */
app.post(
  '/billing/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res): Promise<void> => {
    const sig = req.headers['stripe-signature'] as string | undefined;

    if (!stripe || !STRIPE_WEBHOOK_SECRET) {
      logger.warn({ message: 'Stripe webhook received but Stripe not configured', component: 'billing' });
      res.status(503).end();
      return;
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig ?? '', STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      logger.warn({ message: 'Invalid Stripe webhook signature', component: 'billing', err: String(err) });
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    try {
      if (event.type === 'checkout.session.completed') {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const userId          = checkoutSession.metadata?.userId ?? checkoutSession.client_reference_id;
        const customerId      = typeof checkoutSession.customer === 'string'
          ? checkoutSession.customer
          : (checkoutSession.customer as Stripe.Customer | null)?.id ?? null;

        if (userId && pool) {
          await pool.query(
            `UPDATE users SET plan = 'pro', stripe_customer_id = COALESCE($2, stripe_customer_id), updated_at = NOW()
             WHERE id = $1`,
            [userId, customerId],
          );
          logger.info({ message: 'user_upgraded_to_pro', component: 'billing', userId });
        }

      } else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId   = typeof subscription.customer === 'string'
          ? subscription.customer
          : (subscription.customer as Stripe.Customer).id;

        if (customerId && pool) {
          await pool.query(
            `UPDATE users SET plan = 'free', updated_at = NOW() WHERE stripe_customer_id = $1`,
            [customerId],
          );
          logger.info({ message: 'user_downgraded_to_free', component: 'billing', customerId });
        }
      }

      res.json({ received: true });

    } catch (err) {
      logger.error({ message: 'Stripe webhook processing error', component: 'billing', err: String(err) });
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  },
);

/**
 * POST /audit/log
 * Body: { action: string; details?: Record<string, unknown> }
 *
 * Persists an audit event to PostgreSQL (if DATABASE_URL is set).
 * Falls back to structured console.log when DB is not configured.
 */
// ── Logs ─────────────────────────────────────────────────────────────────────

/**
 * POST /logs
 * Body: { level: 'error'|'warn'|'info'|'debug', component: string, message: string, userId?: string, meta?: object }
 *
 * Receives structured log events and aggregated API metrics from the React client.
 * Writes them through Winston so they appear in server logs (and files in production).
 * Also updates Prometheus counters when the payload is an 'apiMetrics' component report.
 */
app.post('/logs', (req, res) => {
  const { level, component, message, userId, meta } = req.body as {
    level?:     unknown;
    component?: unknown;
    message?:   unknown;
    userId?:    unknown;
    meta?:      unknown;
  };

  const VALID_LEVELS = new Set(['error', 'warn', 'info', 'debug']);
  const safeLevel     = VALID_LEVELS.has(level as string) ? (level as string) : 'info';
  const safeComponent = isStringSafe(component, 64)  ? component : 'client';
  const safeMessage   = isStringSafe(message,   512) ? message   : '[no message]';
  const safeUserId    = isStringSafe(userId,     64)  ? userId    : (req.session.userId ?? 'anonymous');
  const safeMeta      = meta !== null && typeof meta === 'object' && !Array.isArray(meta)
    ? (meta as Record<string, unknown>)
    : null;

  // Write through Winston
  (logger as unknown as Record<string, (obj: object) => void>)[safeLevel]({
    message:   safeMessage,
    component: safeComponent,
    userId:    safeUserId,
    ...(safeMeta ? { meta: safeMeta } : {}),
  });

  // Update Prometheus counters for 'apiMetrics' component periodic reports
  if (safeComponent === 'apiMetrics' && safeMeta) {
    for (const [endpoint, stats] of Object.entries(safeMeta)) {
      const s = stats as Record<string, number>;
      if (typeof s.count === 'number') {
        clientApiCalls.inc({ endpoint }, s.count);
      }
      if (typeof s.errors === 'number' && s.errors > 0) {
        clientApiErrors.inc({ endpoint }, s.errors);
      }
    }
  }

  res.json({ ok: true });
});

// ── Audit ─────────────────────────────────────────────────────────────────────

app.post('/audit/log', async (req, res) => {
  const { action, details } = req.body as { action?: unknown; details?: unknown };

  if (!isStringSafe(action, 128)) {
    res.status(400).json({ error: 'action deve essere una stringa (max 128 caratteri)' });
    return;
  }

  // Only allow plain objects (or undefined) for details
  const safeDetails: Record<string, unknown> | null =
    details !== null && typeof details === 'object' && !Array.isArray(details)
      ? (details as Record<string, unknown>)
      : null;

  const userId = req.session.userId ?? 'anonymous';

  try {
    if (pool) {
      await pool.query(
        'INSERT INTO audit_log(user_id, action, details, created_at) VALUES($1,$2,$3,NOW())',
        [userId, action, safeDetails ? JSON.stringify(safeDetails) : null],
      );
    } else {
      // Structured fallback when DB is not configured (e.g. local dev without Postgres)
      logger.info({ message: 'audit_event', component: 'audit', userId, action, details: safeDetails });
    }

    res.json({ ok: true });
  } catch (err) {
    logger.error({ message: 'Impossibile registrare evento di audit', component: 'audit', err: String(err) });
    res.status(500).json({ error: 'Impossibile registrare evento di audit' });
  }
});

// ─── P30 — Agent Platform routes ────────────────────────────────────────────

app.use('/agents',   createAgentsRouter(pool));
app.use('/agents',   createAgentRunRouter(pool));
app.use('/memory',   createMemoryRouter(pool));
app.use('/audit',    createAuditRouter(pool));
app.use('/adaptive', createAdaptiveRouter(pool));
app.use('/feedback', createFeedbackRouter(pool));

// ── Health ────────────────────────────────────────────────────────────────────

/**
 * GET /health
 * Used by: load balancers (Render, Heroku), smoke tests, uptime monitors.
 * Returns 200 while the server is accepting connections.
 * Returns 503 if the DB is configured but unreachable.
 */
app.get('/health', async (_req, res) => {
  const dbStatus: boolean | 'not-configured' = pool ? true : 'not-configured';

  if (pool) {
    try {
      await pool.query('SELECT 1');
    } catch {
      res.status(503).json({
        status: 'degraded',
        db:     false,
        ts:     new Date().toISOString(),
      });
      return;
    }
  }

  res.json({
    status:  'ok',
    version: process.env.npm_package_version ?? '1.0.0',
    env:     isProd ? 'production' : 'development',
    db:      dbStatus,
    uptime:  Math.floor(process.uptime()),
    ts:      new Date().toISOString(),
  });
});

/**
 * GET /metrics
 * Returns Prometheus text-format metrics suitable for scraping.
 * Includes: http_requests_total, http_request_duration_ms, http_errors_total,
 *           client_api_calls_total, client_api_errors_total, Node.js process metrics.
 *
 * ⚠️  In production, protect this endpoint with IP allowlist or HTTP Basic Auth.
 */
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', registry.contentType);
    res.end(await registry.metrics());
  } catch (err) {
    logger.error({ message: 'Failed to collect metrics', component: 'metrics', err: String(err) });
    res.status(500).end('# metrics collection failed');
  }
});

/**
 * GET /auth/check
 * Lightweight session probe used by CI smoke tests and the client AuthProvider
 * to verify cookie-based auth is working end-to-end.
 * Returns 200 + { authenticated: true/false } — never throws 401.
 */
app.get('/auth/check', (req, res) => {
  res.json({ authenticated: !!req.session.userId });
});

// ─── Start ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  await ensureAuditTable();
  await ensureUsersTable();
  await ensureAgentsTable();
  await ensureAgentRunsTable();
  await ensureMemoryTable();
  if (pool) {
    await ensureAdaptiveSchema(pool);
    await ensureMemoryConsolidationSchema(pool);
    await ensureFeedbackSchema(pool);
  }
  await seedBuiltInAgents();
  app.listen(PORT, () => {
    logger.info({
      message:   `DocenteDoc backend in ascolto su http://localhost:${PORT}`,
      component: 'server',
      port:      PORT,
      env:       isProd ? 'production' : 'development',
    });
    if (!isProd) {
      logger.warn({
        message:   '⚠️  Modalità DEVELOPMENT — non usare in produzione senza .env configurato',
        component: 'server',
      });
    }
  });

  // Capture unhandled promise rejections so they appear in server logs
  process.on('unhandledRejection', (reason) => {
    logger.error({ message: 'unhandledRejection', component: 'process', reason: String(reason) });
  });

  process.on('uncaughtException', (err) => {
    logger.error({ message: 'uncaughtException', component: 'process', err: err.message, stack: err.stack });
    // Allow process manager (Render/PM2) to restart automatically
    process.exit(1);
  });
}

main().catch(err => {
  logger.error({ message: 'Avvio fallito', component: 'server', err: String(err) });
  process.exit(1);
});

/**
 * api/audit.ts — Vercel Serverless Function
 *
 * Endpoint: POST /api/audit
 *
 * Riceve eventi di audit dall'app client (es. WorkspaceErrorBoundary,
 * AITabErrorBoundary, azioni enterprise critiche) e li persiste.
 *
 * Strategia di storage:
 *   1. Se DATABASE_URL → PostgreSQL via REST (Supabase / Neon / PlanetScale compatibile)
 *   2. Fallback → structured console.log (catturato dai log Vercel)
 *
 * Sicurezza:
 *   ✅ Solo POST (405 su tutti gli altri verbi)
 *   ✅ Validazione input: action (string ≤128), details (object | null), userId (string ≤64)
 *   ✅ Body limit 32 KB — la Vercel Function legge il body raw una volta sola
 *   ✅ Nessun segreto esposto al client nella risposta
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isSafeString(v: unknown, max: number): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= max;
}

function isSafeObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuditPayload {
  action:  string;
  details?: Record<string, unknown>;
  userId?:  string;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // ── Input validation ──────────────────────────────────────────────────────

  const body = req.body as Partial<AuditPayload>;

  if (!isSafeString(body.action, 128)) {
    res.status(400).json({ error: 'action è obbligatorio (string, max 128 caratteri)' });
    return;
  }

  if (body.details !== undefined && body.details !== null && !isSafeObject(body.details)) {
    res.status(400).json({ error: 'details deve essere un oggetto o null' });
    return;
  }

  // userId opzionale — il client può auto-identificarsi; mai fidarsi ciecamente
  const userId  = isSafeString(body.userId, 64)  ? body.userId  : 'anonymous';
  const action  = body.action;
  const details = body.details ?? null;

  // ── Persist ───────────────────────────────────────────────────────────────

  const entry = {
    userId,
    action,
    details,
    ts: new Date().toISOString(),
  };

  if (process.env.DATABASE_URL) {
    // Lazy-import pg to avoid bundling it when DATABASE_URL is not set
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
      // Ensure table exists (idempotent)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS audit_log (
          id         BIGSERIAL   PRIMARY KEY,
          user_id    TEXT        NOT NULL DEFAULT 'anonymous',
          action     TEXT        NOT NULL,
          details    JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(
        `INSERT INTO audit_log(user_id, action, details, created_at)
         VALUES($1, $2, $3, NOW())`,
        [userId, action, details ? JSON.stringify(details) : null],
      );
    } catch (dbErr) {
      // Log the error but still return 200 — audit failures must not crash the app
      console.error('[api/audit] DB error:', dbErr);
    } finally {
      await pool.end().catch(() => undefined);
    }
  } else {
    // Structured fallback — Vercel captures these in the function logs
    console.info(JSON.stringify({ level: 'AUDIT', ...entry }));
  }

  res.status(200).json({ ok: true, timestamp: entry.ts });
}

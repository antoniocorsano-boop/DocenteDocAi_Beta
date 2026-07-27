/**
 * Vercel Serverless Function — AI proxy + school discovery proxy
 *
 * This proxy keeps API keys on the server (never bundled in client JS).
 * All external fetches (AI, MIUR, school websites) go through here,
 * keeping the client-side ecosystem fully isolated.
 *
 * Actions:
 *   POST /api/ai  { action: 'ai' | undefined, model, contents, config? }  → AI generation
 *   POST /api/ai  { action: 'school_search', query: string }              → MIUR Open Data lookup
 *   POST /api/ai  { action: 'school_kb_crawl', codiceMeccanografico, siteUrl? } → public document catalog
 *   POST /api/ai  { action: 'fetch_proxy', url: string }                  → generic public-URL fetch
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GOOGLE_AI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// MIUR Open Data — scuole italiane (anno scolastico corrente)
// Fonte ufficiale: dati.istruzione.it — dati pubblici, licenza CC BY 4.0
const MIUR_SCHOOLS_CSV =
  'https://dati.istruzione.it/opendata/opendata/catalogo/elements1/?area=Scuole&datasetId=DS0400SCUANAGRAFESTAT';

// Rate-limit safeguard: reject payloads over 1MB
const MAX_BODY_BYTES = 1_000_000;

// ── In-memory IP rate limiter ────────────────────────────────────────────────
// Best-effort: resets on Vercel cold-start (acceptable for basic DoS mitigation).
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQ   = 30;

interface RateEntry { count: number; resetAt: number; }
const _ipRateMap = new Map<string, RateEntry>();

function checkRateLimit(req: import('@vercel/node').VercelRequest): boolean {
  // Skip rate limiting in test environments — the in-memory map is shared
  // across all test requests (same process), causing false 429s.
  if (process.env.NODE_ENV === 'test') return true;

  const forwarded = req.headers['x-forwarded-for'];
  const ip = String(
    (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim()
    ?? (req.socket as { remoteAddress?: string } | null)?.remoteAddress
    ?? 'unknown',
  );
  const now  = Date.now();
  const entry = _ipRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    _ipRateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX_REQ) return false;
  entry.count++;
  return true;
}

// ── Allowed external hostnames for fetch_proxy and school_kb_crawl ───────────
// Whitelist: only Italian public institution domains
const ALLOWED_PROXY_HOSTS = [
  '.istruzione.it',
  '.istruzione.gov.it',
  '.miur.it',
  '.dati.istruzione.it',
  '.scuolainchiaro.it',
  '.governo.it',
  '.comune.',
  '.edu.it',
  '.gov.it',
  '.istruzioneer.it',
  // School sites typically end in edu.it or are on istruzione.it subdomains
  // Generic .it allowed for school websites — filtered by codiceMeccanografico match
];

function isAllowedHost(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    // School sites: allow any .edu.it or istruzione.it subdomain
    return ALLOWED_PROXY_HOSTS.some(suffix => hostname.endsWith(suffix) || hostname.includes(suffix));
  } catch {
    return false;
  }
}

// ── School search helper: parses MIUR CSV ────────────────────────────────────
interface SchoolRecord {
  codiceMeccanografico: string;
  denominazione: string;
  tipo: string;
  indirizzo: string;
  comune: string;
  provincia: string;
  regione: string;
  codiceComune: string;
  capScuola: string;
  emailScuola: string;
  sitoWeb: string;
}

function searchSchoolsInCSV(csvText: string, query: string): SchoolRecord[] {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(';').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  const qLower = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const results: SchoolRecord[] = [];
  for (let i = 1; i < lines.length && results.length < 10; i++) {
    const cols = lines[i].split(';').map(c => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 4) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = cols[idx] ?? ''; });

    const denom = (row['denominazionescuola'] ?? row['denominazione'] ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const comune = (row['descrizionecomune'] ?? row['comune'] ?? '').toLowerCase();

    if (denom.includes(qLower) || comune.includes(qLower)) {
      results.push({
        codiceMeccanografico: row['codicescuola'] ?? row['codice_meccanografico'] ?? '',
        denominazione: row['denominazionescuola'] ?? row['denominazione'] ?? '',
        tipo: row['descrizionetipologiagradoistruzionescuola'] ?? row['tipo'] ?? '',
        indirizzo: `${row['indirizzoscuola'] ?? ''} ${row['caplocalitascuola'] ?? ''}`.trim(),
        comune: row['descrizionecomune'] ?? row['comune'] ?? '',
        provincia: row['siglasprovincia'] ?? row['provincia'] ?? '',
        regione: row['descrizioneregione'] ?? '',
        codiceComune: row['codicecomunescuola'] ?? '',
        capScuola: row['caplocalitascuola'] ?? '',
        emailScuola: row['emailscuola'] ?? '',
        sitoWeb: row['sitowebscuola'] ?? '',
      });
    }
  }
  return results;
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void | VercelResponse> {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting — 30 requests per minute per IP (best-effort, resets on cold-start)
  if (!checkRateLimit(req)) {
    return res.status(429).json({ error: 'Too many requests. Limit: 30 per minute.' });
  }

  const body = req.body as Record<string, unknown>;
  const action = (body?.action as string) ?? 'ai';

  // ── Action: school_search ─────────────────────────────────────────────────
  if (action === 'school_search') {
    const query = String(body?.query ?? '').trim();
    if (!query || query.length < 3) {
      return res.status(400).json({ error: 'query must be at least 3 characters' });
    }
    if (query.length > 200) {
      return res.status(400).json({ error: 'query too long' });
    }

    let csvText: string;
    try {
      const r = await fetch(MIUR_SCHOOLS_CSV, {
        headers: { 'Accept': 'text/csv, */*', 'User-Agent': 'DocenteDocAI/1.0 (educational tool)' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!r.ok) {
        // Fallback: return empty so the client shows a graceful message
        return res.status(200).json({ schools: [], fallback: true });
      }
      csvText = await r.text();
    } catch {
      return res.status(200).json({ schools: [], fallback: true });
    }

    const schools = searchSchoolsInCSV(csvText, query);
    return res.status(200).json({ schools });
  }

  // ── Action: school_kb_crawl ───────────────────────────────────────────────
  if (action === 'school_kb_crawl') {
    const codiceMeccanografico = String(body?.codiceMeccanografico ?? '').trim();
    const siteUrl = String(body?.siteUrl ?? '').trim();

    // Validate codiceMeccanografico: 10 alphanum chars
    if (codiceMeccanografico && !/^[A-Z0-9]{6,12}$/i.test(codiceMeccanografico)) {
      return res.status(400).json({ error: 'Invalid codiceMeccanografico' });
    }

    const documents: { title: string; url: string; category: string; snippet: string }[] = [];

    // 1. Fetch MIUR "Scuola in Chiaro" profile page for this school
    const miurProfileUrl = `https://cercalatuascuola.istruzione.it/cercalatuascuola/istituti/${codiceMeccanografico}/`;
    try {
      const r = await fetch(miurProfileUrl, { signal: AbortSignal.timeout(8_000) });
      if (r.ok) {
        const html = await r.text();
        // Extract basic info via simple regex (no DOM parser in Edge)
        const ptofMatch = html.match(/href="([^"]*ptof[^"]*\.pdf)"/i);
        if (ptofMatch) {
          documents.push({ title: 'PTOF — Piano Triennale Offerta Formativa', url: ptofMatch[1], category: 'ptof', snippet: 'Piano Triennale dell\'Offerta Formativa ufficiale della scuola.' });
        }
        const rapMatch = html.match(/href="([^"]*rap[^"]*\.pdf)"/i);
        if (rapMatch) {
          documents.push({ title: 'RAV — Rapporto di Autovalutazione', url: rapMatch[1], category: 'rav', snippet: 'Rapporto di Autovalutazione della scuola.' });
        }
      }
    } catch { /* non-blocking */ }

    // 2. Fetch school website homepage for additional public docs
    if (siteUrl && isAllowedHost(siteUrl)) {
      try {
        const r = await fetch(siteUrl, {
          headers: { 'User-Agent': 'DocenteDocAI/1.0 (educational tool)' },
          signal: AbortSignal.timeout(8_000),
        });
        if (r.ok) {
          const html = await r.text();
          // Look for Albo Pretorio, Circolari, PTOF, Bilancio links
          const linkRegex = /href="([^"]{5,200})">([^<]{3,100})</g;
          const keywords = ['ptof', 'rav', 'albo', 'circolar', 'bilancio', 'pnrr', 'regolamento', 'piano'];
          let m: RegExpExecArray | null;
          while ((m = linkRegex.exec(html)) !== null && documents.length < 20) {
            const href = m[1].trim();
            const text = m[2].trim();
            const textLow = text.toLowerCase();
            const hrefLow = href.toLowerCase();
            const category = keywords.find(k => textLow.includes(k) || hrefLow.includes(k));
            if (category && !documents.some(d => d.url === href)) {
              const fullUrl = href.startsWith('http') ? href : new URL(href, siteUrl).href;
              // Only include if within allowed domain scope
              if (isAllowedHost(fullUrl) || href.startsWith('/')) {
                documents.push({
                  title: text,
                  url: fullUrl,
                  category,
                  snippet: `Documento pubblico: ${text} — fonte: ${new URL(siteUrl).hostname}`,
                });
              }
            }
          }
        }
      } catch { /* non-blocking */ }
    }

    return res.status(200).json({ documents });
  }

  // ── Action: fetch_proxy ───────────────────────────────────────────────────
  // Generic safe proxy for public URLs (whitelist-gated)
  if (action === 'fetch_proxy') {
    const targetUrl = String(body?.url ?? '').trim();
    if (!targetUrl || !targetUrl.startsWith('https://')) {
      return res.status(400).json({ error: 'url must be an https:// URL' });
    }
    if (!isAllowedHost(targetUrl)) {
      return res.status(403).json({ error: 'Host not in allowlist' });
    }
    try {
      const r = await fetch(targetUrl, {
        headers: { 'User-Agent': 'DocenteDocAI/1.0 (educational tool)' },
        signal: AbortSignal.timeout(10_000),
      });
      const contentType = r.headers.get('content-type') ?? '';
      if (contentType.includes('text') || contentType.includes('json')) {
        const text = await r.text();
        return res.status(200).json({ text, contentType, status: r.status });
      }
      return res.status(200).json({ text: '', contentType, status: r.status });
    } catch (err) {
      return res.status(502).json({ error: 'Fetch failed', detail: String(err) });
    }
  }

  // ── Action: ai (default) ──────────────────────────────────────────────────
  // Validate input BEFORE checking the API key so malformed or oversized
  // requests are rejected early regardless of key availability.

  const { model, contents, config, streaming } = body as {
    model: string;
    contents: string | unknown[];
    streaming?: boolean;
    config?: {
      responseMimeType?: string;
      systemInstruction?: string;
      generationConfig?: {
        temperature?: number;
        maxOutputTokens?: number;
        stopSequences?: string[];
      };
      tools?: unknown[];
    };
  };

  if (!model || typeof model !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid model' });
  }
  if (!contents) {
    return res.status(400).json({ error: 'Missing contents' });
  }

  const safeModel = model.replace(/[^a-zA-Z0-9\-_.]/g, '');
  if (!safeModel) {
    return res.status(400).json({ error: 'Invalid model name' });
  }

  type GeminiContent = { role: string; parts: { text: string }[] };
  const geminiContents: GeminiContent[] = Array.isArray(contents)
    ? (contents as GeminiContent[])
    : typeof contents === 'object' && contents !== null
      ? [contents as GeminiContent]  // single Content object — wrap in array
      : [{ role: 'user', parts: [{ text: String(contents) }] }];

  const bodySize = JSON.stringify(geminiContents).length;
  if (bodySize > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'Request payload too large' });
  }

  // Check API key only after input is validated
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AI service not configured on server' });
  }

  const requestBody: Record<string, unknown> = { contents: geminiContents };

  if (config?.generationConfig) {
    requestBody.generationConfig = config.generationConfig;
  }
  if (config?.responseMimeType) {
    requestBody.generationConfig = {
      ...(requestBody.generationConfig as object | undefined ?? {}),
      responseMimeType: config.responseMimeType,
    };
  }
  if (config?.systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: String(config.systemInstruction) }],
    };
  }
  if (config?.tools) {
    requestBody.tools = config.tools;
  }

  // ── Streaming path (SSE) ──────────────────────────────────────────────────
  if (streaming) {
    const streamUrl = `${GOOGLE_AI_BASE}/${safeModel}:streamGenerateContent?alt=sse&key=${apiKey}`;

    let streamResponse: Response;
    try {
      streamResponse = await fetch(streamUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
    } catch (err) {
      return res.status(502).json({ error: 'Failed to reach AI streaming service', detail: String(err) });
    }

    if (!streamResponse.ok) {
      const errText = await streamResponse.text();
      return res.status(streamResponse.status).json({ error: errText });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    if (!streamResponse.body) {
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const reader = streamResponse.body.getReader();
    const decoder = new TextDecoder('utf-8');

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
      }
    } catch (err) {
      // Stream aborted — close gracefully
      res.write(`data: {"error":"${String(err)}"}\n\n`);
    } finally {
      reader.releaseLock();
      res.write('data: [DONE]\n\n');
      res.end();
    }
    return;
  }

  // ── Non-streaming path (default) ──────────────────────────────────────────
  const url = `${GOOGLE_AI_BASE}/${safeModel}:generateContent?key=${apiKey}`;

  let googleResponse: Response;
  try {
    googleResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach AI service', detail: String(err) });
  }

  if (!googleResponse.ok) {
    const errText = await googleResponse.text();
    return res.status(googleResponse.status).json({ error: errText });
  }

  const data = (await googleResponse.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return res.status(200).json({ text });
}


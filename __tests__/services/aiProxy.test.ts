/**
 * aiProxy.test.ts — A4: Input sanitization + security tests for api/ai.ts
 *
 * Tests that the Vercel serverless proxy correctly validates and rejects
 * malformed, oversized, or potentially malicious requests BEFORE they
 * reach external services (Gemini API, MIUR, school websites).
 *
 * Coverage:
 *   - HTTP method guard (405 for non-POST)
 *   - action:ai — missing/invalid model, missing contents, oversized payload, 503 with no key
 *   - action:fetch_proxy — SSRF protection (allowlist, HTTP vs HTTPS)
 *   - action:school_search — query length validation
 *   - action:school_kb_crawl — codiceMeccanografico format validation
 *
 * No external network calls are made in these tests — all exercised paths
 * terminate with early validation errors or the 503 "no API key" gate.
 */

import { describe, it, expect } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../../api/ai';

// ── Mock helpers ──────────────────────────────────────────────────────────────

function mkReq(method: string, body: unknown): VercelRequest {
  return { method, body } as unknown as VercelRequest;
}

interface MockRes {
  statusCode: number;
  body: unknown;
  status: (code: number) => MockRes;
  json: (data: unknown) => MockRes;
}

function mkRes(): MockRes {
  const r = {} as MockRes;
  r.statusCode = 200;
  r.body = null;
  r.status = (code: number) => { r.statusCode = code; return r; };
  r.json = (data: unknown) => { r.body = data; return r; };
  return r;
}

// ── HTTP method guard ─────────────────────────────────────────────────────────

describe('api/ai — HTTP method guard', () => {
  it('rejects GET → 405', async () => {
    const res = mkRes();
    await handler(mkReq('GET', {}), res as unknown as VercelResponse);
    expect(res.statusCode).toBe(405);
  });

  it('rejects PUT → 405', async () => {
    const res = mkRes();
    await handler(mkReq('PUT', {}), res as unknown as VercelResponse);
    expect(res.statusCode).toBe(405);
  });

  it('rejects DELETE → 405', async () => {
    const res = mkRes();
    await handler(mkReq('DELETE', {}), res as unknown as VercelResponse);
    expect(res.statusCode).toBe(405);
  });
});

// ── action:ai input validation ────────────────────────────────────────────────

describe('api/ai — action:ai input validation', () => {
  it('returns 400 when model is missing', async () => {
    const res = mkRes();
    await handler(
      mkReq('POST', { contents: [{ role: 'user', parts: [{ text: 'ciao' }] }] }),
      res as unknown as VercelResponse,
    );
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when contents is missing', async () => {
    const res = mkRes();
    await handler(
      mkReq('POST', { model: 'gemini-1.5-flash' }),
      res as unknown as VercelResponse,
    );
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when model is not a string', async () => {
    const res = mkRes();
    await handler(
      mkReq('POST', { model: 42, contents: 'test' }),
      res as unknown as VercelResponse,
    );
    expect(res.statusCode).toBe(400);
  });

  it('sanitizes model injection attempt — result is 400 or 503, never 200', async () => {
    const res = mkRes();
    // Special chars are stripped by safeModel; after stripping only alphanum remain
    // No API key in test env → reaches 503, not 400
    await handler(
      mkReq('POST', { model: '$(evil); rm -rf /', contents: 'test' }),
      res as unknown as VercelResponse,
    );
    // 400 if safeModel becomes empty after stripping, 503 if key is absent; never 200
    expect([400, 503]).toContain(res.statusCode);
    // Body must be a structured error object, not raw untreated input
    expect(res.body).toHaveProperty('error');
  });

  it('returns 413 when geminiContents payload exceeds 1 MB', async () => {
    const res = mkRes();
    const bigText = 'x'.repeat(1_100_000);
    await handler(
      mkReq('POST', {
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: bigText }] }],
      }),
      res as unknown as VercelResponse,
    );
    expect(res.statusCode).toBe(413);
  });

  it('returns 503 when GEMINI_API_KEY is absent (no external call made)', async () => {
    const res = mkRes();
    const saved = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      await handler(
        mkReq('POST', {
          model: 'gemini-1.5-flash',
          contents: [{ role: 'user', parts: [{ text: 'cosa devo fare oggi?' }] }],
        }),
        res as unknown as VercelResponse,
      );
    } finally {
      if (saved !== undefined) process.env.GEMINI_API_KEY = saved;
    }
    expect(res.statusCode).toBe(503);
  });

  it('error response always includes "error" field in body', async () => {
    const res = mkRes();
    await handler(mkReq('GET', {}), res as unknown as VercelResponse);
    expect(res.body).toHaveProperty('error');
    expect(typeof (res.body as Record<string, unknown>).error).toBe('string');
  });
});

// ── action:fetch_proxy SSRF protection ───────────────────────────────────────

describe('api/ai — action:fetch_proxy SSRF protection', () => {
  it('rejects http:// URLs (requires HTTPS) → 400', async () => {
    const res = mkRes();
    await handler(
      mkReq('POST', { action: 'fetch_proxy', url: 'http://attacker.com/data' }),
      res as unknown as VercelResponse,
    );
    expect(res.statusCode).toBe(400);
  });

  it('rejects non-whitelisted HTTPS host → 403', async () => {
    const res = mkRes();
    await handler(
      mkReq('POST', { action: 'fetch_proxy', url: 'https://attacker.com/exfiltrate' }),
      res as unknown as VercelResponse,
    );
    expect(res.statusCode).toBe(403);
  });

  it('rejects localhost SSRF attempt → 403', async () => {
    const res = mkRes();
    await handler(
      mkReq('POST', { action: 'fetch_proxy', url: 'https://localhost:8080/internal-admin' }),
      res as unknown as VercelResponse,
    );
    expect(res.statusCode).toBe(403);
  });

  it('rejects cloud metadata service SSRF (169.254.169.254) → 403', async () => {
    const res = mkRes();
    await handler(
      mkReq('POST', { action: 'fetch_proxy', url: 'https://169.254.169.254/latest/meta-data' }),
      res as unknown as VercelResponse,
    );
    expect(res.statusCode).toBe(403);
  });

  it('rejects missing url → 400', async () => {
    const res = mkRes();
    await handler(
      mkReq('POST', { action: 'fetch_proxy' }),
      res as unknown as VercelResponse,
    );
    expect(res.statusCode).toBe(400);
  });

  it('rejects url = empty string → 400', async () => {
    const res = mkRes();
    await handler(
      mkReq('POST', { action: 'fetch_proxy', url: '' }),
      res as unknown as VercelResponse,
    );
    expect(res.statusCode).toBe(400);
  });
});

// ── action:school_search input validation ─────────────────────────────────────

describe('api/ai — action:school_search input validation', () => {
  it('rejects query shorter than 3 chars → 400', async () => {
    const res = mkRes();
    await handler(
      mkReq('POST', { action: 'school_search', query: 'ab' }),
      res as unknown as VercelResponse,
    );
    expect(res.statusCode).toBe(400);
  });

  it('rejects empty query → 400', async () => {
    const res = mkRes();
    await handler(
      mkReq('POST', { action: 'school_search', query: '' }),
      res as unknown as VercelResponse,
    );
    expect(res.statusCode).toBe(400);
  });

  it('rejects query longer than 200 chars → 400', async () => {
    const res = mkRes();
    await handler(
      mkReq('POST', { action: 'school_search', query: 'a'.repeat(201) }),
      res as unknown as VercelResponse,
    );
    expect(res.statusCode).toBe(400);
  });

  it('rejects null query → 400', async () => {
    const res = mkRes();
    await handler(
      mkReq('POST', { action: 'school_search', query: null }),
      res as unknown as VercelResponse,
    );
    expect(res.statusCode).toBe(400);
  });
});

// ── action:school_kb_crawl input validation ───────────────────────────────────

describe('api/ai — action:school_kb_crawl input validation', () => {
  it('rejects codiceMeccanografico with path traversal attempt → 400', async () => {
    const res = mkRes();
    await handler(
      mkReq('POST', { action: 'school_kb_crawl', codiceMeccanografico: '../etc/passwd' }),
      res as unknown as VercelResponse,
    );
    expect(res.statusCode).toBe(400);
  });

  it('rejects codiceMeccanografico with SQL injection attempt → 400', async () => {
    const res = mkRes();
    await handler(
      mkReq('POST', { action: 'school_kb_crawl', codiceMeccanografico: "'; DROP TABLE schools;--" }),
      res as unknown as VercelResponse,
    );
    expect(res.statusCode).toBe(400);
  });

  it('rejects codiceMeccanografico with special characters → 400', async () => {
    const res = mkRes();
    await handler(
      mkReq('POST', { action: 'school_kb_crawl', codiceMeccanografico: '<script>alert(1)</script>' }),
      res as unknown as VercelResponse,
    );
    expect(res.statusCode).toBe(400);
  });
});

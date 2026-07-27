/**
 * src/services/apiMetrics.ts — P27 Monitoring & Observability
 *
 * Lightweight client-side API call tracker.
 *
 * Records: endpoint slug, call duration (ms), success/failure.
 * Aggregates buffered records and flushes them to the backend /logs
 * endpoint every FLUSH_INTERVAL_MS (default: 60 s) or when the buffer
 * reaches MAX_BUFFER entries.
 *
 * Usage:
 *   import { trackApiCall, startMetricsReporter } from '@/services/apiMetrics';
 *
 *   // Wire reporter once (e.g. in main.tsx or AuthProvider):
 *   startMetricsReporter();
 *
 *   // Wrap any fetch / SDK call:
 *   const t0 = performance.now();
 *   try {
 *     await callGemini(prompt);
 *     trackApiCall('gemini/generate', performance.now() - t0, true);
 *   } catch (err) {
 *     trackApiCall('gemini/generate', performance.now() - t0, false);
 *     throw err;
 *   }
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiCallRecord {
  endpoint:   string;
  durationMs: number;
  success:    boolean;
  ts:         number;
}

export interface EndpointMetrics {
  count:   number;
  errors:  number;
  avgMs:   number;
  p95Ms:   number;
}

export type MetricsSnapshot = Record<string, EndpointMetrics>;

// ─── Config ───────────────────────────────────────────────────────────────────

const MAX_BUFFER          = 100;
const FLUSH_INTERVAL_MS   = 60_000;   // 60 s
const FLUSH_THRESHOLD     = 50;        // flush early when buffer this full
const BACKEND_URL         = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? '';
const FETCH_TIMEOUT_MS    = 8_000;

// ─── State ────────────────────────────────────────────────────────────────────

const _buffer: ApiCallRecord[] = [];
let   _flushTimer: ReturnType<typeof setInterval> | null = null;

// ─── Internal ─────────────────────────────────────────────────────────────────

function aggregate(): MetricsSnapshot {
  const map: Record<string, { durationsSorted: number[]; errors: number }> = {};

  for (const r of _buffer) {
    if (!map[r.endpoint]) map[r.endpoint] = { durationsSorted: [], errors: 0 };
    map[r.endpoint].durationsSorted.push(r.durationMs);
    if (!r.success) map[r.endpoint].errors++;
  }

  const result: MetricsSnapshot = {};
  for (const [ep, v] of Object.entries(map)) {
    const sorted = [...v.durationsSorted].sort((a, b) => a - b);
    const count  = sorted.length;
    const sum    = sorted.reduce((a, b) => a + b, 0);
    const p95Idx = Math.min(Math.floor(count * 0.95), count - 1);

    result[ep] = {
      count,
      errors: v.errors,
      avgMs:  count > 0 ? Math.round(sum / count) : 0,
      p95Ms:  sorted[p95Idx] ?? 0,
    };
  }
  return result;
}

async function flush(): Promise<void> {
  if (_buffer.length === 0) return;

  const snapshot = aggregate();
  _buffer.length = 0; // clear before async op to avoid double-flush

  if (!BACKEND_URL) return; // No backend configured — drop silently (dev)

  try {
    await fetch(`${BACKEND_URL}/logs`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        level:     'info',
        component: 'apiMetrics',
        message:   'periodic_metrics_report',
        meta:      snapshot,
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    // Non-blocking — metrics flush must never crash the app
  }
}

function maybeFlushEarly(): void {
  if (_buffer.length >= FLUSH_THRESHOLD) {
    void flush();
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Record a single API call result.
 * Endpoint names should be short slugs, e.g. 'gemini/generate', 'drive/upload'.
 * Buffer is capped at MAX_BUFFER; oldest entries are dropped on overflow.
 */
export function trackApiCall(
  endpoint:   string,
  durationMs: number,
  success:    boolean,
): void {
  if (_buffer.length >= MAX_BUFFER) _buffer.shift();
  _buffer.push({ endpoint, durationMs, success, ts: Date.now() });
  maybeFlushEarly();
}

/**
 * Returns a read-only snapshot of aggregated metrics for all tracked endpoints.
 * Does NOT clear the buffer.
 */
export function getMetricsSnapshot(): MetricsSnapshot {
  return aggregate();
}

/**
 * Starts the periodic background flush timer.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function startMetricsReporter(): void {
  if (_flushTimer !== null) return;
  _flushTimer = setInterval(() => { void flush(); }, FLUSH_INTERVAL_MS);
}

/**
 * Stops the periodic background flush timer and performs a final flush.
 * Call during app teardown or logout.
 */
export function stopMetricsReporter(): void {
  if (_flushTimer !== null) {
    clearInterval(_flushTimer);
    _flushTimer = null;
  }
  void flush();
}

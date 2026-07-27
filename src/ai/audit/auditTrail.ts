/**
 * auditTrail.ts — Chronological history store for AIAuditTrail records
 *
 * Maintains a circular in-memory buffer of recent audit trails (max 50).
 * Also exposes an optional console logger gated by AI Experimental Mode.
 *
 * Consumers:
 *   - aiEngine.ts calls pushAudit() after each non-cached analysis run
 *   - AIDevToolsPanel reads getAuditHistory() to display the log
 *
 * The buffer is intentionally small (50 entries) — each entry is at most
 * ~1 KB, keeping memory overhead negligible.
 */
import type { AIAuditTrail } from './auditTypes';

// ── config ────────────────────────────────────────────────────────────────────

const MAX_HISTORY = 50;
const STORAGE_KEY = 'ai_beta_mode';

function isBetaActive(): boolean {
  if (import.meta.env.VITE_AI_BETA === 'true') return true;
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

// ── circular buffer ───────────────────────────────────────────────────────────

const _history: AIAuditTrail[] = [];

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Appends a finished AIAuditTrail to the history buffer.
 *
 * If beta mode is active, also logs a compact summary to the console.
 * Silently evicts the oldest entry when the buffer is full.
 *
 * @param trail - Sealed audit trail from finishAuditTrail()
 */
export function pushAudit(trail: AIAuditTrail): void {
  if (_history.length >= MAX_HISTORY) _history.shift();
  _history.push(trail);

  // Fire-and-forget localStorage persistence — keeps the last 10 entries across
  // page refreshes. No raw student PII is stored (AIAuditTrail contains only
  // execution metadata: timings, step names, cache hit flag).
  try {
    localStorage.setItem('ai_audit_trail', JSON.stringify(_history.slice(-10)));
  } catch {
    // quota exceeded or private browsing — ignore silently
  }

  if (isBetaActive()) {
    const stepsSummary = trail.cacheHit
      ? '(cache hit — no steps)'
      : trail.steps.map((s) => `${s.name}=${s.durationMs}ms`).join(', ');
    console.debug(
      `[AI Audit] id=${trail.id} total=${trail.totalMs}ms cache=${trail.cacheHit} | ${stepsSummary}`,
    );
  }
}

/**
 * Restores the last persisted audit entries from localStorage into the in-memory
 * buffer. Call once on app startup before any reads from `getAuditHistory()`.
 */
export function loadAuditHistoryFromStorage(): void {
  try {
    const raw = localStorage.getItem('ai_audit_trail');
    if (raw) {
      const stored: AIAuditTrail[] = JSON.parse(raw);
      _history.push(...stored.slice(0, MAX_HISTORY));
    }
  } catch {
    // malformed JSON or missing — ignore
  }
}

/**
 * Returns a read-only snapshot of the audit history from oldest to newest.
 * Each call returns a new array — external mutation does not corrupt the buffer.
 */
export function getAuditHistory(): readonly AIAuditTrail[] {
  return [..._history];
}

/**
 * Returns the most recently recorded AIAuditTrail, or null if the history
 * is empty.
 */
export function getLastAudit(): AIAuditTrail | null {
  return _history.length > 0 ? _history[_history.length - 1] : null;
}

/**
 * Clears the entire audit history buffer.
 * Useful in tests or when starting a new teacher session.
 */
export function clearAuditHistory(): void {
  _history.length = 0;
}

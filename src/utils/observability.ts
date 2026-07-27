/**
 * src/utils/observability.ts — P27 Monitoring & Observability
 *
 * Thin event bus for pure system modules (TokenController, PrivacyGuard,
 * SimulationGuard, etc.) to emit structured observability events WITHOUT
 * depending on React or Sentry directly.
 *
 * Consumers (monitoring.ts) call `registerObserver()` once at startup to
 * wire in Sentry breadcrumbs, analytics, or whatever backend they prefer.
 *
 * Design:
 *   - Zero external dependencies (pure TS). Safe to import in any module.
 *   - Synchronous — low overhead, no async queuing.
 *   - Always logs to console (dev: all levels; prod: warn+error only).
 *   - Optionally forwards to a single registered callback (late-bound).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ObserveLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ObservePayload {
  event:    string;
  level:    ObserveLevel;
  data:     Record<string, unknown>;
  ts:       number;
}

export type ObserverCallback = (payload: ObservePayload) => void;

// ─── State ────────────────────────────────────────────────────────────────────

/** P29: multi-subscriber set — any number of observers can coexist. */
const _observers = new Set<ObserverCallback>();

const IS_DEV = typeof import.meta !== 'undefined'
  ? (import.meta.env?.DEV ?? false)
  : false;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Register an observer. Returns an unsubscribe function for cleanup.
 * Multiple observers can be registered simultaneously (P29 upgrade).
 *
 *   const unsub = registerObserver(cb);
 *   // later:
 *   unsub();
 */
export function registerObserver(cb: ObserverCallback): () => void {
  _observers.add(cb);
  return () => { _observers.delete(cb); };
}

/**
 * Unregister a specific observer, or clear all observers if called with no args.
 * Use the unsubscribe function returned by `registerObserver` for targeted removal.
 * Use this no-arg form in tests to reset state between cases.
 */
export function unregisterObserver(cb?: ObserverCallback): void {
  if (cb) {
    _observers.delete(cb);
  } else {
    _observers.clear();
  }
}

/**
 * Emit a structured observability event.
 *
 * Always logs to console (level-gated by env).
 * Forwards to registered observer if present.
 *
 * @param event   Dot-namespaced event name, e.g. 'token.budget.exhausted'
 * @param data    Supplementary key/value context
 * @param level   Log level (default: 'info')
 */
export function observe(
  event: string,
  data:  Record<string, unknown> = {},
  level: ObserveLevel            = 'info',
): void {
  const payload: ObservePayload = { event, level, data, ts: Date.now() };

  // Console logging — always show warn/error, only show debug/info in dev
  if (level === 'error') {
    console.error('[orbit]', event, data);
  } else if (level === 'warn') {
    console.warn('[orbit]', event, data);
  } else if (IS_DEV) {
    if (level === 'debug') console.debug('[orbit]', event, data);
    else                   console.info('[orbit]', event, data);
  }

  // Forward to all registered observers (Sentry breadcrumbs, store updates, etc.)
  _observers.forEach(cb => {
    try {
      cb(payload);
    } catch {
      // Each observer is isolated — one failure must never crash the others
    }
  });
}

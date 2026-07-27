/**
 * modules/system/TokenController.ts  —  P22 Stabilization Layer / P27 Monitoring
 *
 * Per-session token budget tracker.  A pure module-level singleton (reset
 * on page reload) that prevents unbounded AI API consumption.
 *
 * Usage:
 *   if (canUseTokens(estimated)) {
 *     consumeTokens(estimated);
 *     await callAPI(input);
 *   }
 *
 * The limit can be raised at runtime for PowerUser tiers via setTokenLimit().
 * Observability events are emitted via observe() for Sentry breadcrumbs.
 */

import { observe } from '@/utils/observability';

// ─── State ────────────────────────────────────────────────────────────────────

const DEFAULT_LIMIT = 1_000;

let _used  = 0;
let _limit = DEFAULT_LIMIT;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns true if `estimated` tokens can be consumed without exceeding the limit.
 */
export function canUseTokens(estimated: number): boolean {
  return _used + estimated < _limit;
}

/**
 * Records that `n` tokens have been consumed.  Clamps at the limit.
 * Emits observability events at 90% and 100% budget thresholds.
 */
export function consumeTokens(n: number): void {
  const prev = _used;
  _used = Math.min(_used + n, _limit);

  // 90% warning
  if (prev < _limit * 0.9 && _used >= _limit * 0.9) {
    observe('token.budget.warning', { used: _used, limit: _limit, pct: 90 }, 'warn');
  }
  // Budget fully exhausted
  if (prev < _limit && _used >= _limit) {
    observe('token.budget.exhausted', { used: _used, limit: _limit }, 'warn');
  }
}

/**
 * Resets the usage counter (e.g. at session start or daily boundary).
 */
export function resetTokens(): void {
  observe('token.budget.reset', { prevUsed: _used, limit: _limit }, 'debug');
  _used = 0;
}

/**
 * Sets a new token limit.  Useful for different subscription tiers.
 * @param limit Must be a positive integer.
 */
export function setTokenLimit(limit: number): void {
  if (limit > 0) _limit = limit;
}

/**
 * Returns a snapshot of the current token budget state.
 */
export function getTokenState(): { used: number; limit: number; remaining: number } {
  return { used: _used, limit: _limit, remaining: Math.max(0, _limit - _used) };
}

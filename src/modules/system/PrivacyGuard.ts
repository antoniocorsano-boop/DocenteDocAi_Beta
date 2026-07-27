/**
 * modules/system/PrivacyGuard.ts  —  P22 Stabilization Layer / P27 Monitoring
 *
 * Privacy-first input sanitization and cloud transmission policy.
 *
 * Modes:
 *   strict   — no cloud calls; all processing stays local (default for PA pilot)
 *   balanced — cloud calls allowed for high-complexity tasks only
 *   enhanced — cloud calls allowed freely (explicitly opted-in by user)
 *
 * Usage:
 *   const safe = sanitizeInput(rawText);
 *   if (canSendToCloud()) { await callAPI(safe); }
 */

import { observe } from '@/utils/observability';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PrivacyMode = 'strict' | 'balanced' | 'enhanced';

// ─── State ────────────────────────────────────────────────────────────────────

let _mode: PrivacyMode = 'strict';

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Sets the active privacy mode.
 * Should be called once during app init based on user preferences.
 * Emits an observability event on every mode change.
 */
export function setPrivacyMode(mode: PrivacyMode): void {
  const prev = _mode;
  _mode = mode;
  if (prev !== mode) {
    observe('privacy.mode.changed', { prev, next: mode }, 'info');
  }
}

/**
 * Returns the currently active privacy mode.
 */
export function getPrivacyMode(): PrivacyMode {
  return _mode;
}

/**
 * Sanitizes free-text input before any processing or transmission.
 *
 * Applies in order:
 *   1. Strip HTML/script injection vectors (<, >)
 *   2. Remove `<script` patterns (redundant after #1 but explicit)
 *   3. Strip inline event handlers (onclick=, onload=, …)
 *   4. Redact apparent personal names ("Mario Rossi" → "[PERSON]")
 *   5. Truncate to 5 000 characters to prevent oversized payloads
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/script/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/\b[A-ZÀÈÌÒÙ][a-zàèìòùá]+ [A-ZÀÈÌÒÙ][a-zàèìòùá]+\b/g, '[PERSON]')
    .slice(0, 5_000);
}

/**
 * Returns true when the current privacy mode permits sending data to a cloud API.
 *
 *   strict   → false (local-only)
 *   balanced → true  (caller should still gate on complexity)
 *   enhanced → true  (caller may call freely)
 */
export function canSendToCloud(): boolean {
  return _mode !== 'strict';
}

/**
 * Returns true when the current mode permits logging/telemetry to external services.
 * Only allowed in 'enhanced' mode.
 */
export function canLogExternally(): boolean {
  return _mode === 'enhanced';
}

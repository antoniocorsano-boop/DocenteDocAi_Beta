/**
 * OrbitNudgeEngine — decides whether Orbit should surface a proactive nudge.
 *
 * Pure function, zero side-effects. Called on every context change; returns a
 * `NudgeDecision` that tells the UI whether to show the nudge card and which
 * suggestion to feature.
 *
 * Anti-spam contract:
 *   - Caller must enforce the 20 s cooldown by passing `msSinceLastNudge`.
 *   - Engine never references time itself (keeps it pure and testable).
 *
 * Nudge conditions (any one suffices):
 *   1. Emotional state === 'blocked'         → user stuck
 *   2. Top suggestion confidence < 0.5       → system uncertain (low-signal)
 *   3. Last user message is very short (< 10 chars) → likely lost / confused
 *   4. Emotional state === 'overloaded'      → cognitive overload
 */

import type { EmotionalState } from '@/modules/orchestration/EmotionalEngine';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface NudgeContext {
  /** Current smoothed emotional state. */
  emotionalState?:   EmotionalState;
  /** Confidence of the top suggestion (0–1). */
  topConfidence?:    number;
  /** Text of the most recent user message. */
  lastUserMessage?:  string;
  /**
   * Milliseconds since the last nudge was shown.
   * Engine returns `nudge: false` when this is below COOLDOWN_MS.
   * Pass `Infinity` (or omit) to skip cooldown check.
   */
  msSinceLastNudge?: number;
}

export interface NudgeDecision {
  /** Whether the nudge card should be displayed. */
  nudge:  boolean;
  /** Human-readable reason shown in the nudge card. */
  reason: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

/** Minimum interval between nudges (ms). */
export const NUDGE_COOLDOWN_MS = 20_000;

// ── Engine ─────────────────────────────────────────────────────────────────────

/**
 * Evaluate whether Orbit should nudge the user right now.
 *
 * Returns `{ nudge: false }` with an empty reason when the cooldown has not
 * elapsed or no trigger condition is met.
 */
export function shouldNudge(ctx: NudgeContext): NudgeDecision {
  const elapsed = ctx.msSinceLastNudge ?? Infinity;

  // ── Cooldown guard ─────────────────────────────────────────────────────────
  if (elapsed < NUDGE_COOLDOWN_MS) {
    return { nudge: false, reason: '' };
  }

  // ── Trigger conditions ─────────────────────────────────────────────────────

  if (ctx.emotionalState === 'blocked') {
    return {
      nudge:  true,
      reason: 'Posso aiutarti a semplificare questo punto',
    };
  }

  if (ctx.emotionalState === 'overloaded') {
    return {
      nudge:  true,
      reason: 'Troppo da elaborare — vuoi un riassunto rapido?',
    };
  }

  if (ctx.topConfidence !== undefined && ctx.topConfidence < 0.5) {
    return {
      nudge:  true,
      reason: 'Ho un suggerimento che potrebbe aiutarti',
    };
  }

  if (ctx.lastUserMessage !== undefined && ctx.lastUserMessage.trim().length < 10) {
    return {
      nudge:  true,
      reason: 'Sembra che tu stia cercando qualcosa — posso aiutarti?',
    };
  }

  return { nudge: false, reason: '' };
}

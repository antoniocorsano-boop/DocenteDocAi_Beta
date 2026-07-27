/**
 * theme/cognitiveLoad.ts
 *
 * Cognitive Load Balancer — P17.
 *
 * Computes a cognitive load score from runtime signals and uses it to
 * throttle Jarvis presence intensity, preventing visual overload when the
 * user is already stressed or context-switching rapidly.
 *
 * Design:
 *   - Pure functions, no React, no stores
 *   - Score-based: each signal contributes a weighted addend
 *   - Four tiers: low / medium / high / critical
 *   - Threshold constants are exported so they can be tuned without
 *     touching the algorithm
 */

import type { JarvisPresenceLevel } from './orbitStates';
import type { OrbitBehaviorSignals } from './orbitStates';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Four-tier cognitive load classification.
 *
 *   low:      full expressiveness, all presence levels available
 *   medium:   cinematic downgraded to assistant
 *   high:     forced to assistant regardless of adaptive signal
 *   critical: forced to ambient — Jarvis goes silent
 */
export type CognitiveLoadLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Input signals for `computeCognitiveLoad`.
 *
 * Overlaps intentionally with `OrbitBehaviorSignals` so that UserWorkspace
 * can pass the same object to both `resolveAdaptivePresence` and
 * `computeCognitiveLoad` without duplication.
 */
export interface CognitiveLoadSignals {
  /** Number of concurrent agent-like processes (flows + ambient workers). */
  activeAgentsCount: number;
  /** Ambient auto-executions fired this session. */
  ambientFiredCount: number;
  /** User interactions in the last 60 s (entry clicks + menu opens). */
  recentInteractions: number;
  /** Estimated task complexity (from pattern detector). */
  taskComplexity?: OrbitBehaviorSignals['taskComplexity'];
  /** Viewport width — narrow screen adds baseline cognitive pressure. */
  viewportWidth: number;
}

// ─── Score thresholds ─────────────────────────────────────────────────────────

export const LOAD_THRESHOLD_LOW      = 5;   // score < 5  → low
export const LOAD_THRESHOLD_MEDIUM   = 10;  // score < 10 → medium
export const LOAD_THRESHOLD_HIGH     = 16;  // score < 16 → high  (≥16 → critical)

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * Computes a numeric cognitive load score and maps it to a `CognitiveLoadLevel`.
 *
 * Score contributions:
 *   +2.0 per active agent  (concurrent processes are expensive)
 *   +0.5 per ambient fire  (background execution adds noise)
 *   +1.5 per recent interaction (rapid interaction = context-switching)
 *   +2.0 for medium task / +4.0 for high task (complexity raises baseline)
 *   +3.0 on mobile (small screen amplifies all stimuli)
 */
export function computeCognitiveLoad(
  signals: CognitiveLoadSignals,
): CognitiveLoadLevel {
  const {
    activeAgentsCount,
    ambientFiredCount,
    recentInteractions,
    taskComplexity = 'low',
    viewportWidth,
  } = signals;

  let score = 0;
  score += activeAgentsCount  * 2.0;
  score += ambientFiredCount  * 0.5;
  score += recentInteractions * 1.5;
  if (taskComplexity === 'medium') score += 2;
  if (taskComplexity === 'high')   score += 4;
  if (viewportWidth < 600)         score += 3; // mobile stress

  if (score < LOAD_THRESHOLD_LOW)    return 'low';
  if (score < LOAD_THRESHOLD_MEDIUM) return 'medium';
  if (score < LOAD_THRESHOLD_HIGH)   return 'high';
  return 'critical';
}

/**
 * Applies cognitive load as a presence ceiling.
 *
 * | Load     | Effect                              |
 * |----------|-------------------------------------|
 * | low      | no change — full expressiveness     |
 * | medium   | cinematic → assistant               |
 * | high     | anything above assistant → assistant|
 * | critical | forced to ambient (Jarvis silenced)  |
 */
export function balancePresenceWithLoad(
  basePresence: JarvisPresenceLevel,
  load:         CognitiveLoadLevel,
): JarvisPresenceLevel {
  switch (load) {
    case 'low':      return basePresence;
    case 'medium':   return basePresence === 'cinematic' ? 'assistant' : basePresence;
    case 'high':     return basePresence === 'ambient'   ? 'ambient'   : 'assistant';
    case 'critical': return 'ambient';
  }
}

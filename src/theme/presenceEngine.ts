/**
 * theme/presenceEngine.ts
 *
 * Final Presence Resolver — P17 Fusion Engine.
 *
 * Combines three layers into a single `JarvisPresenceLevel`:
 *
 *   Layer 1 — Adaptive (P16):   resolveAdaptivePresence()
 *   Layer 2 — Personality (P17b): resolveDominantPersonality()
 *   Layer 3 — Cognitive Load (P17a): computeCognitiveLoad() → balancePresenceWithLoad()
 *
 * The fusion is intentionally sequential: each layer can only lower or maintain the
 * result from the previous layer (load acts as a ceiling, not a floor).
 *
 * Design:
 *   - Pure function — no side-effects, no imports of React / stores
 *   - Deterministic — same input → same output
 *   - Tree-shakeable — heavy layers only active when agents array is populated
 */

import { resolveAdaptivePresence }       from './orbitStates';
import type { OrbitBehaviorSignals,
              JarvisPresenceLevel }       from './orbitStates';
import type { NexusState }               from '../components/ui/JarvisNexus';

import { resolveDominantPersonality,
         AGENT_PERSONALITIES }           from './agentPersonality';
import type { ActiveAgent }              from './agentPersonality';

import { computeCognitiveLoad,
         balancePresenceWithLoad }        from './cognitiveLoad';
import type { CognitiveLoadSignals }      from './cognitiveLoad';

import { resolveAttention }              from '../modules/orbit/attentionRouter';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FinalPresenceInput {
  /** Current Nexus visual state (drives Layer 1 baseline). */
  nexusState:       NexusState;
  /** P16 behaviour signals (pattern intent, complexity, confidence). */
  behaviorSignals:  OrbitBehaviorSignals;
  /** P17 cognitive-load signals (agent count, interactions, viewport). */
  cognitiveSignals: CognitiveLoadSignals;
  /** Active agents contributing to this session (may be empty). */
  agents:           ActiveAgent[];
}

// ─── Fusion function ─────────────────────────────────────────────────────────

/**
 * Resolves the definitive Jarvis presence level for the current render cycle.
 *
 * Fusion order:
 *   1. Adaptive base (P16 signals)
 *   2. Personality boost / suppression   — executor & mentor can promote to cinematic;
 *                                           observer can demote cinematic → assistant
 *   3. Cognitive load ceiling            — high load prevents cinematic; critical → ambient
 */
export function resolveFinalPresence({
  nexusState,
  behaviorSignals,
  cognitiveSignals,
  agents,
}: FinalPresenceInput): JarvisPresenceLevel {

  // ── Layer 1: P16 adaptive baseline ──────────────────────────────────────
  let level: JarvisPresenceLevel = resolveAdaptivePresence(nexusState, behaviorSignals);

  // ── Layer 2: personality adjustment ─────────────────────────────────────
  const dominant = resolveDominantPersonality(agents);

  if (dominant) {
    // Energetic agents (executor / mentor) can promote assistant → cinematic
    // Exception: mobile viewport — personality cannot override the mobile cap
    const isMobile = behaviorSignals.viewportWidth < 600;
    if (dominant.preferredPresence === 'cinematic' && level === 'assistant' && !isMobile) {
      level = 'cinematic';
    }

    // Passive observer with single/no competing agents suppresses cinematic → assistant
    // (avoids over-stimulation from a lone observer-mode agent)
    if (
      dominant.preferredPresence === 'ambient' &&
      level === 'cinematic' &&
      cognitiveSignals.activeAgentsCount <= 1
    ) {
      level = 'assistant';
    }
  }

  // ── Layer 3: cognitive load ceiling ─────────────────────────────────────
  const load = computeCognitiveLoad(cognitiveSignals);
  const final = balancePresenceWithLoad(level, load);

  // ── Layer 4: attention routing (P18) ────────────────────────────────────
  // Computes which agent is `primary` given the current load + intent.
  // Currently used only for dev diagnostics and UI visual differentiation.
  // The optional presence downgrade (`isPrimaryContext === false`) is wired
  // here as a hook for future multi-panel support; it is dormant (always true)
  // in the current single-Nexus layout.
  const attentionMap = resolveAttention({
    agents:       agents,
    userIntent:   behaviorSignals.userIntent,
    cognitiveLoad: load,
    now:           Date.now(),
  });

  const isPrimaryContext = true; // single Nexus — always primary context
  const primaryAgentId   = Object.keys(attentionMap).find(
    id => attentionMap[id] === 'primary',
  );
  if (!isPrimaryContext && primaryAgentId && final === 'cinematic') {
    // future: downgrade non-primary context
  }

  // ── Dev diagnostics (stripped by Vite/esbuild in production) ─────────────
  if (process.env.NODE_ENV === 'development') {
    const dominantName = dominant
      ? (agents.find(a => AGENT_PERSONALITIES[a.personality] === dominant)?.personality ?? '?')
      : 'none';
    console.debug('[Orbit] presence resolved', {
      nexusState,
      userIntent:         behaviorSignals.userIntent,
      taskComplexity:     behaviorSignals.taskComplexity,
      agentConfidence:    behaviorSignals.agentConfidence,
      activeAgentsCount:  cognitiveSignals.activeAgentsCount,
      ambientFiredCount:  cognitiveSignals.ambientFiredCount,
      dominantPersonality: dominant ? `${dominantName} (mult=${dominant.motionMultiplier})` : 'none',
      cognitiveLoad:      load,
      attentionPrimary:   primaryAgentId ?? 'none',
      attentionMap,
      finalPresence:      final,
    });
  }

  return final;
}

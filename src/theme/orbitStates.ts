/**
 * theme/orbitStates.ts
 *
 * Orbit UI Identity System — 4 macro states + Jarvis presence model.
 *
 * Each macro state defines:
 *   - Visual behaviour (colours, motion, density)
 *   - Jarvis presence level (ambient / assistant / cinematic)
 *   - Keyboard affordances
 *   - Accessibility copy for screen readers
 *
 * Design:
 *   - Pure data — no React, no stores, no side-effects
 *   - References ORBIT_COLORS and ORBIT_MOTION token layers
 *   - Used by JarvisNexus, JarvisIndicator and UserWorkspace for consistent
 *     behavioral mapping across the UI
 */

import type { NexusState } from '../components/ui/JarvisNexus';
import { ORBIT_COLORS, ORBIT_MOTION } from './orbitTokens';

// ─── Presence level ───────────────────────────────────────────────────────────

/**
 * Jarvis presence levels — how visually prominent Jarvis is.
 *
 *   ambient:    Subtle indicator only — dot or glow. Non-intrusive.
 *   assistant:  Panel available on demand (Ctrl+Shift+J), action strip visible.
 *   cinematic:  Full orbital panel, animations active, proactive overlays.
 */
export type JarvisPresenceLevel = 'ambient' | 'assistant' | 'cinematic';

// ─── Macro state spec ─────────────────────────────────────────────────────────

export interface OrbitMacroState {
  /** Which NexusState values this macro state covers */
  nexusStates:    NexusState[];
  /** Jarvis presence level in this state */
  presence:       JarvisPresenceLevel;
  /** CSS color for the Jarvis orb / indicator */
  orbColor:       string;
  /** CSS animation duration for the pulse / ring */
  pulseDuration:  string;
  /** Whether the orbital ring is spinning (processing) */
  ringSpinning:   boolean;
  /** Label for screen readers */
  ariaLabel:      string;
  /** Short human-readable status label */
  statusLabel:    string;
}

// ─── 4 Macro States ───────────────────────────────────────────────────────────

/**
 * Orbit Identity System — 4 macro states:
 *
 *  1. IDLE         — no activity, ambient presence
 *  2. SUGGESTION   — delta or flow card pending, assistant presence
 *  3. ACTIVE       — skill auto-fired or action in progress, cinematic
 *  4. AUTONOMOUS   — silent/ambient skill execution in flight, cinematic
 */
export const ORBIT_MACRO_STATES: Record<string, OrbitMacroState> = {
  IDLE: {
    nexusStates:   ['idle'],
    presence:      'ambient',
    orbColor:      'var(--md-sys-color-outline)',
    pulseDuration: ORBIT_MOTION.idlePulseDuration,
    ringSpinning:  false,
    ariaLabel:     'Jarvis inattivo — in ascolto',
    statusLabel:   'In ascolto',
  },

  SUGGESTION: {
    nexusStates:   ['suggestion', 'learning'],
    presence:      'assistant',
    orbColor:      ORBIT_COLORS.jarvisAccent,
    pulseDuration: ORBIT_MOTION.activePulseDuration,
    ringSpinning:  false,
    ariaLabel:     'Jarvis ha suggerimenti in attesa',
    statusLabel:   'Suggerimento disponibile',
  },

  ACTIVE: {
    nexusStates:   ['decision', 'processing'],
    presence:      'cinematic',
    orbColor:      ORBIT_COLORS.jarvisAccent,
    pulseDuration: ORBIT_MOTION.activePulseDuration,
    ringSpinning:  true,
    ariaLabel:     'Jarvis sta elaborando',
    statusLabel:   'Elaborazione in corso',
  },

  AUTONOMOUS: {
    nexusStates:   [], // virtual state — triggered by ambientFiredCount > 0
    presence:      'cinematic',
    orbColor:      ORBIT_COLORS.ambientIndicator,
    pulseDuration: ORBIT_MOTION.activePulseDuration,
    ringSpinning:  false,
    ariaLabel:     'Jarvis sta lavorando in autonomia',
    statusLabel:   'Autonomia attiva',
  },
} as const;

// ─── Presence resolver ────────────────────────────────────────────────────────

/**
 * Resolves the Jarvis presence level from runtime state.
 * Used by JarvisIndicator and UserWorkspace to decide visual behaviour.
 *
 * @param nexusState       - Current NexusState
 * @param ambientFiredCount - Number of ambient auto-executions this session
 * @param viewportWidth    - Current viewport width in px (for mobile/desktop)
 */
export function resolvePresenceLevel(
  nexusState:        NexusState,
  ambientFiredCount: number,
  viewportWidth:     number,
): JarvisPresenceLevel {
  // On narrow viewports, cap at assistant level to avoid UI disruption
  if (viewportWidth < 600) {
    return nexusState === 'idle' ? 'ambient' : 'assistant';
  }

  // Autonomous mode: ambient fires in progress
  if (ambientFiredCount > 0) return 'cinematic';

  // Map nexusState to macro state
  for (const spec of Object.values(ORBIT_MACRO_STATES)) {
    if (spec.nexusStates.includes(nexusState)) return spec.presence;
  }
  return 'ambient';
}

/**
 * Returns the OrbitMacroState spec for a given nexusState.
 * Falls back to IDLE for unrecognised states.
 */
export function getMacroState(
  nexusState:        NexusState,
  ambientFiredCount: number = 0,
): OrbitMacroState {
  if (ambientFiredCount > 0) return ORBIT_MACRO_STATES.AUTONOMOUS;

  for (const spec of Object.values(ORBIT_MACRO_STATES)) {
    if (spec.nexusStates.includes(nexusState)) return spec;
  }
  return ORBIT_MACRO_STATES.IDLE;
}

// ─── Adaptive Behavior Layer (P16) ───────────────────────────────────────────

/**
 * Semantic signals that drive the adaptive presence resolver.
 *
 * All fields except `viewportWidth` and `ambientFiredCount` are optional so
 * callers can provide only the signals they have — the resolver degrades
 * gracefully to the P15 static logic for any missing field.
 */
export interface OrbitBehaviorSignals {
  /** Viewport width in px — used to cap presence on narrow screens. */
  viewportWidth:    number;
  /** Ambient auto-executions fired this session. */
  ambientFiredCount: number;
  /** What the user is currently trying to do. */
  userIntent?:      'explore' | 'execute' | 'learn' | 'idle';
  /** Estimated complexity of the current task. */
  taskComplexity?:  'low' | 'medium' | 'high';
  /**
   * Confidence score of the most active agent (0 → 1).
   * Sourced from trust store or pattern detector.
   */
  agentConfidence?: number;
  /**
   * Number of agent-like processes running concurrently
   * (flows + ambient skill workers).
   */
  activeAgentsCount?: number;
}

/**
 * Adaptive presence resolver — P16.
 *
 * Replaces the static `resolvePresenceLevel` with a context-aware algorithm:
 *
 *   UI ≠ state  →  UI = interpretation of context
 *
 * Rules (in priority order):
 *   1. Mobile cap     — never cinematic on < 600 px
 *   2. Ambient limit  — downgrade cinematic→assistant after 5 ambient fires
 *   3. Multi-agent    — two+ agents with confidence > 0.6 → cinematic
 *   4. Agent+complex  — high confidence + high task → cinematic
 *   5. Learning mode  — learn intent + high complexity → cinematic
 *   6. Execute intent — assistant minimum
 *   7. NexusState map — decision/processing → assistant; autonomous → cinematic
 *   8. Fallback       — ambient
 */
export function resolveAdaptivePresence(
  nexusState: NexusState,
  signals:    OrbitBehaviorSignals,
): JarvisPresenceLevel {
  const {
    viewportWidth,
    ambientFiredCount,
    userIntent,
    taskComplexity,
    agentConfidence  = 0,
    activeAgentsCount = 0,
  } = signals;

  // 📱 1. Mobile cap — always limit to assistant on narrow viewports
  if (viewportWidth < 600) {
    return nexusState === 'idle' && ambientFiredCount === 0 ? 'ambient' : 'assistant';
  }

  // Start from NexusState-derived baseline
  let level: JarvisPresenceLevel = 'ambient';

  if (nexusState === 'suggestion' || nexusState === 'learning') level = 'assistant';
  if (nexusState === 'decision'   || nexusState === 'processing') level = 'assistant';
  if (ambientFiredCount > 0) level = 'cinematic';

  // 🎯 3. Execute intent → assistant minimum
  if (userIntent === 'execute' && level === 'ambient') level = 'assistant';

  // 📚 4. Learn + high complexity → cinematic
  if (userIntent === 'learn' && taskComplexity === 'high') level = 'cinematic';

  // 🤖 5. Agent confidence + high complexity → cinematic
  if (agentConfidence > 0.75 && taskComplexity === 'high') level = 'cinematic';

  // 🧠 6. Multi-agent escalation → cinematic
  if (activeAgentsCount >= 2 && agentConfidence > 0.6) level = 'cinematic';

  // 🌊 7. Ambient overload guard — downgrade cinematic if too many ambient fires
  //    (prevents "always cinematic" fatigue after long autonomous sessions)
  if (ambientFiredCount > 5 && level === 'cinematic') level = 'assistant';

  return level;
}

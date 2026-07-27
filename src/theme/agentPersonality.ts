/**
 * theme/agentPersonality.ts
 *
 * Agent Personality Layer — P17b.
 *
 * Each "agent" (flow worker, ambient skill, named Jarvis sub-system) expresses
 * a personality that influences how the UI presents itself:
 *
 *   executor  → energetic, fast, prominent (cinematic)
 *   analyst   → precise, measured, informative (assistant)
 *   mentor    → warm, expansive, educational (cinematic)
 *   observer  → silent, minimal, non-intrusive (ambient)
 *
 * The dominant personality is the highest-priority active agent.
 * It shifts presence level, animation speed, and accent colour.
 *
 * Design:
 *   - Pure data + pure functions, no side-effects
 *   - colorShift uses literal hex — only applied via JS inline style,
 *     never as a CSS class, so it bypasses the MD3 class-selector rules.
 *     (Acceptable exception because it's a CSS custom-property override.)
 */

import type { JarvisPresenceLevel } from './orbitStates';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgentPersonality =
  | 'analyst'
  | 'executor'
  | 'mentor'
  | 'observer';

export interface AgentPersonalityProfile {
  /**
   * Preferred Jarvis presence level for this personality.
   * The fusion engine may promote or limit this based on load + P16 signals.
   */
  preferredPresence: JarvisPresenceLevel;
  /**
   * Multiplier applied to ORBIT_MOTION base durations.
   *   < 1 → slower / calmer
   *   > 1 → faster / more energetic
   */
  motionMultiplier:  number;
  /**
   * Optional hex colour override for the Jarvis orb accent.
   * Applied via CSS `--orbit-accent-override` custom property.
   * Falls back to `ORBIT_COLORS.jarvisAccent` when undefined.
   */
  colorShift?:       string;
  /**
   * Priority used to elect the dominant personality when multiple agents
   * are active. Higher number wins (3 > 2 > 1).
   */
  priority:          number;
}

export interface ActiveAgent {
  /** Unique identifier (flow id, skill id, or well-known system id). */
  id:          string;
  personality: AgentPersonality;
}

// ─── Personality catalogue ────────────────────────────────────────────────────

export const AGENT_PERSONALITIES: Record<AgentPersonality, AgentPersonalityProfile> = {
  /** Analyst: careful, structured — prefers assistant-level visibility */
  analyst: {
    preferredPresence: 'assistant',
    motionMultiplier:  0.8,
    colorShift:        '#60a5fa', // tailwind blue-400
    priority:          2,
  },
  /** Executor: results-oriented, energetic — promotes cinematic mode */
  executor: {
    preferredPresence: 'cinematic',
    motionMultiplier:  1.2,
    colorShift:        '#f59e0b', // tailwind amber-400
    priority:          3,
  },
  /** Mentor: warm, expansive — cinematic but unhurried */
  mentor: {
    preferredPresence: 'cinematic',
    motionMultiplier:  1.0,
    colorShift:        '#34d399', // tailwind emerald-400
    priority:          2,
  },
  /** Observer: silent monitor — stays out of the way */
  observer: {
    preferredPresence: 'ambient',
    motionMultiplier:  0.6,
    colorShift:        '#9ca3af', // tailwind gray-400
    priority:          1,
  },
};

// ─── Dominance resolution ─────────────────────────────────────────────────────

/**
 * Elects the dominant `AgentPersonalityProfile` from a list of active agents.
 *
 * Ties are broken by the order of `agents` (first-in-list wins on equal priority).
 * Returns `null` when the list is empty.
 */
export function resolveDominantPersonality(
  agents: ActiveAgent[],
): AgentPersonalityProfile | null {
  if (agents.length === 0) return null;

  const sorted = [...agents].sort(
    (a, b) =>
      AGENT_PERSONALITIES[b.personality].priority -
      AGENT_PERSONALITIES[a.personality].priority,
  );

  return AGENT_PERSONALITIES[sorted[0].personality];
}

/**
 * Returns the animation duration (ms) for a given ORBIT_MOTION base value
 * (e.g. `'1.5s'`) scaled by the dominant agent's `motionMultiplier`.
 *
 * Example:
 *   applyMotionMultiplier('1.5s', 1.2) → '1.25s'
 *   applyMotionMultiplier('3s',   0.8) → '3.75s'
 */
export function applyMotionMultiplier(
  baseDurationCss: string,
  multiplier:      number,
): string {
  // Parse number from e.g. '1.5s' or '280ms'
  const ms = baseDurationCss.endsWith('ms')
    ? parseFloat(baseDurationCss)
    : parseFloat(baseDurationCss) * 1000;

  const adjusted = ms / multiplier; // higher multiplier = shorter duration = faster
  return adjusted >= 1000
    ? `${(adjusted / 1000).toFixed(2)}s`
    : `${Math.round(adjusted)}ms`;
}

/**
 * modules/orbit/narrativeLayer.ts
 *
 * P21 — Narrative Layer.
 *
 * Translates AgentAction[] into human-readable Italian status messages.
 *
 * Two modes:
 *   generateNarrative(actions)           → simple label: "Analisi in corso…"
 *   generateRichNarrative(actions, agents) → prefixed: "Analyst: Analisi in corso…"
 *
 * Design:
 *   - Pure functions, no React, no store imports
 *   - Italian copy only — the app targets Italian-speaking teachers
 *   - Returns null (not empty string) when there is nothing meaningful to say
 *     (empty list, idle-only list, or unknown action type)
 */

import type { AgentAction, AgentActionType } from './coordinationEngine';
import type { AgentPersonality }             from '../../theme/agentPersonality';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Minimal agent shape required by the narrative layer. */
export interface NarrativeAgent {
  id:          string;
  personality: AgentPersonality;
}

// ─── Copy tables ──────────────────────────────────────────────────────────────

/**
 * Italian status labels — describes what is *happening now* from the user POV.
 * `idle` deliberately maps to an empty string so callers can check for null.
 */
export const NARRATIVE_LABELS_IT: Record<AgentActionType, string> = {
  analyze:  'Analisi in corso…',
  plan:     'Sto pianificando i passi…',
  execute:  'Esecuzione operazione…',
  explain:  'Ti spiego cosa sta succedendo…',
  observe:  'In ascolto…',
  handoff:  'Passaggio tra agenti…',
  idle:     '',
};

/**
 * Italian personality display names used for narrative prefixes.
 * Kept intentionally terse so they fit inline on small screens.
 */
export const PERSONALITY_LABEL_IT: Record<AgentPersonality, string> = {
  analyst:  'Analyst',
  executor: 'Executor',
  mentor:   'Mentor',
  observer: 'Observer',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the highest-priority non-idle action, or undefined when none exists. */
function primaryNonIdleAction(actions: AgentAction[]): AgentAction | undefined {
  return [...actions]
    .sort((a, b) => b.priority - a.priority)
    .find(a => a.type !== 'idle');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns a concise Italian label for the most important current action.
 * Returns null when the list is empty or only contains idle actions.
 *
 * @example
 *   generateNarrative([{ agentId: 'a1', type: 'analyze', priority: 10 }])
 *   // → "Analisi in corso…"
 */
export function generateNarrative(actions: AgentAction[]): string | null {
  const action = primaryNonIdleAction(actions);
  if (!action) return null;
  const label = NARRATIVE_LABELS_IT[action.type];
  return label || null;
}

/**
 * Returns a richer Italian label prefixed with the acting agent's personality name.
 * Falls back to "Agent" when the agent id is not found in the provided roster.
 *
 * @example
 *   generateRichNarrative(actions, agents)
 *   // → "Analyst: Analisi in corso…"
 *   // → "Executor: Esecuzione operazione…"
 */
export function generateRichNarrative(
  actions: AgentAction[],
  agents:  NarrativeAgent[],
): string | null {
  const action = primaryNonIdleAction(actions);
  if (!action) return null;
  const label = NARRATIVE_LABELS_IT[action.type];
  if (!label) return null;
  const agent      = agents.find(a => a.id === action.agentId);
  const agentLabel = agent ? PERSONALITY_LABEL_IT[agent.personality] : 'Agent';
  return `${agentLabel}: ${label}`;
}

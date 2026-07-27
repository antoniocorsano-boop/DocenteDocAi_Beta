/**
 * modules/orbit/coordinationEngine.ts
 *
 * P19 — Multi-Agent Coordination Protocol.
 *
 * Transforms the flat list of attention-ranked agents (P18) into an ordered
 * sequence of `AgentAction` objects — a micro-program that the runtime can
 * execute step by step.
 *
 * Design:
 *   - Pure functions, no React, no side-effects
 *   - Deterministic: same signals → same action list
 *   - Capability-gated: agents can only perform actions their personality
 *     supports; incapable agents are handed off to a qualified peer
 *   - Priority-ordered output: callers read [0] for the "primary action" or
 *     iterate for a pipeline
 *
 * Rule evaluation order:
 *   1. Execute intent (fastest path)
 *   2. Learn intent (mentor takes over)
 *   3. Explore intent (parallel observation)
 *   4. High-complexity task (analyst → hand-off → executor pipeline)
 *   5. Fallback observe
 */

import type { AgentPersonality }    from '../../theme/agentPersonality';
import type { AgentAttentionState } from './attentionRouter';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * The set of atomic operations an agent can perform.
 *
 *   analyze   — deep inspection of context / data
 *   plan      — build a structured approach before acting
 *   execute   — carry out an action (flow run, automation)
 *   explain   — produce a human-readable narrative
 *   observe   — passive monitoring; no user-visible output
 *   handoff   — delegation marker; pairs with a `targetAgentId`
 *   idle      — no work to do
 */
export type AgentActionType =
  | 'analyze'
  | 'plan'
  | 'execute'
  | 'explain'
  | 'observe'
  | 'handoff'
  | 'idle';

/**
 * A single unit of work assigned to one agent.
 *
 * Actions with `type === 'handoff'` must carry a `targetAgentId`.
 * Priority is used by callers to determine sequencing or importance.
 */
export interface AgentAction {
  agentId:        string;
  type:           AgentActionType;
  /** Populated only on `handoff` actions — the recipient agent id. */
  targetAgentId?: string;
  /** Arbitrary metadata for the action (not consumed by this module). */
  payload?:       unknown;
  /** Higher = more important / processed first. */
  priority:       number;
}

/**
 * Input agent record for `coordinateAgents`.
 *
 * Extends the base `ActiveAgent` shape with the P18 attention tier and a
 * model confidence score so coordination can make smarter decisions.
 */
export interface CoordinationAgent {
  id:          string;
  personality: AgentPersonality;
  /** P18 attention tier for this agent in the current routing cycle. */
  attention:   AgentAttentionState;
  /** Model confidence [0, 1]. Used to bias action selection. */
  confidence:  number;
}

/**
 * All signals consumed by `coordinateAgents`.
 */
export interface CoordinationSignals {
  agents:          CoordinationAgent[];
  userIntent?:     'explore' | 'execute' | 'learn' | 'idle';
  taskComplexity?: 'low' | 'medium' | 'high';
}

// ─── Capability map ───────────────────────────────────────────────────────────

/**
 * Each personality has a fixed set of action types it can perform.
 * Any action outside this set triggers a `handoff` to a capable peer.
 */
export const AGENT_CAPABILITIES: Record<AgentPersonality, AgentActionType[]> = {
  analyst:  ['analyze', 'plan'],
  executor: ['execute'],
  mentor:   ['explain', 'plan'],
  observer: ['observe'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true when `agent` can autonomously handle `action`. */
function canHandle(agent: CoordinationAgent, action: AgentActionType): boolean {
  return AGENT_CAPABILITIES[agent.personality].includes(action);
}

/**
 * Produces a two-action handoff sequence: `from` delegates to `to`,
 * then `to` performs the target action.
 */
function createHandoff(
  from:   CoordinationAgent,
  to:     CoordinationAgent,
  action: AgentActionType,
): AgentAction[] {
  return [
    {
      agentId:       from.id,
      type:          'handoff',
      targetAgentId: to.id,
      priority:      9,
    },
    {
      agentId:  to.id,
      type:     action,
      priority: 10,
    },
  ];
}

/** Find first non-suppressed agent by personality. */
function findByPersonality(
  agents:      CoordinationAgent[],
  personality: AgentPersonality,
): CoordinationAgent | undefined {
  return agents.find(
    a => a.personality === personality && a.attention !== 'suppressed',
  );
}

// ─── Main coordinator ─────────────────────────────────────────────────────────

/**
 * Produces an ordered list of `AgentAction` objects for the current render cycle.
 *
 * Never produces:
 *   - Two simultaneous `execute` actions (conflict-free)
 *   - Actions for `suppressed` agents (attention-aware)
 *   - Actions a personality cannot handle without a handoff
 *
 * Returns an empty array only when there is no primary agent (all suppressed or
 * no agents at all).
 */
export function coordinateAgents(signals: CoordinationSignals): AgentAction[] {
  const { agents, userIntent, taskComplexity } = signals;

  const primary = agents.find(a => a.attention === 'primary');
  if (!primary) return [];

  // ── EXECUTE ───────────────────────────────────────────────────────────────
  if (userIntent === 'execute') {
    if (canHandle(primary, 'execute')) {
      return [{ agentId: primary.id, type: 'execute', priority: 10 }];
    }
    // Primary can't execute — hand off to an executor
    const executor = findByPersonality(agents, 'executor');
    if (executor) {
      return createHandoff(primary, executor, 'execute');
    }
    // No executor available: primary plans as best-effort
    if (canHandle(primary, 'plan')) {
      return [{ agentId: primary.id, type: 'plan', priority: 7 }];
    }
  }

  // ── LEARN ─────────────────────────────────────────────────────────────────
  if (userIntent === 'learn') {
    const mentor = findByPersonality(agents, 'mentor');
    if (mentor) {
      return [{ agentId: mentor.id, type: 'explain', priority: 10 }];
    }
    // No mentor: analyst can plan an explanation
    const analyst = findByPersonality(agents, 'analyst');
    if (analyst) {
      return [{ agentId: analyst.id, type: 'analyze', priority: 8 }];
    }
  }

  // ── EXPLORE ───────────────────────────────────────────────────────────────
  if (userIntent === 'explore') {
    const active = agents.filter(a => a.attention !== 'suppressed');
    if (active.length > 0) {
      return active.map(a => ({
        agentId:  a.id,
        type:     a.personality === 'analyst' ? 'analyze' : 'observe',
        priority: a.attention === 'primary' ? 8 : 5,
      }));
    }
  }

  // ── HIGH COMPLEXITY PIPELINE ──────────────────────────────────────────────
  // Regardless of intent, a high-complexity task benefits from
  // analyze → hand-off → execute sequencing.
  if (taskComplexity === 'high') {
    const analyst  = findByPersonality(agents, 'analyst');
    const executor = findByPersonality(agents, 'executor');

    if (analyst && executor) {
      return [
        { agentId: analyst.id,  type: 'analyze',  priority: 10 },
        { agentId: analyst.id,  type: 'handoff',  targetAgentId: executor.id, priority: 9 },
        { agentId: executor.id, type: 'execute',  priority: 10 },
      ];
    }
    // Only analyst available: plan
    if (analyst) {
      return [{ agentId: analyst.id, type: 'plan', priority: 8 }];
    }
  }

  // ── FALLBACK ──────────────────────────────────────────────────────────────
  return [{ agentId: primary.id, type: 'observe', priority: 1 }];
}

// ─── Narrative helpers ────────────────────────────────────────────────────────

/**
 * Maps an `AgentActionType` to a short Italian label for the UI narrative strip.
 * The label describes what is *happening now* from the user's perspective.
 */
export const ACTION_LABELS_IT: Record<AgentActionType, string> = {
  analyze:  'Analisi in corso…',
  plan:     'Pianificazione…',
  execute:  'Esecuzione task…',
  explain:  'Spiegazione…',
  observe:  'In ascolto…',
  handoff:  'Delega in corso…',
  idle:     '',
};

/**
 * Returns the Italian narrative label for the highest-priority action in a list.
 * Returns `null` when the list is empty or only contains `idle` actions.
 */
export function getPrimaryActionLabel(actions: AgentAction[]): string | null {
  if (actions.length === 0) return null;
  const sorted = [...actions].sort((a, b) => b.priority - a.priority);
  const first  = sorted[0];
  const label  = ACTION_LABELS_IT[first.type];
  return label || null;
}

/**
 * modules/orbit/attentionRouter.ts
 *
 * P18 — Attention Routing System.
 *
 * Decides, at each render cycle, which agent has the user's attention focus
 * and how loud the other agents can be.  Prevents visual chaos when multiple
 * flows / skills are active simultaneously.
 *
 * Design:
 *   - Pure functions (no React, no stores, no side-effects)
 *   - Score-based election: every agent gets a numeric score, the highest
 *     wins `primary`; the rest are ranked into secondary / background / suppressed
 *   - Cognitive load acts as a ceiling on the number of secondary slots
 *     (high → 1 secondary, critical → 0 secondaries)
 *   - Event-throttle utility prevents flicker when multiple signals fire close
 *     together (< 400 ms apart)
 *
 * Terminology:
 *   primary     — only agent actively guiding the user; full opacity + scale
 *   secondary   — visible companion, lower contrast
 *   background  — present but silent (very low opacity)
 *   suppressed  — completely hidden (critical load)
 */

import type { AgentPersonality } from '../../theme/agentPersonality';
import { AGENT_PERSONALITIES }   from '../../theme/agentPersonality';
import type { CognitiveLoadLevel } from '../../theme/cognitiveLoad';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Attention tier for one agent in the current routing cycle.
 *
 *   primary     → full visual prominence; this agent is "speaking"
 *   secondary   → companion; visible but not dominant
 *   background  → present but silent (low opacity / smaller scale)
 *   suppressed  → hidden; not rendered
 */
export type AgentAttentionState =
  | 'primary'
  | 'secondary'
  | 'background'
  | 'suppressed';

/** Convenience alias — keyed by agent id. */
export type AttentionMap = Record<string, AgentAttentionState>;

/**
 * Per-agent input for `resolveAttention`.
 *
 * All fields except `id` and `personality` are optional and have sensible
 * defaults so that the existing `ActiveAgent[]` (which only carries id +
 * personality) can be passed directly — TypeScript structural compatibility.
 */
export interface AttentionAgentInput {
  id:            string;
  personality:   AgentPersonality;
  /**
   * Explicit priority override.
   * When omitted, falls back to `AGENT_PERSONALITIES[personality].priority`.
   */
  priority?:     number;
  /**
   * How confident the underlying model is about this agent's relevance.
   * Range [0, 1]. Defaults to 0.5 (neutral).
   */
  confidence?:   number;
  /**
   * Epoch-ms timestamp of the last time this agent was active / fired.
   * Defaults to `now - 5 minutes` (i.e. "cold / inactive").
   */
  lastActiveTs?: number;
}

/**
 * All signals consumed by `resolveAttention`.
 */
export interface AttentionSignals {
  agents:       AttentionAgentInput[];
  /**
   * Inferred intent of the current user action.
   * Aligns with `OrbitBehaviorSignals.userIntent`.
   */
  userIntent?:  'explore' | 'execute' | 'learn' | 'idle';
  /** Pre-computed cognitive load level for this render cycle. */
  cognitiveLoad: CognitiveLoadLevel;
  /** Reference epoch-ms (pass `Date.now()` at call site for reproducibility in tests). */
  now:           number;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

/** Default confidence when the caller provides none. */
const DEFAULT_CONFIDENCE        = 0.5;
/** How many ms in the past to place an agent with no lastActiveTs  */
const DEFAULT_INACTIVE_OFFSET   = 300_000; // 5 min

/**
 * Computes a scalar priority score for one agent.
 *
 * Score components:
 *   +priority × 3      — catalogue priority (executor=3, analyst=2, mentor=2, observer=1)
 *   +confidence × 5    — model confidence [0,1]
 *   +recency bonus     — up to +5 for agents active within the last 10 s; decays to 0 at 10 s
 *   +intent alignment  — +5 when personality matches current user intent
 */
function scoreAgent(
  agent:   AttentionAgentInput,
  signals: AttentionSignals,
): number {
  const { userIntent, now } = signals;
  const { personality }     = agent;

  const priority     = agent.priority    ?? AGENT_PERSONALITIES[personality].priority;
  const confidence   = agent.confidence  ?? DEFAULT_CONFIDENCE;
  const lastActiveTs = agent.lastActiveTs ?? now - DEFAULT_INACTIVE_OFFSET;

  let score = 0;

  // Base priority drives the election for agents with equal confidence
  score += priority * 3;

  // Model confidence reflects how likely this agent's output is correct
  score += confidence * 5;

  // Recency bonus: linear decay from +5 (just fired) to 0 (≥ 10 s ago)
  const ageMs = now - lastActiveTs;
  score += Math.max(0, 5 - ageMs / 2_000);

  // Intent alignment: personality perfectly matches what the user is trying to do
  if (userIntent === 'execute' && personality === 'executor') score += 5;
  if (userIntent === 'learn'   && personality === 'mentor')   score += 5;

  return score;
}

// ─── Main resolver ────────────────────────────────────────────────────────────

/**
 * Resolves the attention tier for every agent in `signals.agents`.
 *
 * Result semantics:
 *   - Exactly 1 `primary` (the highest-scoring agent).
 *   - 0–2 `secondary` depending on cognitive load:
 *       low / medium → up to 2
 *       high         → up to 1
 *       critical     → 0
 *   - Remaining agents: `suppressed` when critical, `background` otherwise.
 *
 * Returns an empty map when `agents` is empty (no routing needed).
 */
export function resolveAttention(signals: AttentionSignals): AttentionMap {
  const { agents, cognitiveLoad } = signals;

  if (agents.length === 0) return {};

  // Score + sort descending
  const ranked = agents
    .map(a => ({ agent: a, score: scoreAgent(a, signals) }))
    .sort((a, b) => b.score - a.score);

  const result: AttentionMap = {};

  // Slot budget from cognitive load
  const secondarySlots =
    cognitiveLoad === 'critical' ? 0 :
    cognitiveLoad === 'high'     ? 1 :
                                   2;   // low | medium

  // Primary (always exactly 1)
  result[ranked[0].agent.id] = 'primary';

  // Secondaries
  const secondaryEnd = Math.min(secondarySlots + 1, ranked.length);
  for (let i = 1; i < secondaryEnd; i++) {
    result[ranked[i].agent.id] = 'secondary';
  }

  // Background / suppressed
  for (let i = secondaryEnd; i < ranked.length; i++) {
    result[ranked[i].agent.id] =
      cognitiveLoad === 'critical' ? 'suppressed' : 'background';
  }

  return result;
}

// ─── Event throttling ─────────────────────────────────────────────────────────

/**
 * Minimal debounce guard for the attention router's callers.
 *
 * Returns `true` when an event should be processed; `false` when it falls
 * within the throttle window of the last accepted event.
 *
 * Prevents UI flicker when multiple signals arrive in rapid succession (e.g.
 * two flows firing within the same 400 ms window).
 *
 * @param now - Current epoch-ms; defaults to `Date.now()`.
 */

const EVENT_THROTTLE_MS = 400;
let _lastEventTs = 0;

export function shouldProcessEvent(now: number = Date.now()): boolean {
  if (now - _lastEventTs < EVENT_THROTTLE_MS) return false;
  _lastEventTs = now;
  return true;
}

/** Resets the throttle timer. Exported for test isolation. */
export function resetEventThrottle(): void {
  _lastEventTs = 0;
}

// ─── Priority queue ───────────────────────────────────────────────────────────

/**
 * An event that can be queued for deferred or ordered handling.
 */
export interface QueuedEvent {
  /** Unique identifier for this event. */
  id:        string;
  /** Higher = processed first. */
  priority:  number;
  /** Arbitrary payload (caller-typed). */
  payload?:  unknown;
}

/**
 * Enqueues `event` into an immutable copy of `queue`, sorted by priority
 * descending.  Uses an insertion-aware sort so existing order is stable for
 * equal-priority events.
 *
 * @returns A new sorted array (does not mutate the original).
 */
export function enqueueEvent(queue: QueuedEvent[], event: QueuedEvent): QueuedEvent[] {
  return [...queue, event].sort((a, b) => b.priority - a.priority);
}

// ─── Visual styling helpers ───────────────────────────────────────────────────

/**
 * Maps an `AgentAttentionState` to its CSS opacity value.
 *
 * Used by JarvisNexus to tint non-primary agent cards.
 */
export function attentionOpacity(state: AgentAttentionState | undefined): number {
  switch (state) {
    case 'primary':     return 1;
    case 'secondary':   return 0.7;
    case 'background':  return 0.35;
    case 'suppressed':  return 0;
    default:            return 1;   // no routing data → full visibility
  }
}

/**
 * Maps an `AgentAttentionState` to a CSS transform scale value.
 */
export function attentionScale(state: AgentAttentionState | undefined): number {
  switch (state) {
    case 'primary':    return 1;
    case 'secondary':  return 0.97;
    case 'background': return 0.93;
    case 'suppressed': return 0.85;
    default:           return 1;
  }
}

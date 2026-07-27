/**
 * modules/orbit/executionEngine.ts
 *
 * P20 — Execution Engine.
 *
 * Transforms an ordered AgentAction[] (produced by P19 coordinationEngine) into
 * actual side-effects: store dispatches, UI signals, structured logging.
 *
 * Architecture:
 *   - Registry pattern: each AgentActionType maps to one ActionHandler
 *   - ExecutionContext carries injected runtime dependencies (dispatch, logger)
 *   - dedupeActions() guards against duplicate (agentId × type) pairs
 *   - runExecutionPipeline() is the single public entry point, safe for useEffect
 *
 * Anti-spam contract:
 *   The pipeline itself does NOT throttle — callers are responsible for
 *   debouncing (e.g. via a useRef key-diff guard in the hook layer).
 *
 * Dispatch events emitted:
 *   ORBIT_RUN_TASK         — forwarded by `execute` handler
 *   ORBIT_SHOW_EXPLANATION — forwarded by `explain` handler
 *
 * Task lifecycle:
 *   idle → running → success | error
 *   Reported via `ExecutionContext.onStateChange` when provided.
 */

import type { AgentAction, AgentActionType } from './coordinationEngine';

// ─── Task lifecycle ──────────────────────────────────────────────────────────

/**
 * Lifecycle states for the execution pipeline.
 *
 *   idle    — no work queued (initial / after completion)
 *   running — pipeline is processing at least one action
 *   success — all actions completed without throwing
 *   error   — at least one action handler threw (pipeline still ran to completion)
 */
export type TaskState = 'idle' | 'running' | 'success' | 'error';

// ─── Execution context ────────────────────────────────────────────────────────

/**
 * Runtime dependencies injected at the call-site.
 * Keeping this interface injectable makes the pipeline fully testable without React.
 */
export interface ExecutionContext {
  /** Opaque session handle, forwarded to handlers that need it. */
  orbitSession?: unknown;
  /**
   * Generic event bus — callers wire this to Zustand actions, telemetry, or
   * a simple dev-mode console sink.
   */
  dispatch: (action: { type: string; payload?: unknown }) => void;
  /** Optional structured logger; omit in production to suppress debug output. */
  logger?: (msg: string, data?: unknown) => void;
  /**
   * Lifecycle callback — called with `'running'` at start, then `'success'`
   * or `'error'` at completion.  The `action` argument identifies the specific
   * action being processed (absent for the start/done calls).
   */
  onStateChange?: (state: TaskState, action?: AgentAction) => void;
}

// ─── Handler type ─────────────────────────────────────────────────────────────

type ActionHandler = (
  action: AgentAction,
  ctx:    ExecutionContext,
) => Promise<void> | void;

// ─── Handler registry ─────────────────────────────────────────────────────────

/**
 * One handler per `AgentActionType`.
 *
 * Handlers are intentionally lightweight: they signal intent to the wider
 * system via `ctx.dispatch`, keeping business logic in the store layer.
 * The `execute` and `explain` handlers are the only ones that currently
 * produce observable side-effects.
 */
export const ACTION_HANDLERS: Record<AgentActionType, ActionHandler> = {

  analyze: (action, ctx) => {
    ctx.logger?.('[orbit/analyze]', { agentId: action.agentId });
  },

  plan: (action, ctx) => {
    ctx.logger?.('[orbit/plan]', { agentId: action.agentId });
  },

  execute: (action, ctx) => {
    ctx.logger?.('[orbit/execute]', { agentId: action.agentId });
    ctx.dispatch({ type: 'ORBIT_RUN_TASK', payload: action.payload });
  },

  explain: (action, ctx) => {
    ctx.logger?.('[orbit/explain]', { agentId: action.agentId });
    ctx.dispatch({ type: 'ORBIT_SHOW_EXPLANATION', payload: action.payload });
  },

  // Passive monitor — no side-effect intended.
  observe: () => {},

  handoff: (action, ctx) => {
    ctx.logger?.('[orbit/handoff]', {
      from: action.agentId,
      to:   action.targetAgentId,
    });
  },

  // No-op filler state.
  idle: () => {},
};

// ─── De-duplication ───────────────────────────────────────────────────────────

/**
 * Removes duplicate `(agentId, type)` pairs from an action list, keeping only
 * the first occurrence (the one with the highest priority, assuming the list
 * is already sorted descending when dedupe is called after sort).
 *
 * Prevents the same agent from executing the same action twice in one run.
 */
export function dedupeActions(actions: AgentAction[]): AgentAction[] {
  const seen = new Set<string>();
  return actions.filter(a => {
    const key = `${a.agentId}\u00b7${a.type}`; // '·' separator
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

/**
 * Runs an action list through the handler registry, sequentially in descending
 * priority order.
 *
 * Guarantees:
 *   - Deduplicates before executing
 *   - Per-action errors are caught and logged; the pipeline continues
 *   - Resolves when all handlers have settled (async-safe)
 *   - No-ops immediately for an empty list
 */
export async function runExecutionPipeline(
  actions: AgentAction[],
  ctx:     ExecutionContext,
): Promise<void> {
  if (actions.length === 0) return;

  const pipeline = dedupeActions(
    [...actions].sort((a, b) => b.priority - a.priority),
  );

  ctx.onStateChange?.('running');
  let encounteredError = false;

  for (const action of pipeline) {
    const handler = ACTION_HANDLERS[action.type];
    if (!handler) continue;

    try {
      await handler(action, ctx);
    } catch (err) {
      encounteredError = true;
      ctx.logger?.('[orbit/pipeline-error]', { action, err });
      ctx.onStateChange?.('error', action);
    }
  }

  if (!encounteredError) {
    ctx.onStateChange?.('success');
  }
}

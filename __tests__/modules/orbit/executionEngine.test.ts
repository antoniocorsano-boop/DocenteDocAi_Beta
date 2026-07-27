/**
 * __tests__/modules/orbit/executionEngine.test.ts
 *
 * Unit tests for P20 — Execution Engine.
 *
 * Coverage targets:
 *   - dedupeActions: removes duplicate (agentId × type) pairs
 *   - dedupeActions: keeps distinct (agentId × type) pairs
 *   - runExecutionPipeline: empty list → immediate return, no dispatch
 *   - runExecutionPipeline: executes handlers in descending priority order
 *   - runExecutionPipeline: `execute` dispatches ORBIT_RUN_TASK
 *   - runExecutionPipeline: `explain` dispatches ORBIT_SHOW_EXPLANATION
 *   - runExecutionPipeline: `observe/idle/analyze/plan` emit no dispatch
 *   - runExecutionPipeline: continues after a handler error
 *   - runExecutionPipeline: dedupes before executing (no duplicate dispatch)
 *   - ACTION_HANDLERS: all AgentActionType keys are covered
 */

import { describe, it, expect, vi, type Mock } from 'vitest';

import {
  dedupeActions,
  runExecutionPipeline,
  ACTION_HANDLERS,
} from '../../../src/modules/orbit/executionEngine';
import type { AgentAction }      from '../../../src/modules/orbit/coordinationEngine';
import type { ExecutionContext, TaskState }  from '../../../src/modules/orbit/executionEngine';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAction(
  overrides: Partial<AgentAction> & { agentId: string },
): AgentAction {
  return {
    type:     'observe',
    priority: 5,
    ...overrides,
  };
}

function makeCtx(dispatch?: Mock): ExecutionContext {
  return {
    dispatch: dispatch ?? vi.fn(),
    logger:   vi.fn(),
  };
}

// ─── dedupeActions ────────────────────────────────────────────────────────────

describe('dedupeActions', () => {
  it('returns an empty array unchanged', () => {
    expect(dedupeActions([])).toEqual([]);
  });

  it('removes duplicate (agentId, type) pairs, keeping first occurrence', () => {
    const a1 = makeAction({ agentId: 'a', type: 'analyze', priority: 10 });
    const a2 = makeAction({ agentId: 'a', type: 'analyze', priority: 5 });
    const result = dedupeActions([a1, a2]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(a1);
  });

  it('keeps different types for the same agent', () => {
    const actions = [
      makeAction({ agentId: 'a', type: 'analyze', priority: 8 }),
      makeAction({ agentId: 'a', type: 'handoff', priority: 7 }),
    ];
    expect(dedupeActions(actions)).toHaveLength(2);
  });

  it('keeps same type for different agents', () => {
    const actions = [
      makeAction({ agentId: 'a1', type: 'execute', priority: 10 }),
      makeAction({ agentId: 'a2', type: 'execute', priority: 10 }),
    ];
    expect(dedupeActions(actions)).toHaveLength(2);
  });

  it('does not mutate the original array', () => {
    const actions = [
      makeAction({ agentId: 'a', type: 'observe', priority: 5 }),
      makeAction({ agentId: 'a', type: 'observe', priority: 3 }),
    ];
    const original = [...actions];
    dedupeActions(actions);
    expect(actions).toEqual(original);
  });
});

// ─── runExecutionPipeline — basic ────────────────────────────────────────────

describe('runExecutionPipeline — basic', () => {
  it('resolves immediately for an empty action list without calling dispatch', async () => {
    const dispatch = vi.fn();
    await runExecutionPipeline([], makeCtx(dispatch));
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('calls the execute handler and dispatches ORBIT_RUN_TASK', async () => {
    const dispatch = vi.fn();
    const actions  = [makeAction({ agentId: 'a1', type: 'execute', priority: 10 })];
    await runExecutionPipeline(actions, makeCtx(dispatch));
    expect(dispatch).toHaveBeenCalledOnce();
    expect(dispatch).toHaveBeenCalledWith({ type: 'ORBIT_RUN_TASK', payload: undefined });
  });

  it('calls the explain handler and dispatches ORBIT_SHOW_EXPLANATION', async () => {
    const dispatch = vi.fn();
    const actions  = [makeAction({ agentId: 'a1', type: 'explain', priority: 8, payload: 'lesson-abc' })];
    await runExecutionPipeline(actions, makeCtx(dispatch));
    expect(dispatch).toHaveBeenCalledWith({ type: 'ORBIT_SHOW_EXPLANATION', payload: 'lesson-abc' });
  });

  it('observe, idle, handoff do not call dispatch', async () => {
    const dispatch = vi.fn();
    await runExecutionPipeline(
      [
        makeAction({ agentId: 'a', type: 'observe', priority: 5 }),
        makeAction({ agentId: 'b', type: 'idle',    priority: 1 }),
        makeAction({ agentId: 'c', type: 'handoff', priority: 9, targetAgentId: 'd' }),
      ],
      makeCtx(dispatch),
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('analyze and plan do not call dispatch', async () => {
    const dispatch = vi.fn();
    await runExecutionPipeline(
      [
        makeAction({ agentId: 'a', type: 'analyze', priority: 7 }),
        makeAction({ agentId: 'b', type: 'plan',    priority: 6 }),
      ],
      makeCtx(dispatch),
    );
    expect(dispatch).not.toHaveBeenCalled();
  });
});

// ─── runExecutionPipeline — ordering ─────────────────────────────────────────

describe('runExecutionPipeline — execution order', () => {
  it('executes handlers in descending priority order', async () => {
    const order: number[] = [];
    const ctx: ExecutionContext = {
      dispatch: vi.fn(),
      logger:   vi.fn(),
    };

    // Spy execute handler: record which priority ran
    const originalExecute = ACTION_HANDLERS.execute;
    ACTION_HANDLERS.execute = (action) => { order.push(action.priority); };

    try {
      await runExecutionPipeline(
        [
          makeAction({ agentId: 'a1', type: 'execute', priority: 3 }),
          makeAction({ agentId: 'a2', type: 'execute', priority: 10 }),
          makeAction({ agentId: 'a3', type: 'execute', priority: 6 }),
        ],
        ctx,
      );
    } finally {
      ACTION_HANDLERS.execute = originalExecute; // restore
    }

    expect(order).toEqual([10, 6, 3]);
  });
});

// ─── runExecutionPipeline — error resilience ─────────────────────────────────

describe('runExecutionPipeline — error resilience', () => {
  it('continues executing subsequent actions after a handler throws', async () => {
    const dispatch = vi.fn();
    const logger   = vi.fn();

    const originalAnalyze = ACTION_HANDLERS.analyze;
    ACTION_HANDLERS.analyze = () => { throw new Error('handler-crash'); };

    try {
      await runExecutionPipeline(
        [
          makeAction({ agentId: 'a', type: 'analyze', priority: 10 }),
          makeAction({ agentId: 'b', type: 'execute', priority: 5 }),
        ],
        { dispatch, logger },
      );
    } finally {
      ACTION_HANDLERS.analyze = originalAnalyze;
    }

    // Pipeline must continue: execute should still have dispatched
    expect(dispatch).toHaveBeenCalledWith({ type: 'ORBIT_RUN_TASK', payload: undefined });
    // Error must have been logged
    expect(logger).toHaveBeenCalledWith('[orbit/pipeline-error]', expect.objectContaining({ err: expect.any(Error) }));
  });
});

// ─── runExecutionPipeline — dedup in pipeline ────────────────────────────────

describe('runExecutionPipeline — deduplication', () => {
  it('dispatch is called only once when same agent/type appears twice', async () => {
    const dispatch = vi.fn();
    await runExecutionPipeline(
      [
        makeAction({ agentId: 'a', type: 'execute', priority: 10 }),
        makeAction({ agentId: 'a', type: 'execute', priority: 5 }),
      ],
      makeCtx(dispatch),
    );
    expect(dispatch).toHaveBeenCalledOnce();
  });
});

// ─── ACTION_HANDLERS completeness ────────────────────────────────────────────

describe('ACTION_HANDLERS', () => {
  const requiredTypes = [
    'analyze', 'plan', 'execute', 'explain', 'observe', 'handoff', 'idle',
  ] as const;

  it.each(requiredTypes)('has a handler for "%s"', (type) => {
    expect(typeof ACTION_HANDLERS[type]).toBe('function');
  });
});

// ─── TaskState lifecycle ──────────────────────────────────────────────────────

describe('runExecutionPipeline — TaskState lifecycle', () => {
  it('reports running → success for a clean pipeline', async () => {
    const states: TaskState[] = [];
    await runExecutionPipeline(
      [makeAction({ agentId: 'a', type: 'observe', priority: 5 })],
      { dispatch: vi.fn(), onStateChange: (s) => states.push(s) },
    );
    expect(states).toEqual(['running', 'success']);
  });

  it('reports running → error when a handler throws (but pipeline completes)', async () => {
    const states: TaskState[] = [];
    const originalAnalyze = ACTION_HANDLERS.analyze;
    ACTION_HANDLERS.analyze = () => { throw new Error('boom'); };
    try {
      await runExecutionPipeline(
        [makeAction({ agentId: 'a', type: 'analyze', priority: 8 })],
        { dispatch: vi.fn(), onStateChange: (s) => states.push(s) },
      );
    } finally {
      ACTION_HANDLERS.analyze = originalAnalyze;
    }
    // running first, then error from the throwing handler
    expect(states[0]).toBe('running');
    expect(states).toContain('error');
  });

  it('never calls onStateChange for an empty action list', async () => {
    const onStateChange = vi.fn();
    await runExecutionPipeline([], { dispatch: vi.fn(), onStateChange });
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it('passes the failing action to onStateChange(error, action)', async () => {
    const calls: Array<[TaskState, AgentAction | undefined]> = [];
    const originalPlan = ACTION_HANDLERS.plan;
    ACTION_HANDLERS.plan = () => { throw new Error('plan-fail'); };
    const failingAction = makeAction({ agentId: 'a', type: 'plan', priority: 7 });
    try {
      await runExecutionPipeline(
        [failingAction],
        { dispatch: vi.fn(), onStateChange: (s, a) => calls.push([s, a]) },
      );
    } finally {
      ACTION_HANDLERS.plan = originalPlan;
    }
    const errorCall = calls.find(([s]) => s === 'error');
    expect(errorCall?.[1]).toMatchObject({ agentId: 'a', type: 'plan' });
  });
});

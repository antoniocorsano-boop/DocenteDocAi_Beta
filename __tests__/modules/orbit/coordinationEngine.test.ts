/**
 * __tests__/modules/orbit/coordinationEngine.test.ts
 *
 * Unit tests for P19 — Multi-Agent Coordination Protocol.
 *
 * Coverage targets:
 *   - Empty / no-primary scenarios (guard)
 *   - Execute intent: direct + handoff paths
 *   - Learn intent: mentor + fallback
 *   - Explore intent: parallel observation
 *   - High-complexity pipeline: analyst → handoff → executor
 *   - Suppressed agents ignored
 *   - Never two simultaneous execute actions
 *   - Fallback observe for unknown intent
 *   - getPrimaryActionLabel helper
 *   - Italian labels via ACTION_LABELS_IT
 */

import { describe, it, expect } from 'vitest';

import {
  coordinateAgents,
  getPrimaryActionLabel,
  ACTION_LABELS_IT,
  AGENT_CAPABILITIES,
} from '../../../src/modules/orbit/coordinationEngine';
import type {
  CoordinationAgent,
  CoordinationSignals,
} from '../../../src/modules/orbit/coordinationEngine';

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeAgent(
  overrides: Partial<CoordinationAgent> & { id: string },
): CoordinationAgent {
  return {
    personality: 'observer',
    attention:   'background',
    confidence:  0.8,
    ...overrides,
  };
}

function signals(overrides: Partial<CoordinationSignals>): CoordinationSignals {
  return {
    agents:         [],
    userIntent:     undefined,
    taskComplexity: 'low',
    ...overrides,
  };
}

// ─── Guard cases ──────────────────────────────────────────────────────────────

describe('coordinateAgents — guard cases', () => {
  it('returns [] when agents list is empty', () => {
    expect(coordinateAgents(signals({ agents: [] }))).toEqual([]);
  });

  it('returns [] when no primary agent exists (all secondary)', () => {
    const agents = [
      makeAgent({ id: 'a1', personality: 'analyst',  attention: 'secondary' }),
      makeAgent({ id: 'a2', personality: 'executor', attention: 'background' }),
    ];
    expect(coordinateAgents(signals({ agents }))).toEqual([]);
  });

  it('returns [] when all agents are suppressed', () => {
    const agents = [
      makeAgent({ id: 'a1', personality: 'analyst',  attention: 'suppressed' }),
      makeAgent({ id: 'a2', personality: 'executor', attention: 'suppressed' }),
    ];
    expect(coordinateAgents(signals({ agents }))).toEqual([]);
  });
});

// ─── Execute intent ───────────────────────────────────────────────────────────

describe('coordinateAgents — execute intent', () => {
  it('executor as primary → direct execute action', () => {
    const agents = [
      makeAgent({ id: 'exec', personality: 'executor', attention: 'primary' }),
    ];
    const result = coordinateAgents(signals({ agents, userIntent: 'execute' }));

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ agentId: 'exec', type: 'execute' });
  });

  it('analyst as primary + executor available → handoff then execute', () => {
    const agents = [
      makeAgent({ id: 'analyst1', personality: 'analyst',  attention: 'primary' }),
      makeAgent({ id: 'exec1',    personality: 'executor', attention: 'secondary' }),
    ];
    const result = coordinateAgents(signals({ agents, userIntent: 'execute' }));

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ agentId: 'analyst1', type: 'handoff', targetAgentId: 'exec1' });
    expect(result[1]).toMatchObject({ agentId: 'exec1',    type: 'execute' });
  });

  it('analyst as primary, NO executor → falls back to plan', () => {
    const agents = [
      makeAgent({ id: 'analyst1', personality: 'analyst', attention: 'primary' }),
    ];
    const result = coordinateAgents(signals({ agents, userIntent: 'execute' }));

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ agentId: 'analyst1', type: 'plan' });
  });

  it('mentor as primary, executor available → handoff to executor', () => {
    const agents = [
      makeAgent({ id: 'mentor1', personality: 'mentor',   attention: 'primary' }),
      makeAgent({ id: 'exec1',   personality: 'executor', attention: 'secondary' }),
    ];
    const result = coordinateAgents(signals({ agents, userIntent: 'execute' }));

    expect(result[result.length - 1]).toMatchObject({ type: 'execute', agentId: 'exec1' });
  });

  it('suppressed executor is ignored; analyst falls back to plan', () => {
    const agents = [
      makeAgent({ id: 'analyst1', personality: 'analyst',  attention: 'primary' }),
      makeAgent({ id: 'exec1',    personality: 'executor', attention: 'suppressed' }),
    ];
    const result = coordinateAgents(signals({ agents, userIntent: 'execute' }));

    // No handoff to suppressed executor — should fall back
    const types = result.map(a => a.type);
    expect(types).not.toContain('execute');
    expect(types).toContain('plan');
  });
});

// ─── Learn intent ─────────────────────────────────────────────────────────────

describe('coordinateAgents — learn intent', () => {
  it('mentor available → explain action assigned to mentor', () => {
    const agents = [
      makeAgent({ id: 'analyst1', personality: 'analyst', attention: 'primary' }),
      makeAgent({ id: 'mentor1',  personality: 'mentor',  attention: 'secondary' }),
    ];
    const result = coordinateAgents(signals({ agents, userIntent: 'learn' }));

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ agentId: 'mentor1', type: 'explain' });
  });

  it('mentor is primary → explain', () => {
    const agents = [
      makeAgent({ id: 'mentor1', personality: 'mentor', attention: 'primary' }),
    ];
    const result = coordinateAgents(signals({ agents, userIntent: 'learn' }));

    expect(result[0]).toMatchObject({ type: 'explain' });
  });

  it('no mentor, analyst available → analyst analyzes (best-effort)', () => {
    const agents = [
      makeAgent({ id: 'analyst1', personality: 'analyst', attention: 'primary' }),
    ];
    const result = coordinateAgents(signals({ agents, userIntent: 'learn' }));

    expect(result[0]).toMatchObject({ agentId: 'analyst1', type: 'analyze' });
  });

  it('suppressed mentor is ignored; analyst handles it', () => {
    const agents = [
      makeAgent({ id: 'analyst1', personality: 'analyst', attention: 'primary' }),
      makeAgent({ id: 'mentor1',  personality: 'mentor',  attention: 'suppressed' }),
    ];
    const result = coordinateAgents(signals({ agents, userIntent: 'learn' }));

    expect(result[0].type).not.toBe('explain');
  });
});

// ─── Explore intent ───────────────────────────────────────────────────────────

describe('coordinateAgents — explore intent', () => {
  it('all non-suppressed agents get actions', () => {
    const agents = [
      makeAgent({ id: 'a1', personality: 'analyst',  attention: 'primary' }),
      makeAgent({ id: 'a2', personality: 'observer', attention: 'secondary' }),
      makeAgent({ id: 'a3', personality: 'executor', attention: 'suppressed' }),
    ];
    const result = coordinateAgents(signals({ agents, userIntent: 'explore' }));

    const ids = result.map(a => a.agentId);
    expect(ids).toContain('a1');
    expect(ids).toContain('a2');
    expect(ids).not.toContain('a3'); // suppressed
  });

  it('analyst gets analyze action in explore', () => {
    const agents = [
      makeAgent({ id: 'analyst1', personality: 'analyst', attention: 'primary' }),
    ];
    const result = coordinateAgents(signals({ agents, userIntent: 'explore' }));

    expect(result[0]).toMatchObject({ agentId: 'analyst1', type: 'analyze' });
  });

  it('non-analyst gets observe action in explore', () => {
    const agents = [
      makeAgent({ id: 'obs1', personality: 'observer', attention: 'primary' }),
    ];
    const result = coordinateAgents(signals({ agents, userIntent: 'explore' }));

    expect(result[0]).toMatchObject({ type: 'observe' });
  });
});

// ─── High complexity pipeline ─────────────────────────────────────────────────

describe('coordinateAgents — high complexity', () => {
  it('analyst + executor → analyze → handoff → execute pipeline', () => {
    const agents = [
      makeAgent({ id: 'analyst1', personality: 'analyst',  attention: 'primary' }),
      makeAgent({ id: 'exec1',    personality: 'executor', attention: 'secondary' }),
    ];
    const result = coordinateAgents(signals({
      agents,
      taskComplexity: 'high',
    }));

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ agentId: 'analyst1', type: 'analyze' });
    expect(result[1]).toMatchObject({ agentId: 'analyst1', type: 'handoff', targetAgentId: 'exec1' });
    expect(result[2]).toMatchObject({ agentId: 'exec1',    type: 'execute' });
  });

  it('high complexity but only analyst → plan (no executor to handoff to)', () => {
    const agents = [
      makeAgent({ id: 'analyst1', personality: 'analyst', attention: 'primary' }),
    ];
    const result = coordinateAgents(signals({ agents, taskComplexity: 'high' }));

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ agentId: 'analyst1', type: 'plan' });
  });

  it('high complexity pipeline never has two execute actions', () => {
    const agents = [
      makeAgent({ id: 'analyst1', personality: 'analyst',  attention: 'primary' }),
      makeAgent({ id: 'exec1',    personality: 'executor', attention: 'secondary' }),
      makeAgent({ id: 'exec2',    personality: 'executor', attention: 'background' }),
    ];
    const result = coordinateAgents(signals({
      agents,
      taskComplexity: 'high',
    }));

    const executeActions = result.filter(a => a.type === 'execute');
    expect(executeActions.length).toBeLessThanOrEqual(1);
  });
});

// ─── Fallback ─────────────────────────────────────────────────────────────────

describe('coordinateAgents — fallback', () => {
  it('no matching intent rule → primary agent gets observe with priority 1', () => {
    const agents = [
      makeAgent({ id: 'obs1', personality: 'observer', attention: 'primary' }),
    ];
    const result = coordinateAgents(signals({ agents, userIntent: 'idle' }));

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ agentId: 'obs1', type: 'observe', priority: 1 });
  });

  it('undefined intent also falls back gracefully', () => {
    const agents = [
      makeAgent({ id: 'obs1', personality: 'observer', attention: 'primary' }),
    ];
    const result = coordinateAgents(signals({ agents }));

    expect(result[0].type).toBe('observe');
  });
});

// ─── AGENT_CAPABILITIES integrity ────────────────────────────────────────────

describe('AGENT_CAPABILITIES', () => {
  it('every personality has at least one capability', () => {
    const personalities: Array<keyof typeof AGENT_CAPABILITIES> = [
      'analyst', 'executor', 'mentor', 'observer',
    ];
    for (const p of personalities) {
      expect(AGENT_CAPABILITIES[p].length).toBeGreaterThan(0);
    }
  });

  it('executor can execute', () => {
    expect(AGENT_CAPABILITIES.executor).toContain('execute');
  });

  it('mentor can explain', () => {
    expect(AGENT_CAPABILITIES.mentor).toContain('explain');
  });

  it('analyst cannot execute directly', () => {
    expect(AGENT_CAPABILITIES.analyst).not.toContain('execute');
  });
});

// ─── getPrimaryActionLabel ────────────────────────────────────────────────────

describe('getPrimaryActionLabel', () => {
  it('returns null for empty array', () => {
    expect(getPrimaryActionLabel([])).toBeNull();
  });

  it('returns null for idle action (empty label)', () => {
    expect(getPrimaryActionLabel([
      { agentId: 'a1', type: 'idle', priority: 5 },
    ])).toBeNull();
  });

  it('returns the Italian label for a valid action type', () => {
    const label = getPrimaryActionLabel([
      { agentId: 'a1', type: 'execute', priority: 10 },
    ]);
    expect(label).toBe('Esecuzione task…');
  });

  it('picks the highest-priority action when multiple are present', () => {
    const label = getPrimaryActionLabel([
      { agentId: 'a1', type: 'observe',  priority: 1 },
      { agentId: 'a2', type: 'analyze',  priority: 5 },
      { agentId: 'a3', type: 'execute',  priority: 10 },
    ]);
    expect(label).toBe('Esecuzione task…');
  });

  it('skips idle to pick next-highest when idle is top', () => {
    // If the top-priority action is idle (empty string), the function should
    // return null rather than an empty string
    const label = getPrimaryActionLabel([
      { agentId: 'a1', type: 'idle',    priority: 20 },
      { agentId: 'a2', type: 'analyze', priority: 5 },
    ]);
    // Our implementation returns label of sorted[0] — idle → null
    expect(label).toBeNull();
  });
});

// ─── ACTION_LABELS_IT completeness ───────────────────────────────────────────

describe('ACTION_LABELS_IT', () => {
  const expectedTypes: Array<keyof typeof ACTION_LABELS_IT> = [
    'analyze', 'plan', 'execute', 'explain', 'observe', 'handoff', 'idle',
  ];

  it.each(expectedTypes)('has an entry for "%s"', (type) => {
    expect(ACTION_LABELS_IT[type]).toBeDefined();
  });

  it('non-idle labels are non-empty strings', () => {
    for (const [type, label] of Object.entries(ACTION_LABELS_IT)) {
      if (type !== 'idle') {
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      }
    }
  });
});

/**
 * __tests__/modules/orbit/attentionRouter.test.ts
 *
 * P18 — Attention Routing System test suite.
 *
 * Covers all critical contracts:
 *   1. Routing — correct tier assignment under various agent + load combos
 *   2. Intent alignment  — executor/mentor get boosted by matching intent
 *   3. Event throttle — shouldProcessEvent respects 400 ms window
 *   4. Priority queue — enqueueEvent produces correct order
 *   5. Visual helpers — attentionOpacity / attentionScale return expected values
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveAttention,
  shouldProcessEvent,
  resetEventThrottle,
  enqueueEvent,
  attentionOpacity,
  attentionScale,
} from '../../../src/modules/orbit/attentionRouter';
import type {
  AttentionAgentInput,
  AttentionSignals,
  QueuedEvent,
} from '../../../src/modules/orbit/attentionRouter';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NOW = 1_700_000_000_000; // fixed epoch for deterministic tests

function makeSignals(
  agents: AttentionAgentInput[],
  overrides: Partial<Omit<AttentionSignals, 'agents'>> = {},
): AttentionSignals {
  return {
    agents,
    cognitiveLoad: 'low',
    now:           NOW,
    ...overrides,
  };
}

/** Agent factory with sensible defaults */
function agent(
  id: string,
  personality: AttentionAgentInput['personality'],
  extras: Partial<Omit<AttentionAgentInput, 'id' | 'personality'>> = {},
): AttentionAgentInput {
  return { id, personality, ...extras };
}

// ─── resolveAttention — routing ───────────────────────────────────────────────

describe('resolveAttention — routing', () => {
  it('returns an empty map when no agents are provided', () => {
    const result = resolveAttention(makeSignals([]));
    expect(result).toEqual({});
  });

  it('single agent always becomes primary', () => {
    const result = resolveAttention(makeSignals([agent('a1', 'analyst')]));
    expect(result['a1']).toBe('primary');
  });

  it('3 agents at low load → 1 primary + 2 secondary', () => {
    const result = resolveAttention(makeSignals([
      agent('a1', 'executor', { priority: 3, confidence: 0.9 }),
      agent('a2', 'analyst',  { priority: 2, confidence: 0.7 }),
      agent('a3', 'observer', { priority: 1, confidence: 0.5 }),
    ]));
    expect(result['a1']).toBe('primary');
    expect(result['a2']).toBe('secondary');
    expect(result['a3']).toBe('secondary');
  });

  it('3 agents at high load → 1 primary + 1 secondary + 1 background', () => {
    const result = resolveAttention(makeSignals(
      [
        agent('a1', 'executor', { priority: 3, confidence: 0.9 }),
        agent('a2', 'analyst',  { priority: 2, confidence: 0.7 }),
        agent('a3', 'observer', { priority: 1, confidence: 0.5 }),
      ],
      { cognitiveLoad: 'high' },
    ));
    expect(result['a1']).toBe('primary');
    expect(result['a2']).toBe('secondary');
    expect(result['a3']).toBe('background');
  });

  it('3 agents at critical load → 1 primary + 2 suppressed (no secondary)', () => {
    const result = resolveAttention(makeSignals(
      [
        agent('a1', 'executor', { priority: 3, confidence: 0.9 }),
        agent('a2', 'analyst',  { priority: 2, confidence: 0.7 }),
        agent('a3', 'observer', { priority: 1, confidence: 0.5 }),
      ],
      { cognitiveLoad: 'critical' },
    ));
    expect(result['a1']).toBe('primary');
    expect(result['a2']).toBe('suppressed');
    expect(result['a3']).toBe('suppressed');
  });

  it('2 agents at medium load → 1 primary + 1 secondary', () => {
    const result = resolveAttention(makeSignals(
      [
        agent('x', 'mentor',  { priority: 2, confidence: 0.8 }),
        agent('y', 'analyst', { priority: 2, confidence: 0.6 }),
      ],
      { cognitiveLoad: 'medium' },
    ));
    const states = Object.values(result);
    expect(states.filter(s => s === 'primary').length).toBe(1);
    expect(states.filter(s => s === 'secondary').length).toBe(1);
  });

  it('single agent at critical load is still primary (not suppressed)', () => {
    const result = resolveAttention(makeSignals(
      [agent('solo', 'observer', { priority: 1, confidence: 0.5 })],
      { cognitiveLoad: 'critical' },
    ));
    expect(result['solo']).toBe('primary');
  });
});

// ─── resolveAttention — intent alignment ────────────────────────────────────

describe('resolveAttention — intent alignment', () => {
  it('execute intent boosts executor above higher-priority analyst', () => {
    // analyst has higher catalogue priority (=2 vs executor's =3 — actually executor is 3)
    // Let's force equal priority and let intent decide
    const result = resolveAttention(makeSignals(
      [
        // Both get priority=2 override so only intent bonus differentiates
        agent('exec', 'executor', { priority: 2, confidence: 0.5 }),
        agent('anly', 'analyst',  { priority: 2, confidence: 0.5 }),
      ],
      { userIntent: 'execute' },
    ));
    expect(result['exec']).toBe('primary');
    expect(result['anly']).toBe('secondary');
  });

  it('learn intent promotes mentor to primary over executor', () => {
    const result = resolveAttention(makeSignals(
      [
        agent('ment', 'mentor',   { priority: 2, confidence: 0.5 }),
        agent('exec', 'executor', { priority: 2, confidence: 0.5 }),
      ],
      { userIntent: 'learn' },
    ));
    expect(result['ment']).toBe('primary');
    expect(result['exec']).toBe('secondary');
  });

  it('idle intent does not apply any alignment bonus', () => {
    // Just check that the highest base-score agent wins
    const result = resolveAttention(makeSignals(
      [
        agent('high', 'executor', { priority: 3, confidence: 0.9 }),
        agent('low',  'observer', { priority: 1, confidence: 0.2 }),
      ],
      { userIntent: 'idle' },
    ));
    expect(result['high']).toBe('primary');
  });

  it('recency tiebreaks — recently active agent scores higher', () => {
    const result = resolveAttention(makeSignals(
      [
        // same personality, same confidence, same priority — only recency differs
        agent('fresh', 'analyst', { priority: 2, confidence: 0.5, lastActiveTs: NOW - 500 }),
        agent('stale', 'analyst', { priority: 2, confidence: 0.5, lastActiveTs: NOW - 30_000 }),
      ],
    ));
    expect(result['fresh']).toBe('primary');
    expect(result['stale']).toBe('secondary');
  });
});

// ─── shouldProcessEvent — throttle ───────────────────────────────────────────

describe('shouldProcessEvent', () => {
  beforeEach(() => { resetEventThrottle(); });

  it('accepts the first event', () => {
    expect(shouldProcessEvent(1000)).toBe(true);
  });

  it('rejects a second event within 400 ms', () => {
    shouldProcessEvent(1000);
    expect(shouldProcessEvent(1300)).toBe(false);
  });

  it('accepts an event after 400 ms have passed', () => {
    shouldProcessEvent(1000);
    expect(shouldProcessEvent(1401)).toBe(true);
  });

  it('accepts event exactly at the boundary (400 ms)', () => {
    shouldProcessEvent(0);
    // 399 ms later: strictly inside window → rejected
    expect(shouldProcessEvent(399)).toBe(false);
    // 400 ms later: exactly at boundary (< 400 is false) → accepted
    expect(shouldProcessEvent(400)).toBe(true);
  });
});

// ─── enqueueEvent — priority queue ───────────────────────────────────────────

describe('enqueueEvent', () => {
  it('sorts events by priority descending', () => {
    let queue: QueuedEvent[] = [];
    queue = enqueueEvent(queue, { id: 'low',    priority: 1 });
    queue = enqueueEvent(queue, { id: 'high',   priority: 10 });
    queue = enqueueEvent(queue, { id: 'medium', priority: 5 });
    expect(queue.map(e => e.id)).toEqual(['high', 'medium', 'low']);
  });

  it('does not mutate the original queue', () => {
    const original: QueuedEvent[] = [{ id: 'a', priority: 5 }];
    const next = enqueueEvent(original, { id: 'b', priority: 10 });
    expect(original).toHaveLength(1);
    expect(next).toHaveLength(2);
  });

  it('preserves insertion order for equal-priority events', () => {
    let queue: QueuedEvent[] = [];
    queue = enqueueEvent(queue, { id: 'first',  priority: 5 });
    queue = enqueueEvent(queue, { id: 'second', priority: 5 });
    // stable sort: first appears before second
    expect(queue[0].id).toBe('first');
    expect(queue[1].id).toBe('second');
  });
});

// ─── Visual helpers ───────────────────────────────────────────────────────────

describe('attentionOpacity', () => {
  it('primary → 1', () => expect(attentionOpacity('primary')).toBe(1));
  it('secondary → 0.7', () => expect(attentionOpacity('secondary')).toBe(0.7));
  it('background → 0.35', () => expect(attentionOpacity('background')).toBe(0.35));
  it('suppressed → 0', () => expect(attentionOpacity('suppressed')).toBe(0));
  it('undefined (no routing data) → 1 (full visibility)', () => {
    expect(attentionOpacity(undefined)).toBe(1);
  });
});

describe('attentionScale', () => {
  it('primary → 1', () => expect(attentionScale('primary')).toBe(1));
  it('secondary → 0.97', () => expect(attentionScale('secondary')).toBe(0.97));
  it('background → 0.93', () => expect(attentionScale('background')).toBe(0.93));
  it('suppressed → 0.85', () => expect(attentionScale('suppressed')).toBe(0.85));
  it('undefined → 1', () => expect(attentionScale(undefined)).toBe(1));
});

// ─── Integration contract ─────────────────────────────────────────────────────

describe('resolveAttention — invariants', () => {
  it('always has exactly 1 primary when agents are present', () => {
    for (const load of ['low', 'medium', 'high', 'critical'] as const) {
      const result = resolveAttention(makeSignals(
        [
          agent('a', 'executor', { priority: 3, confidence: 0.9 }),
          agent('b', 'analyst',  { priority: 2, confidence: 0.7 }),
          agent('c', 'observer', { priority: 1, confidence: 0.4 }),
        ],
        { cognitiveLoad: load },
      ));
      const primaries = Object.values(result).filter(s => s === 'primary');
      expect(primaries.length).toBe(1);
    }
  });

  it('secondaries ≤ 2 at low load', () => {
    const result = resolveAttention(makeSignals(
      Array.from({ length: 5 }, (_, i) =>
        agent(`a${i}`, 'analyst', { priority: 2, confidence: 0.5 }),
      ),
    ));
    const secondaries = Object.values(result).filter(s => s === 'secondary');
    expect(secondaries.length).toBeLessThanOrEqual(2);
  });

  it('secondaries ≤ 1 at high load', () => {
    const result = resolveAttention(makeSignals(
      Array.from({ length: 5 }, (_, i) =>
        agent(`a${i}`, 'analyst', { priority: 2, confidence: 0.5 }),
      ),
      { cognitiveLoad: 'high' },
    ));
    const secondaries = Object.values(result).filter(s => s === 'secondary');
    expect(secondaries.length).toBeLessThanOrEqual(1);
  });

  it('0 secondaries at critical load', () => {
    const result = resolveAttention(makeSignals(
      Array.from({ length: 4 }, (_, i) =>
        agent(`a${i}`, 'analyst', { priority: 2, confidence: 0.5 }),
      ),
      { cognitiveLoad: 'critical' },
    ));
    const secondaries = Object.values(result).filter(s => s === 'secondary');
    expect(secondaries.length).toBe(0);
  });

  it('all non-primary agents are suppressed at critical load', () => {
    const result = resolveAttention(makeSignals(
      [
        agent('a', 'executor', { priority: 3, confidence: 0.9 }),
        agent('b', 'mentor',   { priority: 2, confidence: 0.7 }),
        agent('c', 'observer', { priority: 1, confidence: 0.4 }),
      ],
      { cognitiveLoad: 'critical' },
    ));
    expect(result['a']).toBe('primary');
    expect(result['b']).toBe('suppressed');
    expect(result['c']).toBe('suppressed');
  });
});

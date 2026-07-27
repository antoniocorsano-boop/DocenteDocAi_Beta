/**
 * __tests__/modules/orchestration/EmotionalEngine.test.ts
 *
 * Unit tests for EmotionalEngine P39.6 additions.
 * Covers:
 *   - smoothState: legal and illegal state transitions
 *   - createEmotionalMemory: lastPerceivedState default
 *   - updateEmotionalMemory: lastPerceivedState written correctly, counters updated
 *   - adaptBlocks: exploration & structure style hints (P39.5)
 */

import { describe, it, expect } from 'vitest';
import type { UIBlock } from '@/types/uiBlocks';
import {
  smoothState,
  createEmotionalMemory,
  updateEmotionalMemory,
  adaptBlocks,
  type EmotionalState,
  type EmotionalSignal,
  type EmotionalStrategy,
  type BlockStyleHint,
} from '@/modules/orchestration/EmotionalEngine';

// ── Helpers ────────────────────────────────────────────────────────────────────

const neutralSignal = (): EmotionalSignal => ({
  confused:         false,
  uncertain:        false,
  urgent:           false,
  stalling:         false,
  cognitiveLoad:    'medium',
  clarity:          'clear',
  momentum:         'flowing',
  intentConfidence: 'high',
  wordCount:        10,
});

const baseStrategy = (overrides: Partial<EmotionalStrategy> = {}): EmotionalStrategy => ({
  tone:       'neutral',
  depth:      'medium',
  uiDensity:  'medium',
  guidance:   'none',
  maxBlocks:  4,
  ...overrides,
});

const textBlock    = (): UIBlock => ({ type: 'text',    content: 'hello' });
const insightBlock = (): UIBlock => ({ type: 'insight', data: { agentsUsed: [], confidence: 0.8, memoryUsed: false, memoryItems: [], intentType: 'test', durationMs: 100, mode: 'balanced', adaptiveHints: [] } });
const chartBlock   = (): UIBlock => ({ type: 'chart',   config: { chartType: 'bar', data: [] } });

// ── smoothState ────────────────────────────────────────────────────────────────

describe('smoothState — legal transitions', () => {
  const LEGAL: Array<[EmotionalState, EmotionalState]> = [
    ['blocked',       'blocked'],
    ['blocked',       'overloaded'],
    ['overloaded',    'overloaded'],
    ['overloaded',    'exploring'],
    ['overloaded',    'blocked'],
    ['exploring',     'exploring'],
    ['exploring',     'focused'],
    ['exploring',     'overloaded'],
    ['focused',       'focused'],
    ['focused',       'goal_oriented'],
    ['focused',       'exploring'],
    ['goal_oriented', 'goal_oriented'],
    ['goal_oriented', 'focused'],
  ];

  LEGAL.forEach(([prev, next]) => {
    it(`${prev} → ${next} is allowed`, () => {
      expect(smoothState(prev, next)).toBe(next);
    });
  });
});

describe('smoothState — illegal transitions (must be blocked)', () => {
  const ILLEGAL: Array<[EmotionalState, EmotionalState]> = [
    ['blocked',       'focused'],
    ['blocked',       'exploring'],
    ['blocked',       'goal_oriented'],
    ['overloaded',    'focused'],
    ['overloaded',    'goal_oriented'],
    ['exploring',     'blocked'],
    ['exploring',     'goal_oriented'],
    ['focused',       'blocked'],
    ['focused',       'overloaded'],
    ['goal_oriented', 'blocked'],
    ['goal_oriented', 'overloaded'],
    ['goal_oriented', 'exploring'],
  ];

  ILLEGAL.forEach(([prev, next]) => {
    it(`${prev} → ${next} is blocked (returns ${prev})`, () => {
      expect(smoothState(prev, next)).toBe(prev);
    });
  });
});

// ── createEmotionalMemory ──────────────────────────────────────────────────────

describe('createEmotionalMemory', () => {
  it('initialises lastPerceivedState to "focused"', () => {
    expect(createEmotionalMemory().lastPerceivedState).toBe('focused');
  });

  it('initialises counters to 0 and preferredDepth to medium', () => {
    const m = createEmotionalMemory();
    expect(m.frustrationCount).toBe(0);
    expect(m.flowScore).toBe(0);
    expect(m.preferredDepth).toBe('medium');
  });
});

// ── updateEmotionalMemory ──────────────────────────────────────────────────────

describe('updateEmotionalMemory — lastPerceivedState tracking', () => {
  it('writes the passed state to lastPerceivedState', () => {
    const mem = createEmotionalMemory();
    const updated = updateEmotionalMemory(mem, neutralSignal(), 'blocked');
    expect(updated.lastPerceivedState).toBe('blocked');
  });

  it('overwrites previous lastPerceivedState on next call', () => {
    let mem = createEmotionalMemory();
    mem = updateEmotionalMemory(mem, neutralSignal(), 'overloaded');
    mem = updateEmotionalMemory(mem, neutralSignal(), 'exploring');
    expect(mem.lastPerceivedState).toBe('exploring');
  });

  it('records all distinct states correctly', () => {
    const m0 = createEmotionalMemory();
    const states: EmotionalState[] = ['blocked', 'overloaded', 'exploring', 'focused', 'goal_oriented'];
    let mem = m0;
    for (const s of states) {
      mem = updateEmotionalMemory(mem, neutralSignal(), s);
      expect(mem.lastPerceivedState).toBe(s);
    }
  });
});

describe('updateEmotionalMemory — frustrationCount and flowScore', () => {
  it('increments frustrationCount on negative state', () => {
    const m0 = createEmotionalMemory();
    const m1 = updateEmotionalMemory(m0, neutralSignal(), 'blocked');
    expect(m1.frustrationCount).toBe(1);
  });

  it('decrements frustrationCount on positive state (clamp 0)', () => {
    const m0 = { ...createEmotionalMemory(), frustrationCount: 2 };
    const m1 = updateEmotionalMemory(m0, neutralSignal(), 'focused');
    expect(m1.frustrationCount).toBe(1);
  });

  it('frustrationCount does not go below 0', () => {
    const m0 = createEmotionalMemory(); // frustrationCount: 0
    const m1 = updateEmotionalMemory(m0, neutralSignal(), 'focused');
    expect(m1.frustrationCount).toBe(0);
  });

  it('increments flowScore on positive state', () => {
    const m0 = createEmotionalMemory();
    const m1 = updateEmotionalMemory(m0, neutralSignal(), 'goal_oriented');
    expect(m1.flowScore).toBe(1);
  });

  it('does not mutate the original memory object', () => {
    const m0 = createEmotionalMemory();
    updateEmotionalMemory(m0, neutralSignal(), 'blocked');
    expect(m0.frustrationCount).toBe(0);
    expect(m0.lastPerceivedState).toBe('focused');
  });
});

describe('updateEmotionalMemory — preferredDepth from cognitiveLoad', () => {
  it('high cognitiveLoad → preferredDepth "deep"', () => {
    const m0 = createEmotionalMemory();
    const sig: EmotionalSignal = { ...neutralSignal(), cognitiveLoad: 'high' };
    expect(updateEmotionalMemory(m0, sig, 'focused').preferredDepth).toBe('deep');
  });

  it('low cognitiveLoad → preferredDepth "light"', () => {
    const m0 = createEmotionalMemory();
    const sig: EmotionalSignal = { ...neutralSignal(), cognitiveLoad: 'low' };
    expect(updateEmotionalMemory(m0, sig, 'focused').preferredDepth).toBe('light');
  });

  it('medium cognitiveLoad → preferredDepth "medium"', () => {
    const m0 = createEmotionalMemory();
    const sig: EmotionalSignal = { ...neutralSignal(), cognitiveLoad: 'medium' };
    expect(updateEmotionalMemory(m0, sig, 'focused').preferredDepth).toBe('medium');
  });
});

// ── adaptBlocks ────────────────────────────────────────────────────────────────

describe('adaptBlocks — uiDensity=high or no maxBlocks → all visible', () => {
  it('uiDensity=high returns all blocks without hidden flag', () => {
    const blocks: UIBlock[] = [textBlock(), insightBlock(), chartBlock()];
    const result = adaptBlocks(blocks, baseStrategy({ uiDensity: 'high', maxBlocks: 1 }));
    expect(result.every(b => !b.hidden)).toBe(true);
  });

  it('no maxBlocks returns all blocks without hidden flag', () => {
    const blocks: UIBlock[] = [textBlock(), insightBlock(), chartBlock()];
    const strategy = baseStrategy();
    delete (strategy as Partial<EmotionalStrategy>).maxBlocks;
    const result = adaptBlocks(blocks, strategy);
    expect(result.every(b => !b.hidden)).toBe(true);
  });
});

describe('adaptBlocks — exploration=high style hint (P39.5)', () => {
  it('exploration=high shows all blocks even when maxBlocks is restrictive', () => {
    const blocks: UIBlock[] = [textBlock(), insightBlock(), chartBlock(), chartBlock(), chartBlock()];
    const hint: BlockStyleHint = { structure: 'medium', exploration: 'high' };
    const result = adaptBlocks(blocks, baseStrategy({ maxBlocks: 2 }), hint);
    expect(result.every(b => !b.hidden)).toBe(true);
  });
});

describe('adaptBlocks — structure style hint adjusts maxVisible (P39.5)', () => {
  it('structure=high adds 1 to maxBlocks', () => {
    const blocks: UIBlock[] = [
      textBlock(),    // priority 10
      insightBlock(), // priority 1
      chartBlock(),   // priority 2
      insightBlock(), // priority 1
      insightBlock(), // priority 1
    ];
    const hint: BlockStyleHint = { structure: 'high', exploration: 'medium' };
    // maxBlocks=3 + structure=high → maxVisible=4
    const result = adaptBlocks(blocks, baseStrategy({ maxBlocks: 3, uiDensity: 'medium' }), hint);
    const visible = result.filter(b => !b.hidden);
    expect(visible.length).toBe(4);
  });

  it('structure=low removes 1 from maxBlocks', () => {
    const blocks: UIBlock[] = [
      textBlock(),    // priority 10
      insightBlock(), // priority 1
      chartBlock(),   // priority 2
      insightBlock(), // priority 1
      insightBlock(), // priority 1
    ];
    const hint: BlockStyleHint = { structure: 'low', exploration: 'medium' };
    // maxBlocks=3 + structure=low → maxVisible=2
    const result = adaptBlocks(blocks, baseStrategy({ maxBlocks: 3, uiDensity: 'medium' }), hint);
    const visible = result.filter(b => !b.hidden);
    expect(visible.length).toBe(2);
  });

  it('structure=medium keeps maxBlocks unchanged', () => {
    const blocks: UIBlock[] = [textBlock(), insightBlock(), chartBlock(), insightBlock()];
    const hint: BlockStyleHint = { structure: 'medium', exploration: 'medium' };
    const result = adaptBlocks(blocks, baseStrategy({ maxBlocks: 2, uiDensity: 'medium' }), hint);
    const visible = result.filter(b => !b.hidden);
    expect(visible.length).toBe(2);
  });
});

describe('adaptBlocks — priority ranking', () => {
  it('highest-priority blocks are visible, lower-priority are hidden', () => {
    const blocks: UIBlock[] = [
      chartBlock(),   // low priority (2)
      textBlock(),    // high priority (10)
    ];
    const result = adaptBlocks(blocks, baseStrategy({ maxBlocks: 1, uiDensity: 'medium' }));
    // text (priority 10) should be visible
    const textResult  = result.find(b => b.type === 'text');
    const chartResult = result.find(b => b.type === 'chart');
    expect(textResult?.hidden).toBeFalsy();
    expect(chartResult?.hidden).toBe(true);
  });

  it('all blocks visible when count <= maxBlocks', () => {
    const blocks: UIBlock[] = [textBlock(), insightBlock()];
    const result = adaptBlocks(blocks, baseStrategy({ maxBlocks: 5, uiDensity: 'medium' }));
    expect(result.every(b => !b.hidden)).toBe(true);
  });

  it('does not mutate or discard original blocks (always same length)', () => {
    const blocks: UIBlock[] = [textBlock(), insightBlock(), chartBlock(), insightBlock(), insightBlock()];
    const result = adaptBlocks(blocks, baseStrategy({ maxBlocks: 2, uiDensity: 'medium' }));
    expect(result.length).toBe(blocks.length);
  });
});

describe('adaptBlocks — structure constraint: maxVisible >= 1', () => {
  it('structure=low with maxBlocks=1 → still shows 1 block', () => {
    const blocks: UIBlock[] = [textBlock(), insightBlock()];
    const hint: BlockStyleHint = { structure: 'low', exploration: 'medium' };
    // maxBlocks=1 - 1 = 0 → clamped to 1
    const result = adaptBlocks(blocks, baseStrategy({ maxBlocks: 1, uiDensity: 'medium' }), hint);
    const visible = result.filter(b => !b.hidden);
    expect(visible.length).toBeGreaterThanOrEqual(1);
  });
});

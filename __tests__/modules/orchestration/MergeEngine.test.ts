/**
 * __tests__/modules/orchestration/MergeEngine.test.ts
 *
 * Unit tests for mergeStrategy (CognitiveStyleEngine P39.6).
 * Covers all explicit priority paths:
 *   P1 — Emotional safety  (guidance === 'lead')
 *   P2 — Style preference  (structure, exploration, autonomy, guidance)
 *   P3 — Speed fine-tuning (deliberate, fast)
 * Also tests applyStyleBias backward-compat shim.
 */

import { describe, it, expect } from 'vitest';
import {
  mergeStrategy,
  applyStyleBias,
  createCognitiveStyle,
  type CognitiveStyle,
} from '@/modules/orchestration/CognitiveStyleEngine';
import type { EmotionalStrategy } from '@/modules/orchestration/EmotionalEngine';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Base "calm, focused" strategy — no safety override, balanced values. */
function baseStrategy(overrides: Partial<EmotionalStrategy> = {}): EmotionalStrategy {
  return {
    tone:       'neutral',
    depth:      'medium',
    uiDensity:  'medium',
    guidance:   'none',
    maxBlocks:  4,
    ...overrides,
  };
}

/** CognitiveStyle with all dims set to medium/balanced — neutral baseline. */
function neutralStyle(overrides: Partial<CognitiveStyle> = {}): CognitiveStyle {
  return { ...createCognitiveStyle(), ...overrides };
}

// ── P1: Emotional safety ──────────────────────────────────────────────────────

describe('mergeStrategy — P1: emotional safety (guidance === lead)', () => {
  it('forces depth=light and uiDensity=low regardless of style', () => {
    const result = mergeStrategy(
      baseStrategy({ guidance: 'lead', depth: 'deep', uiDensity: 'high' }),
      neutralStyle({ structure: 'high', exploration: 'high' }),
    );
    expect(result.depth).toBe('light');
    expect(result.uiDensity).toBe('low');
  });

  it('returns immediately — no P2/P3 mutations applied', () => {
    const result = mergeStrategy(
      baseStrategy({ guidance: 'lead', tone: 'reassuring', maxBlocks: 2 }),
      neutralStyle({ structure: 'high', autonomy: 'high', speedPreference: 'deliberate' }),
    );
    // tone and maxBlocks must be untouched (P1 returns early)
    expect(result.tone).toBe('reassuring');
    expect(result.maxBlocks).toBe(2);
    // depth/uiDensity overridden
    expect(result.depth).toBe('light');
    expect(result.uiDensity).toBe('low');
  });

  it('P1 wins over autonomy=high that would have lifted depth to medium', () => {
    const result = mergeStrategy(
      baseStrategy({ guidance: 'lead', depth: 'light' }),
      neutralStyle({ autonomy: 'high' }),
    );
    expect(result.depth).toBe('light');
    expect(result.guidance).toBe('lead');
  });
});

// ── P2a: Structure → uiDensity ────────────────────────────────────────────────

describe('mergeStrategy — P2a: structure drives uiDensity', () => {
  it('structure=high → uiDensity=high', () => {
    const result = mergeStrategy(
      baseStrategy({ uiDensity: 'medium' }),
      neutralStyle({ structure: 'high' }),
    );
    expect(result.uiDensity).toBe('high');
  });

  it('structure=low → uiDensity=low', () => {
    const result = mergeStrategy(
      baseStrategy({ uiDensity: 'medium' }),
      neutralStyle({ structure: 'low' }),
    );
    expect(result.uiDensity).toBe('low');
  });

  it('structure=medium → uiDensity unchanged', () => {
    const result = mergeStrategy(
      baseStrategy({ uiDensity: 'medium' }),
      neutralStyle({ structure: 'medium' }),
    );
    expect(result.uiDensity).toBe('medium');
  });
});

// ── P2b: Exploration → no maxBlocks cap ──────────────────────────────────────

describe('mergeStrategy — P2b: exploration removes block cap', () => {
  it('exploration=high deletes maxBlocks', () => {
    const result = mergeStrategy(
      baseStrategy({ maxBlocks: 4 }),
      neutralStyle({ exploration: 'high' }),
    );
    expect(result.maxBlocks).toBeUndefined();
  });

  it('exploration=medium preserves maxBlocks', () => {
    const result = mergeStrategy(
      baseStrategy({ maxBlocks: 4 }),
      neutralStyle({ exploration: 'medium' }),
    );
    expect(result.maxBlocks).toBe(4);
  });

  it('exploration=low preserves maxBlocks', () => {
    const result = mergeStrategy(
      baseStrategy({ maxBlocks: 3 }),
      neutralStyle({ exploration: 'low' }),
    );
    expect(result.maxBlocks).toBe(3);
  });
});

// ── P2c: Autonomy → depth floor ───────────────────────────────────────────────

describe('mergeStrategy — P2c: autonomy floors depth to medium', () => {
  it('autonomy=high + depth=light → depth promoted to medium', () => {
    const result = mergeStrategy(
      baseStrategy({ depth: 'light' }),
      neutralStyle({ autonomy: 'high' }),
    );
    expect(result.depth).toBe('medium');
  });

  it('autonomy=high + depth=medium → depth stays medium', () => {
    const result = mergeStrategy(
      baseStrategy({ depth: 'medium' }),
      neutralStyle({ autonomy: 'high' }),
    );
    expect(result.depth).toBe('medium');
  });

  it('autonomy=high + depth=deep → depth stays deep', () => {
    const result = mergeStrategy(
      baseStrategy({ depth: 'deep' }),
      neutralStyle({ autonomy: 'high' }),
    );
    expect(result.depth).toBe('deep');
  });

  it('autonomy=low — no depth change', () => {
    const result = mergeStrategy(
      baseStrategy({ depth: 'light' }),
      neutralStyle({ autonomy: 'low' }),
    );
    expect(result.depth).toBe('light');
  });
});

// ── P2d: Guidance suggestion ──────────────────────────────────────────────────

describe('mergeStrategy — P2d: guidance suggestion heuristic', () => {
  it('structure=high + autonomy=low + guidance=none → guidance=suggest', () => {
    const result = mergeStrategy(
      baseStrategy({ guidance: 'none' }),
      neutralStyle({ structure: 'high', autonomy: 'low' }),
    );
    expect(result.guidance).toBe('suggest');
  });

  it('structure=high + autonomy=medium + guidance=none → guidance unchanged', () => {
    const result = mergeStrategy(
      baseStrategy({ guidance: 'none' }),
      neutralStyle({ structure: 'high', autonomy: 'medium' }),
    );
    expect(result.guidance).toBe('none');
  });

  it('structure=low + autonomy=low + guidance=none → guidance unchanged', () => {
    const result = mergeStrategy(
      baseStrategy({ guidance: 'none' }),
      neutralStyle({ structure: 'low', autonomy: 'low' }),
    );
    expect(result.guidance).toBe('none');
  });
});

// ── P3: Speed fine-tuning ─────────────────────────────────────────────────────

describe('mergeStrategy — P3: speed fine-tuning', () => {
  it('speedPreference=deliberate + depth=medium → depth=deep', () => {
    const result = mergeStrategy(
      baseStrategy({ depth: 'medium' }),
      neutralStyle({ speedPreference: 'deliberate' }),
    );
    expect(result.depth).toBe('deep');
  });

  it('speedPreference=deliberate + depth=light → depth stays light (only promotes medium)', () => {
    const result = mergeStrategy(
      baseStrategy({ depth: 'light' }),
      neutralStyle({ speedPreference: 'deliberate' }),
    );
    expect(result.depth).toBe('light');
  });

  it('speedPreference=fast + depth=deep + non-reassuring → depth capped to medium', () => {
    const result = mergeStrategy(
      baseStrategy({ depth: 'deep', tone: 'neutral' }),
      neutralStyle({ speedPreference: 'fast' }),
    );
    expect(result.depth).toBe('medium');
  });

  it('speedPreference=fast + no prior maxBlocks → maxBlocks set to 6', () => {
    const result = mergeStrategy(
      baseStrategy({ maxBlocks: undefined }),
      neutralStyle({ speedPreference: 'fast' }),
    );
    expect(result.maxBlocks).toBe(6);
  });

  it('speedPreference=fast + tone=reassuring → no capping (safety tone respected)', () => {
    const result = mergeStrategy(
      baseStrategy({ depth: 'deep', tone: 'reassuring' }),
      neutralStyle({ speedPreference: 'fast' }),
    );
    // tone is reassuring, so P3 fast-cap condition is skipped
    expect(result.depth).toBe('deep');
  });

  it('speedPreference=balanced → no P3 changes', () => {
    const result = mergeStrategy(
      baseStrategy({ depth: 'medium', maxBlocks: 4 }),
      neutralStyle({ speedPreference: 'balanced' }),
    );
    expect(result.depth).toBe('medium');
    expect(result.maxBlocks).toBe(4);
  });
});

// ── Priority conflicts ────────────────────────────────────────────────────────

describe('mergeStrategy — priority conflict resolution', () => {
  it('P1 overrides P2+P3 simultaneously: lead blocks structure=high uiDensity promotion', () => {
    const result = mergeStrategy(
      baseStrategy({ guidance: 'lead', depth: 'deep', uiDensity: 'high' }),
      neutralStyle({ structure: 'high', autonomy: 'high', speedPreference: 'deliberate' }),
    );
    expect(result.depth).toBe('light');
    expect(result.uiDensity).toBe('low');
    expect(result.guidance).toBe('lead');
  });

  it('P2 autonomy floor does not interfere with P3 deliberate promotion (depth=medium→deep)', () => {
    // autonomy=high: light→medium (P2c), then deliberate: medium→deep (P3)
    const result = mergeStrategy(
      baseStrategy({ depth: 'light' }),
      neutralStyle({ autonomy: 'high', speedPreference: 'deliberate' }),
    );
    // P2c promotes light→medium, P3 then promotes medium→deep
    expect(result.depth).toBe('deep');
  });

  it('exploration=high removes maxBlocks, then fast P3 sets maxBlocks=6 only if not already undefined', () => {
    // exploration=high deletes maxBlocks (P2b), then fast P3 runs:
    //   "if (!result.maxBlocks) result.maxBlocks = 6" — maxBlocks is undefined → falsy → sets 6
    const result = mergeStrategy(
      baseStrategy({ maxBlocks: 4, tone: 'neutral', depth: 'medium' }),
      neutralStyle({ exploration: 'high', speedPreference: 'fast' }),
    );
    // P2b: delete maxBlocks → undefined
    // P3 fast: !undefined → true → maxBlocks = 6
    expect(result.maxBlocks).toBe(6);
  });
});

// ── applyStyleBias backward-compat shim ──────────────────────────────────────

describe('applyStyleBias — backward-compat shim delegates to mergeStrategy', () => {
  it('produces identical output to mergeStrategy for all priority paths', () => {
    const strategy = baseStrategy({ guidance: 'lead', depth: 'deep' });
    const style    = neutralStyle({ structure: 'high', autonomy: 'high' });

    expect(applyStyleBias(strategy, style)).toEqual(mergeStrategy(strategy, style));
  });

  it('P2 path: same output as mergeStrategy', () => {
    const strategy = baseStrategy({ uiDensity: 'medium', depth: 'light' });
    const style    = neutralStyle({ structure: 'high', autonomy: 'high', exploration: 'high' });

    expect(applyStyleBias(strategy, style)).toEqual(mergeStrategy(strategy, style));
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('mergeStrategy — edge cases', () => {
  it('createCognitiveStyle() neutral style does not mutate strategy', () => {
    const original = baseStrategy({ depth: 'medium', uiDensity: 'medium', guidance: 'none' });
    const result   = mergeStrategy(original, createCognitiveStyle());
    expect(result.depth).toBe('medium');
    expect(result.uiDensity).toBe('medium');
    expect(result.guidance).toBe('none');
    expect(result.maxBlocks).toBe(4);
  });

  it('does not mutate the original strategy object', () => {
    const original = baseStrategy({ depth: 'medium', maxBlocks: 5 });
    const stylePkg = neutralStyle({ exploration: 'high', speedPreference: 'fast' });
    mergeStrategy(original, stylePkg);
    expect(original.depth).toBe('medium');
    expect(original.maxBlocks).toBe(5);
  });
});

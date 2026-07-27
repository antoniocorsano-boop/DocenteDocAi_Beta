/**
 * __tests__/modules/orchestration/CognitiveStyleEngine.test.ts
 *
 * Unit tests for CognitiveStyleEngine (P39 + P39.5).
 * Covers:
 *   - smoothStyle: EWA 70/30 blending convergence
 *   - deriveStyle: heuristic derivation + speedPreference stability in early turns
 *   - recordModeUsage: signal accumulation
 *   - buildStyleSection: system prompt generation
 *   - createCognitiveStyle / createCognitiveStyleSignals: factory defaults
 */

import { describe, it, expect } from 'vitest';
import {
  smoothStyle,
  deriveStyle,
  recordModeUsage,
  buildStyleSection,
  createCognitiveStyle,
  createCognitiveStyleSignals,
  type CognitiveStyle,
  type CognitiveStyleSignals,
} from '@/modules/orchestration/CognitiveStyleEngine';

// ── Factories ──────────────────────────────────────────────────────────────────

describe('createCognitiveStyle', () => {
  it('initialises all dimensions to medium/balanced', () => {
    const s = createCognitiveStyle();
    expect(s.structure).toBe('medium');
    expect(s.autonomy).toBe('medium');
    expect(s.speedPreference).toBe('balanced');
    expect(s.exploration).toBe('medium');
  });
});

describe('createCognitiveStyleSignals', () => {
  it('initialises all counters to 0', () => {
    const s = createCognitiveStyleSignals();
    expect(s.totalTurns).toBe(0);
    expect(s.revealClicks).toBe(0);
    expect(s.deepModeUsageCount).toBe(0);
    expect(s.fastModeUsageCount).toBe(0);
    expect(s.suggestionAccepted).toBe(0);
    expect(s.suggestionRejected).toBe(0);
    expect(s.blockedTurns).toBe(0);
  });
});

// ── smoothStyle ────────────────────────────────────────────────────────────────

describe('smoothStyle — EWA 70/30', () => {
  it('no change when prev === next on all dims', () => {
    const s: CognitiveStyle = { structure: 'high', autonomy: 'high', speedPreference: 'fast', exploration: 'low' };
    expect(smoothStyle(s, s)).toEqual(s);
  });

  it('blends low→high gradually — medium is intermediate', () => {
    const prev: CognitiveStyle = { structure: 'low',  autonomy: 'medium', speedPreference: 'balanced', exploration: 'medium' };
    const next: CognitiveStyle = { structure: 'high', autonomy: 'medium', speedPreference: 'balanced', exploration: 'medium' };
    const result = smoothStyle(prev, next);
    // low (0) * 0.7 + high (2) * 0.3 = 0.6 → rounds to 1 → medium
    expect(result.structure).toBe('medium');
  });

  it('blends high→low gradually — medium is intermediate', () => {
    const prev: CognitiveStyle = { structure: 'high', autonomy: 'medium', speedPreference: 'balanced', exploration: 'medium' };
    const next: CognitiveStyle = { structure: 'low',  autonomy: 'medium', speedPreference: 'balanced', exploration: 'medium' };
    const result = smoothStyle(prev, next);
    // high (2) * 0.7 + low (0) * 0.3 = 1.4 → rounds to 1 → medium
    expect(result.structure).toBe('medium');
  });

  it('speedPreference passes through without blending', () => {
    const prev: CognitiveStyle = { structure: 'medium', autonomy: 'medium', speedPreference: 'fast', exploration: 'medium' };
    const next: CognitiveStyle = { structure: 'medium', autonomy: 'medium', speedPreference: 'deliberate', exploration: 'medium' };
    const result = smoothStyle(prev, next);
    expect(result.speedPreference).toBe('deliberate');
  });

  it('EWA inertia: medium + high target stays at medium (strong prev weight prevents overshoot)', () => {
    let style: CognitiveStyle = createCognitiveStyle(); // all medium (score=1)
    const target: CognitiveStyle = { structure: 'high', autonomy: 'high', speedPreference: 'balanced', exploration: 'high' };
    for (let i = 0; i < 20; i++) {
      style = smoothStyle(style, target);
    }
    // EWA 70/30: 1*0.7 + 2*0.3 = 1.3 → Math.round(1.3) = 1 → medium (stable)
    // The 70% weight on prev is strong enough to prevent overshoot from medium to high
    expect(style.structure).toBe('medium');
    expect(style.autonomy).toBe('medium');
    expect(style.exploration).toBe('medium');
  });

  it('converges immediately when already at target (high+high → high)', () => {
    let style: CognitiveStyle = { structure: 'high', autonomy: 'high', speedPreference: 'balanced', exploration: 'high' };
    const target = { ...style };
    for (let i = 0; i < 5; i++) {
      style = smoothStyle(style, target);
    }
    expect(style.structure).toBe('high');
    expect(style.autonomy).toBe('high');
    expect(style.exploration).toBe('high');
  });
});

// ── deriveStyle ────────────────────────────────────────────────────────────────

describe('deriveStyle — heuristic derivation', () => {
  it('neutral signals produce medium style (close to baseline)', () => {
    const signals: CognitiveStyleSignals = {
      ...createCognitiveStyleSignals(),
      totalTurns: 10,
    };
    const result = deriveStyle(signals, createCognitiveStyle());
    // With zero signals, all scores should be low/medium — structure stays medium
    expect(['low', 'medium']).toContain(result.structure);
    expect(['low', 'medium']).toContain(result.exploration);
  });

  it('many reveal clicks → structure and exploration trend high', () => {
    const signals: CognitiveStyleSignals = {
      ...createCognitiveStyleSignals(),
      revealClicks: 10,
      totalTurns:   20,
    };
    const result = deriveStyle(signals, createCognitiveStyle());
    expect(['medium', 'high']).toContain(result.structure);
    expect(['medium', 'high']).toContain(result.exploration);
  });

  it('all rejected suggestions → autonomy trends high', () => {
    const signals: CognitiveStyleSignals = {
      ...createCognitiveStyleSignals(),
      suggestionRejected: 10,
      suggestionAccepted: 0,
      totalTurns:         20,
    };
    const result = deriveStyle(signals, createCognitiveStyle());
    expect(['medium', 'high']).toContain(result.autonomy);
  });

  it('all accepted suggestions → autonomy trends low', () => {
    const signals: CognitiveStyleSignals = {
      ...createCognitiveStyleSignals(),
      suggestionAccepted: 10,
      suggestionRejected: 0,
      totalTurns:         20,
      blockedTurns:       5, // many blocked turns also push autonomy down
    };
    const result = deriveStyle(signals, createCognitiveStyle());
    expect(['low', 'medium']).toContain(result.autonomy);
  });

  it('many deep mode uses → deliberate speedPreference (with T >= 5)', () => {
    const signals: CognitiveStyleSignals = {
      ...createCognitiveStyleSignals(),
      deepModeUsageCount: 8,
      totalTurns:         10,
    };
    const result = deriveStyle(signals, createCognitiveStyle());
    expect(result.speedPreference).toBe('deliberate');
  });

  it('many fast mode uses → fast speedPreference (with T >= 5)', () => {
    const signals: CognitiveStyleSignals = {
      ...createCognitiveStyleSignals(),
      fastModeUsageCount: 8,
      totalTurns:         10,
    };
    const result = deriveStyle(signals, createCognitiveStyle());
    expect(result.speedPreference).toBe('fast');
  });

  it('speedPreference is frozen to current when T < 5', () => {
    const signals: CognitiveStyleSignals = {
      ...createCognitiveStyleSignals(),
      deepModeUsageCount: 3, // would be deliberate if T >= 5
      totalTurns:         4,
    };
    const current: CognitiveStyle = { ...createCognitiveStyle(), speedPreference: 'fast' };
    const result = deriveStyle(signals, current);
    // T=4 < 5 → speedPreference stays at the current value
    expect(result.speedPreference).toBe('fast');
  });

  it('style is stable after N identical turns (convergence)', () => {
    let style = createCognitiveStyle();
    const signals: CognitiveStyleSignals = {
      ...createCognitiveStyleSignals(),
      revealClicks:       6,
      deepModeUsageCount: 8,
      suggestionRejected: 5,
      totalTurns:         20,
    };
    for (let i = 0; i < 10; i++) {
      style = deriveStyle(signals, style);
    }
    const before = { ...style };
    const after  = deriveStyle(signals, style);
    expect(after.structure).toBe(before.structure);
    expect(after.autonomy).toBe(before.autonomy);
    expect(after.exploration).toBe(before.exploration);
    expect(after.speedPreference).toBe(before.speedPreference);
  });
});

// ── recordModeUsage ────────────────────────────────────────────────────────────

describe('recordModeUsage', () => {
  it('increments totalTurns on every call', () => {
    const s0 = createCognitiveStyleSignals();
    const s1 = recordModeUsage(s0, 'balanced', false);
    const s2 = recordModeUsage(s1, 'balanced', false);
    expect(s1.totalTurns).toBe(1);
    expect(s2.totalTurns).toBe(2);
  });

  it('deep mode increments deepModeUsageCount', () => {
    const s0 = createCognitiveStyleSignals();
    const s1 = recordModeUsage(s0, 'deep', false);
    expect(s1.deepModeUsageCount).toBe(1);
    expect(s1.fastModeUsageCount).toBe(0);
  });

  it('manual mode increments deepModeUsageCount (counts as deep)', () => {
    const s0 = createCognitiveStyleSignals();
    const s1 = recordModeUsage(s0, 'manual', false);
    expect(s1.deepModeUsageCount).toBe(1);
  });

  it('fast mode increments fastModeUsageCount', () => {
    const s0 = createCognitiveStyleSignals();
    const s1 = recordModeUsage(s0, 'fast', false);
    expect(s1.fastModeUsageCount).toBe(1);
    expect(s1.deepModeUsageCount).toBe(0);
  });

  it('standard mode increments neither deep nor fast count', () => {
    const s0 = createCognitiveStyleSignals();
    const s1 = recordModeUsage(s0, 'balanced', false);
    expect(s1.deepModeUsageCount).toBe(0);
    expect(s1.fastModeUsageCount).toBe(0);
  });

  it('isBlocked=true increments blockedTurns', () => {
    const s0 = createCognitiveStyleSignals();
    const s1 = recordModeUsage(s0, 'balanced', true);
    expect(s1.blockedTurns).toBe(1);
  });

  it('isBlocked=false does not increment blockedTurns', () => {
    const s0 = createCognitiveStyleSignals();
    const s1 = recordModeUsage(s0, 'balanced', false);
    expect(s1.blockedTurns).toBe(0);
  });

  it('does not mutate the original signals object', () => {
    const s0 = createCognitiveStyleSignals();
    recordModeUsage(s0, 'deep', true);
    expect(s0.totalTurns).toBe(0);
    expect(s0.deepModeUsageCount).toBe(0);
    expect(s0.blockedTurns).toBe(0);
  });
});

// ── buildStyleSection ──────────────────────────────────────────────────────────

describe('buildStyleSection', () => {
  it('returns empty string for neutral style', () => {
    const style = createCognitiveStyle(); // all medium/balanced
    expect(buildStyleSection(style)).toBe('');
  });

  it('structure=high includes structured response directive', () => {
    const style: CognitiveStyle = { ...createCognitiveStyle(), structure: 'high' };
    expect(buildStyleSection(style)).toMatch(/STRUTTURA/);
  });

  it('autonomy=low includes explicit guidance directive', () => {
    const style: CognitiveStyle = { ...createCognitiveStyle(), autonomy: 'low' };
    expect(buildStyleSection(style)).toMatch(/GUIDA ESPLICITA/);
  });

  it('autonomy=high includes autonomy directive', () => {
    const style: CognitiveStyle = { ...createCognitiveStyle(), autonomy: 'high' };
    expect(buildStyleSection(style)).toMatch(/AUTONOMIA/);
  });

  it('speedPreference=fast includes concise directive', () => {
    const style: CognitiveStyle = { ...createCognitiveStyle(), speedPreference: 'fast' };
    expect(buildStyleSection(style)).toMatch(/RITMO/);
  });

  it('speedPreference=deliberate includes depth directive', () => {
    const style: CognitiveStyle = { ...createCognitiveStyle(), speedPreference: 'deliberate' };
    expect(buildStyleSection(style)).toMatch(/PROFONDITÀ/);
  });

  it('exploration=high includes exploration directive', () => {
    const style: CognitiveStyle = { ...createCognitiveStyle(), exploration: 'high' };
    expect(buildStyleSection(style)).toMatch(/ESPLORAZIONE/);
  });

  it('all active dims produce multi-line output', () => {
    const style: CognitiveStyle = {
      structure:       'high',
      autonomy:        'low',
      speedPreference: 'deliberate',
      exploration:     'high',
    };
    const lines = buildStyleSection(style).split('\n').filter(Boolean);
    expect(lines.length).toBeGreaterThanOrEqual(4);
  });
});

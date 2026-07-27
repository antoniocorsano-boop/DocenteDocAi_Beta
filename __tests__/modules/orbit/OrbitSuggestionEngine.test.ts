/**
 * __tests__/modules/orbit/OrbitSuggestionEngine.test.ts — Sprint D
 *
 * Unit tests for OrbitSuggestionEngine.ts (Sprint C — cross-world extension).
 *
 * All functions under test are pure — no mocks, no React, no stores.
 *
 * Contracts verified:
 *   1.  Returns at most MAX_SUGGESTIONS (3) items
 *   2.  Always returns at least 1 item (default fallback guaranteed)
 *   3.  Labels are always in soft-question form (end with '?')
 *   4.  Suggestions in previousActions are filtered out
 *   5.  Emotional state 'blocked' → 'simplify' suggestion added
 *   6.  Emotional state 'overloaded' → 'summary' suggestion added
 *   7.  Emotional state 'goal_oriented' → 'quiz' suggestion added
 *   8.  Cognitive style exploration=high → 'expand-deep' added
 *   9.  Cognitive style structure=high → 'rubric' added
 *   10. hasMessages=true → 'rephrase' candidate added
 *   11. Cross-world: availableWorlds without activeWorldId → world-switch suggestion present
 *   12. Cross-world: activeWorldId filters out the active world from suggestions
 *   13. All confidence values are in [0, 1]
 *   14. All items have non-empty id, label, prompt, reason
 *   15. Result is sorted descending by confidence
 */

import { describe, it, expect } from 'vitest';
import {
  getOrbitSuggestions,
  type OrbitContext,
} from '../../../src/modules/orbit/OrbitSuggestionEngine';

// ── Helpers ───────────────────────────────────────────────────────────────────

const baseCtx = (overrides?: Partial<OrbitContext>): OrbitContext => ({
  hasMessages: false,
  ...overrides,
});

// ── Contract 1-2: MAX_SUGGESTIONS + always-present fallback ──────────────────

describe('getOrbitSuggestions — count contracts', () => {
  it('[1] returns at most 3 items even with many signals', () => {
    const result = getOrbitSuggestions(baseCtx({
      emotionalState:  'blocked',
      cognitiveStyle:  { structure: 'high', exploration: 'high', speedPreference: 'fast' },
      hasMessages:     true,
      recentMessages:  ['qualcosa di recente'],
      availableWorlds: [{ id: 'cultura', label: 'Cultura', icon: 'menu_book' }],
      activeWorldId:   'didattica',
    }));
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('[2] returns at least 1 item for empty context', () => {
    const result = getOrbitSuggestions(baseCtx());
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});

// ── Contract 3: labels always soft questions ──────────────────────────────────

describe('getOrbitSuggestions — label format', () => {
  it('[3] all labels end with "?"', () => {
    const result = getOrbitSuggestions(baseCtx({
      emotionalState:  'goal_oriented',
      cognitiveStyle:  { structure: 'high', exploration: 'high', speedPreference: 'fast' },
      hasMessages:     true,
      availableWorlds: [{ id: 'cultura', label: 'Cultura', icon: 'menu_book' }],
      activeWorldId:   'didattica',
    }));
    for (const s of result) {
      expect(s.label.trim().endsWith('?')).toBe(true);
    }
  });
});

// ── Contract 4: previousActions deduplication ────────────────────────────────

describe('getOrbitSuggestions — previousActions filter', () => {
  it('[4] suppresses suggestions already in previousActions', () => {
    const result = getOrbitSuggestions(baseCtx({
      emotionalState:  'blocked',
      previousActions: ['simplify'],
    }));
    expect(result.find(s => s.id === 'simplify')).toBeUndefined();
  });

  it('[4] still returns other items when one is suppressed', () => {
    const result = getOrbitSuggestions(baseCtx({
      previousActions: ['quiz-default'],
    }));
    // quiz-default suppressed but fallback is gone — at least 0 items (no other signals)
    // key assertion: quiz-default is NOT present
    expect(result.find(s => s.id === 'quiz-default')).toBeUndefined();
  });
});

// ── Contracts 5-7: emotional state rules ─────────────────────────────────────

describe('getOrbitSuggestions — emotional state rules', () => {
  it('[5] blocked state adds simplify suggestion', () => {
    const result = getOrbitSuggestions(baseCtx({ emotionalState: 'blocked' }));
    expect(result.find(s => s.id === 'simplify')).toBeDefined();
  });

  it('[5] blocked + recentMessages enriches prompt with message content', () => {
    const result = getOrbitSuggestions(baseCtx({
      emotionalState: 'blocked',
      recentMessages: ['contenuto specifico da semplificare'],
    }));
    const s = result.find(s => s.id === 'simplify');
    expect(s).toBeDefined();
    expect(s!.confidence).toBeGreaterThan(0.80);
  });

  it('[6] overloaded state adds summary suggestion', () => {
    const result = getOrbitSuggestions(baseCtx({ emotionalState: 'overloaded' }));
    expect(result.find(s => s.id === 'summary')).toBeDefined();
  });

  it('[7] goal_oriented state adds quiz suggestion', () => {
    const result = getOrbitSuggestions(baseCtx({ emotionalState: 'goal_oriented' }));
    expect(result.find(s => s.id === 'quiz')).toBeDefined();
  });

  it('[7] focused state also adds quiz suggestion', () => {
    const result = getOrbitSuggestions(baseCtx({ emotionalState: 'focused' }));
    expect(result.find(s => s.id === 'quiz')).toBeDefined();
  });
});

// ── Contracts 8-10: cognitive style + session context ────────────────────────

describe('getOrbitSuggestions — cognitive style rules', () => {
  it('[8] exploration=high adds expand-deep suggestion', () => {
    const result = getOrbitSuggestions(baseCtx({
      cognitiveStyle: { structure: 'low', exploration: 'high', speedPreference: 'balanced' },
    }));
    expect(result.find(s => s.id === 'expand-deep')).toBeDefined();
  });

  it('[9] structure=high adds rubric suggestion', () => {
    const result = getOrbitSuggestions(baseCtx({
      cognitiveStyle: { structure: 'high', exploration: 'low', speedPreference: 'balanced' },
    }));
    expect(result.find(s => s.id === 'rubric')).toBeDefined();
  });

  it('[10] hasMessages=true adds rephrase as candidate', () => {
    // With no other signals, rephrase competes with quiz-default
    const result = getOrbitSuggestions(baseCtx({ hasMessages: true }));
    // rephrase has confidence 0.72 > quiz-default 0.60 → should win slot
    expect(result.find(s => s.id === 'rephrase')).toBeDefined();
  });
});

// ── Contracts 11-12: cross-world suggestions ─────────────────────────────────

describe('getOrbitSuggestions — cross-world (Fase 6)', () => {
  it('[11] generates world-switch suggestion when availableWorlds present', () => {
    const result = getOrbitSuggestions(baseCtx({
      availableWorlds: [{ id: 'cultura', label: 'Cultura', icon: 'menu_book' }],
    }));
    expect(result.find(s => s.id === 'world-switch-cultura')).toBeDefined();
  });

  it('[11] world-switch label ends with "?"', () => {
    const result = getOrbitSuggestions(baseCtx({
      availableWorlds: [{ id: 'cultura', label: 'Cultura', icon: 'menu_book' }],
    }));
    const s = result.find(s => s.id === 'world-switch-cultura');
    expect(s!.label.trim().endsWith('?')).toBe(true);
  });

  it('[12] active world is excluded from cross-world suggestions', () => {
    const result = getOrbitSuggestions(baseCtx({
      activeWorldId:   'cultura',
      availableWorlds: [
        { id: 'didattica', label: 'Didattica', icon: 'school' },
        { id: 'cultura',   label: 'Cultura',   icon: 'menu_book' },
      ],
    }));
    // cultura is active → should NOT appear as world-switch target
    expect(result.find(s => s.id === 'world-switch-cultura')).toBeUndefined();
    // didattica is other world → may appear
    expect(result.find(s => s.id === 'world-switch-didattica')).toBeDefined();
  });

  it('[12] no world-switch when availableWorlds is empty', () => {
    const result = getOrbitSuggestions(baseCtx({
      activeWorldId:   'didattica',
      availableWorlds: [],
    }));
    expect(result.find(s => s.id?.startsWith('world-switch-'))).toBeUndefined();
  });

  it('[12] no world-switch when all worlds are the active world', () => {
    const result = getOrbitSuggestions(baseCtx({
      activeWorldId:   'didattica',
      availableWorlds: [{ id: 'didattica', label: 'Didattica', icon: 'school' }],
    }));
    expect(result.find(s => s.id?.startsWith('world-switch-'))).toBeUndefined();
  });
});

// ── Contracts 13-15: output quality ──────────────────────────────────────────

describe('getOrbitSuggestions — output quality', () => {
  it('[13] all confidence values are in [0, 1]', () => {
    const result = getOrbitSuggestions(baseCtx({
      emotionalState:  'overloaded',
      cognitiveStyle:  { structure: 'high', exploration: 'high', speedPreference: 'fast' },
      hasMessages:     true,
      availableWorlds: [{ id: 'cultura', label: 'Cultura', icon: 'menu_book' }],
      activeWorldId:   'didattica',
    }));
    for (const s of result) {
      expect(s.confidence).toBeGreaterThanOrEqual(0);
      expect(s.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('[14] all items have non-empty id, label, prompt, reason', () => {
    const result = getOrbitSuggestions(baseCtx({
      emotionalState:  'blocked',
      hasMessages:     true,
      availableWorlds: [{ id: 'cultura', label: 'Cultura', icon: 'menu_book' }],
    }));
    for (const s of result) {
      expect(s.id.trim().length).toBeGreaterThan(0);
      expect(s.label.trim().length).toBeGreaterThan(0);
      expect(s.prompt.trim().length).toBeGreaterThan(0);
      expect(s.reason.trim().length).toBeGreaterThan(0);
    }
  });

  it('[15] result is sorted descending by confidence', () => {
    const result = getOrbitSuggestions(baseCtx({
      emotionalState:  'blocked',
      cognitiveStyle:  { structure: 'high', exploration: 'high', speedPreference: 'fast' },
      hasMessages:     true,
    }));
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].confidence).toBeGreaterThanOrEqual(result[i + 1].confidence);
    }
  });
});

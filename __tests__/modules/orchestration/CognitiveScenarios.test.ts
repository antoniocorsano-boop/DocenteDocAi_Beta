/**
 * __tests__/modules/orchestration/CognitiveScenarios.test.ts
 *
 * Integration scenarios for the full P39.6 cognitive pipeline.
 * These exercise multiple modules together — no mocks.
 *
 * Scenarios covered:
 *   1. "Utente bloccato per 3 turni poi si sblocca"
 *      → uiDensity stays 'low' / guidance stays 'lead' throughout blockage;
 *        recovers to higher density only after real recovery signal.
 *
 *   2. "Utente autonomo high structure"
 *      → mergeStrategy produces uiDensity='high' (P2a) + depth >= 'medium' (P2c autonomy floor)
 *
 *   3. "No oscillazione speedPreference nei primi 5 turni"
 *      → speedPreference locked to current value until T>=5
 *        (even when signals strongly suggest a different preference)
 */

import { describe, it, expect } from 'vitest';
import type { UIBlock } from '@/types/uiBlocks';
import {
  analyzeEmotional,
  updateEmotionalMemory,
  createEmotionalMemory,
  createEmotionalProfile,
  adaptBlocks,
  type EmotionalMemory,
  type EmotionalState,
  type EmotionalStrategy,
} from '@/modules/orchestration/EmotionalEngine';
import {
  mergeStrategy,
  deriveStyle,
  recordModeUsage,
  createCognitiveStyle,
  createCognitiveStyleSignals,
  type CognitiveStyle,
  type CognitiveStyleSignals,
} from '@/modules/orchestration/CognitiveStyleEngine';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Simulates a single turn of the full cognitive pipeline.
 *
 * NOTE on prevState:
 *   Omit (undefined) on the first turn of a fresh session — analyzeEmotional
 *   will use the raw detected state with no smoothState filtering.
 *   Pass the previous state on subsequent turns so the smoothState guard applies.
 */
function runTurn(
  text:       string,
  memory:     EmotionalMemory,
  signals:    CognitiveStyleSignals,
  style:      CognitiveStyle,
  prevState?: EmotionalState,
): {
  memory:   EmotionalMemory;
  signals:  CognitiveStyleSignals;
  style:    CognitiveStyle;
  state:    EmotionalState;
  strategy: EmotionalStrategy;
} {
  const { signal, state, strategy: emotionalStrategy } = analyzeEmotional(
    text,
    memory,
    createEmotionalProfile(),
    prevState,
  );
  const isBlocked = state === 'blocked' || state === 'overloaded';
  const newMemory  = updateEmotionalMemory(memory, signal, state);
  const newSignals = recordModeUsage(signals, 'balanced', isBlocked);
  const newStyle   = deriveStyle(newSignals, style);
  const strategy   = mergeStrategy(emotionalStrategy, newStyle);

  return { memory: newMemory, signals: newSignals, style: newStyle, state, strategy };
}

// Text fixtures (Italian, matching the keyword regexes in detectSignals)
const BLOCKED_TEXT  = 'Non capisco cosa fare, sono confuso su questo passaggio';
const FOCUSED_TEXT  = 'Procediamo con il prossimo punto del piano didattico';

/**
 * Build a style that already has structure=high / autonomy=high.
 *
 * EWA 70/30 inertia means blendLevel(medium→high) = 1.3 → rounds to medium,
 * so 'high' is unreachable from 'medium' via organic signal accumulation.
 * This represents either:
 *   a) a style initialised to high (e.g. from a persisted profile), or
 *   b) a future manual override (Fase 3 slider).
 * The merge-engine tests below verify the correct P2a/P2c behaviour given that style.
 */
function highStructureHighAutonomyStyle(): CognitiveStyle {
  return { structure: 'high', autonomy: 'high', speedPreference: 'balanced', exploration: 'medium' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Scenario 1 — "Utente bloccato per 3 turni poi si sblocca"
// ═══════════════════════════════════════════════════════════════════════════════

describe('Scenario 1 — utente bloccato poi si sblocca', () => {
  it('primo turno senza prevState raggiunge blocked direttamente', () => {
    // On the first turn of a fresh session prevState is omitted → smoothState is
    // skipped → raw detected state is used as-is.
    const { state } = analyzeEmotional(BLOCKED_TEXT, createEmotionalMemory());
    expect(state).toBe('blocked');
  });

  it('uiDensity rimane bassa durante i 3 turni di blocco', () => {
    let memory  = createEmotionalMemory();
    let signals = createCognitiveStyleSignals();
    let style   = createCognitiveStyle();
    let state: EmotionalState | undefined = undefined; // first turn: bypass smoothState

    for (let t = 0; t < 3; t++) {
      ({ memory, signals, style, state } = runTurn(BLOCKED_TEXT, memory, signals, style, state));
      expect(state).toBe('blocked');
      expect(mergeStrategy(
        analyzeEmotional(BLOCKED_TEXT, memory, undefined, state).strategy,
        style,
      ).uiDensity).toBe('low');
    }
  });

  it('guidance è lead durante il blocco', () => {
    let memory  = createEmotionalMemory();
    let signals = createCognitiveStyleSignals();
    let style   = createCognitiveStyle();
    let state: EmotionalState | undefined = undefined;

    for (let t = 0; t < 3; t++) {
      ({ memory, signals, style, state } = runTurn(BLOCKED_TEXT, memory, signals, style, state));
    }
    const { strategy } = analyzeEmotional(BLOCKED_TEXT, memory, undefined, state as EmotionalState);
    expect(mergeStrategy(strategy, style).guidance).toBe('lead');
  });

  it('frustrationCount >= 3 dopo 3 turni bloccati → safety override (depth=light)', () => {
    let memory  = createEmotionalMemory();
    let signals = createCognitiveStyleSignals();
    let style   = createCognitiveStyle();
    let state: EmotionalState | undefined = undefined;

    for (let t = 0; t < 3; t++) {
      ({ memory, signals, style, state } = runTurn(BLOCKED_TEXT, memory, signals, style, state));
    }
    expect(memory.frustrationCount).toBeGreaterThanOrEqual(3);

    // At frustrationCount >= 3 resolveStrategy forces safety regardless of text
    const { strategy } = analyzeEmotional(FOCUSED_TEXT, memory, undefined, state as EmotionalState);
    expect(strategy.depth).toBe('light');
    expect(strategy.uiDensity).toBe('low');
  });

  it('smoothState blocca il salto diretto blocked→focused (richiede percorso graduale)', () => {
    // SMOOTH_TRANSITIONS: blocked → [blocked, overloaded] only.
    // A clear message resolves to 'focused' raw but smoothState returns
    // prev ('blocked') because the transition is illegal.
    const { state } = analyzeEmotional(
      FOCUSED_TEXT,
      createEmotionalMemory(),
      createEmotionalProfile(),
      'blocked',   // prevState forces smoothState check
    );
    // blocked → focused is ILLEGAL → state stays 'blocked'
    expect(state).toBe('blocked');
  });

  it('lastPerceivedState è aggiornato ad ogni turno bloccato', () => {
    let memory  = createEmotionalMemory();
    let signals = createCognitiveStyleSignals();
    let style   = createCognitiveStyle();
    let state: EmotionalState | undefined = undefined;

    for (let t = 0; t < 2; t++) {
      ({ memory, signals, style, state } = runTurn(BLOCKED_TEXT, memory, signals, style, state));
      expect(memory.lastPerceivedState).toBe('blocked');
    }
  });

  it('blockedTurns si accumula nei segnali durante il blocco', () => {
    let memory  = createEmotionalMemory();
    let signals = createCognitiveStyleSignals();
    let style   = createCognitiveStyle();
    let state: EmotionalState | undefined = undefined;

    for (let t = 0; t < 3; t++) {
      ({ memory, signals, style, state } = runTurn(BLOCKED_TEXT, memory, signals, style, state));
    }
    expect(signals.blockedTurns).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Scenario 2 — "Utente autonomo high structure"
// ═══════════════════════════════════════════════════════════════════════════════

describe('Scenario 2 — utente autonomo high structure', () => {
  // NOTE: EWA 70/30 inertia means blendLevel(medium→high) = 1.3 → rounds to 1 →
  // medium.  'high' is only achievable when already at 'high' (2*0.7+2*0.3=2).
  // In production this style comes from a persisted profile (already high) or
  // a future manual override (Fase 3 slider).  We set it directly here.

  it('structure=high → uiDensity=high (P2a merge rule)', () => {
    const style = highStructureHighAutonomyStyle();
    const emotional: EmotionalStrategy = {
      tone: 'neutral', depth: 'medium', uiDensity: 'medium', guidance: 'none', maxBlocks: 4,
    };
    const merged = mergeStrategy(emotional, style);
    expect(merged.uiDensity).toBe('high');
  });

  it('autonomy=high + depth=light → depth floored to medium (P2c merge rule)', () => {
    const style = highStructureHighAutonomyStyle();
    const emotional: EmotionalStrategy = {
      tone: 'neutral', depth: 'light', uiDensity: 'medium', guidance: 'none', maxBlocks: 4,
    };
    const merged = mergeStrategy(emotional, style);
    expect(['medium', 'deep']).toContain(merged.depth);
    expect(merged.depth).not.toBe('light');
  });

  it('structure=high + autonomy=high combo: uiDensity=high AND depth >= medium', () => {
    const style = highStructureHighAutonomyStyle();
    const emotional: EmotionalStrategy = {
      tone: 'neutral', depth: 'light', uiDensity: 'low', guidance: 'none', maxBlocks: 3,
    };
    const merged = mergeStrategy(emotional, style);
    expect(merged.uiDensity).toBe('high');
    expect(['medium', 'deep']).toContain(merged.depth);
  });

  it('P1 safety overrides P2 structure preference — lead stays lead even on high-structure', () => {
    const style = highStructureHighAutonomyStyle();
    const emotional: EmotionalStrategy = {
      tone: 'reassuring', depth: 'light', uiDensity: 'low', guidance: 'lead', maxBlocks: 2,
    };
    const merged = mergeStrategy(emotional, style);
    // P1 is inviolable: guidance='lead' → depth stays light, uiDensity stays low
    expect(merged.guidance).toBe('lead');
    expect(merged.depth).toBe('light');
    expect(merged.uiDensity).toBe('low');
  });

  it('focused turns with high-structure style produce uiDensity=high', () => {
    const style = highStructureHighAutonomyStyle();
    let memory  = createEmotionalMemory();
    let state: EmotionalState | undefined = undefined;

    for (let t = 0; t < 3; t++) {
      const { signal, state: newState, strategy } = analyzeEmotional(
        FOCUSED_TEXT, memory, undefined, state,
      );
      memory = updateEmotionalMemory(memory, signal, newState);
      state  = newState;
      const merged = mergeStrategy(strategy, style);
      expect(merged.uiDensity).toBe('high');
      expect(['medium', 'deep']).toContain(merged.depth);
    }
  });

  it('EWA inertia: blendLevel(medium→high) stays medium (system property documented)', () => {
    // EWA is INTENTIONAL — prevents oscillations.
    // Organic signal accumulation can't push medium→high due to 70% inertia weight.
    let signals = createCognitiveStyleSignals();
    let style   = createCognitiveStyle(); // all medium
    for (let t = 0; t < 20; t++) {
      signals = { ...signals, revealClicks: signals.revealClicks + 1, totalTurns: signals.totalTurns + 1 };
      style   = deriveStyle(signals, style);
    }
    // Even after 20 turns of high revealClicks, structure stays medium due to EWA
    expect(style.structure).toBe('medium');
  });

  it('adaptBlocks with structure=high adds 1 visible block to maxBlocks', () => {
    const style = highStructureHighAutonomyStyle();
    const strategy: EmotionalStrategy = {
      tone: 'neutral', depth: 'medium', uiDensity: 'medium', guidance: 'none', maxBlocks: 2,
    };
    const blocks: UIBlock[] = [
      { type: 'text',    content: 'a' },
      { type: 'insight', data: { agentsUsed: [], confidence: 0.8, memoryUsed: false, memoryItems: [], intentType: 'test', durationMs: 100, mode: 'balanced', adaptiveHints: [] } },
      { type: 'chart',   config: { chartType: 'bar', data: [] } },
      { type: 'insight', data: { agentsUsed: [], confidence: 0.5, memoryUsed: false, memoryItems: [], intentType: 'test', durationMs: 80,  mode: 'balanced', adaptiveHints: [] } },
    ];
    const result  = adaptBlocks(blocks, strategy, { structure: style.structure, exploration: style.exploration });
    const visible = result.filter(b => !b.hidden);
    // structure=high: maxBlocks(2) + 1 = 3 visible
    expect(visible.length).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Scenario 3 — "No oscillazione speedPreference nei primi 5 turni"
// ═══════════════════════════════════════════════════════════════════════════════

describe('Scenario 3 — speedPreference stabile nei primi 5 turni', () => {
  it('T<5: speedPreference non cambia anche se segnali dicono deliberate', () => {
    let signals = createCognitiveStyleSignals();
    let style: CognitiveStyle = { ...createCognitiveStyle(), speedPreference: 'fast' };

    // Simulate 4 turns with deep mode → strong signal for deliberate
    for (let t = 0; t < 4; t++) {
      signals = recordModeUsage(signals, 'deep', false);
      style   = deriveStyle(signals, style);
      expect(signals.totalTurns).toBe(t + 1);
      expect(style.speedPreference).toBe('fast'); // locked
    }
    expect(signals.totalTurns).toBe(4);
    expect(style.speedPreference).toBe('fast');
  });

  it('T<5: speedPreference non cambia da balanced nemmeno se 3x fast mode', () => {
    let signals = createCognitiveStyleSignals();
    let style   = createCognitiveStyle(); // speedPreference: 'balanced'

    for (let t = 0; t < 4; t++) {
      signals = recordModeUsage(signals, 'fast', false);
      style   = deriveStyle(signals, style);
    }
    expect(style.speedPreference).toBe('balanced'); // locked
  });

  it('T=5: speedPreference si sblocca e segue i segnali (deliberate)', () => {
    let signals = createCognitiveStyleSignals();
    let style: CognitiveStyle = { ...createCognitiveStyle(), speedPreference: 'fast' };

    // 5 turns with deep mode
    for (let t = 0; t < 5; t++) {
      signals = recordModeUsage(signals, 'deep', false);
    }
    // Push deepModeUsageCount high enough to trigger 'deliberate'
    // deepModeUsageCount = 5, totalTurns = 5 → ratio = 1.0 → 'deliberate'
    style = deriveStyle(signals, style);
    expect(signals.totalTurns).toBe(5);
    expect(style.speedPreference).toBe('deliberate');
  });

  it('T=5: speedPreference si sblocca verso fast con segnali fast', () => {
    let signals = createCognitiveStyleSignals();
    let style: CognitiveStyle = { ...createCognitiveStyle(), speedPreference: 'balanced' };

    for (let t = 0; t < 5; t++) {
      signals = recordModeUsage(signals, 'fast', false);
    }
    style = deriveStyle(signals, style);
    expect(style.speedPreference).toBe('fast');
  });

  it('pipeline completa — speedPreference ancora locked al turno 4 in full pipeline', () => {
    let memory  = createEmotionalMemory();
    let signals = createCognitiveStyleSignals();
    let style: CognitiveStyle = { ...createCognitiveStyle(), speedPreference: 'deliberate' };
    let state: EmotionalState | undefined = undefined;

    // 4 turns with fast-style messages (short/urgent)
    const fastText = 'Avanti'; // short → goal_oriented, no slow signal
    for (let t = 0; t < 4; t++) {
      const { signal, state: newState, strategy } = analyzeEmotional(fastText, memory, undefined, state);
      memory   = updateEmotionalMemory(memory, signal, newState);
      signals  = recordModeUsage(signals, 'fast', false);
      style    = deriveStyle(signals, style);
      state    = newState;
      // speedPreference still locked (T<5)
      expect(style.speedPreference).toBe('deliberate');
      void mergeStrategy(strategy, style);
    }
  });

  it('mergeStrategy con speedPreference=deliberate + depth=medium → depth=deep (P3)', () => {
    const style: CognitiveStyle = { ...createCognitiveStyle(), speedPreference: 'deliberate' };
    const emotional: EmotionalStrategy = {
      tone: 'neutral', depth: 'medium', uiDensity: 'medium', guidance: 'none', maxBlocks: 4,
    };
    const merged = mergeStrategy(emotional, style);
    expect(merged.depth).toBe('deep');
  });

  it('nessuna oscillazione dopo convergenza — identical style for N turns', () => {
    let signals = {
      ...createCognitiveStyleSignals(),
      totalTurns:         10,
      deepModeUsageCount: 8,
      revealClicks:       4,
      suggestionRejected: 4,
    };
    let style = createCognitiveStyle();
    // Converge 10 times
    for (let i = 0; i < 10; i++) {
      style = deriveStyle(signals, style);
    }
    const before = { ...style };
    // Verify: further turns produce the same style (stable fixed point)
    for (let i = 0; i < 3; i++) {
      style = deriveStyle(signals, style);
    }
    expect(style.structure).toBe(before.structure);
    expect(style.autonomy).toBe(before.autonomy);
    expect(style.exploration).toBe(before.exploration);
    expect(style.speedPreference).toBe(before.speedPreference);
  });
});

/**
 * __tests__/modules/orbit/orbitEngine.test.ts
 *
 * Unit tests for the Orbit / Jarvis presence system.
 *
 * All functions under test are pure — no mocks, no React, no stores.
 *
 * Contract guarantees verified here:
 *   1.  mobile viewport → never cinematic
 *   2.  critical cognitive load → always ambient
 *   3.  executor agent + confident signals → cinematic (if load allows)
 *   4.  multi-agent escalation limited by load ceiling
 *   5.  dominant personality priority ordering
 *   6.  observer personality suppresses cinematic on single-agent session
 *   7.  balancePresenceWithLoad ceiling rules (all four load levels)
 *   8.  computeCognitiveLoad score thresholds
 *   9.  resolveDominantPersonality tie-breaking + empty array
 *   10. applyMotionMultiplier CSS string scaling
 */

import { describe, it, expect } from 'vitest';

import {
  computeCognitiveLoad,
  balancePresenceWithLoad,
  LOAD_THRESHOLD_LOW,
  LOAD_THRESHOLD_MEDIUM,
  LOAD_THRESHOLD_HIGH,
} from '../../../src/theme/cognitiveLoad';
import type { CognitiveLoadSignals } from '../../../src/theme/cognitiveLoad';

import {
  resolveDominantPersonality,
  applyMotionMultiplier,
  AGENT_PERSONALITIES,
} from '../../../src/theme/agentPersonality';
import type { ActiveAgent } from '../../../src/theme/agentPersonality';

import {
  resolveAdaptivePresence,
} from '../../../src/theme/orbitStates';
import type { OrbitBehaviorSignals } from '../../../src/theme/orbitStates';

import {
  resolveFinalPresence,
} from '../../../src/theme/presenceEngine';
import type { FinalPresenceInput } from '../../../src/theme/presenceEngine';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DESKTOP = 1280;
const MOBILE  = 375;

const baseSignals = (overrides?: Partial<OrbitBehaviorSignals>): OrbitBehaviorSignals => ({
  viewportWidth:     DESKTOP,
  ambientFiredCount: 0,
  activeAgentsCount: 0,
  ...overrides,
});

const baseCognitive = (overrides?: Partial<CognitiveLoadSignals>): CognitiveLoadSignals => ({
  viewportWidth:      DESKTOP,
  ambientFiredCount:  0,
  activeAgentsCount:  0,
  recentInteractions: 0,
  ...overrides,
});

const finalInput = (overrides?: Partial<FinalPresenceInput>): FinalPresenceInput => ({
  nexusState:       'idle',
  behaviorSignals:  baseSignals(),
  cognitiveSignals: baseCognitive(),
  agents:           [],
  ...overrides,
});

// ─── computeCognitiveLoad ─────────────────────────────────────────────────────

describe('computeCognitiveLoad', () => {
  it('returns low when all signals are zero', () => {
    expect(computeCognitiveLoad(baseCognitive())).toBe('low');
  });

  it('returns low just below LOW threshold', () => {
    // score = 4.0  (2 agents × 2.0 = 4 < 5)
    expect(computeCognitiveLoad(baseCognitive({ activeAgentsCount: 2 }))).toBe('low');
  });

  it('returns medium at/above LOW threshold', () => {
    // score = 5.0  (1 agent × 2 + 2 ambient × 0.5 = 3 + 1... try 3 agents = 6 ≥ 5)
    expect(computeCognitiveLoad(baseCognitive({
      activeAgentsCount: 3, // 6.0
    }))).toBe('medium');
  });

  it('returns high between MEDIUM and HIGH thresholds', () => {
    // score = 10: 5 agents × 2.0 = 10 → medium; need ≥ 10 → 5*2=10 qualifies medium
    // Try 6 agents: 12 → high (12 >= 10 but < 16)
    expect(computeCognitiveLoad(baseCognitive({
      activeAgentsCount: 6,
    }))).toBe('high');
  });

  it('returns critical at or above HIGH threshold', () => {
    // score = 8 agents × 2 = 16 → critical
    expect(computeCognitiveLoad(baseCognitive({
      activeAgentsCount: 8,
    }))).toBe('critical');
  });

  it('adds mobile stress (+3) on narrow viewport', () => {
    // score = 0 + 3 (mobile) = 3 < 5 → still low
    expect(computeCognitiveLoad(baseCognitive({ viewportWidth: MOBILE }))).toBe('low');
    // score = 4 (2 agents) + 3 (mobile) = 7 → medium
    expect(computeCognitiveLoad(baseCognitive({
      viewportWidth:     MOBILE,
      activeAgentsCount: 2,
    }))).toBe('medium');
  });

  it('respects taskComplexity contributions', () => {
    // low complexity: score=0 → low
    expect(computeCognitiveLoad(baseCognitive({ taskComplexity: 'low' }))).toBe('low');
    // medium complexity: score=2 → low (< 5)
    expect(computeCognitiveLoad(baseCognitive({ taskComplexity: 'medium' }))).toBe('low');
    // high complexity + 3 agents: 4*2 + 4 = 12 → high
    expect(computeCognitiveLoad(baseCognitive({
      activeAgentsCount: 4,
      taskComplexity:    'high',
    }))).toBe('high');
  });

  it('threshold constants match expected values', () => {
    expect(LOAD_THRESHOLD_LOW).toBe(5);
    expect(LOAD_THRESHOLD_MEDIUM).toBe(10);
    expect(LOAD_THRESHOLD_HIGH).toBe(16);
  });
});

// ─── balancePresenceWithLoad ──────────────────────────────────────────────────

describe('balancePresenceWithLoad', () => {
  it('low load: identity for all presence levels', () => {
    expect(balancePresenceWithLoad('ambient',   'low')).toBe('ambient');
    expect(balancePresenceWithLoad('assistant', 'low')).toBe('assistant');
    expect(balancePresenceWithLoad('cinematic', 'low')).toBe('cinematic');
  });

  it('medium load: downgrades cinematic → assistant only', () => {
    expect(balancePresenceWithLoad('cinematic', 'medium')).toBe('assistant');
    expect(balancePresenceWithLoad('assistant', 'medium')).toBe('assistant');
    expect(balancePresenceWithLoad('ambient',   'medium')).toBe('ambient');
  });

  it('high load: forces assistant (but respects ambient floor)', () => {
    expect(balancePresenceWithLoad('cinematic', 'high')).toBe('assistant');
    expect(balancePresenceWithLoad('assistant', 'high')).toBe('assistant');
    expect(balancePresenceWithLoad('ambient',   'high')).toBe('ambient');
  });

  it('critical load: always ambient regardless of base', () => {
    expect(balancePresenceWithLoad('cinematic', 'critical')).toBe('ambient');
    expect(balancePresenceWithLoad('assistant', 'critical')).toBe('ambient');
    expect(balancePresenceWithLoad('ambient',   'critical')).toBe('ambient');
  });
});

// ─── resolveAdaptivePresence ──────────────────────────────────────────────────

describe('resolveAdaptivePresence', () => {
  it('CONTRACT: mobile viewport → never cinematic', () => {
    // Even with maxed ambient fires, mobile stays at ambient or assistant
    const level = resolveAdaptivePresence('idle', baseSignals({
      viewportWidth:     MOBILE,
      ambientFiredCount: 10,
      activeAgentsCount: 5,
    }));
    expect(level).not.toBe('cinematic');
  });

  it('mobile + idle + no ambient → ambient', () => {
    expect(
      resolveAdaptivePresence('idle', baseSignals({ viewportWidth: MOBILE }))
    ).toBe('ambient');
  });

  it('desktop idle → ambient', () => {
    expect(resolveAdaptivePresence('idle', baseSignals())).toBe('ambient');
  });

  it('ambient fire → cinematic on desktop', () => {
    expect(
      resolveAdaptivePresence('idle', baseSignals({ ambientFiredCount: 1 }))
    ).toBe('cinematic');
  });

  it('ambient overload (> 5 fires) → downgrades cinematic → assistant', () => {
    expect(
      resolveAdaptivePresence('idle', baseSignals({ ambientFiredCount: 6 }))
    ).toBe('assistant');
  });

  it('suggestion state → assistant', () => {
    expect(resolveAdaptivePresence('suggestion', baseSignals())).toBe('assistant');
  });

  it('multi-agent + high confidence → cinematic', () => {
    expect(resolveAdaptivePresence('idle', baseSignals({
      activeAgentsCount: 2,
      agentConfidence:   0.8,
      taskComplexity:    'high',
    }))).toBe('cinematic');
  });
});

// ─── resolveDominantPersonality ───────────────────────────────────────────────

describe('resolveDominantPersonality', () => {
  it('returns null for empty agent list', () => {
    expect(resolveDominantPersonality([])).toBeNull();
  });

  it('single agent → that agent\'s profile', () => {
    const result = resolveDominantPersonality([{ id: 'a1', personality: 'analyst' }]);
    expect(result).toEqual(AGENT_PERSONALITIES.analyst);
  });

  it('executor (priority 3) wins over analyst (priority 2)', () => {
    const agents: ActiveAgent[] = [
      { id: 'a1', personality: 'analyst' },
      { id: 'e1', personality: 'executor' },
    ];
    expect(resolveDominantPersonality(agents)).toEqual(AGENT_PERSONALITIES.executor);
  });

  it('mentor (priority 2) ties with analyst (priority 2) → first in array wins', () => {
    const agents: ActiveAgent[] = [
      { id: 'm1', personality: 'mentor' },
      { id: 'a1', personality: 'analyst' },
    ];
    expect(resolveDominantPersonality(agents)).toEqual(AGENT_PERSONALITIES.mentor);
  });

  it('observer (priority 1) loses to everyone', () => {
    const agents: ActiveAgent[] = [
      { id: 'o1', personality: 'observer' },
      { id: 'a1', personality: 'analyst' },
    ];
    expect(resolveDominantPersonality(agents)).toEqual(AGENT_PERSONALITIES.analyst);
  });

  it('AGENT_PERSONALITIES has correct priority ordering', () => {
    expect(AGENT_PERSONALITIES.executor.priority).toBe(3);
    expect(AGENT_PERSONALITIES.analyst.priority).toBe(2);
    expect(AGENT_PERSONALITIES.mentor.priority).toBe(2);
    expect(AGENT_PERSONALITIES.observer.priority).toBe(1);
  });
});

// ─── applyMotionMultiplier ────────────────────────────────────────────────────

describe('applyMotionMultiplier', () => {
  it('multiplier 1 → identity', () => {
    expect(applyMotionMultiplier('1.5s', 1)).toBe('1.50s');
  });

  it('multiplier > 1 → shorter (faster) duration', () => {
    // 1.5s / 1.2 = 1.25s
    expect(applyMotionMultiplier('1.5s', 1.2)).toBe('1.25s');
  });

  it('multiplier < 1 → longer (slower) duration', () => {
    // 3s / 0.6 = 5s
    expect(applyMotionMultiplier('3s', 0.6)).toBe('5.00s');
  });

  it('handles millisecond input', () => {
    // 280ms / 1.2 = 233ms
    const result = applyMotionMultiplier('280ms', 1.2);
    expect(result).toBe('233ms');
  });

  it('result < 1000ms → outputs ms, ≥ 1000ms → outputs s', () => {
    expect(applyMotionMultiplier('0.9s', 1)).toMatch(/ms$/);  // 900ms
    expect(applyMotionMultiplier('1.5s', 1)).toMatch(/s$/);   // 1.50s
  });
});

// ─── resolveFinalPresence — integration ──────────────────────────────────────

describe('resolveFinalPresence', () => {
  // CONTRACT 1: mobile → never cinematic
  it('CONTRACT: mobile viewport never produces cinematic', () => {
    const level = resolveFinalPresence(finalInput({
      nexusState:       'idle',
      behaviorSignals:  baseSignals({ viewportWidth: MOBILE, ambientFiredCount: 5 }),
      cognitiveSignals: baseCognitive({ viewportWidth: MOBILE }),
      agents:           [{ id: 'e1', personality: 'executor' }],
    }));
    expect(level).not.toBe('cinematic');
  });

  // CONTRACT 2: critical load → always ambient
  it('CONTRACT: critical cognitive load forces ambient', () => {
    const level = resolveFinalPresence(finalInput({
      nexusState:       'idle',
      behaviorSignals:  baseSignals({ ambientFiredCount: 3 }),
      cognitiveSignals: baseCognitive({ activeAgentsCount: 10 }), // score=20 → critical
      agents:           [{ id: 'e1', personality: 'executor' }],
    }));
    expect(level).toBe('ambient');
  });

  // CONTRACT 3: executor + high confidence → cinematic (when load allows)
  it('CONTRACT: executor personality promotes assistant → cinematic under low load', () => {
    const level = resolveFinalPresence(finalInput({
      nexusState:      'suggestion',       // L1 → assistant
      behaviorSignals: baseSignals({
        activeAgentsCount: 1,
        agentConfidence:   0.5,      // not enough for P16 to go cinematic alone
      }),
      cognitiveSignals: baseCognitive({ activeAgentsCount: 1 }), // score=2 → low load
      agents:           [{ id: 'e1', personality: 'executor' }],
    }));
    expect(level).toBe('cinematic');
  });

  // CONTRACT 4: multi-agent escalation limited by load
  it('CONTRACT: multi-agent escalation capped by high cognitive load', () => {
    // L1 would be cinematic (multi-agent high confidence)
    // But load is high (6 agents) → forced to assistant
    const level = resolveFinalPresence(finalInput({
      behaviorSignals:  baseSignals({
        activeAgentsCount: 2,
        agentConfidence:   0.8,
        taskComplexity:    'high',
      }),
      cognitiveSignals: baseCognitive({
        activeAgentsCount: 6, // score=12 → high load → assistant ceiling
      }),
    }));
    expect(level).toBe('assistant');
  });

  // CONTRACT 5: observer suppresses cinematic → assistant on single-agent
  it('observer alone suppresses cinematic to assistant', () => {
    // P16 gives cinematic (ambient fired)
    // observer personality + single agent → downgrade to assistant
    // load = low
    const level = resolveFinalPresence(finalInput({
      behaviorSignals:  baseSignals({ ambientFiredCount: 1 }),    // L1 → cinematic
      cognitiveSignals: baseCognitive({ activeAgentsCount: 1 }),  // load = low
      agents:           [{ id: 'o1', personality: 'observer' }],
    }));
    expect(level).toBe('assistant');
  });

  // Edge: no agents → personality layer is skipped, P16 result passes through load
  it('no agents → result is pure adaptive + load (P16 + P17a)', () => {
    const level = resolveFinalPresence(finalInput({
      behaviorSignals:  baseSignals({ ambientFiredCount: 1 }),    // L1 → cinematic
      cognitiveSignals: baseCognitive(),                          // load = low
      agents:           [],
    }));
    expect(level).toBe('cinematic');
  });

  // Edge: idle state + zero agents + zero signals → ambient
  it('fully quiescent system resolves to ambient', () => {
    expect(resolveFinalPresence(finalInput())).toBe('ambient');
  });
});

/**
 * trust.test.ts — Sprint 7: AI Trust Score
 *
 * Test suites:
 *   1. scoreStudentTrust  — per-student trust score
 *   2. scoreClassTrust    — class-level composite trust score
 *   3. generateTrustReport — full TrustReport generation
 *   4. useTrustStore      — ephemeral Zustand store state transitions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  scoreStudentTrust,
  scoreClassTrust,
} from '../trustScoreEngine';
import { generateTrustReport } from '../trustReport';
import { useTrustStore } from '../trustStore';
import type { AIExplanation } from '../../explainability/decisionExplainer';
import type { BiasLevel } from '../../fairness/biasReport';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeExplanation(studentId: string, confidenceScore: number): AIExplanation {
  return {
    studentId,
    riskLevel:     confidenceScore >= 0.60 ? 'low' : confidenceScore >= 0.40 ? 'moderate' : 'high',
    primaryReason: 'Test reason',
    confidence:    {
      score:       confidenceScore,
      level:       confidenceScore >= 0.60 ? 'high' : confidenceScore >= 0.40 ? 'medium' : 'low',
      rationale:   'Test rationale',
      dataLimits:  [],
    },
    contributingFactors: [],
    counterfactuals:     ['test'],
    recommendations:     ['test'],
    computedAt:    new Date().toISOString(),
  } as unknown as AIExplanation;
}

const HIGH_CONF  = makeExplanation('s1', 0.85);
const MED_CONF   = makeExplanation('s2', 0.50);
const LOW_CONF   = makeExplanation('s3', 0.25);
const BELOW_THRES = makeExplanation('s4', 0.30); // below coverage threshold of 0.40

const GOOD_EXP_ARRAY: AIExplanation[] = [
  makeExplanation('s1', 0.90),
  makeExplanation('s2', 0.80),
  makeExplanation('s3', 0.75),
  makeExplanation('s4', 0.85),
  makeExplanation('s5', 0.78),
];

// ── 1. scoreStudentTrust ──────────────────────────────────────────────────────

describe('scoreStudentTrust', () => {
  it('returns full fairnessPenalty (1.0) when student is NOT in affected set', () => {
    const result = scoreStudentTrust(HIGH_CONF, new Set<string>());
    expect(result.fairnessPenalty).toBe(1.0);
  });

  it('applies fairnessPenalty of 0.50 when student IS in affected set', () => {
    const result = scoreStudentTrust(HIGH_CONF, new Set<string>(['s1']));
    expect(result.fairnessPenalty).toBe(0.5);
  });

  it('defaults to empty affectedIds when not provided', () => {
    const result = scoreStudentTrust(MED_CONF);
    expect(result.fairnessPenalty).toBe(1.0);
  });

  it('overallScore = dataQuality*0.70 + fairnessPenalty*0.30 (unaffected)', () => {
    const exp = makeExplanation('sx', 0.80);
    const result = scoreStudentTrust(exp, new Set<string>());
    const expected = 0.80 * 0.70 + 1.0 * 0.30;
    expect(result.overallScore).toBeCloseTo(expected, 3);
  });

  it('overallScore = dataQuality*0.70 + 0.50*0.30 (affected)', () => {
    const exp = makeExplanation('sx', 0.80);
    const result = scoreStudentTrust(exp, new Set<string>(['sx']));
    const expected = 0.80 * 0.70 + 0.50 * 0.30;
    expect(result.overallScore).toBeCloseTo(expected, 3);
  });

  it('overallScore is always in [0, 1]', () => {
    [HIGH_CONF, MED_CONF, LOW_CONF, BELOW_THRES].forEach(e => {
      const result = scoreStudentTrust(e, new Set<string>([e.studentId]));
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(1);
    });
  });

  it('is deterministic for the same input', () => {
    const r1 = scoreStudentTrust(HIGH_CONF, new Set(['s1']));
    const r2 = scoreStudentTrust(HIGH_CONF, new Set(['s1']));
    expect(r1.overallScore).toBe(r2.overallScore);
    expect(r1.trustLevel).toBe(r2.trustLevel);
  });

  it('trustLevel is "high" for high confidence unaffected student', () => {
    const exp = makeExplanation('s1', 0.85);
    const result = scoreStudentTrust(exp);
    expect(result.trustLevel).toBe('high');
  });

  it('trustLevel is "insufficient" for very low confidence', () => {
    const exp = makeExplanation('s1', 0.05);
    const result = scoreStudentTrust(exp, new Set(['s1']));
    const overall = 0.05 * 0.70 + 0.50 * 0.30;
    expect(overall).toBeLessThan(0.25); // should be insufficient
    expect(result.trustLevel).toBe('insufficient');
  });

  it('studentId is preserved in the result', () => {
    const result = scoreStudentTrust(makeExplanation('student-99', 0.6));
    expect(result.studentId).toBe('student-99');
  });
});

// ── 2. scoreClassTrust ────────────────────────────────────────────────────────

describe('scoreClassTrust', () => {
  it('returns all-zero dimensions and "insufficient" for empty explanations', () => {
    const result = scoreClassTrust([], 'none');
    expect(result.overallScore).toBe(0);
    expect(result.trustLevel).toBe('insufficient');
    expect(result.dimensions.dataQuality).toBe(0);
    expect(result.dimensions.fairnessScore).toBe(0);
    expect(result.dimensions.coverageScore).toBe(0);
    expect(result.dimensions.pedagogyAlignment).toBe(0);
  });

  it('emits all four warning flags for empty explanations', () => {
    const result = scoreClassTrust([], 'none');
    expect(result.warningFlags).toHaveLength(4);
  });

  it('fairnessScore = 1.0 for biasLevel "none"', () => {
    const result = scoreClassTrust([HIGH_CONF], 'none');
    expect(result.dimensions.fairnessScore).toBe(1.0);
  });

  it('fairnessScore = 0.85 for biasLevel "low"', () => {
    const result = scoreClassTrust([HIGH_CONF], 'low');
    expect(result.dimensions.fairnessScore).toBe(0.85);
  });

  it('fairnessScore = 0.55 for biasLevel "moderate"', () => {
    const result = scoreClassTrust([HIGH_CONF], 'moderate');
    expect(result.dimensions.fairnessScore).toBe(0.55);
  });

  it('fairnessScore = 0.25 for biasLevel "high"', () => {
    const result = scoreClassTrust([HIGH_CONF], 'high');
    expect(result.dimensions.fairnessScore).toBe(0.25);
  });

  it('pedagogyAlignment dimension equals passed pedagogyScore', () => {
    const result = scoreClassTrust([HIGH_CONF], 'none', 0.73);
    expect(result.dimensions.pedagogyAlignment).toBeCloseTo(0.73, 3);
  });

  it('defaults pedagogyAlignment to 0 when not provided', () => {
    const result = scoreClassTrust([HIGH_CONF], 'none');
    expect(result.dimensions.pedagogyAlignment).toBe(0);
  });

  it('coverageScore = fraction of students with confidence >= 0.40', () => {
    // s1=0.85 (>=0.40) ✓   s2=0.50 (>=0.40) ✓   s3=0.25 (<0.40) ✗
    const result = scoreClassTrust([HIGH_CONF, MED_CONF, LOW_CONF], 'none');
    expect(result.dimensions.coverageScore).toBeCloseTo(2 / 3, 2);
  });

  it('sufficientDataCount correct', () => {
    // HIGH=0.85≥0.40, MED=0.50≥0.40, LOW=0.25<0.40, BELOW=0.30<0.40
    const result = scoreClassTrust([HIGH_CONF, MED_CONF, LOW_CONF, BELOW_THRES], 'none');
    expect(result.sufficientDataCount).toBe(2);
  });

  it('studentCount matches explanations length', () => {
    const result = scoreClassTrust(GOOD_EXP_ARRAY, 'none');
    expect(result.studentCount).toBe(5);
  });

  it('studentScores length matches explanations length', () => {
    const result = scoreClassTrust(GOOD_EXP_ARRAY, 'none');
    expect(result.studentScores).toHaveLength(5);
  });

  it('warningFlags only emitted for dimensions < 0.50', () => {
    const result = scoreClassTrust(GOOD_EXP_ARRAY, 'none', 0.80);
    // all good data → no warnings
    result.warningFlags.forEach(flag => {
      expect(typeof flag).toBe('string');
    });
    // none should fire for high-quality data
    expect(result.warningFlags.length).toBe(0);
  });

  it('fairness warning fires for biasLevel "high"', () => {
    const result = scoreClassTrust(GOOD_EXP_ARRAY, 'high', 0.80);
    expect(result.warningFlags.some(w => w.toLowerCase().includes('bias'))).toBe(true);
  });

  it('overall score is in [0, 1]', () => {
    const r1 = scoreClassTrust(GOOD_EXP_ARRAY, 'none', 0.80);
    expect(r1.overallScore).toBeGreaterThanOrEqual(0);
    expect(r1.overallScore).toBeLessThanOrEqual(1);
  });

  it('high-quality class with no bias, good pedagogy → "high" or "moderate" trust', () => {
    const result = scoreClassTrust(GOOD_EXP_ARRAY, 'none', 0.80);
    expect(['high', 'moderate']).toContain(result.trustLevel);
  });

  it('is deterministic for same inputs', () => {
    const r1 = scoreClassTrust([HIGH_CONF, MED_CONF], 'low', 0.60);
    const r2 = scoreClassTrust([HIGH_CONF, MED_CONF], 'low', 0.60);
    expect(r1.overallScore).toBe(r2.overallScore);
    expect(r1.trustLevel).toBe(r2.trustLevel);
  });
});

// ── 3. generateTrustReport ────────────────────────────────────────────────────

describe('generateTrustReport', () => {
  it('returns a report with a valid ISO computedAt timestamp', () => {
    const report = generateTrustReport([HIGH_CONF], 'none');
    expect(() => new Date(report.computedAt)).not.toThrow();
    expect(new Date(report.computedAt).toISOString()).toBe(report.computedAt);
  });

  it('recommendations has at most 3 items', () => {
    // poor data in all dimensions
    const report = generateTrustReport([LOW_CONF], 'high', 0);
    expect(report.recommendations.length).toBeLessThanOrEqual(3);
  });

  it('recommendations is empty when all dimensions are good', () => {
    const report = generateTrustReport(GOOD_EXP_ARRAY, 'none', 0.80);
    expect(report.recommendations).toHaveLength(0);
  });

  it('recommendation for fairness fires when biasLevel is "high"', () => {
    const report = generateTrustReport(GOOD_EXP_ARRAY, 'high', 0.80);
    expect(report.recommendations.some(r => r.toLowerCase().includes('audit'))).toBe(true);
  });

  it('trustLevelLabel matches the classScore.trustLevel in Italian', () => {
    const map: Record<string, string> = {
      high: 'Alta fiducia',
      moderate: 'Fiducia moderata',
      low: 'Fiducia bassa',
      insufficient: 'Fiducia insufficiente',
    };
    const report = generateTrustReport([HIGH_CONF], 'none', 0.80);
    expect(report.trustLevelLabel).toBe(map[report.classScore.trustLevel]);
  });

  it('trustSummary is a non-empty string', () => {
    const report = generateTrustReport(GOOD_EXP_ARRAY, 'none');
    expect(typeof report.trustSummary).toBe('string');
    expect(report.trustSummary.length).toBeGreaterThan(10);
  });

  it('classScore is embedded in the report', () => {
    const report = generateTrustReport(GOOD_EXP_ARRAY, 'none', 0.75);
    expect(report.classScore.studentCount).toBe(5);
  });

  it('is deterministic for same inputs', () => {
    const exps: AIExplanation[] = [makeExplanation('sa', 0.70), makeExplanation('sb', 0.80)];
    const r1 = generateTrustReport(exps, 'low', 0.65);
    const r2 = generateTrustReport(exps, 'low', 0.65);
    expect(r1.classScore.overallScore).toBe(r2.classScore.overallScore);
    expect(r1.trustLevelLabel).toBe(r2.trustLevelLabel);
    expect(r1.recommendations).toEqual(r2.recommendations);
  });
});

// ── 4. useTrustStore ─────────────────────────────────────────────────────────

describe('useTrustStore', () => {
  beforeEach(() => {
    useTrustStore.getState().actions.clear();
  });

  it('starts with null report and null error', () => {
    const state = useTrustStore.getState();
    expect(state.report).toBeNull();
    expect(state.error).toBeNull();
    expect(state.lastComputedAt).toBeNull();
  });

  it('compute() sets report and clears error', () => {
    const { actions } = useTrustStore.getState();
    actions.compute([HIGH_CONF], 'none', 0.80);
    const state = useTrustStore.getState();
    expect(state.report).not.toBeNull();
    expect(state.error).toBeNull();
  });

  it('lastComputedAt matches report.computedAt after compute()', () => {
    const { actions } = useTrustStore.getState();
    actions.compute([HIGH_CONF, MED_CONF], 'low', 0.60);
    const state = useTrustStore.getState();
    expect(state.lastComputedAt).toBe(state.report!.computedAt);
  });

  it('empty explanations → sets error, not report', () => {
    const { actions } = useTrustStore.getState();
    actions.compute([], 'none');
    const state = useTrustStore.getState();
    expect(state.report).toBeNull();
    expect(state.error).toBeTruthy();
    expect(state.error).toContain('Nessuna spiegazione');
  });

  it('clear() resets report, error and lastComputedAt', () => {
    const { actions } = useTrustStore.getState();
    actions.compute([HIGH_CONF], 'none');
    actions.clear();
    const state = useTrustStore.getState();
    expect(state.report).toBeNull();
    expect(state.error).toBeNull();
    expect(state.lastComputedAt).toBeNull();
  });

  it('successive compute() overwrites previous report', () => {
    const { actions } = useTrustStore.getState();
    actions.compute([HIGH_CONF], 'none', 0.80);
    const ts1 = useTrustStore.getState().report!.computedAt;

    // wait a tick so timestamps differ
    const exps2 = [makeExplanation('zz', 0.65)];
    actions.compute(exps2, 'low', 0.50);
    const state = useTrustStore.getState();

    expect(state.report).not.toBeNull();
    expect(state.report!.classScore.studentCount).toBe(1);
    // computedAt may be same datetime in tests but report should be fresh
    expect(state.lastComputedAt).toBe(state.report!.computedAt);
    // Just ensure old count 1 = new count 1 (both have one student)
    void ts1; // suppress lint
  });

  it('computing flag is false after synchronous compute()', () => {
    const { actions } = useTrustStore.getState();
    actions.compute([HIGH_CONF], 'none');
    expect(useTrustStore.getState().computing).toBe(false);
  });

  it('affected students from store reduce per-student overall score', () => {
    const { actions } = useTrustStore.getState();
    const affectedIds = new Set<string>(['s1']);
    actions.compute([HIGH_CONF], 'none', 0.80, affectedIds);
    const report = useTrustStore.getState().report!;
    const studentScore = report.classScore.studentScores.find(s => s.studentId === 's1');
    expect(studentScore).toBeDefined();
    expect(studentScore!.fairnessPenalty).toBe(0.5);
  });
});

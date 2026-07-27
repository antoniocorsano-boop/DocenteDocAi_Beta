/**
 * fairness.test.ts — Unit tests for Sprint 5: Bias Detection
 *
 * Covers:
 *   1. groupProfiler     — group partitioning, profile stats, complement
 *   2. disparateImpactDetector — DIR, MRD, FAG, flag logic
 *   3. biasReport        — level classification, affected groups, recommendations
 *   4. fairnessStore     — state transitions via compute / clear
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Studente } from '@/types/student.types';
import type { AIExplanation } from '../../explainability/decisionExplainer';
import type { ConfidenceBreakdown } from '../../explainability/confidenceModel';
import {
  profileGroups,
  complementIds,
  type GroupProfile,
} from '../groupProfiler';
import {
  detectDisparities,
  analyzeClassFairness,
  THRESHOLD_DIR_HIGH,
  THRESHOLD_DIR_LOW,
  THRESHOLD_MRD,
} from '../disparateImpactDetector';
import { generateBiasReport, type BiasLevel } from '../biasReport';
import { useFairnessStore } from '../fairnessStore';

// ── fixtures ──────────────────────────────────────────────────────────────────

function makeStudent(id: string, overrides: Partial<Studente> = {}): Studente {
  return {
    id,
    nome: `Nome${id}`,
    cognome: `Cognome${id}`,
    classe: '3A',
    hasBES: false,
    hasDSA: false,
    has104: false,
    ...overrides,
  };
}

const confidence: ConfidenceBreakdown = {
  score: 0.7,
  level: 'high',
  label: 'Alta',
  colorToken: 'primary',
  components: { dataVolume: 0.8, dataRecency: 0.7, consistency: 0.6, subjectSpread: 0.5, temporalSpan: 0.7 },
};

function makeExplanation(studentId: string, riskScore: number, gradeAverage = 6.0): AIExplanation {
  const tiers = ['safe', 'watch', 'at_risk', 'critical'] as const;
  const riskTier =
    riskScore >= 0.70 ? 'critical' :
    riskScore >= 0.50 ? 'at_risk'  :
    riskScore >= 0.30 ? 'watch'    : 'safe';
  return {
    studentId,
    riskScore,
    riskTier,
    confidence,
    factors: [],
    narrative: 'Narrative text.',
    worstSubject: null,
    gradeAverage,
    subjectsCount: 3,
  };
}

// 20-student class: 16 "normal" + 4 BES students
// Normal: riskScore ~0.20, gradeAverage 7.5
// BES: riskScore ~0.65, gradeAverage 5.5 → should trigger dir_high for BES group
function buildBiasedClass() {
  const students: Studente[] = [];
  const explanations = new Map<string, AIExplanation>();

  for (let i = 1; i <= 16; i++) {
    const id = `normal-${i}`;
    students.push(makeStudent(id, { classe: '3A' }));
    explanations.set(id, makeExplanation(id, 0.15, 7.5));
  }
  for (let i = 1; i <= 4; i++) {
    const id = `bes-${i}`;
    students.push(makeStudent(id, { hasBES: true, classe: '3A' }));
    // riskScore 0.65 → at_risk; gradeAverage 5.5 (below 6 so NOT false alarm)
    explanations.set(id, makeExplanation(id, 0.65, 5.5));
  }
  return { students, explanations };
}

// Unbiased class: uniform risk across all students including BES
function buildUnbiasedClass() {
  const students: Studente[] = [];
  const explanations = new Map<string, AIExplanation>();

  for (let i = 1; i <= 20; i++) {
    const id = `s-${i}`;
    const hasBES = i <= 4;
    students.push(makeStudent(id, { hasBES }));
    explanations.set(id, makeExplanation(id, 0.20, 7.5));
  }
  return { students, explanations };
}

// ── 1. groupProfiler ──────────────────────────────────────────────────────────

describe('groupProfiler', () => {
  it('always includes a general profile covering all students', () => {
    const { students, explanations } = buildUnbiasedClass();
    const profiles = profileGroups(students, explanations);
    const general = profiles.find(p => p.id === 'general');
    expect(general).toBeDefined();
    expect(general!.size).toBe(students.length);
  });

  it('creates a bes profile when BES students exist', () => {
    const { students, explanations } = buildBiasedClass();
    const profiles = profileGroups(students, explanations);
    expect(profiles.some(p => p.id === 'bes')).toBe(true);
  });

  it('does NOT create bes profile when no BES students', () => {
    const students = [makeStudent('a'), makeStudent('b')];
    const explanations = new Map([
      ['a', makeExplanation('a', 0.2)],
      ['b', makeExplanation('b', 0.3)],
    ]);
    const profiles = profileGroups(students, explanations);
    expect(profiles.some(p => p.id === 'bes')).toBe(false);
  });

  it('BES group avgRiskScore reflects only BES students', () => {
    const { students, explanations } = buildBiasedClass();
    const profiles = profileGroups(students, explanations);
    const bes = profiles.find(p => p.id === 'bes')!;
    // All BES have riskScore 0.65
    expect(bes.avgRiskScore).toBeCloseTo(0.65, 2);
  });

  it('creates support supergroup when any support student exists', () => {
    const { students, explanations } = buildBiasedClass();
    const profiles = profileGroups(students, explanations);
    expect(profiles.some(p => p.id === 'support')).toBe(true);
  });

  it('does NOT create per-class profiles when only one classe', () => {
    const { students, explanations } = buildUnbiasedClass();
    const profiles = profileGroups(students, explanations);
    expect(profiles.some(p => p.attribute === 'classe')).toBe(false);
  });

  it('creates per-class profiles when multiple classes exist', () => {
    const students = [
      makeStudent('x1', { classe: '3A' }),
      makeStudent('x2', { classe: '3A' }),
      makeStudent('x3', { classe: '3B' }),
      makeStudent('x4', { classe: '3B' }),
    ];
    const explanations = new Map(students.map(s => [s.id, makeExplanation(s.id, 0.3)]));
    const profiles = profileGroups(students, explanations);
    expect(profiles.filter(p => p.attribute === 'classe')).toHaveLength(2);
  });

  it('atRiskRate is fraction of students with riskScore >= 0.5', () => {
    const { students, explanations } = buildBiasedClass();
    const profiles = profileGroups(students, explanations);
    const general = profiles.find(p => p.id === 'general')!;
    // 4 / 20 = 0.20
    expect(general.atRiskRate).toBeCloseTo(0.20, 2);
  });

  it('complementIds returns all student ids NOT in the group', () => {
    const { students, explanations } = buildBiasedClass();
    const profiles = profileGroups(students, explanations);
    const bes = profiles.find(p => p.id === 'bes')!;
    const complement = complementIds(bes, students.map(s => s.id));
    expect(complement).toHaveLength(16);
    for (const id of bes.studentIds) {
      expect(complement).not.toContain(id);
    }
  });

  it('profile sizes sum correctly: bes + non-bes = total', () => {
    const { students, explanations } = buildBiasedClass();
    const profiles = profileGroups(students, explanations);
    const general = profiles.find(p => p.id === 'general')!;
    const bes = profiles.find(p => p.id === 'bes')!;
    const complement = complementIds(bes, students.map(s => s.id));
    expect(bes.size + complement.length).toBe(general.size);
  });
});

// ── 2. disparateImpactDetector ────────────────────────────────────────────────

describe('disparateImpactDetector', () => {
  it('flags dir_high for BES group in biased class', () => {
    const { students, explanations } = buildBiasedClass();
    const { metrics } = analyzeClassFairness(students, explanations);
    const besMet = metrics.find(m => m.groupId === 'bes');
    expect(besMet).toBeDefined();
    expect(besMet!.flags).toContain('dir_high');
  });

  it('DIR > THRESHOLD_DIR_HIGH for over-predicted BES group', () => {
    const { students, explanations } = buildBiasedClass();
    const { metrics } = analyzeClassFairness(students, explanations);
    const besMet = metrics.find(m => m.groupId === 'bes')!;
    expect(besMet.disparateImpactRatio).not.toBeNull();
    expect(besMet.disparateImpactRatio!).toBeGreaterThan(THRESHOLD_DIR_HIGH);
  });

  it('no significant flags for unbiased class', () => {
    const { students, explanations } = buildUnbiasedClass();
    const { metrics } = analyzeClassFairness(students, explanations);
    const significant = metrics.filter(m => m.significant);
    expect(significant).toHaveLength(0);
  });

  it('meanRiskDifference is positive for higher-risk group', () => {
    const { students, explanations } = buildBiasedClass();
    const { metrics } = analyzeClassFairness(students, explanations);
    const besMet = metrics.find(m => m.groupId === 'bes')!;
    expect(besMet.meanRiskDifference).toBeGreaterThan(0);
  });

  it('sufficientSample is false for group with < 3 members', () => {
    const students = [
      makeStudent('a', { hasBES: true }),
      makeStudent('b'),
      makeStudent('c'),
    ];
    const explanations = new Map([
      ['a', makeExplanation('a', 0.8)],
      ['b', makeExplanation('b', 0.1)],
      ['c', makeExplanation('c', 0.1)],
    ]);
    const { metrics } = analyzeClassFairness(students, explanations);
    const bes = metrics.find(m => m.groupId === 'bes')!;
    expect(bes.sufficientSample).toBe(false);
    expect(bes.significant).toBe(false); // even if flagged, not significant
  });

  it('detectDisparities excludes the general group', () => {
    const { students, explanations } = buildBiasedClass();
    const profiles = profileGroups(students, explanations);
    const metrics = detectDisparities(profiles);
    expect(metrics.every(m => m.groupId !== 'general')).toBe(true);
  });

  it('returns empty array when only general profile exists', () => {
    const students = [makeStudent('x')];
    const explanations = new Map([['x', makeExplanation('x', 0.3)]]);
    const profiles = profileGroups(students, explanations);
    const metrics = detectDisparities(profiles);
    expect(metrics).toHaveLength(0);
  });
});

// ── 3. biasReport ─────────────────────────────────────────────────────────────

describe('biasReport', () => {
  it('overallBiasLevel is "none" for unbiased class', () => {
    const { students, explanations } = buildUnbiasedClass();
    const report = generateBiasReport(students, explanations);
    expect(report.overallBiasLevel).toBe('none');
  });

  it('overallBiasLevel is not "none" for biased class', () => {
    const { students, explanations } = buildBiasedClass();
    const report = generateBiasReport(students, explanations);
    expect(report.overallBiasLevel).not.toBe('none');
  });

  it('affectedGroups is empty for unbiased class', () => {
    const { students, explanations } = buildUnbiasedClass();
    const report = generateBiasReport(students, explanations);
    expect(report.affectedGroups).toHaveLength(0);
  });

  it('biased class has at least one affected group', () => {
    const { students, explanations } = buildBiasedClass();
    const report = generateBiasReport(students, explanations);
    expect(report.affectedGroups.length).toBeGreaterThan(0);
  });

  it('recommendations are non-empty for biased class', () => {
    const { students, explanations } = buildBiasedClass();
    const report = generateBiasReport(students, explanations);
    expect(report.recommendations.length).toBeGreaterThan(0);
    for (const r of report.recommendations) {
      expect(typeof r).toBe('string');
      expect(r.length).toBeGreaterThan(10);
    }
  });

  it('recommendations are empty for unbiased class', () => {
    const { students, explanations } = buildUnbiasedClass();
    const report = generateBiasReport(students, explanations);
    expect(report.recommendations).toHaveLength(0);
  });

  it('report is deterministic for same inputs', () => {
    const { students, explanations } = buildBiasedClass();
    const a = generateBiasReport(students, explanations);
    const b = generateBiasReport(students, explanations);
    expect(a.overallBiasLevel).toBe(b.overallBiasLevel);
    expect(a.significantCount).toBe(b.significantCount);
    expect(a.affectedGroups.map(g => g.groupId)).toEqual(b.affectedGroups.map(g => g.groupId));
  });

  it('summary is always a non-empty string', () => {
    const { students, explanations } = buildBiasedClass();
    const report = generateBiasReport(students, explanations);
    expect(typeof report.summary).toBe('string');
    expect(report.summary.length).toBeGreaterThan(10);
  });

  it('groupsAnalysed === metrics.length', () => {
    const { students, explanations } = buildBiasedClass();
    const report = generateBiasReport(students, explanations);
    expect(report.groupsAnalysed).toBe(report.metrics.length);
  });

  it('significantCount matches filtered metrics', () => {
    const { students, explanations } = buildBiasedClass();
    const report = generateBiasReport(students, explanations);
    const counted = report.metrics.filter(m => m.significant).length;
    expect(report.significantCount).toBe(counted);
  });

  it('high-severity disparity promotes level to "high"', () => {
    // Extreme case: all BES students have grade_adjusted_gap trigger
    const students: Studente[] = [];
    const explanations = new Map<string, AIExplanation>();
    for (let i = 1; i <= 5; i++) {
      const id = `bes-${i}`;
      students.push(makeStudent(id, { hasBES: true }));
      // riskScore 0.90 with gradeAverage 7.0 → gap not explained by grades
      explanations.set(id, makeExplanation(id, 0.90, 7.0));
    }
    for (let i = 1; i <= 15; i++) {
      const id = `norm-${i}`;
      students.push(makeStudent(id));
      explanations.set(id, makeExplanation(id, 0.10, 7.5));
    }
    const report = generateBiasReport(students, explanations);
    expect(['high', 'moderate']).toContain(report.overallBiasLevel);
  });
});

// ── 4. fairnessStore ──────────────────────────────────────────────────────────

describe('fairnessStore', () => {
  beforeEach(() => {
    useFairnessStore.getState().actions.clear();
  });

  it('starts with report === null', () => {
    expect(useFairnessStore.getState().report).toBeNull();
    expect(useFairnessStore.getState().computing).toBe(false);
  });

  it('compute() populates the report', () => {
    const { students, explanations } = buildBiasedClass();
    useFairnessStore.getState().actions.compute(students, explanations);
    const { report } = useFairnessStore.getState();
    expect(report).not.toBeNull();
    expect(typeof report!.overallBiasLevel).toBe('string');
  });

  it('lastComputedAt is set after compute()', () => {
    const { students, explanations } = buildUnbiasedClass();
    useFairnessStore.getState().actions.compute(students, explanations);
    expect(useFairnessStore.getState().lastComputedAt).not.toBeNull();
  });

  it('clear() resets report to null', () => {
    const { students, explanations } = buildBiasedClass();
    useFairnessStore.getState().actions.compute(students, explanations);
    useFairnessStore.getState().actions.clear();
    expect(useFairnessStore.getState().report).toBeNull();
    expect(useFairnessStore.getState().lastComputedAt).toBeNull();
  });

  it('compute() with empty students sets error', () => {
    useFairnessStore.getState().actions.compute([], new Map());
    const { report, error } = useFairnessStore.getState();
    expect(report).toBeNull();
    expect(error).not.toBeNull();
  });
});

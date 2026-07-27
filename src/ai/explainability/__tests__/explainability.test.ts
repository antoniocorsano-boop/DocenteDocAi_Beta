/**
 * explainability.test.ts — Unit tests for Sprint 4: Explainable AI
 *
 * Covers:
 *   1. riskFactorAnalyzer — factor detection, ordering, output ranges
 *   2. confidenceModel    — component scores, level mapping, batch
 *   3. decisionExplainer  — full explanation shape, narrative, tier logic
 *   4. explainClass       — batch explanation, map keying, consistency
 */

import { describe, it, expect } from 'vitest';
import type { Studente, Valutazione } from '@/types/student.types';
import {
  analyzeStudentRiskFactors,
  analyzeClassRiskFactors,
} from '../riskFactorAnalyzer';
import {
  computeConfidence,
  computeClassConfidence,
} from '../confidenceModel';
import {
  explainStudent,
  explainClass,
} from '../decisionExplainer';

// ── fixtures ──────────────────────────────────────────────────────────────────

function makeStudent(overrides: Partial<Studente> = {}): Studente {
  return {
    id: 'student-1',
    nome: 'Mario',
    cognome: 'Rossi',
    classe: '3A',
    hasBES: false,
    hasDSA: false,
    has104: false,
    ...overrides,
  };
}

function makeEval(
  studenteId: string,
  voto: string,
  daysAgo: number,
  materia = 'Matematica',
): Valutazione {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    id: `eval-${studenteId}-${daysAgo}`,
    studenteId,
    materia,
    data: d.toISOString().split('T')[0],
    tipo: 'Scritto',
    voto,
  };
}

// A clearly at-risk student: 5 low/declining grades
const atRiskStudent = makeStudent({ id: 'risk-1' });
const atRiskEvals: Valutazione[] = [
  makeEval('risk-1', '4', 60),
  makeEval('risk-1', '4.5', 50),
  makeEval('risk-1', '3.5', 40),
  makeEval('risk-1', '4', 30),
  makeEval('risk-1', '3', 20),
  makeEval('risk-1', '2.5', 10),
];

// A clearly safe student: 6 high/stable grades
const safeStudent = makeStudent({ id: 'safe-1' });
const safeEvals: Valutazione[] = [
  makeEval('safe-1', '8', 60),
  makeEval('safe-1', '8.5', 50),
  makeEval('safe-1', '9', 40),
  makeEval('safe-1', '8', 30),
  makeEval('safe-1', '9', 20),
  makeEval('safe-1', '9.5', 10),
];

// Student with no evaluations
const emptyStudent = makeStudent({ id: 'empty-1' });

// ── 1. riskFactorAnalyzer ──────────────────────────────────────────────────────

describe('riskFactorAnalyzer', () => {
  it('detects grade_below_sufficiency for at-risk student', () => {
    const result = analyzeStudentRiskFactors(atRiskStudent, atRiskEvals);
    expect(result.factors.some(f => f.id === 'grade_below_sufficiency')).toBe(true);
  });

  it('does NOT flag grade_below_sufficiency for safe student', () => {
    const result = analyzeStudentRiskFactors(safeStudent, safeEvals);
    expect(result.factors.some(f => f.id === 'grade_below_sufficiency')).toBe(false);
  });

  it('detects declining_trend for at-risk student', () => {
    const result = analyzeStudentRiskFactors(atRiskStudent, atRiskEvals);
    expect(result.factors.some(f => f.id === 'declining_trend')).toBe(true);
  });

  it('factors are sorted by descending impact', () => {
    const result = analyzeStudentRiskFactors(atRiskStudent, atRiskEvals);
    for (let i = 0; i < result.factors.length - 1; i++) {
      expect(result.factors[i].impact).toBeGreaterThanOrEqual(result.factors[i + 1].impact);
    }
  });

  it('totalImpact is clamped to [0, 1]', () => {
    for (const student of [atRiskStudent, safeStudent, emptyStudent]) {
      const r = analyzeStudentRiskFactors(student, [...atRiskEvals, ...safeEvals]);
      expect(r.totalImpact).toBeGreaterThanOrEqual(0);
      expect(r.totalImpact).toBeLessThanOrEqual(1);
    }
  });

  it('gradeAverage is within [0, 10]', () => {
    const r = analyzeStudentRiskFactors(atRiskStudent, atRiskEvals);
    expect(r.gradeAverage).toBeGreaterThanOrEqual(0);
    expect(r.gradeAverage).toBeLessThanOrEqual(10);
  });

  it('returns only few_evaluations factor and gradeAverage 0 for student with no evals', () => {
    const r = analyzeStudentRiskFactors(emptyStudent, []);
    // 0 evaluations < threshold of 3 → few_evaluations IS correctly flagged
    expect(r.factors).toHaveLength(1);
    expect(r.factors[0].id).toBe('few_evaluations');
    expect(r.gradeAverage).toBe(0);
    expect(r.worstSubject).toBeNull();
  });

  it('detects multi_subject_risk when > 1 subject is failing', () => {
    const evals = [
      makeEval('risk-1', '4', 50, 'Matematica'),
      makeEval('risk-1', '4', 40, 'Matematica'),
      makeEval('risk-1', '3.5', 30, 'Italiano'),
      makeEval('risk-1', '4', 20, 'Italiano'),
    ];
    const r = analyzeStudentRiskFactors(atRiskStudent, evals);
    expect(r.factors.some(f => f.id === 'multi_subject_risk')).toBe(true);
  });

  it('analyzeClassRiskFactors returns a map with one entry per student', () => {
    const students = [atRiskStudent, safeStudent];
    const evals = [...atRiskEvals, ...safeEvals];
    const map = analyzeClassRiskFactors(students, evals);
    expect(map.size).toBe(2);
    expect(map.has('risk-1')).toBe(true);
    expect(map.has('safe-1')).toBe(true);
  });

  it('special_needs_no_support_signal triggered for BES student with declining grades', () => {
    const besStudent = makeStudent({ id: 'bes-1', hasBES: true });
    const evals = [
      makeEval('bes-1', '5', 40),
      makeEval('bes-1', '4.5', 20),
      makeEval('bes-1', '4', 5),
    ];
    const r = analyzeStudentRiskFactors(besStudent, evals);
    expect(r.factors.some(f => f.id === 'special_needs_no_support_signal')).toBe(true);
  });
});

// ── 2. confidenceModel ────────────────────────────────────────────────────────

describe('confidenceModel', () => {
  it('score is in [0, 1] for any input', () => {
    for (const evals of [atRiskEvals, safeEvals, []]) {
      const { score } = computeConfidence(evals);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });

  it('returns level "insufficient" for no evaluations', () => {
    const { level } = computeConfidence([]);
    expect(level).toBe('insufficient');
  });

  it('returns level "very_high" or "high" for many recent, consistent evals', () => {
    // 10 consistent, recent grades
    const manyEvals = Array.from({ length: 10 }, (_, i) =>
      makeEval('s1', '8', i * 3),
    );
    const { level } = computeConfidence(manyEvals);
    expect(['very_high', 'high']).toContain(level);
  });

  it('all component scores are in [0, 1]', () => {
    const { components } = computeConfidence(atRiskEvals);
    for (const key of Object.keys(components) as (keyof typeof components)[]) {
      expect(components[key]).toBeGreaterThanOrEqual(0);
      expect(components[key]).toBeLessThanOrEqual(1);
    }
  });

  it('computeClassConfidence returns one entry per studentId', () => {
    const evals = [...atRiskEvals, ...safeEvals];
    const map = computeClassConfidence(['risk-1', 'safe-1'], evals);
    expect(map.size).toBe(2);
    expect(map.get('risk-1')).toBeDefined();
    expect(map.get('safe-1')).toBeDefined();
  });

  it('higher volume always increases confidence vs single eval', () => {
    const single = computeConfidence([makeEval('x', '7', 10)]);
    const many = computeConfidence(Array.from({ length: 8 }, (_, i) => makeEval('x', '7', i * 5)));
    expect(many.score).toBeGreaterThan(single.score);
  });
});

// ── 3. decisionExplainer — single student ────────────────────────────────────

describe('decisionExplainer.explainStudent', () => {
  it('returns correct riskTier for high riskProbability', () => {
    const exp = explainStudent(atRiskStudent, atRiskEvals, 0.80);
    expect(exp.riskTier).toBe('critical');
  });

  it('returns "safe" tier for low riskProbability', () => {
    const exp = explainStudent(safeStudent, safeEvals, 0.10);
    expect(exp.riskTier).toBe('safe');
  });

  it('returns "watch" tier for borderline probability', () => {
    const exp = explainStudent(makeStudent(), safeEvals, 0.35);
    expect(exp.riskTier).toBe('watch');
  });

  it('riskScore matches the input riskProbability', () => {
    const exp = explainStudent(atRiskStudent, atRiskEvals, 0.72);
    expect(exp.riskScore).toBe(0.72);
  });

  it('narrative is a non-empty string', () => {
    const exp = explainStudent(atRiskStudent, atRiskEvals, 0.80);
    expect(typeof exp.narrative).toBe('string');
    expect(exp.narrative.length).toBeGreaterThan(10);
  });

  it('studentId matches the input student', () => {
    const exp = explainStudent(atRiskStudent, atRiskEvals, 0.65);
    expect(exp.studentId).toBe(atRiskStudent.id);
  });

  it('factors and confidence are present', () => {
    const exp = explainStudent(atRiskStudent, atRiskEvals, 0.75);
    expect(Array.isArray(exp.factors)).toBe(true);
    expect(typeof exp.confidence.score).toBe('number');
    expect(exp.confidence.score).toBeGreaterThanOrEqual(0);
    expect(exp.confidence.score).toBeLessThanOrEqual(1);
  });
});

// ── 4. decisionExplainer — class batch ────────────────────────────────────────

describe('decisionExplainer.explainClass', () => {
  const students = [atRiskStudent, safeStudent];
  const evals = [...atRiskEvals, ...safeEvals];
  const riskPredictions = [
    { studentId: 'risk-1', riskProbability: 0.80, factors: [] },
    { studentId: 'safe-1', riskProbability: 0.10, factors: [] },
  ];

  it('returns a map with one entry per student', () => {
    const map = explainClass(students, evals, riskPredictions);
    expect(map.size).toBe(2);
  });

  it('each entry has riskTier consistent with riskScore', () => {
    const map = explainClass(students, evals, riskPredictions);
    expect(map.get('risk-1')?.riskTier).toBe('critical');
    expect(map.get('safe-1')?.riskTier).toBe('safe');
  });

  it('is deterministic: same inputs produce same output', () => {
    const a = explainClass(students, evals, riskPredictions);
    const b = explainClass(students, evals, riskPredictions);
    expect(a.get('risk-1')?.riskScore).toBe(b.get('risk-1')?.riskScore);
    expect(a.get('risk-1')?.narrative).toBe(b.get('risk-1')?.narrative);
    expect(a.get('risk-1')?.factors.length).toBe(b.get('risk-1')?.factors.length);
  });

  it('student missing from riskPredictions gets riskScore 0 and safe tier', () => {
    const map = explainClass([makeStudent({ id: 'unknown' })], [], []);
    const exp = map.get('unknown');
    expect(exp?.riskScore).toBe(0);
    expect(exp?.riskTier).toBe('safe');
  });
});

/**
 * recommendation.test.ts — Sprint 8: AI Decision Support
 *
 * Test suites:
 *   1. generateRecommendations — lesson recommender core engine
 *   2. generateActivity        — activity generator
 *   3. generateCurriculumRecommendations — curriculum advisor
 *   4. useRecommendationStore  — ephemeral Zustand store
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { PedagogyReport } from '../../pedagogy/pedagogyReport';
import type { TrustReport } from '../../trust/trustReport';
import type { BenchmarkMetrics } from '../../simulation/benchmarkMetrics';
import type { BloomDistribution } from '../../pedagogy/bloomsClassifier';
import type { Lezione } from '@/types/uda.types';
import { generateRecommendations, type Recommendation } from '../lessonRecommender';
import { generateActivity, targetBloomFromAction } from '../activityGenerator';
import { generateCurriculumRecommendations } from '../curriculumAdvisor';
import { useRecommendationStore } from '../recommendationStore';

// ── fixtures ──────────────────────────────────────────────────────────────────

function makeBloomDistribution(score: number): BloomDistribution {
  const zero = { remember: 0, understand: 0, apply: 0, analyze: 0, evaluate: 0, create: 0 };
  return {
    counts:             { ...zero },
    fractions:          { ...zero },
    maxLevel:           'remember',
    minLevel:           'remember',
    uniqueLevelsCount:  1,
    classifications:    [],
    meanCognitiveIndex: score * 6,
  };
}

function makePedagogyReport(overallScore: number): PedagogyReport {
  const dims = {
    bloomCoverage:        overallScore,
    cognitiveProgression: overallScore,
    activeLearningRatio:  overallScore,
    inclusionSignals:     overallScore,
    diversityOfMethods:   overallScore,
  };
  return {
    computedAt: new Date().toISOString(),
    overallScore,
    lessonScore: {
      entityId: 'l1',
      label: 'Lezione 1',
      overallScore,
      dimensions: dims,
      bloomDistribution: makeBloomDistribution(overallScore),
      weakDimensions: overallScore < 0.65 ? ['bloomCoverage'] : [],
      suggestions: overallScore < 0.65 ? ['Migliorare la copertura di Bloom'] : [],
    },
    udaScores:   [],
    strengths:   [],
    opportunities: overallScore < 0.65 ? ['Migliorare la progressione cognitiva'] : [],
  };
}

function makeTrustReport(overallScore: number, flags: string[] = []): TrustReport {
  const dims = {
    dataQuality:       overallScore,
    fairnessScore:     overallScore,
    coverageScore:     overallScore,
    pedagogyAlignment: overallScore,
  };
  return {
    computedAt:    new Date().toISOString(),
    trustSummary:  `Punteggio di fiducia: ${Math.round(overallScore * 100)}%`,
    trustLevelLabel: overallScore >= 0.75 ? 'Alta' : overallScore >= 0.50 ? 'Moderata' : 'Bassa',
    recommendations: overallScore < 0.60 ? ['Aggiungere più valutazioni'] : [],
    classScore: {
      overallScore,
      trustLevel:         overallScore >= 0.75 ? 'high' : overallScore >= 0.50 ? 'moderate' : 'low',
      dimensions:         dims,
      warningFlags:       flags,
      studentCount:       20,
      sufficientDataCount: Math.round(20 * overallScore),
      studentScores: [],
    },
  };
}

function makeBenchmarks(overrides: Partial<BenchmarkMetrics> = {}): BenchmarkMetrics {
  return {
    predictionConfidence: 0.75,
    riskDetectionRate:    0.80,
    falsePositiveRate:    0.10,
    executionTimeMs:      120,
    classHealthScore:     70,
    atRiskCount:          2,
    excellenceCount:      5,
    f1Score:              0.78,
    ...overrides,
  };
}

function makeLezione(id: string, overrides: Partial<Lezione> = {}): Lezione {
  return {
    id,
    classe:   '3A',
    materia:  'Matematica',
    contenuto: `Contenuto lezione ${id}`,
    svolta:    true,
    ...overrides,
  };
}

// ── 1. generateRecommendations ────────────────────────────────────────────────

describe('generateRecommendations', () => {
  it('returns empty array when all three inputs are empty', () => {
    const result = generateRecommendations([], [], []);
    expect(result).toEqual([]);
  });

  it('returns at least 1 recommendation when pedagogyScore is low', () => {
    const report = makePedagogyReport(0.40);
    const result = generateRecommendations([report], [], []);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('returns no recommendations when all pedagogy scores are above threshold', () => {
    const report = makePedagogyReport(0.90);
    const result = generateRecommendations([report], [], []);
    expect(result).toEqual([]);
  });

  it('generates trust recommendations for low trust score with warning flags', () => {
    const trust = makeTrustReport(0.30, ['Dati insufficienti per 8 studenti']);
    const result = generateRecommendations([], [trust], []);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some(r => r.source === 'trust')).toBe(true);
  });

  it('returns no trust recs when trust score is above threshold', () => {
    const trust = makeTrustReport(0.85);
    const result = generateRecommendations([], [trust], []);
    expect(result.filter(r => r.source === 'trust')).toHaveLength(0);
  });

  it('generates a simulation rec when F1 is below 0.70', () => {
    const bm = makeBenchmarks({ f1Score: 0.50 });
    const result = generateRecommendations([], [], [bm]);
    expect(result.some(r => r.source === 'simulation')).toBe(true);
  });

  it('generates a simulation rec when riskDetectionRate is below 0.70', () => {
    const bm = makeBenchmarks({ riskDetectionRate: 0.55 });
    const result = generateRecommendations([], [], [bm]);
    expect(result.some(r => r.source === 'simulation')).toBe(true);
  });

  it('generates an adjustContent rec when falsePositiveRate is above 0.20', () => {
    const bm = makeBenchmarks({ falsePositiveRate: 0.35 });
    const result = generateRecommendations([], [], [bm]);
    const fprRec = result.find(r => r.suggestedAction === 'adjustContent' && r.source === 'simulation');
    expect(fprRec).toBeDefined();
  });

  it('generates an addExercise rec when classHealthScore is below 50', () => {
    const bm = makeBenchmarks({ classHealthScore: 30 });
    const result = generateRecommendations([], [], [bm]);
    const healthRec = result.find(r => r.suggestedAction === 'addExercise' && r.source === 'simulation');
    expect(healthRec).toBeDefined();
  });

  it('sorts results descending by impactScore', () => {
    const report = makePedagogyReport(0.35);
    const trust  = makeTrustReport(0.25, ['flag1', 'flag2']);
    const bm     = makeBenchmarks({ f1Score: 0.40, riskDetectionRate: 0.40 });
    const result = generateRecommendations([report], [trust], [bm]);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].impactScore).toBeGreaterThanOrEqual(result[i].impactScore);
    }
  });

  it('all impactScores are in [0, 1]', () => {
    const report = makePedagogyReport(0.30);
    const trust  = makeTrustReport(0.20, ['flag']);
    const bm     = makeBenchmarks({ f1Score: 0.20, falsePositiveRate: 0.50, classHealthScore: 20 });
    const result = generateRecommendations([report], [trust], [bm]);
    for (const rec of result) {
      expect(rec.impactScore).toBeGreaterThanOrEqual(0);
      expect(rec.impactScore).toBeLessThanOrEqual(1);
    }
  });

  it('deduplicates recommendations sharing same source+action+title (keeps highest impact)', () => {
    // Two identical-score pedagogy reports produce the same dimension recommendation title
    const r1 = makePedagogyReport(0.35);
    const r2 = makePedagogyReport(0.40);
    const result = generateRecommendations([r1, r2], [], []);
    const titles = result.map(r => r.title);
    const unique  = new Set(titles.map(t => String(t)));
    // After dedup there should be no duplicate titles within the same source
    const entries = result.map(r => `${r.source}::${r.suggestedAction}::${r.title}`);
    const uniqueEntries = new Set(entries);
    expect(entries.length).toBe(uniqueEntries.size);
  });

  it('each recommendation has all required fields', () => {
    const result = generateRecommendations([makePedagogyReport(0.30)], [], []);
    for (const rec of result) {
      expect(rec.id).toBeTruthy();
      expect(rec.title).toBeTruthy();
      expect(rec.description).toBeTruthy();
      expect(['adjustContent', 'addExercise', 'reschedule', 'highlightRisk']).toContain(rec.suggestedAction);
      expect(['pedagogy', 'trust', 'simulation']).toContain(rec.source);
      expect(Array.isArray(rec.tags)).toBe(true);
    }
  });
});

// ── 2. generateActivity ───────────────────────────────────────────────────────

describe('generateActivity', () => {
  function makeRec(overrides: Partial<Recommendation> = {}): Recommendation {
    return {
      id:              'rec-test-1',
      title:           'Test recommendation',
      description:     'Test',
      impactScore:     0.60,
      suggestedAction: 'adjustContent',
      source:          'pedagogy',
      tags:            ['Test'],
      ...overrides,
    };
  }

  it('returns at least 1 activity for any recommendation', () => {
    const activities = generateActivity(makeRec());
    expect(activities.length).toBeGreaterThanOrEqual(1);
  });

  it('returns at most 3 activities', () => {
    const rec = makeRec({ impactScore: 0.99, suggestedAction: 'addExercise' });
    expect(generateActivity(rec).length).toBeLessThanOrEqual(3);
  });

  it('all activities have a valid targetBloomLevel', () => {
    const VALID: string[] = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
    const rec = makeRec({ impactScore: 0.80, suggestedAction: 'highlightRisk' });
    for (const act of generateActivity(rec)) {
      expect(VALID).toContain(act.targetBloomLevel);
    }
  });

  it('recommendationId matches the input recommendation id', () => {
    const rec = makeRec({ id: 'my-special-rec' });
    for (const act of generateActivity(rec)) {
      expect(act.recommendationId).toBe('my-special-rec');
    }
  });

  it('addExercise → first quiz activity targetBloomLevel is apply', () => {
    const rec = makeRec({ suggestedAction: 'addExercise', impactScore: 0.30 });
    const activities = generateActivity(rec);
    expect(activities[0].targetBloomLevel).toBe('apply');
  });

  it('adjustContent → first quiz activity targetBloomLevel is understand', () => {
    const rec = makeRec({ suggestedAction: 'adjustContent', impactScore: 0.30 });
    expect(generateActivity(rec)[0].targetBloomLevel).toBe('understand');
  });

  it('reschedule → first quiz activity targetBloomLevel is analyze', () => {
    const rec = makeRec({ suggestedAction: 'reschedule', impactScore: 0.30 });
    expect(generateActivity(rec)[0].targetBloomLevel).toBe('analyze');
  });

  it('highlightRisk → first quiz activity targetBloomLevel is evaluate', () => {
    const rec = makeRec({ suggestedAction: 'highlightRisk', impactScore: 0.30 });
    expect(generateActivity(rec)[0].targetBloomLevel).toBe('evaluate');
  });

  it('includes a whatif activity when impactScore >= 0.50', () => {
    const rec = makeRec({ impactScore: 0.75, suggestedAction: 'adjustContent' });
    const activities = generateActivity(rec);
    expect(activities.some(a => a.type === 'whatif')).toBe(true);
  });

  it('does NOT include a whatif activity when impactScore < 0.50', () => {
    const rec = makeRec({ impactScore: 0.40, suggestedAction: 'adjustContent' });
    const activities = generateActivity(rec);
    expect(activities.some(a => a.type === 'whatif')).toBe(false);
  });

  it('includes exercise activity when suggestedAction is addExercise', () => {
    const rec = makeRec({ suggestedAction: 'addExercise', impactScore: 0.20 });
    const activities = generateActivity(rec);
    expect(activities.some(a => a.type === 'exercise')).toBe(true);
  });

  it('all activities have durationMinutes > 0', () => {
    const rec = makeRec({ suggestedAction: 'addExercise', impactScore: 0.80 });
    for (const act of generateActivity(rec)) {
      expect(act.durationMinutes).toBeGreaterThan(0);
    }
  });
});

describe('targetBloomFromAction', () => {
  it('addExercise → apply', () => expect(targetBloomFromAction('addExercise')).toBe('apply'));
  it('adjustContent → understand', () => expect(targetBloomFromAction('adjustContent')).toBe('understand'));
  it('reschedule → analyze', () => expect(targetBloomFromAction('reschedule')).toBe('analyze'));
  it('highlightRisk → evaluate', () => expect(targetBloomFromAction('highlightRisk')).toBe('evaluate'));
});

// ── 3. generateCurriculumRecommendations ──────────────────────────────────────

describe('generateCurriculumRecommendations', () => {
  it('returns empty array for empty input', () => {
    expect(generateCurriculumRecommendations([])).toEqual([]);
  });

  it('returns empty array for single lesson', () => {
    expect(generateCurriculumRecommendations([makeLezione('l1')])).toEqual([]);
  });

  it('returns adjustContent rec when only one lesson type used', () => {
    const lessons = Array.from({ length: 6 }, (_, i) =>
      makeLezione(`l${i}`, { tipoLezione: 'Teoria' }),
    );
    const result = generateCurriculumRecommendations(lessons);
    expect(result.some(r => r.suggestedAction === 'adjustContent')).toBe(true);
  });

  it('all recommendations have source = pedagogy', () => {
    const lessons = Array.from({ length: 10 }, (_, i) =>
      makeLezione(`l${i}`, { tipoLezione: 'Teoria' }),
    );
    for (const rec of generateCurriculumRecommendations(lessons)) {
      expect(rec.source).toBe('pedagogy');
    }
  });

  it('returns reschedule rec when very few lessons are marked svolta', () => {
    const lessons = Array.from({ length: 10 }, (_, i) =>
      makeLezione(`l${i}`, { svolta: i < 3, contenuto: `topic${i}` }),
    );
    const result = generateCurriculumRecommendations(lessons);
    expect(result.some(r => r.suggestedAction === 'reschedule')).toBe(true);
  });

  it('results are sorted descending by impactScore', () => {
    const lessons = Array.from({ length: 12 }, (_, i) =>
      makeLezione(`l${i}`, { tipoLezione: 'Teoria', svolta: i % 4 === 0 }),
    );
    const result = generateCurriculumRecommendations(lessons);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].impactScore).toBeGreaterThanOrEqual(result[i].impactScore);
    }
  });

  it('all impactScores are in [0, 1]', () => {
    const lessons = Array.from({ length: 15 }, (_, i) =>
      makeLezione(`l${i}`, { tipoLezione: 'Teoria', svolta: false }),
    );
    for (const rec of generateCurriculumRecommendations(lessons)) {
      expect(rec.impactScore).toBeGreaterThanOrEqual(0);
      expect(rec.impactScore).toBeLessThanOrEqual(1);
    }
  });
});

// ── 4. useRecommendationStore ─────────────────────────────────────────────────

describe('useRecommendationStore', () => {
  beforeEach(() => {
    useRecommendationStore.getState().actions.clear();
  });

  it('initialises with empty recommendations', () => {
    const { recommendations } = useRecommendationStore.getState();
    expect(recommendations).toEqual([]);
  });

  it('initialises with null error and null lastComputedAt', () => {
    const { error, lastComputedAt } = useRecommendationStore.getState();
    expect(error).toBeNull();
    expect(lastComputedAt).toBeNull();
  });

  it('sets error when all three inputs are empty', () => {
    useRecommendationStore.getState().actions.compute([], [], []);
    const { error, recommendations } = useRecommendationStore.getState();
    expect(error).toBeTruthy();
    expect(recommendations).toEqual([]);
  });

  it('populates recommendations after compute() with valid inputs', () => {
    const report = makePedagogyReport(0.35);
    useRecommendationStore.getState().actions.compute([report], [], []);
    const { recommendations, error, lastComputedAt } = useRecommendationStore.getState();
    expect(recommendations.length).toBeGreaterThan(0);
    expect(error).toBeNull();
    expect(lastComputedAt).not.toBeNull();
  });

  it('clear() resets all state fields', () => {
    const report = makePedagogyReport(0.30);
    useRecommendationStore.getState().actions.compute([report], [], []);
    useRecommendationStore.getState().actions.clear();
    const { recommendations, error, lastComputedAt, computing } = useRecommendationStore.getState();
    expect(recommendations).toEqual([]);
    expect(error).toBeNull();
    expect(lastComputedAt).toBeNull();
    expect(computing).toBe(false);
  });

  it('computing is false after compute() completes', () => {
    const report = makePedagogyReport(0.40);
    useRecommendationStore.getState().actions.compute([report], [], []);
    expect(useRecommendationStore.getState().computing).toBe(false);
  });
});

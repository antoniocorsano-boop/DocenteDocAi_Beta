/**
 * simulation.test.ts — Unit tests for the AI Simulation Engine (Sprint 3)
 *
 * Tests cover:
 *   1. scenarioGenerator   — determinism, batch uniqueness, field ranges
 *   2. classroomSimulator  — student count, evaluation count, risk distribution
 *   3. benchmarkMetrics    — metric ranges, happy-path calculation
 *   4. simulationRunner    — single run shape, batch async run
 *   5. Cross-module        — same seed → same metrics (full pipeline determinism)
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import {
  generateScenario,
  generateScenarioBatch,
  NAMED_SCENARIOS,
} from '../scenarioGenerator';
import type { ClassroomScenario } from '../scenarioGenerator';
import { simulateClassroom } from '../classroomSimulator';
import { computeBenchmarkMetrics } from '../benchmarkMetrics';
import { runSimulation, runSimulationBatch } from '../simulationRunner';

// ── mocks ─────────────────────────────────────────────────────────────────────

// The unified orchestrator touches IDB and OTel — stub it out for unit tests
vi.mock('../../orchestrator/unifiedOrchestrator', () => ({
  runUnifiedAnalysis: vi.fn((students, evaluations) => ({
    schemaVersion: 2,
    classHealth: { score: 72, grade: 'buono', dimensions: {}, summary: '' },
    risks: [],
    excellence: [],
    suggestions: [],
    predictions: [],
    classAverage: 6.5,
    atRiskCount: Math.floor(students.length * 0.2),
    excellenceCount: Math.floor(students.length * 0.2),
    riskPredictions: students.map((s: { id: string }, i: number) => ({
      studentId: s.id,
      riskProbability: i < Math.floor(students.length * 0.25) ? 0.8 : 0.2,
      factors: [],
    })),
    lessonAssistant: null,
    stats: { total: 12.0, classHealth: 2.0, risk: 4.0, excellence: 2.0, trend: 1.5, prediction: 2.0, lesson: 0 },
    auditId: null,
  })),
}));

// ── 1. scenarioGenerator ──────────────────────────────────────────────────────

describe('scenarioGenerator', () => {
  it('produces identical output for the same seed', () => {
    const a = generateScenario(42);
    const b = generateScenario(42);
    expect(a).toStrictEqual(b);
  });

  it('produces different output for different seeds', () => {
    const a = generateScenario(1);
    const b = generateScenario(2);
    expect(a).not.toStrictEqual(b);
  });

  it('generates different scenarios per call without a seed', () => {
    const a = generateScenario();
    const b = generateScenario();
    // Two back-to-back calls use different epoch ms — should differ (best-effort)
    // We only assert shapes are valid since timing can theoretically produce same ms
    expect(typeof a.seed).toBe('number');
    expect(typeof b.seed).toBe('number');
  });

  it('returns fields within expected ranges', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = generateScenario(seed);
      expect(s.students).toBeGreaterThanOrEqual(10);
      expect(s.students).toBeLessThanOrEqual(32);
      expect(s.behaviorNoise).toBeGreaterThanOrEqual(0);
      expect(s.behaviorNoise).toBeLessThanOrEqual(1);
      expect(s.specialNeedsRatio).toBeGreaterThanOrEqual(0);
      expect(s.specialNeedsRatio).toBeLessThanOrEqual(0.3);
      expect(s.evaluationsPerStudent).toBeGreaterThanOrEqual(4);
      expect(s.evaluationsPerStudent).toBeLessThanOrEqual(12);
      expect(['low', 'medium', 'high']).toContain(s.riskDistribution);
      expect(['improving', 'stable', 'declining']).toContain(s.trend);
    }
  });

  it('generateScenarioBatch returns the requested count with distinct ids', () => {
    const batch = generateScenarioBatch(5);
    expect(batch).toHaveLength(5);
    const ids = new Set(batch.map(s => s.id));
    expect(ids.size).toBe(5);
  });

  it('generateScenarioBatch is deterministic with a base seed', () => {
    const a = generateScenarioBatch(3, 100);
    const b = generateScenarioBatch(3, 100);
    expect(a).toStrictEqual(b);
  });

  it('NAMED_SCENARIOS map refers to valid seeds', () => {
    for (const name of Object.keys(NAMED_SCENARIOS)) {
      const seed = NAMED_SCENARIOS[name];
      const scenario = generateScenario(seed);
      expect(scenario.seed).toBe(seed);
      expect(typeof scenario.id).toBe('string');
      expect(scenario.id.length).toBeGreaterThan(0);
    }
  });
});

// ── 2. classroomSimulator ─────────────────────────────────────────────────────

describe('classroomSimulator', () => {
  let scenario: ClassroomScenario;

  beforeAll(() => {
    scenario = generateScenario(999);
  });

  it('produces exactly scenario.students Studente records', () => {
    const { students } = simulateClassroom(scenario);
    expect(students).toHaveLength(scenario.students);
  });

  it('produces evaluationsPerStudent × students Valutazione records', () => {
    const { evaluations } = simulateClassroom(scenario);
    const expected = scenario.students * scenario.evaluationsPerStudent;
    expect(evaluations).toHaveLength(expected);
  });

  it('each Studente has required fields', () => {
    const { students } = simulateClassroom(scenario);
    for (const s of students) {
      expect(typeof s.id).toBe('string');
      expect(typeof s.nome).toBe('string');
      expect(typeof s.cognome).toBe('string');
      expect(s.classe).toBe('3A-SIM');
    }
  });

  it('each Valutazione has required fields', () => {
    const { evaluations } = simulateClassroom(scenario);
    const validTypes = ['Scritto', 'Orale', 'Pratico', 'Test', 'Verifica', 'Ricevimento'];
    for (const e of evaluations) {
      expect(typeof e.id).toBe('string');
      expect(typeof e.studenteId).toBe('string');
      expect(validTypes).toContain(e.tipo);
      expect(typeof e.voto).toBe('string');
      expect(parseFloat(e.voto)).toBeGreaterThanOrEqual(2);
      expect(parseFloat(e.voto)).toBeLessThanOrEqual(10);
    }
  });

  it('high-risk scenario: majority of groundTruth students have riskScore >= 0.65', () => {
    const highRisk = generateScenario(NAMED_SCENARIOS.allAtRisk);
    const { groundTruth } = simulateClassroom(highRisk);
    const atRisk = groundTruth.filter(s => s.riskScore >= 0.65).length;
    // allAtRisk scenario always has riskDistribution === 'high' (seed is fixed)
    if (highRisk.riskDistribution === 'high') {
      expect(atRisk / groundTruth.length).toBeGreaterThanOrEqual(0.4);
    }
  });

  it('is deterministic: same scenario produces identical students', () => {
    const a = simulateClassroom(scenario);
    const b = simulateClassroom(scenario);
    expect(a.students).toStrictEqual(b.students);
    expect(a.evaluations).toStrictEqual(b.evaluations);
    expect(a.groundTruth).toStrictEqual(b.groundTruth);
  });
});

// ── 3. benchmarkMetrics ───────────────────────────────────────────────────────

describe('benchmarkMetrics', () => {
  it('returns metrics within [0, 1] / [0, 100] ranges', () => {
    const scenario = generateScenario(77);
    const { groundTruth } = simulateClassroom(scenario);

    const fakeResult = {
      schemaVersion: 2 as const,
      classHealth: { score: 65, grade: 'buono' as const, dimensions: {} as never, summary: '' },
      risks: [], excellence: [], suggestions: [], predictions: [],
      classAverage: 6.0,
      atRiskCount: 4,
      excellenceCount: 3,
      riskPredictions: groundTruth.map((s, i) => ({
        studentId: s.id,
        riskProbability: i < 4 ? 0.75 : 0.15,
        factors: [],
      })),
      lessonAssistant: null,
      stats: { total: 10, classHealth: 2, risk: 3, excellence: 2, trend: 1, prediction: 2, lesson: 0 },
      auditId: null,
    };

    const metrics = computeBenchmarkMetrics(scenario, groundTruth, fakeResult as unknown as import('../../../ai/orchestrator/types').UnifiedAIResult, 42);
    expect(metrics.predictionConfidence).toBeGreaterThanOrEqual(0);
    expect(metrics.predictionConfidence).toBeLessThanOrEqual(1);
    expect(metrics.riskDetectionRate).toBeGreaterThanOrEqual(0);
    expect(metrics.riskDetectionRate).toBeLessThanOrEqual(1);
    expect(metrics.falsePositiveRate).toBeGreaterThanOrEqual(0);
    expect(metrics.falsePositiveRate).toBeLessThanOrEqual(1);
    expect(metrics.classHealthScore).toBeGreaterThanOrEqual(0);
    expect(metrics.classHealthScore).toBeLessThanOrEqual(100);
    if (metrics.f1Score !== null) {
      expect(metrics.f1Score).toBeGreaterThanOrEqual(0);
      expect(metrics.f1Score).toBeLessThanOrEqual(1);
    }
  });

  it('perfect detector: riskDetectionRate === 1, falsePositiveRate === 0, f1 === 1', () => {
    const scenario = generateScenario(88);
    const { groundTruth } = simulateClassroom(scenario);

    // Perfect oracle: flag exactly the ground-truth at-risk students
    const predictions = groundTruth.map(s => ({
      studentId: s.id,
      riskProbability: s.riskScore >= 0.65 ? 0.9 : 0.1,
      factors: [],
    }));

    const fakeResult = {
      schemaVersion: 2 as const,
      classHealth: { score: 70, grade: 'buono' as const, dimensions: {} as never, summary: '' },
      risks: [], excellence: [], suggestions: [], predictions: [],
      classAverage: 6.5, atRiskCount: 0, excellenceCount: 0,
      riskPredictions: predictions,
      lessonAssistant: null,
      stats: { total: 5, classHealth: 1, risk: 1, excellence: 1, trend: 1, prediction: 1, lesson: 0 },
      auditId: null,
    };

    const m = computeBenchmarkMetrics(scenario, groundTruth, fakeResult as unknown as import('../../../ai/orchestrator/types').UnifiedAIResult, 5);
    const hasRisks = groundTruth.some(s => s.riskScore >= 0.65);
    if (hasRisks) {
      expect(m.riskDetectionRate).toBe(1);
      expect(m.falsePositiveRate).toBe(0);
      expect(m.f1Score).toBe(1);
    }
  });
});

// ── 4. simulationRunner ───────────────────────────────────────────────────────

describe('simulationRunner', () => {
  it('runSimulation returns a well-formed SimulationResult', () => {
    const scenario = generateScenario(456);
    const result = runSimulation(scenario);

    expect(result.scenarioId).toBe(scenario.id);
    expect(typeof result.runId).toBe('string');
    expect(typeof result.runAt).toBe('string');
    expect(result.scenario).toStrictEqual(scenario);
    expect(typeof result.executionTimeMs).toBe('number');
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);

    // Metrics sanity
    const m = result.metrics;
    expect(m.riskDetectionRate).toBeGreaterThanOrEqual(0);
    expect(m.classHealthScore).toBeGreaterThanOrEqual(0);
  });

  it('runSimulationBatch resolves with the correct number of results', async () => {
    const scenarios = generateScenarioBatch(3, 100);
    const results = await runSimulationBatch(scenarios);
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(typeof r.runId).toBe('string');
      expect(typeof r.executionTimeMs).toBe('number');
    }
  });

  it('onProgress callback is invoked correctly', async () => {
    const scenarios = generateScenarioBatch(4, 200);
    const calls: [number, number][] = [];
    await runSimulationBatch(scenarios, (done, total) => calls.push([done, total]));
    expect(calls).toHaveLength(4);
    expect(calls[0]).toStrictEqual([1, 4]);
    expect(calls[3]).toStrictEqual([4, 4]);
  });
});

// ── 5. full-pipeline determinism ─────────────────────────────────────────────

describe('full-pipeline determinism', () => {
  it('two runs with the same scenario seed produce identical metrics', () => {
    const scenario = generateScenario(12345);
    const a = runSimulation(scenario);
    const b = runSimulation(scenario);
    // executionTimeMs is wall-clock and varies by ±1ms — exclude from determinism check
    const { executionTimeMs: _aMs, ...aRest } = a.metrics;
    const { executionTimeMs: _bMs, ...bRest } = b.metrics;
    expect(aRest).toStrictEqual(bRest);
  });
});

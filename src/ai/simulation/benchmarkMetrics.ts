/**
 * benchmarkMetrics.ts — Computes quantitative AI-quality metrics by comparing
 * AI output against the ground-truth `SimulatedStudent` oracle.
 *
 * All metrics are deterministic given the same inputs so they can be
 * asserted in unit tests without any epsilon tolerance.
 */

import type { UnifiedAIResult } from '../orchestrator/types';
import type { SimulatedStudent } from './classroomSimulator';
import type { ClassroomScenario } from './scenarioGenerator';

// ── types ─────────────────────────────────────────────────────────────────────

/** Complete benchmark report for one simulation run */
export interface BenchmarkMetrics {
  /**
   * Mean predicted risk probability across all students: [0, 1].
   * Higher values indicate the model sees more at-risk signals in the class.
   */
  predictionConfidence: number;

  /**
   * True-positive rate: fraction of ground-truth at-risk students that the AI
   * also classified as at-risk (riskProbability >= 0.5).  Range [0, 1].
   */
  riskDetectionRate: number;

  /**
   * False-positive rate: fraction of ground-truth safe students that the AI
   * incorrectly flagged as at-risk.  Range [0, 1].
   */
  falsePositiveRate: number;

  /**
   * Wall-clock time (ms) taken by the AI run that produced the result.
   * Sourced from `aiResult.stats.total` when available.
   */
  executionTimeMs: number;

  /**
   * Class health score [0, 100] from the AI output.
   */
  classHealthScore: number;

  /**
   * Number of at-risk students detected by the AI.
   */
  atRiskCount: number;

  /**
   * Number of excellence students detected by the AI.
   */
  excellenceCount: number;

  /**
   * F1 score combining precision (of AI risk flags) and `riskDetectionRate`
   * (recall).  Harmonic mean; range [0, 1].
   * null when there are no true risks AND no AI flags (avoids 0/0).
   */
  f1Score: number | null;
}

// ── helpers ───────────────────────────────────────────────────────────────────

const RISK_THRESHOLD_GT = 0.65; // ground-truth threshold (SimulatedStudent.riskScore)
const RISK_THRESHOLD_AI = 0.5;  // AI threshold (StudentRiskPrediction.riskProbability)

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Compares AI predictions against ground-truth simulated students to produce
 * actionable benchmark metrics.
 *
 * @param _scenario   The scenario that was simulated (reserved for future use,
 *                    e.g. per-scenario calibration curves).
 * @param groundTruth Oracle data from `simulateClassroom()`.
 * @param aiResult    Output of `runUnifiedAnalysis()`.
 * @param executionTimeMs Wall-clock ms measured by the caller.
 */
export function computeBenchmarkMetrics(
  _scenario: ClassroomScenario,
  groundTruth: SimulatedStudent[],
  aiResult: UnifiedAIResult,
  executionTimeMs: number,
): BenchmarkMetrics {
  const { riskPredictions, classHealth, atRiskCount, excellenceCount } = aiResult;

  // ── prediction confidence (mean predicted probability) ────────────────────
  const allProbabilities = riskPredictions.map(p => p.riskProbability);
  const predictionConfidence = round3(mean(allProbabilities));

  // ── risk detection rate (recall) ──────────────────────────────────────────
  const gtAtRisk = new Set(
    groundTruth.filter(s => s.riskScore >= RISK_THRESHOLD_GT).map(s => s.id),
  );
  const aiAtRisk = new Set(
    riskPredictions
      .filter(p => p.riskProbability >= RISK_THRESHOLD_AI)
      .map(p => p.studentId),
  );

  const truePositives = [...gtAtRisk].filter(id => aiAtRisk.has(id)).length;
  const falsePositives = [...aiAtRisk].filter(id => !gtAtRisk.has(id)).length;
  const falseNegatives = [...gtAtRisk].filter(id => !aiAtRisk.has(id)).length;

  const riskDetectionRate = gtAtRisk.size > 0
    ? round3(truePositives / gtAtRisk.size) // TP / (TP + FN)
    : 1; // no actual risks → perfect score by convention

  const gtSafeCount = groundTruth.length - gtAtRisk.size;
  const falsePositiveRate = gtSafeCount > 0
    ? round3(falsePositives / gtSafeCount)
    : 0;

  // ── F1 score ──────────────────────────────────────────────────────────────
  // precision = TP / (TP + FP), recall = riskDetectionRate
  let f1Score: number | null = null;
  if (truePositives + falsePositives + falseNegatives > 0) {
    const precision = truePositives + falsePositives > 0
      ? truePositives / (truePositives + falsePositives)
      : 0;
    const recall = riskDetectionRate;
    const denom = precision + recall;
    f1Score = denom > 0 ? round3((2 * precision * recall) / denom) : 0;
  }

  return {
    predictionConfidence,
    riskDetectionRate,
    falsePositiveRate,
    executionTimeMs: Math.round(executionTimeMs),
    classHealthScore: classHealth.score,
    atRiskCount,
    excellenceCount,
    f1Score,
  };
}

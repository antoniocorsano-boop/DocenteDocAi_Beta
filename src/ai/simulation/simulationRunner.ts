/**
 * simulationRunner.ts — Top-level execution harness that wires together the
 * scenario generator, classroom simulator, AI orchestrator and benchmark
 * metrics into self-contained `SimulationResult` records.
 *
 * Both a synchronous single-run helper and an async batch runner are
 * provided.  The batch runner yields to the browser between runs via
 * `requestIdleCallback` (with a `setTimeout` fallback) so it does not
 * block the main thread.
 */

import { runUnifiedAnalysis } from '../orchestrator/unifiedOrchestrator';
import { generateScenario, generateScenarioBatch } from './scenarioGenerator';
import { simulateClassroom } from './classroomSimulator';
import { computeBenchmarkMetrics } from './benchmarkMetrics';
import type { ClassroomScenario } from './scenarioGenerator';
import type { BenchmarkMetrics } from './benchmarkMetrics';
import type { UnifiedAIResult } from '../orchestrator/types';

// ── types ─────────────────────────────────────────────────────────────────────

/** Complete record of one AI simulation run */
export interface SimulationResult {
  /** Scenario id from `ClassroomScenario.id` */
  scenarioId: string;
  /** Unique run identifier combining scenario id + epoch ms */
  runId: string;
  /** ISO timestamp of when the run was executed */
  runAt: string;
  scenario: ClassroomScenario;
  aiResult: UnifiedAIResult;
  metrics: BenchmarkMetrics;
  /** Wall-clock ms for the AI analysis (not total simulation time) */
  executionTimeMs: number;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function makeRunId(scenarioId: string): string {
  return `${scenarioId}-run-${Date.now().toString(36)}`;
}

/**
 * Browser-safe yield helper.
 * Uses `requestIdleCallback` when available; falls back to `setTimeout(0)`.
 */
function yieldToMain(): Promise<void> {
  return new Promise<void>(resolve => {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => resolve(), { timeout: 50 });
    } else {
      setTimeout(resolve, 0);
    }
  });
}

// ── single run ────────────────────────────────────────────────────────────────

/**
 * Runs the full simulation pipeline for one scenario.
 * This is a synchronous operation — safe to call from Zustand actions or tests.
 */
export function runSimulation(scenario: ClassroomScenario): SimulationResult {
  const { students, evaluations, groundTruth } = simulateClassroom(scenario);

  const t0 = performance.now();
  const aiResult = runUnifiedAnalysis(students, evaluations, [], { forceFresh: true });
  const executionTimeMs = performance.now() - t0;

  const metrics = computeBenchmarkMetrics(scenario, groundTruth, aiResult, executionTimeMs);

  return {
    scenarioId: scenario.id,
    runId: makeRunId(scenario.id),
    runAt: new Date().toISOString(),
    scenario,
    aiResult,
    metrics,
    executionTimeMs,
  };
}

/**
 * Runs the full simulation pipeline for a single scenario generated from
 * an optional seed.  Convenience wrapper used by the Zustand store action
 * `runScenario(seed?)`.
 */
export function runSimulationFromSeed(seed?: number): SimulationResult {
  return runSimulation(generateScenario(seed));
}

// ── batch run ─────────────────────────────────────────────────────────────────

/**
 * Asynchronously runs the simulation pipeline for multiple scenarios,
 * yielding between each run to avoid blocking the UI thread.
 *
 * @param scenarios   Pre-built scenario list.  Use `generateScenarioBatch(n)`
 *                    to produce one.
 * @param onProgress  Optional callback invoked after each run with
 *                    `(doneCount, totalCount)` — useful for progress bars.
 */
export async function runSimulationBatch(
  scenarios: ClassroomScenario[],
  onProgress?: (done: number, total: number) => void,
): Promise<SimulationResult[]> {
  const results: SimulationResult[] = [];

  for (let i = 0; i < scenarios.length; i++) {
    results.push(runSimulation(scenarios[i]));
    onProgress?.(i + 1, scenarios.length);
    if (i < scenarios.length - 1) {
      await yieldToMain();
    }
  }

  return results;
}

/**
 * Convenience wrapper: generates `count` scenarios from an optional base seed
 * and runs the full batch.
 */
export async function runSimulationBatchFromCount(
  count: number,
  baseSeed?: number,
  onProgress?: (done: number, total: number) => void,
): Promise<SimulationResult[]> {
  const scenarios = generateScenarioBatch(count, baseSeed);
  return runSimulationBatch(scenarios, onProgress);
}

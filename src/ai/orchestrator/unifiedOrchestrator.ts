/**
 * unifiedOrchestrator.ts — Single canonical AI entry-point (Sprint 1)
 *
 * Replaces the dual aiEngine / aiPipeline pattern with one function that:
 *   1. Checks the in-memory cache (fast path)
 *   2. Runs all AI sub-modules in dependency order on a miss
 *   3. Writes a persisted audit trail to IndexedDB (fire-and-forget)
 *   4. Emits OpenTelemetry spans for every step
 *   5. Returns a UnifiedAIResult stamped with schemaVersion
 *
 * Backward compatibility:
 *   - Legacy aiEngine.runAIAnalysis() is shimmed to call this function
 *   - All fields from AIAnalysisResult are present verbatim
 *
 * @module unifiedOrchestrator
 */

import type { Studente, Valutazione, Lezione } from '@/types';
import { buildAIContext } from '../contextEngine/contextBuilder';
import { computeClassHealthIndex } from '../classHealth/classHealthIndex';
import { analyzeRisk } from '../contextEngine/riskAnalyzer';
import { analyzeExcellence } from '../contextEngine/excellenceAnalyzer';
import { generateForecasts } from '../copilot/trendEngine';
import { predictClassRisk } from '../prediction/predictClassRisk';
import { askLessonAssistant } from '../lessonAssistant/lessonAssistant';
import { buildContextHash, setCachedUnifiedResult, getCachedUnifiedResult } from '../cache/aiCache';
import { createAuditTrail, recordAuditStep, finishAuditTrail } from '../audit/auditRecorder';
import { pushAudit } from '../audit/auditTrail';
import { persistAudit } from '../audit/auditDb';
import { startAISpan } from '../telemetry/aiTelemetry';
import type { AIContext } from '../contextEngine/contextBuilder';
import type { UnifiedAIResult, UnifiedAIOptions } from './types';
import { AI_SCHEMA_VERSION } from './types';
import type { AIRunStats } from './types';

// ── helpers ───────────────────────────────────────────────────────────────────

function parseVoto(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) ? -1 : n;
}

function computeClassAverage(evals: Valutazione[]): number {
  const valid = evals.map((e) => parseVoto(e.voto)).filter((n) => n >= 0);
  if (valid.length === 0) return 0;
  return parseFloat((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1));
}

// ── core run ──────────────────────────────────────────────────────────────────

function runFull(
  context: AIContext,
  students: Studente[],
  evaluations: Valutazione[],
  options: Required<UnifiedAIOptions>,
): Omit<UnifiedAIResult, 'schemaVersion' | 'auditId'> {
  const audit = createAuditTrail(buildContextHash(context));
  const inputSummary = `${students.length} students, ${evaluations.length} evals`;
  const t0 = performance.now();

  // ── classHealth ─────────────────────────────────────────────────────────────
  const spanHealth = startAISpan('classHealthIndex', { studentCount: students.length });
  const t1 = performance.now();
  const classHealth = computeClassHealthIndex(context);
  const t2 = performance.now();
  spanHealth.end();
  recordAuditStep(audit, 'classHealthIndex', t2 - t1, inputSummary,
    `score=${classHealth.score} grade=${classHealth.grade}`);

  // ── risk ─────────────────────────────────────────────────────────────────────
  const spanRisk = startAISpan('riskAnalyzer');
  const risks = analyzeRisk(context);
  const t3 = performance.now();
  spanRisk.end();
  recordAuditStep(audit, 'riskAnalyzer', t3 - t2, inputSummary,
    `${risks.length} at-risk`);

  // ── excellence ───────────────────────────────────────────────────────────────
  const spanExc = startAISpan('excellenceAnalyzer');
  const excellence = analyzeExcellence(context);
  const t4 = performance.now();
  spanExc.end();
  recordAuditStep(audit, 'excellenceAnalyzer', t4 - t3, inputSummary,
    `${excellence.length} excellent`);

  // ── forecasts ────────────────────────────────────────────────────────────────
  const spanFore = startAISpan('trendEngine');
  const predictions = generateForecasts(students, evaluations);
  const t5 = performance.now();
  spanFore.end();
  recordAuditStep(audit, 'trendEngine', t5 - t4, inputSummary,
    `${predictions.length} forecasts`);

  // ── risk predictions ─────────────────────────────────────────────────────────
  const spanPred = startAISpan('riskPredictor');
  const riskPredictions = predictClassRisk(students, evaluations);
  const t6 = performance.now();
  spanPred.end();
  recordAuditStep(audit, 'riskPredictor', t6 - t5, inputSummary,
    `${riskPredictions.length} predictions`);

  // ── lesson assistant (opt-in) ────────────────────────────────────────────────
  let lessonAssistant = null;
  const t7start = performance.now();
  if (options.includeLessonAssistant) {
    const spanLA = startAISpan('lessonAssistant');
    lessonAssistant = askLessonAssistant(context);
    spanLA.end();
    recordAuditStep(audit, 'lessonAssistant', performance.now() - t7start, inputSummary,
      `${lessonAssistant.suggestions.length} suggestions`);
  }
  const t7 = performance.now();

  const stats: AIRunStats = {
    totalMs: parseFloat((t7 - t0).toFixed(2)),
    breakdown: {
      classHealth: parseFloat((t2 - t1).toFixed(2)),
      risk: parseFloat((t3 - t2).toFixed(2)),
      excellence: parseFloat((t4 - t3).toFixed(2)),
      forecasts: parseFloat((t5 - t4).toFixed(2)),
    },
    lastRun: new Date().toISOString(),
  };

  const sealed = finishAuditTrail(audit, false);
  pushAudit(sealed);
  // Fire-and-forget IDB persistence — does not block the return value
  persistAudit(sealed).catch(() => undefined);

  return {
    classHealth,
    risks,
    excellence,
    suggestions: [...risks, ...excellence],
    predictions,
    classAverage: computeClassAverage(evaluations),
    atRiskCount: risks.length,
    excellenceCount: excellence.length,
    riskPredictions,
    lessonAssistant,
    stats,
  };
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Runs a full AI analysis over the provided class dataset.
 *
 * Results are cached by context hash. Pass `forceFresh: true` to bypass.
 *
 * @param students     - Current class roster
 * @param evaluations  - All recorded evaluations for the class
 * @param lessons      - Lesson records (used by LessonAssistant only)
 * @param options      - Optional flags (includeLessonAssistant, forceFresh)
 */
export function runUnifiedAnalysis(
  students: Studente[],
  evaluations: Valutazione[],
  lessons: Lezione[] = [],
  options: UnifiedAIOptions = {},
): UnifiedAIResult {
  const opts: Required<UnifiedAIOptions> = {
    includeLessonAssistant: options.includeLessonAssistant ?? false,
    forceFresh: options.forceFresh ?? false,
  };

  const context = buildAIContext(students, lessons, evaluations);
  const hash = buildContextHash(context);

  if (!opts.forceFresh) {
    const cached = getCachedUnifiedResult(hash);
    if (cached !== null) {
      // Record cache-hit audit (no steps)
      const audit = createAuditTrail(hash);
      pushAudit(finishAuditTrail(audit, true));
      return cached;
    }
  }

  const spanTotal = startAISpan('runUnifiedAnalysis', {
    studentCount: students.length,
    evalCount: evaluations.length,
  });

  const partial = runFull(context, students, evaluations, opts);
  spanTotal.end();

  const result: UnifiedAIResult = {
    schemaVersion: AI_SCHEMA_VERSION,
    auditId: null,
    ...partial,
  };

  setCachedUnifiedResult(hash, result);
  return result;
}

// Re-export types for convenience
export type { UnifiedAIResult, UnifiedAIOptions } from './types';
export { AI_SCHEMA_VERSION } from './types';

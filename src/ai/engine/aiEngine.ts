/**
 * aiEngine.ts — Unified AI Analysis Engine (FASE 1)
 *
 * Single entry point for all AI computation. Accepts an AIContext and
 * returns a fully-typed AIAnalysisResult. Pure function — no side effects.
 *
 * Benefits:
 * - One import for all AI data consumers (Copilot, Dashboard, etc.)
 * - Easy to cache at call site with useMemo
 * - Tests target a single public API
 */
import type { AIContext } from '../contextEngine/contextBuilder';
import { computeClassHealthIndex } from '../classHealth/classHealthIndex';
import { analyzeRisk } from '../contextEngine/riskAnalyzer';
import { analyzeExcellence } from '../contextEngine/excellenceAnalyzer';
import { generateForecasts } from '../copilot/trendEngine';
import { buildContextHash, getCachedAnalysis, setCachedAnalysis } from '../cache/aiCache';
import { createAuditTrail, recordAuditStep, finishAuditTrail } from '../audit/auditRecorder';
import { pushAudit } from '../audit/auditTrail';
export { getAuditHistory, getLastAudit, clearAuditHistory } from '../audit/auditTrail';
import type { ClassHealthIndex } from '../classHealth/types';
import type { AISuggestion } from '../contextEngine/types';
import type { StudentForecast } from '../copilot/trendEngine';
export type { AIAuditTrail, AuditStep } from '../audit/auditTypes';

// ── public result type ────────────────────────────────────────────────────────

export interface AIAnalysisResult {
  /** Class health composite index (0–100) with grade and dimensions */
  classHealth: ClassHealthIndex;
  /** Students identified as at-risk (avg < 5.5 or declining trend) */
  risks: AISuggestion[];
  /** Students consistently performing above 8.0 */
  excellence: AISuggestion[];
  /** Combined suggestions (risks + excellence) */
  suggestions: AISuggestion[];
  /** Per-student grade trend forecasts (+30 days) */
  predictions: StudentForecast[];
  /** Computed class grade average (1–10), 0 when no evaluations */
  classAverage: number;
  /** Count of at-risk students */
  atRiskCount: number;
  /** Count of excellent students */
  excellenceCount: number;
}

// ── run stats ─────────────────────────────────────────────────────────────────

export interface AIRunStats {
  /** Total wall-clock ms for the last non-cached analysis run */
  totalMs: number;
  /** ms spent in each sub-analyser */
  breakdown: {
    classHealth: number;
    risk: number;
    excellence: number;
    forecasts: number;
  };
  /** ISO timestamp of the last run */
  lastRun: string;
}

let _lastRunStats: AIRunStats | null = null;

/** Returns timing stats from the most recent non-cached `runAIAnalysis` call. */
export function getLastRunStats(): AIRunStats | null {
  return _lastRunStats;
}

// ── engine ────────────────────────────────────────────────────────────────────

function parseVoto(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) ? -1 : n;
}

/**
 * Runs a full AI analysis pass over the provided context.
 *
 * Results are cached by context hash — identical student + evaluation sets
 * return the memoized result instantly without re-running the pipeline.
 *
 * @param context - AIContext built via buildAIContext()
 * @returns AIAnalysisResult — all AI-derived data for the current dataset
 *
 * @example
 * const result = useMemo(() => runAIAnalysis(ctx), [ctx]);
 */
export function runAIAnalysis(context: AIContext): AIAnalysisResult {
  const hash = buildContextHash(context);
  const cached = getCachedAnalysis(hash);
  if (cached !== null) {
    // Record a cache-hit audit trail (no steps) so DevTools can observe it
    const audit = createAuditTrail(hash);
    pushAudit(finishAuditTrail(audit, true));
    return cached;
  }

  const audit = createAuditTrail(hash);
  const inputSummary = `${context.students.length} students, ${context.evaluations.length} evals`;

  const t0 = performance.now();

  const t1 = performance.now();
  const classHealth = computeClassHealthIndex(context);
  const t2 = performance.now();
  recordAuditStep(audit, 'classHealthIndex', t2 - t1, inputSummary,
    `score=${classHealth.score} grade=${classHealth.grade}`);

  const risks = analyzeRisk(context);
  const t3 = performance.now();
  recordAuditStep(audit, 'riskAnalyzer', t3 - t2, inputSummary,
    `${risks.length} at-risk students`);

  const excellence = analyzeExcellence(context);
  const t4 = performance.now();
  recordAuditStep(audit, 'excellenceAnalyzer', t4 - t3, inputSummary,
    `${excellence.length} excellent students`);

  const suggestions = [...risks, ...excellence];
  const predictions = generateForecasts(context.students, context.evaluations);
  const t5 = performance.now();
  recordAuditStep(audit, 'trendEngine', t5 - t4, inputSummary,
    `${predictions.length} forecasts`);

  const validScores = context.evaluations
    .map((e) => parseVoto(e.voto))
    .filter((n) => n >= 0);

  const classAverage =
    validScores.length > 0
      ? parseFloat(
          (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1),
        )
      : 0;

  _lastRunStats = {
    totalMs: parseFloat((t5 - t0).toFixed(2)),
    breakdown: {
      classHealth: parseFloat((t2 - t1).toFixed(2)),
      risk: parseFloat((t3 - t2).toFixed(2)),
      excellence: parseFloat((t4 - t3).toFixed(2)),
      forecasts: parseFloat((t5 - t4).toFixed(2)),
    },
    lastRun: new Date().toISOString(),
  };

  const result: AIAnalysisResult = {
    classHealth,
    risks,
    excellence,
    suggestions,
    predictions,
    classAverage,
    atRiskCount: risks.length,
    excellenceCount: excellence.length,
  };
  setCachedAnalysis(hash, result);
  pushAudit(finishAuditTrail(audit, false));
  return result;
}

/**
 * auditTypes.ts — Shared types for the AI Audit Trail system
 *
 * An AIAuditTrail captures exactly what happened during a single runAIAnalysis
 * call: which analyzers ran, how long each took, whether the result was served
 * from cache, and a compact summary of inputs/outputs for each step.
 *
 * These types are consumed by:
 *   - auditRecorder.ts  (construction)
 *   - auditTrail.ts     (history storage)
 *   - AIDevToolsPanel   (display)
 */

// ── AuditStep ─────────────────────────────────────────────────────────────────

/**
 * A single timed step within an AI analysis pass.
 *
 * @example
 * { name: 'riskAnalyzer', durationMs: 4.2, outputSummary: '3 at-risk students' }
 */
export interface AuditStep {
  /** Human-readable name of the analyzer or sub-module that ran */
  name: string;
  /** Wall-clock duration of this step in milliseconds */
  durationMs: number;
  /** Optional compact description of the input (e.g. "22 students, 88 evals") */
  inputSummary?: string;
  /** Optional compact description of the output (e.g. "3 risks detected") */
  outputSummary?: string;
  /** ISO timestamp at which this step completed */
  completedAt: string;
}

// ── AIAuditTrail ──────────────────────────────────────────────────────────────

/**
 * Full audit record for one runAIAnalysis invocation.
 */
export interface AIAuditTrail {
  /** Unique identifier for this audit (timestamp-derived) */
  id: string;
  /** ISO timestamp when the analysis started */
  startedAt: string;
  /** ISO timestamp when the analysis finished (after all steps + caching) */
  finishedAt: string;
  /** Total wall-clock time in milliseconds */
  totalMs: number;
  /** Ordered list of steps executed */
  steps: AuditStep[];
  /** The context hash that was analysed */
  contextHash: string;
  /** true when the result was served from the in-memory cache (no steps ran) */
  cacheHit: boolean;
}

// ── internal builder type (not exported for consumers) ───────────────────────

/**
 * Mutable builder used internally by auditRecorder during a live analysis run.
 * Finalized into AIAuditTrail by finishAuditTrail().
 */
export interface ActiveAudit {
  id: string;
  startedAt: string;
  startTs: number;
  contextHash: string;
  steps: AuditStep[];
}

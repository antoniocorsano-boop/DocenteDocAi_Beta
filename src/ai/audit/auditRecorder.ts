/**
 * auditRecorder.ts — Factory & mutation helpers for AIAuditTrail
 *
 * Provides three pure functions consumed by aiEngine.ts to instrument
 * each analysis pass:
 *
 *   1. createAuditTrail(contextHash)  → opens a new ActiveAudit
 *   2. recordAuditStep(audit, …)      → appends a timed AuditStep
 *   3. finishAuditTrail(audit, …)     → seals it into an AIAuditTrail
 *
 * All functions are synchronous and pure (no side effects). The returned
 * AIAuditTrail can be passed to pushAudit() from auditTrail.ts for
 * history storage and optional console output.
 */
import type { AIAuditTrail, ActiveAudit, AuditStep } from './auditTypes';

// ── createAuditTrail ──────────────────────────────────────────────────────────

/**
 * Opens a new mutable audit builder for an analysis pass.
 *
 * @param contextHash - Hash of the AIContext being analysed (from buildContextHash)
 * @returns ActiveAudit builder to pass through the pipeline
 */
export function createAuditTrail(contextHash: string): ActiveAudit {
  const now = performance.now();
  const ts = new Date().toISOString();
  return {
    id: `audit-${Date.now()}`,
    startedAt: ts,
    startTs: now,
    contextHash,
    steps: [],
  };
}

// ── recordAuditStep ───────────────────────────────────────────────────────────

/**
 * Appends a completed step to the active audit builder.
 *
 * Typical usage — instrument before/after the analyzer call:
 * ```ts
 * const t0 = performance.now();
 * const risks = analyzeRisk(context);
 * recordAuditStep(audit, 'riskAnalyzer', performance.now() - t0, undefined,
 *   `${risks.length} risks`);
 * ```
 *
 * @param audit          - The ActiveAudit builder (mutated in-place)
 * @param name           - Analyzer name (unique within the audit)
 * @param durationMs     - Elapsed milliseconds for this step
 * @param inputSummary   - Optional human-readable input description
 * @param outputSummary  - Optional human-readable output description
 */
export function recordAuditStep(
  audit: ActiveAudit,
  name: string,
  durationMs: number,
  inputSummary?: string,
  outputSummary?: string,
): void {
  const step: AuditStep = {
    name,
    durationMs: parseFloat(durationMs.toFixed(2)),
    completedAt: new Date().toISOString(),
    ...(inputSummary !== undefined ? { inputSummary } : {}),
    ...(outputSummary !== undefined ? { outputSummary } : {}),
  };
  audit.steps.push(step);
}

// ── finishAuditTrail ──────────────────────────────────────────────────────────

/**
 * Seals an ActiveAudit into an immutable AIAuditTrail.
 *
 * @param audit    - The ActiveAudit builder to finalize
 * @param cacheHit - Whether the result came from the cache (true → no steps ran)
 * @returns Sealed AIAuditTrail ready for history storage or logging
 */
export function finishAuditTrail(
  audit: ActiveAudit,
  cacheHit: boolean,
): AIAuditTrail {
  const finishedAt = new Date().toISOString();
  const totalMs = parseFloat((performance.now() - audit.startTs).toFixed(2));

  return {
    id: audit.id,
    startedAt: audit.startedAt,
    finishedAt,
    totalMs,
    steps: [...audit.steps],
    contextHash: audit.contextHash,
    cacheHit,
  };
}

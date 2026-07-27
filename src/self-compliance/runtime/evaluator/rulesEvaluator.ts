// runtime/evaluator/rulesEvaluator.ts
// Orchestratore: valuta tutte le regole ed emette il ComplianceRuntimeResult

import { ALL_RULES }        from "../rules";
import { computeLiveScore } from "../scoring/liveScorer";
import { buildViolations }  from "../violations/violationEngine";
import type { ComplianceContext, ComplianceRuntimeResult } from "../types";

/**
 * Valuta tutte le 13 regole (5 GDPR + 5 AI Act + 3 AgID) contro il contesto
 * del sistema e restituisce un ComplianceRuntimeResult completo.
 *
 * Pura: nessun side-effect. Può essere chiamata in un useMemo.
 */
export function evaluateAllRules(context: ComplianceContext): ComplianceRuntimeResult {
  const evaluated = ALL_RULES.map(rule => ({
    rule,
    ...rule.evaluate(context),
  }));

  const passedRules  = evaluated.filter(e => e.pass).length;
  const totalRules   = evaluated.length;
  const violations   = buildViolations(evaluated);
  const { liveScore, frameworkScores } = computeLiveScore(evaluated);

  const hasCriticalViolation = violations.some(v => v.severity === "critical");
  const compliant            = liveScore >= 80 && !hasCriticalViolation;

  return {
    evaluatedAt:  new Date().toISOString(),
    liveScore,
    compliant,
    frameworkScores,
    violations,
    passedRules,
    totalRules,
  };
}

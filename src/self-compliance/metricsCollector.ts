// metricsCollector.ts
// Raccoglie e aggrega metriche reali di compliance

import type { SystemActivity, ComplianceMetrics } from "./types";

export function collectMetrics(activities: SystemActivity[]): ComplianceMetrics {
  const total = activities.length;
  if (total === 0) return emptyMetrics();

  const autonomousActions = activities.filter(a => !a.approved && !a.blocked).length;
  const approvedActions   = activities.filter(a => a.approved).length;
  const blockedActions    = activities.filter(a => a.blocked).length;
  const lowRiskActions    = activities.filter(a => a.riskLevel === "low").length;
  const mediumRiskActions = activities.filter(a => a.riskLevel === "medium").length;
  const highRiskActions   = activities.filter(a => a.riskLevel === "high").length;
  const criticalRiskActions = activities.filter(a => a.riskLevel === "critical").length;
  const gdprViolations    = activities.filter(a => a.gdprViolation).length;
  const userOverrides     = activities.filter(a => a.userOverride).length;
  const explainableCount  = activities.filter(a => a.explainable).length;

  const timed = activities.filter(
    (a): a is SystemActivity & { decisionTimeMs: number } => a.decisionTimeMs !== undefined,
  );
  const avgDecisionTime =
    timed.length > 0
      ? timed.reduce((sum, a) => sum + a.decisionTimeMs, 0) / timed.length
      : 0;

  return {
    totalActions: total,
    autonomousActions,
    approvedActions,
    blockedActions,
    lowRiskActions,
    mediumRiskActions,
    highRiskActions,
    criticalRiskActions,
    gdprViolations,
    avgDecisionTime,
    userOverrides,
    explainabilityCoverage: explainableCount / total,
  };
}

export function emptyMetrics(): ComplianceMetrics {
  return {
    totalActions: 0,
    autonomousActions: 0,
    approvedActions: 0,
    blockedActions: 0,
    lowRiskActions: 0,
    mediumRiskActions: 0,
    highRiskActions: 0,
    criticalRiskActions: 0,
    gdprViolations: 0,
    avgDecisionTime: 0,
    userOverrides: 0,
    explainabilityCoverage: 1,
  };
}

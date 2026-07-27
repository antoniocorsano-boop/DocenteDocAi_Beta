// reportGenerator.ts
// Genera report di compliance per auditor, PA, dirigenti

import type {
  ComplianceEvaluation,
  ComplianceMetrics,
  ComplianceReport,
  RiskDistribution,
} from "./types";

const STANDARDS = [
  "GDPR Reg. UE 2016/679",
  "AI Act Reg. UE 2024/1689",
  "CAD D.Lgs. 82/2005",
  "AgID Linee Guida IA nella PA",
];

function makeReportId(): string {
  return `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function generateComplianceReport(
  period: string,
  metrics: ComplianceMetrics,
  evaluation: ComplianceEvaluation,
): ComplianceReport {
  const riskDistribution: RiskDistribution[] = (
    [
      { riskLevel: "low",      count: metrics.lowRiskActions },
      { riskLevel: "medium",   count: metrics.mediumRiskActions },
      { riskLevel: "high",     count: metrics.highRiskActions },
      { riskLevel: "critical", count: metrics.criticalRiskActions },
    ] satisfies RiskDistribution[]
  ).filter(r => r.count > 0);

  return {
    id: makeReportId(),
    period,
    generatedAt: new Date().toISOString(),
    systemStatus: evaluation.complianceStatus,
    metrics,
    incidents: evaluation.issues,
    correctiveActions: [
      ...evaluation.recommendations,
      ...evaluation.requiredActions,
    ],
    riskDistribution,
    explainabilityScore: metrics.explainabilityCoverage,
    standards: STANDARDS,
  };
}

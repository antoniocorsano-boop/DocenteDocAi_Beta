// openDataPublisher.ts
// Pubblica open data aggregati e anonimi (GDPR-safe, D.Lgs. 36/2006)

import type { ComplianceMetrics, OpenDataExport, RiskLevel } from "./types";

const OPEN_DATA_STANDARDS = [
  "GDPR Reg. UE 2016/679",
  "AI Act Reg. UE 2024/1689",
  "Open Data D.Lgs. 36/2006",
  "AgID Profilo Metadati DCAT-AP_IT",
];

export function publishOpenData(period: string, metrics: ComplianceMetrics): OpenDataExport {
  const round3 = (n: number): number => Math.round(n * 1000) / 1000;

  const automationRate =
    metrics.totalActions > 0 ? round3(metrics.autonomousActions / metrics.totalActions) : 0;
  const approvalRate =
    metrics.totalActions > 0 ? round3(metrics.approvedActions / metrics.totalActions) : 0;
  const explainabilityRate = round3(metrics.explainabilityCoverage);

  // Livello di rischio aggregato (massimo rilevato)
  let riskLevel: RiskLevel = "low";
  if (metrics.gdprViolations > 0 || metrics.criticalRiskActions > 0) {
    riskLevel = "critical";
  } else if (metrics.highRiskActions > 0) {
    riskLevel = "high";
  } else if (metrics.mediumRiskActions > 0) {
    riskLevel = "medium";
  }

  return {
    system:      "DocenteDoc AI",
    period,
    generatedAt: new Date().toISOString(),
    metrics: {
      automationRate,
      approvalRate,
      explainabilityRate,
      riskLevel,
      totalActions: metrics.totalActions, // aggregato, nessun dato personale
    },
    standards: OPEN_DATA_STANDARDS,
  };
}

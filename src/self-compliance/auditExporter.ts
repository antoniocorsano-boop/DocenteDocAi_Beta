// auditExporter.ts
// Esporta pacchetti auditabili (JSON) conformi a standard PA

import type { AuditExport, ComplianceReport } from "./types";

const AUDIT_VERSION = "1.0";
const SYSTEM_NAME   = "DocenteDoc AI";
const AUDIT_STANDARDS = [
  "GDPR Reg. UE 2016/679",
  "AI Act Reg. UE 2024/1689 Art. 13 (Trasparenza)",
  "CAD D.Lgs. 82/2005",
  "AgID Linee Guida IA nella PA",
];

export function exportAuditPackage(
  report: ComplianceReport,
  confidenceScore?: number,
): AuditExport {
  const payload = {
    auditVersion:    AUDIT_VERSION,
    exportTimestamp: new Date().toISOString(),
    system:          SYSTEM_NAME,
    standards:       AUDIT_STANDARDS,
    report: {
      id:                  report.id,
      period:              report.period,
      generatedAt:         report.generatedAt,
      systemStatus:        report.systemStatus,
      explainabilityScore: report.explainabilityScore,
    },
    metrics:           report.metrics,
    incidents:         report.incidents,
    correctiveActions: report.correctiveActions,
    riskDistribution:  report.riskDistribution,
    auditTrail: {
      totalActions:     report.metrics.totalActions,
      autonomousActions: report.metrics.autonomousActions,
      approvedActions:  report.metrics.approvedActions,
      blockedActions:   report.metrics.blockedActions,
      gdprViolations:   report.metrics.gdprViolations,
    },
    certification: {
      selfAssessed:   true,
      assessmentDate: new Date().toISOString(),
      assessedBy:     "ComplianceAgent v1.0 (automated)",
      confidenceScore: confidenceScore ?? null,
    },
  };

  return {
    json:    JSON.stringify(payload, null, 2),
    pdf:     undefined,
    apiUrl:  undefined,
  };
}

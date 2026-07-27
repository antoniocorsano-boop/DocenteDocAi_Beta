// runtime/audit/index.ts
// Barrel — esporta tutto il modulo Audit PA

export type {
  PASeverityLevel,
  AuditFinding,
  AuditScenario,
  ComplianceStatusPA,
  CertificationReadiness,
  PALiveAuditReport,
  AuditRun,
  DriftStatus,
  DriftReport,
} from "./types";

export { mapToPASeverity, isBlockingFinding }  from "./severityMapper";
export { generateRecommendations }             from "./recommendationEngine";
export { buildAuditReport }                    from "./auditEngine";
export { runAuditSimulation, AUDIT_SCENARIOS } from "./auditSimulator";
export { collectEvidence }                     from "./evidenceCollector";
export { useAuditTrailStore }                  from "./auditTrailStore";
export { detectDrift }                         from "./driftDetector";

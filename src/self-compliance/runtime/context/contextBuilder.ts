// runtime/context/contextBuilder.ts
// Costruisce il ComplianceContext dalla ComplianceDb in modo deterministico

import { collectMetrics }   from "../../metricsCollector";
import type { ComplianceDb } from "../../types";
import type { ComplianceContext } from "../types";

/**
 * Fatti di sistema staticamente verificabili.
 * Aggiorna questi flag quando le feature cambiano.
 */
const SYSTEM_FACTS = {
  /** dataRetention.ts chiamato da main.tsx: cleanup automatico dopo 365gg */
  hasDataRetentionPolicy: true,
  /** complianceDb usa mutazioni immutabili + slice su retention cap */
  logsAreImmutable: true,
  /** PrivacyConsentModal con localStorage persistence */
  hasPrivacyConsent: true,
  /** Fairness audit non ancora implementato (gap: riskAssessment rischio GDPR) */
  hasBiasMonitoring: false,
} as const;

export function buildContext(db: ComplianceDb): ComplianceContext {
  const metrics = collectMetrics(db.activities);

  // Calcola ratio azioni high-risk approvate
  const highRiskActivities = db.activities.filter(a => a.riskLevel === "high");
  const approvedHighRisk   = highRiskActivities.filter(a => a.approved).length;
  const approvedHighRiskRatio =
    highRiskActivities.length > 0
      ? approvedHighRisk / highRiskActivities.length
      : 1; // nessuna azione high-risk = conforme

  // Azioni critiche non bloccate
  const criticalUnblocked = db.activities.filter(
    a => a.riskLevel === "critical" && !a.blocked,
  ).length;

  // Override rate
  const overrideRate =
    metrics.totalActions > 0
      ? metrics.userOverrides / metrics.totalActions
      : 0;

  // Storico audit
  const lastReport = db.reports[db.reports.length - 1] ?? null;
  const lastAuditDate = lastReport ? new Date(lastReport.generatedAt) : null;
  const lastAuditDaysAgo =
    lastAuditDate !== null
      ? Math.floor((Date.now() - lastAuditDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

  const lastSnapshot     = db.snapshots[db.snapshots.length - 1] ?? null;
  const lastReportStatus = lastSnapshot?.evaluation.complianceStatus ?? null;

  return {
    totalActions:           metrics.totalActions,
    gdprViolations:         metrics.gdprViolations,
    explainabilityCoverage: metrics.explainabilityCoverage,
    approvedHighRiskRatio,
    criticalUnblocked,
    overrideRate,
    avgDecisionTimeMs:      metrics.avgDecisionTime,
    ...SYSTEM_FACTS,
    lastAuditDate,
    lastAuditDaysAgo,
    lastReportStatus,
  };
}

// runtime/audit/evidenceCollector.ts
// Raccoglie evidenze tecniche verificabili dal ComplianceContext per ogni regola.
// Ogni stringa restituita è una "chiave: valore" tracciabile nel verbale PA.

import type { ComplianceContext } from "../types";

/**
 * Restituisce un array di evidenze verificabili per un dato rule ID.
 * Le evidenze mostrano i valori reali del sistema al momento dell'audit
 * e possono essere allegate al verbale per verifica da parte di un auditor esterno.
 */
export function collectEvidence(ctx: ComplianceContext, ruleId: string): string[] {
  switch (ruleId) {

    case "gdpr_no_violations":
      return [
        `Violazioni GDPR rilevate: ${ctx.gdprViolations}`,
        `Override rate: ${(ctx.overrideRate * 100).toFixed(1)}%`,
      ];

    case "gdpr_data_retention":
      return [
        `Policy retention: ${ctx.hasDataRetentionPolicy ? "ATTIVA — src/utils/dataRetention.ts" : "ASSENTE"}`,
      ];

    case "gdpr_lawful_basis":
      return [
        `Privacy consent: ${ctx.hasPrivacyConsent ? "REGISTRATO — key: privacy_consent_v1" : "ASSENTE"}`,
      ];

    case "gdpr_audit_freshness":
      return [
        ctx.lastAuditDaysAgo !== null
          ? `Ultimo audit: ${ctx.lastAuditDaysAgo} giorni fa`
          : "Ultimo audit: MAI ESEGUITO",
        ctx.lastReportStatus !== null
          ? `Ultimo stato: ${ctx.lastReportStatus.toUpperCase()}`
          : "Stato audit: n/d",
      ];

    case "gdpr_immutable_logs":
      return [
        `Log immutabili: ${ctx.logsAreImmutable ? "SÌ — append-only verified" : "NO — mutabilità rilevata"}`,
      ];

    case "ai_act_human_oversight":
      return [
        `Azioni high-risk con approvazione umana: ${(ctx.approvedHighRiskRatio * 100).toFixed(1)}%`,
        `Soglia minima AI Act Art. 14: 95%`,
      ];

    case "ai_act_no_unblocked_critical":
      return [
        `Azioni critiche non bloccate: ${ctx.criticalUnblocked}`,
        `Azioni totali nel log: ${ctx.totalActions}`,
      ];

    case "ai_act_transparency":
      return [
        `Copertura spiegabilità AI: ${(ctx.explainabilityCoverage * 100).toFixed(1)}%`,
        `Soglia minima AI Act Art. 13: 70%`,
      ];

    case "ai_act_logging":
      return [
        `Log AI immutabili: ${ctx.logsAreImmutable ? "SÌ" : "NO"}`,
        `Azioni AI tracciate: ${ctx.totalActions}`,
      ];

    case "ai_act_bias_monitoring":
      return [
        `Modulo bias/fairness: ${ctx.hasBiasMonitoring ? "ATTIVO" : "NON IMPLEMENTATO"}`,
      ];

    case "agid_audit_logging":
      return [
        `Log strutturati AgID: ${ctx.logsAreImmutable ? "CONFORME" : "NON CONFORME"}`,
        `Attività tracciate: ${ctx.totalActions}`,
      ];

    case "agid_traceability":
      return [
        ctx.lastAuditDate !== null
          ? `Ultimo audit AgID: ${ctx.lastAuditDate.toISOString().slice(0, 10)}`
          : "Storico audit: ASSENTE — nessun ciclo ancora eseguito",
      ];

    case "agid_response_time":
      return [
        `Latenza media decisioni: ${Math.round(ctx.avgDecisionTimeMs)}ms`,
        `Soglia AgID § 2.1: < 10000ms`,
      ];

    default:
      return [];
  }
}

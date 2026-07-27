// runtime/audit/auditSimulator.ts
// Orchestratore del Simulatore Audit PA Live
// Applica scenari predefiniti (o custom) al ComplianceContext e genera il report PA

import type { ComplianceContext } from "../types";
import type { ComplianceDb }      from "../../types";
import type { AuditScenario, PALiveAuditReport } from "./types";
import { buildContext }    from "../context/contextBuilder";
import { evaluateAllRules } from "../evaluator/rulesEvaluator";
import { buildAuditReport } from "./auditEngine";

// ── Scenari predefiniti ───────────────────────────────────────────────────────

/**
 * Cinque scenari di simulazione per testare il sistema in condizioni diverse.
 * "production_live" non ha override — usa lo stato reale del DB di compliance.
 */
export const AUDIT_SCENARIOS: AuditScenario[] = [
  {
    id:          "production_live",
    label:       "Produzione Live",
    description: "Stato reale del sistema — nessun override applicato.",
    overrides:   {},
  },
  {
    id:          "fully_compliant",
    label:       "Scenario Ottimale",
    description: "Tutte le violazioni risolte — sistema certificabile PA.",
    overrides:   {
      hasBiasMonitoring:      true,
      lastAuditDaysAgo:       3,
      gdprViolations:         0,
      criticalUnblocked:      0,
      approvedHighRiskRatio:  1.0,
      explainabilityCoverage: 0.95,
      avgDecisionTimeMs:      800,
    },
  },
  {
    id:          "critical_ai",
    label:       "Violazione AI Act Critica",
    description: "Human oversight mancante + azioni critiche non bloccate.",
    overrides:   {
      approvedHighRiskRatio:  0.4,
      criticalUnblocked:      3,
      explainabilityCoverage: 0.2,
    },
  },
  {
    id:          "gdpr_breach",
    label:       "Violazione GDPR Grave",
    description: "Violazioni GDPR attive — privacy consent mancante, log non integri.",
    overrides:   {
      gdprViolations:         2,
      hasPrivacyConsent:      false,
      logsAreImmutable:       false,
      hasDataRetentionPolicy: false,
    },
  },
  {
    id:          "partial_compliance",
    label:       "Conformità Parziale",
    description: "Sistema parzialmente conforme — miglioramenti urgenti ma non bloccanti.",
    overrides:   {
      lastAuditDaysAgo:       45,
      explainabilityCoverage: 0.5,
      hasBiasMonitoring:      false,
      avgDecisionTimeMs:      12000,
    },
  },
];

// ── runAuditSimulation ────────────────────────────────────────────────────────

/**
 * Esegue la simulazione di audit PA applicando il ComplianceContext override
 * dello scenario scelto sopra al contesto reale derivato dal DB.
 *
 * @param db           Stato corrente del compliance database
 * @param scenarioId   ID dello scenario (da AUDIT_SCENARIOS) — default "production_live"
 * @returns            PALiveAuditReport strutturato come un verbale di revisore PA
 */
export function runAuditSimulation(
  db:          ComplianceDb,
  scenarioId:  string = "production_live",
): PALiveAuditReport {
  const scenario = AUDIT_SCENARIOS.find(s => s.id === scenarioId) ?? AUDIT_SCENARIOS[0];
  const baseCtx  = buildContext(db);

  // Override parziale: fields dello scenario sovrascrivono quelli del db reale
  const ctx: ComplianceContext = { ...baseCtx, ...scenario.overrides };

  const result    = evaluateAllRules(ctx);
  const auditType = scenarioId === "production_live" ? "live" : "simulato";

  return buildAuditReport(result, ctx, scenarioId, scenario.label, auditType);
}

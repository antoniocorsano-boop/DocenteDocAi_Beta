// runtime/violations/violationEngine.ts
// Trasforma i risultati delle regole in ComplianceViolation con suggerimenti di remediation

import type { ComplianceRule, ComplianceViolation } from "../types";

type EvaluatedRule = {
  rule: ComplianceRule;
  pass: boolean;
  message?: string;
};

const REMEDIATION_MAP: Partial<Record<string, ComplianceViolation["remediationAction"]>> = {
  gdpr_no_violations:         "contact_dpo",
  gdpr_audit_freshness:       "run_compliance_cycle",
  ai_act_human_oversight:     "enable_human_approval",
  ai_act_no_unblocked_critical: "enable_human_approval",
  agid_audit_logging:         "run_compliance_cycle",
  agid_traceability:          "run_compliance_cycle",
};

const FIX_MAP: Record<string, string> = {
  gdpr_no_violations:
    "Avviare procedura DPO entro 72h (GDPR Art. 33). " +
    "Eseguire audit immediato e notificare il responsabile del trattamento.",
  gdpr_data_retention:
    "Assicurarsi che src/utils/dataRetention.ts sia importato e chiamato in main.tsx. " +
    "Configurare cleanup automatico degli artefatti AI dopo 365 giorni.",
  gdpr_lawful_basis:
    "Attivare PrivacyConsentModal al primo avvio (localStorage key: privacy_consent_v1). " +
    "Verificare che hasPrivacyConsent() ritorni true prima di qualsiasi trattamento.",
  gdpr_audit_freshness:
    "Eseguire un ciclo di audit: ComplianceAgent.runComplianceCycle('day'). " +
    "Considerare un ciclo automatico giornaliero per garantire la accountability.",
  gdpr_immutable_logs:
    "Verificare che complianceDb.addActivity() sia l'unico punto di scrittura. " +
    "Non modificare mai db.activities direttamente — usare sempre le pure functions in complianceDb.ts.",
  ai_act_human_oversight:
    "Abilitare ApprovalQueueStore per le azioni ad alto rischio. " +
    "Ogni azione con riskLevel 'high' deve passare per l'ApprovationFlow prima dell'esecuzione.",
  ai_act_no_unblocked_critical:
    "Aggiornare ActionRegistry per bloccare automaticamente tutte le azioni con riskLevel 'critical'. " +
    "Verificare che blocked === true per ogni SystemActivity con riskLevel === 'critical'.",
  ai_act_transparency:
    "Estendere ExplainabilityPanel per coprire tutte le azioni AI. " +
    "Target: explainabilityCoverage ≥ 0.7. Impostare explainable: true in ogni SystemActivity.",
  ai_act_logging:
    "Verificare che complianceAgent.logActivity() sia chiamato per ogni azione AI del sistema. " +
    "Il log deve essere completo: nessuna azione deve sfuggire alla registrazione.",
  ai_act_bias_monitoring:
    "Implementare un audit di fairness periodico. " +
    "Estendere riskMonitor.ts con metriche di equità sulla distribuzione delle raccomandazioni per classe/gruppo.",
  agid_audit_logging:
    "Confermare che complianceDb.addActivity() e addReport() siano chiamati regolarmente. " +
    "I log devono essere esportabili e verificabili (auditExporter.ts).",
  agid_traceability:
    "Eseguire almeno un ciclo di audit: complianceAgent.runComplianceCycle('month'). " +
    "Configurare un job periodico (es. setInterval in main.tsx) per cicli automatici.",
  agid_response_time:
    "Ottimizzare le chiamate LLM: implementare caching delle risposte, timeout aggressivi, " +
    "e fallback a modelli più veloci quando la latenza supera la soglia.",
};

/** Converte le regole fallite in violazioni strutturate con suggerimenti di fix. */
export function buildViolations(evaluated: EvaluatedRule[]): ComplianceViolation[] {
  return evaluated
    .filter(e => !e.pass)
    .map(e => ({
      ruleId:            e.rule.id,
      framework:         e.rule.framework,
      article:           e.rule.article,
      severity:          e.rule.severity,
      message:           e.message ?? e.rule.description,
      suggestedFix:      FIX_MAP[e.rule.id] ?? "Verificare la documentazione della regola.",
      remediationAction: REMEDIATION_MAP[e.rule.id],
    }));
}

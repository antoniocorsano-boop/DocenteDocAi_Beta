// runtime/audit/auditEngine.ts
// Trasforma un ComplianceRuntimeResult nel report formale di un revisore PA esterno

import type { ComplianceRuntimeResult, RuleFramework, FrameworkScore, ComplianceContext } from "../types";
import type {
  PALiveAuditReport,
  AuditFinding,
  ComplianceStatusPA,
  CertificationReadiness,
} from "./types";
import { mapToPASeverity, isBlockingFinding } from "./severityMapper";
import { generateRecommendations }            from "./recommendationEngine";
import { collectEvidence }                    from "./evidenceCollector";

// ── Note PA per ogni regola ───────────────────────────────────────────────────
// Cosa scriverebbe un revisore PA esterno nel verbale ufficiale.

const PA_NOTES: Record<string, string> = {
  gdpr_no_violations:
    "Il sistema ha segnalato violazioni GDPR attive. Questo costituisce motivo di sospensione " +
    "dell'autorizzazione al trattamento in attesa di verifica DPO (art. 33 GDPR — notifica entro 72h).",
  gdpr_data_retention:
    "Assenza di policy di retention documentata e verificabile. Non conformità GDPR Art. 5(1)(e) — " +
    "i dati non vengono eliminati automaticamente secondo schedule certificato.",
  gdpr_lawful_basis:
    "Nessuna base giuridica documentata per il trattamento. Il sistema raccoglie dati senza " +
    "consenso verificabile dall'ente — trattamento potenzialmente illecito ex GDPR Art. 6.",
  gdpr_audit_freshness:
    "Verifica di accountability troppo datata per essere considerata valida. GDPR Art. 5(2) richiede " +
    "dimostrazione continua della conformità — frequenza mensile raccomandata per sistemi PA.",
  gdpr_immutable_logs:
    "I log di trattamento non garantiscono integrità verificabile — rischio di alterazione o " +
    "cancellazione non autorizzata dei dati di trattamento. Impedisce audit ex-post.",
  ai_act_human_oversight:
    "Supervisione umana insufficiente su sistemi ad alto rischio. Requisito bloccante AI Act Art. 14 — " +
    "il sistema non è certificabile nello stato attuale per utilizzo in contesti PA.",
  ai_act_no_unblocked_critical:
    "Azioni critiche non bloccate in attesa di supervisione umana. Violazione grave AI Act Art. 9 — " +
    "potenziale danno immediato agli utenti finali. Sospensione operativa raccomandata.",
  ai_act_transparency:
    "Copertura spiegabilità inferiore alla soglia minima del 70%. Il sistema non può giustificare " +
    "le proprie raccomandazioni agli utenti finali o all'Autorità Nazionale per l'IA.",
  ai_act_logging:
    "Tracciabilità delle decisioni AI insufficiente. Impedisce la verifica ex-post da parte " +
    "dell'Autorità Nazionale per l'IA come previsto da AI Act Art. 12.",
  ai_act_bias_monitoring:
    "Nessun sistema di monitoraggio equità/bias implementato. Rischio di discriminazione " +
    "algoritmica non quantificabile — non conformità al principio di non discriminazione PA.",
  agid_audit_logging:
    "Log di sistema assenti o non strutturati secondo standard AgID. Non conformità alle " +
    "Linee Guida AgID per sistemi informativi della Pubblica Amministrazione.",
  agid_traceability:
    "Assenza di traccia di audit AgID-compliant. Il sistema non può dimostrare la propria " +
    "storia operativa all'ente certificatore — ostacolo all'iter di accreditamento CAF.",
  agid_response_time:
    "Latenza media superiore ai limiti AgID per sistemi PA. Impatta la qualità del servizio " +
    "pubblico e l'esperienza utente — non conforme alle Linee Guida AgID Performance § 2.1.",
};

// ── Calcolo stato PA ──────────────────────────────────────────────────────────

function computeComplianceStatus(
  score: number,
  blockingCount: number,
): ComplianceStatusPA {
  if (score >= 80 && blockingCount === 0) return "CONFORME";
  if (score >= 55 && blockingCount <= 1)  return "PARZIALMENTE_CONFORME";
  return "NON_CONFORME";
}

function computeCertificationReadiness(
  score: number,
  complianceStatus: ComplianceStatusPA,
): CertificationReadiness {
  if (complianceStatus === "CONFORME")                  return "PRONTO";
  if (score >= 60 && complianceStatus !== "NON_CONFORME") return "CONDIZIONATO";
  return "NON_PRONTO";
}

// ── buildAuditReport ──────────────────────────────────────────────────────────

/**
 * Costruisce il PALiveAuditReport dal risultato della valutazione runtime.
 * Arricchisce ogni violazione con la nota PA e il livello di severità PA.
 * Ordina i findings: bloccanti prima, poi migliorativi.
 *
 * @param result       Output di evaluateAllRules()
 * @param scenarioId   ID dello scenario attivo
 * @param scenarioLabel Etichetta leggibile dello scenario
 * @param auditType    "live" per produzione, "simulato" per scenari override
 */
export function buildAuditReport(
  result:        ComplianceRuntimeResult,
  ctx:           ComplianceContext,
  scenarioId:    string,
  scenarioLabel: string,
  auditType:     PALiveAuditReport["auditType"],
): PALiveAuditReport {

  // Costruisci i findings PA dalle violazioni
  const findings: AuditFinding[] = result.violations.map(v => {
    const paSeverity = mapToPASeverity(v.severity);
    return {
      ruleId:            v.ruleId,
      framework:         v.framework,
      article:           v.article,
      description:       v.message,
      severity:          paSeverity,
      blocking:          isBlockingFinding(paSeverity),
      suggestedFix:      v.suggestedFix,
      remediationAction: v.remediationAction,
      paNote:            PA_NOTES[v.ruleId] ?? "Verificare la documentazione tecnica e normativa della regola.",
      evidence:          collectEvidence(ctx, v.ruleId),
      // Propaga il Use Case dal contesto → abilita analytics "violazioni per UC"
      useCaseId:         ctx.useCase,
    };
  });

  // Ordina: bloccanti (blocking=true) prima
  findings.sort((a, b) => (a.blocking === b.blocking ? 0 : a.blocking ? -1 : 1));

  const blockingCount  = findings.filter(f => f.blocking).length;
  const improvingCount = findings.filter(f => !f.blocking).length;

  // Normalizza frameworkScores a soli valori numerici (come da spec JSON)
  const frameworkScores: Record<RuleFramework, number> = (
    Object.entries(result.frameworkScores) as [RuleFramework, FrameworkScore][]
  ).reduce(
    (acc, [fw, fs]) => ({ ...acc, [fw]: fs.score }),
    {} as Record<RuleFramework, number>,
  );

  const complianceStatus      = computeComplianceStatus(result.liveScore, blockingCount);
  const certificationReadiness = computeCertificationReadiness(result.liveScore, complianceStatus);

  const recommendations = generateRecommendations(result.violations, {
    overallScore:           result.liveScore,
    blockingCount,
    certificationReadiness,
  });

  return {
    auditDate:              result.evaluatedAt,
    auditType,
    scenarioId,
    scenarioLabel,
    overallScore:           result.liveScore,
    complianceStatus,
    certificationReadiness,
    frameworkScores,
    totalRules:             result.totalRules,
    passedRules:            result.passedRules,
    findings,
    blockingCount,
    improvingCount,
    recommendations,
    generatedBy:            "DocenteDoc AI Self-Compliance Engine v1",
  };
}

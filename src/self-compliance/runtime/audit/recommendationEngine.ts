// runtime/audit/recommendationEngine.ts
// Genera raccomandazioni contestuali per il report PA — tono da revisore esterno

import type { ComplianceViolation } from "../types";
import type { PALiveAuditReport } from "./types";

/** Raccomandazione specifica per ogni regola che fallisce */
const RULE_RECOMMENDATIONS: Record<string, string> = {
  gdpr_no_violations:
    "Attivare procedura DPO (Art. 33 GDPR) entro 72h e sospendere il trattamento non conforme fino a validazione.",
  gdpr_data_retention:
    "Formalizzare e documentare la policy di data retention in accordo con GDPR Art. 5(1)(e) — scadenza: 365 giorni per gli artefatti AI.",
  gdpr_lawful_basis:
    "Implementare e documentare la base giuridica del trattamento prima di qualsiasi raccolta dati (GDPR Art. 6).",
  gdpr_audit_freshness:
    "Pianificare cicli di audit mensili automatici per mantenere la dimostrazione continua di accountability (GDPR Art. 5(2)).",
  gdpr_immutable_logs:
    "Adottare architettura di logging append-only con verificabilità crittografica (hash-chain o WORM storage).",
  ai_act_human_oversight:
    "Implementare coda di approvazione umana obbligatoria per tutte le azioni AI ad alto rischio (AI Act Art. 14).",
  ai_act_no_unblocked_critical:
    "Bloccare immediatamente le azioni critiche non approvate — requisito inderogabile AI Act Art. 9 per sistemi ad Alto Rischio.",
  ai_act_transparency:
    "Estendere il pannello di spiegabilità AI per coprire almeno il 70% delle decisioni e renderle verificabili (AI Act Art. 13).",
  ai_act_logging:
    "Garantire registrazione strutturata e completa di ogni decisione AI nel log di compliance per verifica ex-post (AI Act Art. 12).",
  ai_act_bias_monitoring:
    "Sviluppare e integrare un modulo di fairness audit per rilevare e quantificare bias algoritmici nelle raccomandazioni.",
  agid_audit_logging:
    "Allineare la struttura dei log agli standard AgID CAF e garantire esportabilità per ispezione dell'ente certificatore.",
  agid_traceability:
    "Completare almeno un ciclo di audit AgID-compliant e pianificare cicli mensili automatici tramite job schedulato.",
  agid_response_time:
    "Ottimizzare le chiamate AI con caching delle risposte, timeout aggressivi e fallback a modelli più veloci (<10s).",
};

/** Raccomandazioni contestuali basate su pattern trasversali */
function buildContextualRecommendations(
  violations: ComplianceViolation[],
  report: Pick<PALiveAuditReport, "overallScore" | "blockingCount" | "certificationReadiness">,
): string[] {
  const recs: string[] = [];

  if (report.certificationReadiness === "NON_PRONTO") {
    recs.push(
      "Per ottenere la certificazione PA, risolvere prima tutte le criticità Bloccanti (High + Critical) — " +
      "rappresentano un impedimento formale alla messa in esercizio del sistema.",
    );
  }

  if (violations.some(v => v.framework === "GDPR")) {
    recs.push(
      "Prioritizzare la conformità GDPR: è prerequisito legale per qualsiasi trattamento dati e " +
      "per procedere con la certificazione PA.",
    );
  }

  if (violations.some(v => v.framework === "AI_ACT" && v.severity === "critical")) {
    recs.push(
      "Le violazioni AI Act critiche impediscono l'uso del sistema in contesti PA — " +
      "sospendere le funzionalità AI ad alto rischio fino a risoluzione.",
    );
  }

  if (report.blockingCount === 0 && report.overallScore >= 70) {
    recs.push(
      "Il sistema ha superato la soglia minima — avviare la procedura di pre-certificazione " +
      "informale con l'ente di supervisione competente.",
    );
  }

  if (report.overallScore >= 80 && report.blockingCount === 0) {
    recs.push(
      "Integrare i log di compliance nel Registro dei Trattamenti GDPR (Art. 30) per " +
      "accelerare l'iter di certificazione PA e dimostrare accountability strutturale.",
    );
  }

  return recs;
}

/**
 * Genera l'elenco di raccomandazioni per il report PA.
 * Combina raccomandazioni specifiche per regola + raccomandazioni contestuali basate su pattern.
 *
 * @returns Array deduplicato di stringhe di raccomandazione in italiano.
 */
export function generateRecommendations(
  violations: ComplianceViolation[],
  report: Pick<PALiveAuditReport, "overallScore" | "blockingCount" | "certificationReadiness">,
): string[] {
  const recs: string[] = [];

  for (const v of violations) {
    const rec = RULE_RECOMMENDATIONS[v.ruleId];
    if (rec) recs.push(rec);
  }

  recs.push(...buildContextualRecommendations(violations, report));

  // Deduplica mantenendo l'ordine
  return [...new Set(recs)];
}

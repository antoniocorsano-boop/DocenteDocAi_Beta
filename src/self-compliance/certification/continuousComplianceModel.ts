// certification/continuousComplianceModel.ts
// Modello compliance continua: cicli audit, escalation, integrazione PA

import type { ContinuousComplianceModel, EscalationRule } from "./types";

const ESCALATION_RULES: EscalationRule[] = [
  {
    triggerCondition:
      "CRITICAL unmitigated risk rilevato (es. DPA mancante, GDPR violation)",
    severity: "critical",
    escalationTarget: "DPO + Responsabile trattamento dati",
    responseTimeHours: 4,
    automatedAction:
      "Alert automatico via Self-Compliance Engine → riskMonitor → ComplianceAgent",
  },
  {
    triggerCondition:
      "Compliance score < 50 per 2 cicli consecutivi",
    severity: "high",
    escalationTarget: "Responsabile ICT PA + Fornitore",
    responseTimeHours: 24,
    automatedAction:
      "Flag COMPLIANCE_DEGRADED in ComplianceStore → notifica nella dashboard",
  },
  {
    triggerCondition:
      "Override rate docente > 30% (sistema troppo invasivo o unreliable)",
    severity: "medium",
    escalationTarget: "Team AI Product",
    responseTimeHours: 72,
    automatedAction:
      "RiskAlert MEDIUM generato da riskMonitor con categoria override_rate_high",
  },
  {
    triggerCondition:
      "Explainability score < 70% per ciclo mensile",
    severity: "medium",
    escalationTarget: "Team AI Product + Qualità",
    responseTimeHours: 72,
    automatedAction:
      "RiskAlert MEDIUM generato da riskMonitor con categoria explainability_low",
  },
  {
    triggerCondition:
      "Mancato aggiornamento documentazione AI Act per > 30 giorni da modifica sistema",
    severity: "low",
    escalationTarget: "Responsabile Compliance",
    responseTimeHours: 168,
    automatedAction: "Nessuna azione automatica — reminder manuale richiesto",
  },
];

export function buildContinuousComplianceModel(): ContinuousComplianceModel {
  return {
    generatedAt: new Date().toISOString().slice(0, 10),

    auditCycles: [
      {
        frequency: "daily",
        type: "automated_metrics",
        description:
          "Ciclo automatico giornaliero: raccolta metriche (collectMetrics), " +
          "monitoraggio rischi (monitorRisks), valutazione (evaluateCompliance). " +
          "Eseguito da ComplianceAgent.runComplianceCycle('day'). " +
          "Report salvato in ComplianceDb con retention 90 cicli.",
        owner: "Sistema (Self-Compliance Engine)",
        artifacts: ["ComplianceReport giornaliero", "RiskAlert se presenti"],
      },
      {
        frequency: "weekly",
        type: "open_data_export",
        description:
          "Export settimanale dei dati di compliance in formato DCAT-AP_IT " +
          "tramite openDataPublisher. Pubblicazione su portale open data PA. " +
          "Solo dati aggregati GDPR-safe.",
        owner: "Sistema (automatico) + Responsabile Open Data (validazione)",
        artifacts: ["OpenDataExport JSON", "Dataset compliance metrics"],
      },
      {
        frequency: "monthly",
        type: "formal_audit_report",
        description:
          "Audit formale mensile: generazione CertificationPackage completo, " +
          "export AuditExport, revisione manuale da parte del Responsabile Compliance. " +
          "Verifica gap analysis vs mese precedente. Tracciamento progress pathTo100.",
        owner: "Responsabile Compliance PA + Fornitore",
        artifacts: [
          "CertificationPackage JSON",
          "AuditExport JSON (firmabile digitalmente)",
          "Report gap analysis delta",
        ],
      },
      {
        frequency: "quarterly",
        type: "normative_review",
        description:
          "Revisione trimestrale della conformità normativa: verifica aggiornamenti " +
          "AI Act, GDPR, linee guida AgID. Aggiornamento gapAnalyzer e readinessScorer. " +
          "Riallineamento politiche interne alla PA.",
        owner: "DPO + Responsabile Compliance + Fornitore",
        artifacts: ["Gap analysis aggiornata", "Roadmap remediation aggiornata"],
      },
      {
        frequency: "annual",
        type: "full_compliance_review",
        description:
          "Audit annuale completo: revisione DPIA, aggiornamento RoPA, verifica DPA con LLM provider, " +
          "penetration test, revisione policy formazione PA. " +
          "Produce documento 'Dichiarazione di Conformità Annuale'.",
        owner: "DPO + Responsabile trattamento + eventuale auditor esterno",
        artifacts: [
          "DPIA aggiornata",
          "RoPA aggiornato",
          "DPA firmati con LLM provider",
          "Report pentest",
          "Dichiarazione conformità annuale",
        ],
      },
    ],

    escalationRules: ESCALATION_RULES,

    integrationWithPA: [
      {
        authority: "AGID (Agenzia per l'Italia Digitale)",
        obligation:
          "Notifica pre-utilizzo sistema IA ad Alto Rischio per PA (AI Act Art. 26(6)). " +
          "Registrazione nel database nazionale sistemi AI (in corso di istituzione).",
        deadline: "Prima del deploy in produzione PA",
        status: "missing",
      },
      {
        authority: "Garante Privacy",
        obligation:
          "Consultazione preventiva per DPIA (GDPR Art. 36) se residual risk alto. " +
          "Notifica violazioni dati entro 72h (Art. 33).",
        deadline: "Prima del deploy + ongoing",
        status: "partial",
      },
      {
        authority: "Istituzione Scolastica PA",
        obligation:
          "Nomina DPO (GDPR Art. 37). " +
          "Stipula DPA con fornitori LLM (GDPR Art. 28). " +
          "Formazione personale docente sull'uso del sistema AI.",
        deadline: "Prima del deploy + 30gg dall'attivazione",
        status: "missing",
      },
      {
        authority: "Agenzia Nazionale Cybersicurezza (ACN)",
        obligation:
          "Conformità misure minime di sicurezza ICT per la PA. " +
          "Eventuale assessment NIS2 se l'istituzione rientra nel perimetro.",
        deadline: "Variabile — verificare con l'istituzione",
        status: "partial",
      },
    ],

    maturityLevels: [
      {
        level: 1,
        name: "Initial — Compliance di base",
        description:
          "Il sistema è operativo con supervisione umana, logging e trasparenza. " +
          "Self-Compliance Engine attivo. Metriche raccolte automaticamente.",
        currentlyAt: true,
        requiredGaps: [],
      },
      {
        level: 2,
        name: "Documented — Documentazione formale",
        description:
          "Documentazione tecnica AI Act completa (Art. 11). " +
          "DPIA formale approvata. RoPA registrato. " +
          "DPA firmati con ogni LLM provider.",
        currentlyAt: false,
        requiredGaps: [
          "Art. 28 GDPR — DPA con LLM provider",
          "Art. 30 GDPR — RoPA",
          "Art. 35 GDPR — DPIA approvata",
          "AI Act Art. 11 — Documentazione tecnica completa",
        ],
      },
      {
        level: 3,
        name: "Managed — Governance completa",
        description:
          "DPO nominato. Formazione docenti completata. " +
          "Notifica AGID e registrazione sistema AI. " +
          "Processo incident notification attivo.",
        currentlyAt: false,
        requiredGaps: [
          "Art. 37 GDPR — DPO nominato",
          "AI Act Art. 26(6) — Notifica AGID",
          "AgID linee guida — Formazione PA",
          "Art. 33 GDPR — Processo incident notification formalizzato",
        ],
      },
      {
        level: 4,
        name: "Quantified — Metriche e audit esterni",
        description:
          "Audit esterno indipendente. " +
          "Open data pubblicati regolarmente su dati.gov.it. " +
          "Pentest completato. Dichiarazione accessibilità AgID pubblicata.",
        currentlyAt: false,
        requiredGaps: [
          "Pentest esterno",
          "Dichiarazione accessibilità AgID",
          "Open data su portale nazionale",
          "Audit indipendente (opzionale ma raccomandato)",
        ],
      },
      {
        level: 5,
        name: "Optimizing — Eccellenza operativa",
        description:
          "ISO 42001 in progress o certificato. " +
          "Feedback loop docenti integrato nel miglioramento continuo del modello. " +
          "Partnership con DAE (Digital Academy Education) per best practice.",
        currentlyAt: false,
        requiredGaps: [
          "ISO 42001 project management",
          "Feedback loop strutturato",
          "Report annuale trasparenza pubblicato",
        ],
      },
    ],
  };
}

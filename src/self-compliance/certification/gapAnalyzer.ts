// certification/gapAnalyzer.ts
// Gap Analysis: GDPR · AI Act · AgID · ISO 42001

import type { GapAnalysis, GapItem } from "./types";

const GAP_ITEMS: GapItem[] = [
  // GDPR
  {
    id: "gap_gdpr_1",
    standard: "GDPR",
    article: "Art. 13",
    requirement: "Informativa completa agli interessati al momento della raccolta dati",
    status: "partial",
    evidence: "PrivacyConsentModal presente per docenti",
    action: "Aggiungere informativa specifica per studenti minorenni e famiglie",
    priority: "high",
  },
  {
    id: "gap_gdpr_2",
    standard: "GDPR",
    article: "Art. 25",
    requirement: "Privacy by Design e Privacy by Default",
    status: "compliant",
    evidence: "Storage solo locale, nessun PII in LLM, retention automatica, minimizzazione dati",
    priority: "low",
  },
  {
    id: "gap_gdpr_3",
    standard: "GDPR",
    article: "Art. 28",
    requirement: "Data Processing Agreement con responsabili del trattamento (LLM provider)",
    status: "missing",
    action: "Stipulare DPA con Google (Gemini) e Anthropic prima del deploy PA",
    priority: "high",
  },
  {
    id: "gap_gdpr_4",
    standard: "GDPR",
    article: "Art. 30",
    requirement: "Registro delle attività di trattamento",
    status: "missing",
    action: "Predisporre registro formale trattamenti dati (RoPA) per la PA committente",
    priority: "high",
  },
  {
    id: "gap_gdpr_5",
    standard: "GDPR",
    article: "Art. 33",
    requirement: "Notifica violazione dati al Garante entro 72h",
    status: "partial",
    evidence: "riskMonitor rileva gdprViolation con alert CRITICAL",
    action: "Implementare procedura guidata di notifica al Garante",
    priority: "high",
  },
  {
    id: "gap_gdpr_6",
    standard: "GDPR",
    article: "Art. 35",
    requirement: "Data Protection Impact Assessment (DPIA)",
    status: "partial",
    evidence: "DPIA in generazione automatica (dpiaGenerator.ts)",
    action: "Approvazione formale DPIA da DPO nominato dalla PA",
    priority: "high",
  },
  {
    id: "gap_gdpr_7",
    standard: "GDPR",
    article: "Art. 37",
    requirement: "Nomina del Responsabile della Protezione dei Dati (DPO)",
    status: "missing",
    action: "La PA committente deve nominare DPO e comunicarlo al Garante",
    priority: "high",
  },
  {
    id: "gap_gdpr_8",
    standard: "GDPR",
    article: "Art. 17",
    requirement: "Diritto alla cancellazione (right to erasure)",
    status: "missing",
    action: "Implementare UI per la cancellazione dei dati su richiesta dell'interessato",
    priority: "medium",
  },

  // AI ACT
  {
    id: "gap_ai_1",
    standard: "AI Act",
    article: "Art. 9",
    requirement: "Sistema di gestione del rischio documentato per ciclo di vita AI",
    status: "compliant",
    evidence: "Self-Compliance Engine attivo: riskMonitor, complianceBrain, auditExporter",
    priority: "low",
  },
  {
    id: "gap_ai_2",
    standard: "AI Act",
    article: "Art. 11",
    requirement: "Documentazione tecnica completa e aggiornata",
    status: "partial",
    evidence: "Documentazione in generazione (certificationPackage)",
    action: "Finalizzare e depositare documentazione tecnica formale",
    priority: "high",
  },
  {
    id: "gap_ai_3",
    standard: "AI Act",
    article: "Art. 12",
    requirement: "Logging automatico durante il funzionamento",
    status: "compliant",
    evidence: "complianceDb: rolling log 1000 attività con timestamp, tipo, rischio, esito",
    priority: "low",
  },
  {
    id: "gap_ai_4",
    standard: "AI Act",
    article: "Art. 13",
    requirement: "Trasparenza e informazione agli utenti sull'IA",
    status: "compliant",
    evidence: "ExplainabilityPanel: confidence, reasons, dataUsed, normativeRef",
    priority: "low",
  },
  {
    id: "gap_ai_5",
    standard: "AI Act",
    article: "Art. 14",
    requirement: "Supervisione umana effettiva durante il funzionamento",
    status: "compliant",
    evidence: "ApprovalQueueStore, guided execution, nessuna azione autonoma ad alto rischio",
    priority: "low",
  },
  {
    id: "gap_ai_6",
    standard: "AI Act",
    article: "Art. 49",
    requirement: "Registrazione nel database EU prima del deploy",
    status: "missing",
    action: "Completare registrazione nel database EU AI Act (disponibile da agosto 2026)",
    priority: "medium",
  },
  {
    id: "gap_ai_7",
    standard: "AI Act",
    article: "Art. 26(6)",
    requirement: "Formazione degli utenti PA sull'uso del sistema AI",
    status: "missing",
    action: "Predisporre piano formazione obbligatoria per docenti/deployer PA",
    priority: "high",
  },
  {
    id: "gap_ai_8",
    standard: "AI Act",
    article: "Art. 62",
    requirement: "Notifica incidenti gravi all'autorità di vigilanza",
    status: "missing",
    action: "Implementare procedura di notifica automatica ad AgID/AGID",
    priority: "medium",
  },

  // AgID
  {
    id: "gap_agid_1",
    standard: "AgID",
    article: "Linee Guida IA PA (2024)",
    requirement: "Registro trattamenti automatizzati con impatto su terzi",
    status: "partial",
    evidence: "complianceDb traccia attività, mancante formato standard AgID",
    action: "Produrre registro in formato AgID-compatibile",
    priority: "medium",
  },
  {
    id: "gap_agid_2",
    standard: "AgID",
    article: "CAD Art. 32",
    requirement: "Misure minime di sicurezza ICT per la PA",
    status: "partial",
    evidence: "HTTPS, auth Google OAuth, nessun backend proprio",
    action: "Certificazione misure minime sicurezza AgID, pentest",
    priority: "high",
  },
  {
    id: "gap_agid_3",
    standard: "AgID",
    article: "PNRR — Accessibilità PA",
    requirement: "Dichiarazione di accessibilità per siti/app PA",
    status: "missing",
    action: "Audit accessibilità WCAG 2.1 AA + dichiarazione AgID",
    priority: "medium",
  },
  {
    id: "gap_agid_4",
    standard: "AgID",
    article: "Open Data D.Lgs. 36/2006",
    requirement: "Pubblicazione open data in formato DCAT-AP_IT",
    status: "compliant",
    evidence: "openDataPublisher.ts genera JSON DCAT-AP_IT conforme",
    priority: "low",
  },

  // ISO 42001
  {
    id: "gap_iso_1",
    standard: "ISO/IEC 42001",
    article: "§ 6.1",
    requirement: "Risk assessment e risk treatment per sistemi AI governance",
    status: "compliant",
    evidence: "riskAssessment.ts + Self-Compliance Engine implementati",
    priority: "low",
  },
  {
    id: "gap_iso_2",
    standard: "ISO/IEC 42001",
    article: "§ 9.1",
    requirement: "Monitoraggio, misurazione, analisi e valutazione continua",
    status: "compliant",
    evidence: "ComplianceAgent.runComplianceCycle(), snapshot periodici, metricsCollector",
    priority: "low",
  },
  {
    id: "gap_iso_3",
    standard: "ISO/IEC 42001",
    article: "§ 8.4",
    requirement: "Gestione del ciclo di vita del sistema AI (training, deployment, retirement)",
    status: "partial",
    evidence: "Deployment su Vercel gestito. Mancante: piano formale di dismissione/aggiornamento",
    action: "Definire policy di lifecycle management del sistema AI",
    priority: "medium",
  },
];

export function generateGapAnalysis(): GapAnalysis {
  const compliantCount = GAP_ITEMS.filter(i => i.status === "compliant").length;
  const partialCount   = GAP_ITEMS.filter(i => i.status === "partial").length;
  const missingCount   = GAP_ITEMS.filter(i => i.status === "missing").length;
  const total          = GAP_ITEMS.length;
  const complianceRate = Math.round(
    ((compliantCount + partialCount * 0.5) / total) * 100,
  );

  return {
    date:            new Date().toISOString().slice(0, 10),
    standards:       ["GDPR", "AI Act", "AgID", "ISO/IEC 42001"],
    items:           GAP_ITEMS,
    compliantCount,
    partialCount,
    missingCount,
    complianceRate,
  };
}

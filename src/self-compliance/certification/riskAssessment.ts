// certification/riskAssessment.ts
// AI Risk Assessment — rischi tecnici, etici, legali, operativi

import type { AIRiskAssessment, SystemRisk } from "./types";

const RISKS: SystemRisk[] = [
  // TECNICI
  {
    id: "risk_t1",
    category: "technical",
    title: "Allucinazioni LLM nei suggerimenti didattici",
    description:
      "Il modello LLM (Gemini/Anthropic) può generare contenuti plausibili ma fattualmente " +
      "errati o pedagogicamente inadeguati.",
    affectedComponent: "copilotBrain → api/ai.ts → LLM provider",
    severity: "high",
    mitigationStatus: "implemented",
    mitigationDescription:
      "ExplainabilityPanel mostra confidence score. Supervisione umana obbligatoria. " +
      "Tutte le azioni richiedono conferma docente. Nessuna azione autonoma su dati studenti.",
    standard: "AI Act Art. 9, Art. 15",
  },
  {
    id: "risk_t2",
    category: "technical",
    title: "Dipendenza totale da provider LLM esterno",
    description:
      "Indisponibilità o cambiamento API di Gemini/Anthropic causa interruzione servizio AI.",
    affectedComponent: "api/ai.ts",
    severity: "medium",
    mitigationStatus: "partial",
    mitigationDescription:
      "Gestione errori e fallback UI presenti. Mancante: provider di backup, " +
      "modalità offline degradata con funzioni base senza AI.",
    standard: "ISO/IEC 27001 A.17 (Business Continuity)",
  },
  {
    id: "risk_t3",
    category: "technical",
    title: "Perdita dati da localStorage browser eviction",
    description:
      "Il browser può cancellare localStorage sotto pressione di storage (quota exceeded).",
    affectedComponent: "tutti gli Zustand store con persist",
    severity: "medium",
    mitigationStatus: "implemented",
    mitigationDescription:
      "Google Drive backup, export manuale, service worker PWA. " +
      "dataRetention.ts gestisce cleanup ordinato.",
    standard: "ISO/IEC 27001 A.12.3 (Backup)",
  },
  {
    id: "risk_t4",
    category: "technical",
    title: "Esposizione indiretta di PII tramite prompt LLM",
    description:
      "Il contenuto dei prompt potrebbe contenere informazioni identificative se costruiti " +
      "con dati studenti non opportunamente filtrati.",
    affectedComponent: "api/ai.ts (proxy Edge Function)",
    severity: "high",
    mitigationStatus: "partial",
    mitigationDescription:
      "API proxy server-side evita esposizione chiavi. Mancante: " +
      "strato di sanitizzazione/anonimizzazione dei prompt prima dell'invio all'LLM.",
    standard: "GDPR Art. 25 (Privacy by Design), AI Act Art. 10",
  },

  // ETICI
  {
    id: "risk_e1",
    category: "ethical",
    title: "Bias nei suggerimenti AI verso profili studente stereotipati",
    description:
      "Il modello LLM potrebbe replicare bias sistemici (genere, etnia, disabilità) " +
      "nei suggerimenti didattici.",
    affectedComponent: "copilotBrain, rankingEngine",
    severity: "high",
    mitigationStatus: "partial",
    mitigationDescription:
      "Nessun dato demografico usato nel ranking. Mancante: " +
      "audit di fairness periodico, test su distribuzioni demografiche.",
    standard: "AI Act Art. 9 (bias), Charter EU Art. 21 (non-discriminazione)",
  },
  {
    id: "risk_e2",
    category: "ethical",
    title: "Over-automazione che riduce l'autonomia professionale del docente",
    description:
      "Un sistema troppo 'invasivo' rischia di degradare il giudizio pedagogico professionale " +
      "del docente nel lungo periodo.",
    affectedComponent: "IntelligentDashboard, CopilotDocentePanel",
    severity: "medium",
    mitigationStatus: "implemented",
    mitigationDescription:
      "Tutti i suggerimenti sono presentati come supporto, non come direttive. " +
      "Docente può ignorare, modificare o bloccare qualsiasi azione.",
    standard: "AI Act Considerando (49), UNESCO Rec. AI in Education",
  },
  {
    id: "risk_e3",
    category: "ethical",
    title: "Mancanza di equità algoritmica nei report studente",
    description:
      "Analisi AI su studenti potrebbe enfatizzare deficit senza considerare contesto socioeconomico.",
    affectedComponent: "AI analysis pipeline",
    severity: "medium",
    mitigationStatus: "missing",
    mitigationDescription:
      "Mancante: indicatori di equità (fairness metrics) nel ComplianceEngine. " +
      "Da implementare: flag automatico se pattern di valutazione mostrano asimmetrie sistematiche.",
    standard: "UNESCO Recommendation on AI Ethics (2021)",
  },

  // LEGALI
  {
    id: "risk_l1",
    category: "legal",
    title: "Mancanza di DPA con provider LLM",
    description:
      "Assenza di Data Processing Agreement formale con Google (Gemini) e Anthropic " +
      "per il trattamento dei dati passati via API.",
    affectedComponent: "api/ai.ts",
    severity: "critical",
    mitigationStatus: "missing",
    mitigationDescription:
      "Urgente: verificare e firmare DPA con Google Cloud (Gemini) e Anthropic prima del deploy PA. " +
      "Alternativa: usare solo LLM on-premise o EU-hosted.",
    standard: "GDPR Art. 28 (Responsabile del trattamento)",
  },
  {
    id: "risk_l2",
    category: "legal",
    title: "Assenza di informativa GDPR per studenti minorenni e famiglie",
    description:
      "Il sistema tratta dati di studenti minorenni. " +
      "È richiesto consenso genitoriale e informativa specifica (GDPR Art. 8).",
    affectedComponent: "PrivacyConsentModal",
    severity: "high",
    mitigationStatus: "partial",
    mitigationDescription:
      "PrivacyConsentModal presente solo per docenti. " +
      "Mancante: informativa studenti/famiglie, workflow consenso genitoriale.",
    standard: "GDPR Art. 8, Art. 13",
  },
  {
    id: "risk_l3",
    category: "legal",
    title: "Notifica incidenti a Garante Privacy non automatizzata",
    description:
      "In caso di violazione dati, GDPR Art. 33 richiede notifica al Garante entro 72h.",
    affectedComponent: "riskMonitor, ComplianceAgent",
    severity: "high",
    mitigationStatus: "partial",
    mitigationDescription:
      "riskMonitor rileva gdprViolation e genera alert CRITICAL. " +
      "Mancante: procedura di notifica automatica/guidata al Garante.",
    standard: "GDPR Art. 33",
  },
  {
    id: "risk_l4",
    category: "legal",
    title: "Mancata registrazione AI Act (Art. 49) nel database EU",
    description:
      "I sistemi AI ad alto rischio devono essere registrati nel database EU prima del deploy.",
    affectedComponent: "sistema nel suo complesso",
    severity: "high",
    mitigationStatus: "missing",
    mitigationDescription:
      "Da completare prima del deploy PA: registrazione nel database EU (Art. 49 AI Act) " +
      "non ancora disponibile (database EU attivo da agosto 2026).",
    standard: "AI Act Art. 49",
  },

  // OPERATIVI
  {
    id: "risk_o1",
    category: "operational",
    title: "Formazione insufficiente del personale PA sull'uso del sistema AI",
    description:
      "Senza formazione adeguata, i docenti potrebbero non essere in grado di " +
      "esercitare supervisione umana efficace (AI Act Art. 14).",
    affectedComponent: "deployment PA",
    severity: "medium",
    mitigationStatus: "missing",
    mitigationDescription:
      "Mancante: piano di formazione obbligatoria per deployer PA, " +
      "materiali di onboarding, test di competenza AI literacy.",
    standard: "AI Act Art. 26(6), PNRR Missione 1 (competenze digitali PA)",
  },
  {
    id: "risk_o2",
    category: "operational",
    title: "Dipendenza da Vercel per Edge Function AI",
    description:
      "Il proxy AI è ospitato su Vercel (US). " +
      "Interruzione o cambio provider impatta tutto il layer AI.",
    affectedComponent: "api/ai.ts (Vercel Edge)",
    severity: "medium",
    mitigationStatus: "partial",
    mitigationDescription:
      "Gestione errori presente. Mancante: piano di migrazione verso " +
      "hosting EU-compliant (es. OVH, Azure EU, CINECA).",
    standard: "ISO/IEC 27001 A.15 (Supplier Relationships)",
  },
];

export function generateRiskAssessment(): AIRiskAssessment {
  const critical = RISKS.filter(r => r.severity === "critical").length;
  const high     = RISKS.filter(r => r.severity === "high").length;

  let overallRiskLevel: AIRiskAssessment["overallRiskLevel"] = "low";
  if (critical > 0)       overallRiskLevel = "critical";
  else if (high > 2)      overallRiskLevel = "high";
  else if (high > 0)      overallRiskLevel = "medium";

  const missing = RISKS.filter(r => r.mitigationStatus === "missing");

  const summary =
    `Identificati ${RISKS.length} rischi (${critical} critici, ${high} alti). ` +
    `${missing.length} rischi senza mitigazione implementata. ` +
    `Priorità assoluta: DPA con provider LLM (GDPR Art. 28), ` +
    `informativa minori (GDPR Art. 8), registrazione AI Act EU (Art. 49), ` +
    `piano formazione PA (AI Act Art. 26).`;

  return {
    date:             new Date().toISOString().slice(0, 10),
    systemVersion:    "1.0.0",
    risks:            RISKS,
    overallRiskLevel,
    summary,
  };
}

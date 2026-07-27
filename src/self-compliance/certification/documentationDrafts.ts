// certification/documentationDrafts.ts
// Generatore bozze documentazione formale (AI Act Art. 11 + PA)

import type { DocumentDraft, DocumentSection, AIActClassification, CertificationScore } from "./types";

const TODAY = new Date().toISOString().slice(0, 10);

export function generateTechnicalDocumentation(
  aiAct: AIActClassification,
  score: CertificationScore,
): DocumentDraft {
  const sections: DocumentSection[] = [
    {
      title: "1. Descrizione Generale del Sistema",
      content:
        "DocenteDoc AI è un sistema di supporto alle decisioni didattiche per docenti " +
        "delle istituzioni scolastiche pubbliche italiane. " +
        "Il sistema utilizza modelli di linguaggio di grandi dimensioni (LLM) " +
        "per generare suggerimenti contestuali in ambito di pianificazione UDA, " +
        "annotazione studenti e analisi del percorso formativo. " +
        "Classificazione AI Act: Sistema ad Alto Rischio — Allegato III, punto 3(b).",
    },
    {
      title: "2. Architettura Tecnica",
      content:
        "Stack: React 18 + TypeScript + Vite, MUI v7 (Material Design 3), Zustand per state management. " +
        "SPA full-client. AI proxy: Vercel Edge Function (api/ai.ts) — nessuna chiave AI nel browser. " +
        "LLM integrati: Google Gemini, Anthropic Claude (con fallback). " +
        "Persistenza: localStorage (Zustand persist) + Google Drive backup opzionale. " +
        "PWA: Service Worker per funzionalità offline parziale.",
    },
    {
      title: "3. Dati Trattati",
      content:
        "Categorie: dati anagrafici studenti, dati didattici/valutativi, " +
        "pattern comportamentali docente (aggregati), log di audit, metriche di compliance. " +
        "Nessun dato speciale ex Art. 9 GDPR nel core del sistema. " +
        "Nessun PII trasmesso direttamente agli LLM (solo aggregati/anonimizzati). " +
        "Retention: 365gg studenti, 90gg AI behavior, 730gg audit.",
    },
    {
      title: "4. Misure di Sicurezza",
      content:
        "Autenticazione: Google OAuth 2.0. " +
        "Trasmissione: HTTPS obbligatorio (gestito da Vercel). " +
        "Chiavi API: solo server-side (Vercel environment variables). " +
        "Nessun endpoint pubblico che esponga dati personali. " +
        "CSP headers configurati in vercel.json.",
    },
    {
      title: "5. Meccanismi di Supervisione Umana",
      content:
        "Tutti i suggerimenti AI sono presentati come raccomandazioni non vincolanti. " +
        "Il docente mantiene pieno controllo su ogni azione. " +
        "Azioni ad alto rischio richiedono approvazione esplicita (ApprovalQueueStore). " +
        "ExplainabilityPanel: ogni suggerimento espone confidence, reasons, normativeRef. " +
        "Docente può ignorare, modificare o bloccare qualsiasi azione.",
    },
    {
      title: "6. Gestione del Ciclo di Vita AI",
      content:
        "Deployment: Vercel (CI/CD automatico da GitHub). " +
        "Aggiornamenti: versionati in Git, semantic versioning. " +
        "Monitoraggio: Self-Compliance Engine (cicli automatici di valutazione). " +
        "Incident response: riskMonitor → complianceBrain → alert → escalation manuale (DPO/PA). " +
        "Dismissione: piano da formalizzare prima del deploy PA.",
    },
    {
      title: "7. Certification Readiness Score",
      content:
        `Score complessivo: ${score.total}/100. ` +
        `Governance: ${score.breakdown.governance}/100. ` +
        `Trasparenza: ${score.breakdown.transparency}/100. ` +
        `Auditabilità: ${score.breakdown.auditability}/100. ` +
        `Sicurezza: ${score.breakdown.security}/100. ` +
        `Supervisione umana: ${score.breakdown.humanOversight}/100. ` +
        `Documentazione: ${score.breakdown.documentation}/100. ` +
        `Protezione dati: ${score.breakdown.dataProtection}/100.`,
    },
    {
      title: "8. Obblighi AI Act Implementati",
      content: aiAct.obligations
        .map(o => `${o.article} — ${o.title}: ${o.implemented ? "✓ IMPLEMENTATO" : "✗ MANCANTE"}. ${o.evidence ?? o.description}`)
        .join("\n"),
    },
  ];

  return {
    type: "technical_documentation",
    version: "1.0",
    date: TODAY,
    sections,
  };
}

export function generateAISystemDescription(): DocumentDraft {
  const sections: DocumentSection[] = [
    {
      title: "Descrizione del Sistema AI",
      content:
        "Nome: DocenteDoc AI\n" +
        "Versione: 1.0.0\n" +
        "Fornitore: [Nome del fornitore — da specificare]\n" +
        "Scopo: Sistema di supporto alle decisioni per docenti PA\n" +
        "Classificazione AI Act: Alto Rischio (Allegato III, punto 3b)\n" +
        "Tipo di sistema: Sistema di raccomandazione / Decision Support System\n" +
        "Modalità di funzionamento: Supporto umano — nessuna decisione automatica vincolante",
    },
    {
      title: "Capacità e Limiti del Sistema",
      content:
        "CAPACITÀ:\n" +
        "- Genera suggerimenti contestuali per pianificazione UDA e annotazioni studenti\n" +
        "- Analizza pattern di utilizzo per personalizzare i suggerimenti\n" +
        "- Produce report di compliance automatici\n" +
        "- Esporta dati auditabili in formato JSON\n\n" +
        "LIMITI:\n" +
        "- Non prende decisioni vincolanti: ogni azione richiede conferma umana\n" +
        "- Accuratezza dipende dalla qualità dei dati inseriti dal docente\n" +
        "- Le analisi AI possono contenere errori (supervisione docente sempre richiesta)\n" +
        "- Non sostituisce la valutazione professionale del docente",
    },
    {
      title: "Dati Utilizzati",
      content:
        "Il sistema utilizza dati inseriti dal docente (UDA, annotazioni, valutazioni studenti). " +
        "I dati identificativi degli studenti rimangono nel dispositivo del docente. " +
        "All'LLM vengono inviati solo contenuti pedagogici anonimizzati. " +
        "Il sistema non addestra nuovi modelli AI.",
    },
    {
      title: "Supervisione e Controllo Umano",
      content:
        "Il docente ha sempre il controllo finale. " +
        "Tutti i suggerimenti AI sono chiaramente identificati come tali. " +
        "Il docente può: accettare, modificare, rifiutare o segnalare qualsiasi suggerimento. " +
        "Azioni ad impatto elevato richiedono doppia conferma esplicita.",
    },
  ];

  return {
    type: "ai_system_description",
    version: "1.0",
    date: TODAY,
    sections,
  };
}

export function generateTransparencyStatement(): DocumentDraft {
  const sections: DocumentSection[] = [
    {
      title: "Dichiarazione di Trasparenza dell'IA — DocenteDoc AI",
      content:
        "Gentile utente,\n\n" +
        "Questo sistema utilizza tecnologie di Intelligenza Artificiale (IA) " +
        "per supportare il tuo lavoro di docente.\n\n" +
        "COME FUNZIONA:\n" +
        "Il sistema analizza le informazioni che inserisci (UDA, annotazioni, valutazioni) " +
        "e genera suggerimenti per migliorare la tua pianificazione didattica. " +
        "Ogni suggerimento include una spiegazione del perché viene proposto.\n\n" +
        "COSA NON FA:\n" +
        "Il sistema NON prende decisioni al posto tuo. " +
        "Sei sempre tu a decidere cosa fare con i suggerimenti dell'IA.\n\n" +
        "I TUOI DATI:\n" +
        "I dati degli studenti rimangono nel tuo dispositivo. " +
        "All'IA esterna vengono inviati solo contenuti pedagogici anonimi. " +
        "Puoi cancellare tutti i tuoi dati in qualsiasi momento.\n\n" +
        "CLASSIFICAZIONE AI ACT:\n" +
        "Questo sistema è classificato come IA ad Alto Rischio ai sensi del Regolamento UE 2024/1689 " +
        "(AI Act), in quanto utilizzato in ambito educativo. " +
        "Come previsto dalla normativa, il sistema è dotato di meccanismi di supervisione umana, " +
        "trasparenza e audit.\n\n" +
        "Per qualsiasi domanda o segnalazione: [contatto DPO istituzione scolastica]",
    },
  ];

  return {
    type: "transparency_statement",
    version: "1.0",
    date: TODAY,
    sections,
  };
}

export function generateAdminComplianceReport(score: CertificationScore): DocumentDraft {
  const sections: DocumentSection[] = [
    {
      title: "Report di Conformità Amministrativa — DocenteDoc AI",
      content:
        `Data: ${TODAY}\n` +
        "Sistema: DocenteDoc AI v1.0.0\n" +
        "Tipo: Sistema IA ad Alto Rischio (AI Act Allegato III)\n" +
        "Stato complessivo: IN CONFORMITÀ PARZIALE — Azioni richieste",
    },
    {
      title: "Sintesi Esecutiva",
      content:
        `Il sistema DocenteDoc AI ha ottenuto un Certification Readiness Score di ${score.total}/100. ` +
        "Il sistema implementa correttamente i requisiti tecnici fondamentali dell'AI Act " +
        "(supervisione umana, trasparenza, logging, risk management). " +
        "Sono richieste azioni prioritarie in ambito legale-contrattuale (DPA, DPIA formale, RoPA) " +
        "e organizzativo (formazione PA) prima del deploy in produzione nella PA.",
    },
    {
      title: "Conformità per Area",
      content:
        `• Governance AI: ${score.breakdown.governance}/100\n` +
        `• Trasparenza: ${score.breakdown.transparency}/100\n` +
        `• Auditabilità: ${score.breakdown.auditability}/100\n` +
        `• Sicurezza: ${score.breakdown.security}/100\n` +
        `• Supervisione umana: ${score.breakdown.humanOversight}/100\n` +
        `• Documentazione: ${score.breakdown.documentation}/100\n` +
        `• Protezione dati: ${score.breakdown.dataProtection}/100`,
    },
    {
      title: "Azioni Prioritarie Richieste",
      content: score.pathTo100.slice(0, 5).map((a, i) => `${i + 1}. ${a}`).join("\n"),
    },
    {
      title: "Normativa di Riferimento",
      content:
        "• Regolamento UE 2024/1689 (AI Act)\n" +
        "• Regolamento UE 2016/679 (GDPR)\n" +
        "• D.Lgs. 82/2005 (Codice Amministrazione Digitale)\n" +
        "• Linee Guida AgID sull'uso dell'IA nella PA (2024)\n" +
        "• ISO/IEC 42001:2023 (AI Management Systems)\n" +
        "• ISO/IEC 27001:2022 (Information Security)",
    },
  ];

  return {
    type: "admin_compliance_report",
    version: "1.0",
    date: TODAY,
    sections,
  };
}

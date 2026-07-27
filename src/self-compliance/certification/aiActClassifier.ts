// certification/aiActClassifier.ts
// Classificazione del sistema sotto AI Act (Reg. UE 2024/1689)

import type { AIActClassification, AIActObligation } from "./types";

/**
 * DocenteDoc AI è classificato come sistema AI ad ALTO RISCHIO ai sensi dell'AI Act:
 * - Allegato III, punto 3(b): sistemi AI per istruzione e formazione professionale
 *   che valutano gli studenti o determinano l'accesso all'istruzione
 * - Allegato III, punto 8: sistemi AI usati in PA per attività di interesse pubblico
 */
export function classifyAIActRisk(): AIActClassification {
  const obligations: AIActObligation[] = [
    {
      article: "Art. 9",
      title: "Sistema di Gestione del Rischio",
      description:
        "Stabilire, implementare, documentare e mantenere un sistema di gestione dei rischi " +
        "per l'intero ciclo di vita del sistema AI.",
      implemented: true,
      evidence:
        "Self-Compliance Engine con riskMonitor, complianceBrain, auditExporter attivi.",
    },
    {
      article: "Art. 10",
      title: "Dati e Governance dei Dati",
      description:
        "Pratiche di governance e gestione dei dati adeguate, incluse verifiche di parzialità " +
        "e pertinenza dei dati di addestramento.",
      implemented: true,
      evidence:
        "GDPR data retention 365gg, anonimizzazione, nessun dato personale in modelli AI (solo aggregati).",
    },
    {
      article: "Art. 11",
      title: "Documentazione Tecnica",
      description:
        "Documentazione tecnica completa prima dell'immissione sul mercato, aggiornata in modo continuativo.",
      implemented: false,
      evidence: "Documentazione tecnica formale in fase di generazione (certificationPackage).",
    },
    {
      article: "Art. 12",
      title: "Conservazione delle Registrazioni",
      description:
        "Capacità di registrazione automatica degli eventi rilevanti durante il funzionamento " +
        "(logging e audit trail).",
      implemented: true,
      evidence:
        "complianceDb: rolling log 1000 attività, 90 report, 500 alert con retention automatica.",
    },
    {
      article: "Art. 13",
      title: "Trasparenza e Informazione agli Utenti",
      description:
        "Istruzioni per l'uso chiare e informazioni sul funzionamento, capacità e limiti del sistema.",
      implemented: true,
      evidence:
        "ExplainabilityPanel: ogni suggerimento espone headline, reasons, dataUsed, confidenceScore, normativeRef.",
    },
    {
      article: "Art. 14",
      title: "Supervisione Umana",
      description:
        "Misure tecniche e organizzative che consentano agli utenti di supervisionare il sistema " +
        "durante il suo funzionamento ed intervenire.",
      implemented: true,
      evidence:
        "HumanInTheLoop: ApprovalQueueStore, guided execution, blocco azioni critiche, override utente.",
    },
    {
      article: "Art. 15",
      title: "Accuratezza, Robustezza e Cybersicurezza",
      description:
        "Livello appropriato di accuratezza, robustezza e sicurezza informatica durante tutto " +
        "il ciclo di vita.",
      implemented: true,
      evidence:
        "RankedAction con scoreBreakdown, confidenceScore, API key server-side only, nessun PII nel browser.",
    },
    {
      article: "Art. 26",
      title: "Obblighi dei Deployer (PA)",
      description:
        "Il deployer (PA) deve garantire supervisione umana, monitorare il funzionamento e " +
        "notificare incidenti.",
      implemented: false,
      evidence:
        "Le procedure di incident response della PA (DPO, notifica AgID) non sono ancora formalizzate.",
    },
    {
      article: "Art. 50",
      title: "Obblighi di Trasparenza per Interazione Umana",
      description:
        "Obbligo di informare le persone fisiche che stanno interagendo con un sistema AI.",
      implemented: true,
      evidence:
        "PrivacyConsentModal: consenso GDPR art.13 al primo avvio, badge AI visibile nella UI.",
    },
    {
      article: "Art. 62",
      title: "Notifica Incidenti Gravi",
      description:
        "I fornitori di sistemi AI ad alto rischio devono notificare incidenti gravi all'autorità di vigilanza.",
      implemented: false,
      evidence: "Procedura di notifica automatica agli enti di vigilanza (AgID/Garante) non ancora implementata.",
    },
  ];

  return {
    riskTier: "high",
    justification:
      "Il sistema DocenteDoc AI assiste docenti di PA nella pianificazione didattica, " +
      "valutazione degli studenti e decisioni ad impatto formativo. Rientra nell'Allegato III, " +
      "punto 3(b) dell'AI Act (sistemi AI per istruzione/valutazione) e nella categoria PA " +
      "di sistemi ad alto rischio per impatto su diritti fondamentali (art. 6, par. 2).",
    annexIII_category: "Punto 3(b) — Istruzione e formazione professionale",
    obligations,
    isExempt: false,
  };
}

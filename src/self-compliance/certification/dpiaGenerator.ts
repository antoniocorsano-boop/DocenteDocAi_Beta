// certification/dpiaGenerator.ts
// Generatore DPIA (Data Protection Impact Assessment) — GDPR Art. 35

import type { DPIA, DataCategory, DPIARisk } from "./types";

const DATA_CATEGORIES: DataCategory[] = [
  {
    name: "Dati anagrafici studenti",
    subjects: ["studenti minorenni"],
    sensitivity: "ordinary",
    retentionDays: 365,
    legalBasis: "GDPR Art. 6(1)(e) — compito di interesse pubblico (D.Lgs. 196/2003, D.Lgs. 82/2005)",
  },
  {
    name: "Dati didattici e valutativi",
    subjects: ["studenti minorenni", "docenti"],
    sensitivity: "ordinary",
    retentionDays: 365,
    legalBasis: "GDPR Art. 6(1)(e) — compito di interesse pubblico",
  },
  {
    name: "Dati comportamentali AI (pattern uso docente)",
    subjects: ["docenti"],
    sensitivity: "ordinary",
    retentionDays: 90,
    legalBasis: "GDPR Art. 6(1)(a) — consenso esplicito (PrivacyConsentModal)",
  },
  {
    name: "Dati di audit e compliance",
    subjects: ["docenti", "sistema AI"],
    sensitivity: "ordinary",
    retentionDays: 730,
    legalBasis: "GDPR Art. 6(1)(c) — obbligo legale (AI Act Art. 12, CAD Art. 32)",
  },
  {
    name: "Log di sistema e tracciamento AI",
    subjects: ["sistema AI"],
    sensitivity: "ordinary",
    retentionDays: 365,
    legalBasis: "GDPR Art. 6(1)(c) — obbligo legale (AI Act Art. 12)",
  },
];

const RISKS: DPIARisk[] = [
  {
    id: "dpia_r1",
    threat: "Accesso non autorizzato a dati studenti minorenni",
    likelihood: "low",
    impact: "high",
    residualRisk: "low",
    mitigation:
      "Storage solo locale (localStorage), nessun backend proprio, autenticazione Google OAuth, " +
      "dati non trasmessi a server terzi eccetto AI proxy server-side.",
    status: "implemented",
  },
  {
    id: "dpia_r2",
    threat: "Profilazione automatica di studenti con effetti giuridici",
    likelihood: "medium",
    impact: "high",
    residualRisk: "low",
    mitigation:
      "Il sistema produce solo suggerimenti (non decisioni vincolanti). " +
      "Supervisione umana obbligatoria (Art. 14 AI Act). " +
      "ExplainabilityPanel mostra motivazioni, docente mantiene pieno controllo.",
    status: "implemented",
  },
  {
    id: "dpia_r3",
    threat: "Trasferimento dati personali a LLM (Gemini/Anthropic) senza base legale",
    likelihood: "low",
    impact: "high",
    residualRisk: "low",
    mitigation:
      "API key solo server-side (Vercel Edge Function api/ai.ts), dati inviati all'LLM " +
      "anonimizzati/aggregati, nessun PII trasmesso direttamente. " +
      "Nota: verificare DPA con Google/Anthropic.",
    status: "planned",
  },
  {
    id: "dpia_r4",
    threat: "Bias algoritmico nelle valutazioni studenti",
    likelihood: "medium",
    impact: "high",
    residualRisk: "medium",
    mitigation:
      "RankedAction con scoreBreakdown trasparente, ExplainabilityPanel. " +
      "Mancante: audit periodico di equità (fairness audit).",
    status: "planned",
  },
  {
    id: "dpia_r5",
    threat: "Perdita di dati per guasto browser/browser storage eviction",
    likelihood: "medium",
    impact: "medium",
    residualRisk: "low",
    mitigation:
      "Backup su Google Drive (useGDriveBackup), export manuale, service worker PWA.",
    status: "implemented",
  },
  {
    id: "dpia_r6",
    threat: "Conservazione dati oltre i limiti di retention",
    likelihood: "low",
    impact: "medium",
    residualRisk: "low",
    mitigation:
      "dataRetention.ts: cleanup automatico artefatti AI dopo 365gg, " +
      "chiamato a ogni avvio da main.tsx.",
    status: "implemented",
  },
  {
    id: "dpia_r7",
    threat: "Mancata informativa adeguata agli interessati (studenti e famiglie)",
    likelihood: "medium",
    impact: "high",
    residualRisk: "medium",
    mitigation:
      "PrivacyConsentModal presente per docenti. Mancante: informativa specifica " +
      "per studenti minorenni e relative famiglie (GDPR Art. 8).",
    status: "planned",
  },
  {
    id: "dpia_r8",
    threat: "Decisioni automatizzate su studenti senza diritto di opposizione",
    likelihood: "low",
    impact: "high",
    residualRisk: "low",
    mitigation:
      "Il sistema non prende decisioni automatizzate vincolanti (supervisione umana obbligatoria). " +
      "GDPR Art. 22 non applicabile; AI Act Art. 14 implementato.",
    status: "implemented",
  },
];

export function generateDPIA(): DPIA {
  return {
    version: "1.0",
    date: new Date().toISOString().slice(0, 10),
    systemName: "DocenteDoc AI",
    controller: "Istituto Scolastico (da specificare in fase di deployer)",
    dpo: "DPO nominato dall'istituzione scolastica (GDPR Art. 37)",
    purpose: [
      "Supporto alla pianificazione didattica e progettazione UDA",
      "Suggerimenti AI per annotazioni e valutazioni degli studenti",
      "Monitoraggio e analisi del percorso formativo degli studenti",
      "Automazione della reportistica didattica",
      "Compliance e audit del sistema AI stesso",
    ],
    dataCategories: DATA_CATEGORIES,
    processingActivities: [
      "Raccolta e archiviazione dati anagrafici e didattici studenti (localStorage)",
      "Analisi pattern comportamentali docente per personalizzazione AI",
      "Trasmissione dati aggregati/anonimizzati a LLM per generazione suggerimenti",
      "Generazione e conservazione log di audit e compliance",
      "Backup dati su Google Drive (consenso esplicito docente)",
      "Pubblicazione open data aggregati e anonimi",
    ],
    risks: RISKS,
    necessityTest:
      "Il trattamento è strettamente necessario per le finalità dichiarate: " +
      "senza i dati degli studenti non è possibile personalizzare il supporto didattico AI. " +
      "I dati di audit sono necessari per dimostrare conformità (AI Act, GDPR). " +
      "Non esistono alternative meno invasive che garantiscano le stesse funzionalità.",
    proportionalityTest:
      "Le categorie di dati trattate sono limitate al minimo necessario (principio minimizzazione). " +
      "Nessun dato speciale ex Art. 9 GDPR nel core del sistema. " +
      "Retention limitata (365gg studenti, 90gg AI behavior, 730gg audit). " +
      "Nessuna profilazione automatica con effetti giuridici.",
    conclusion: "required",
    approvalStatus: "draft",
  };
}

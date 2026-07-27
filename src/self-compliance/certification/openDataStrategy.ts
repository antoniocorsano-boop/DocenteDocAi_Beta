// certification/openDataStrategy.ts
// Strategia open data DCAT-AP_IT compliant per PA

import type { OpenDataStrategy, OpenDataDataset } from "./types";

const TODAY = new Date().toISOString().slice(0, 10);

const DATASETS: OpenDataDataset[] = [
  {
    id: "ds-compliance-metrics",
    title: "Metriche Compliance Sistema AI Didattico",
    description:
      "Serie storica delle metriche di conformità del sistema DocenteDoc AI: " +
      "tasso conformità azioni, distribuzione rischi (low/medium/high/critical), " +
      "copertura supervisione umana, tempo medio decisione. " +
      "Dati 100% aggregati — nessun dato personale o riferimento a singoli utenti.",
    format: "application/json",
    license: "https://creativecommons.org/licenses/by/4.0/",
    accrualPeriodicity: "weekly",
    containsPersonalData: false,
    gdprSafe: true,
    dctTerms: {
      publisher: "[Nome Istituzione Scolastica / Fornitore]",
      language: "it",
      conformsTo: "https://www.dati.gov.it/onto/dcatapit",
    },
  },
  {
    id: "ds-ai-act-obligations",
    title: "Stato Obblighi AI Act — Sistema DocenteDoc AI",
    description:
      "Stato di implementazione degli obblighi derivanti dal Regolamento UE 2024/1689 (AI Act) " +
      "per il sistema DocenteDoc AI ad Alto Rischio (Allegato III, punto 3b). " +
      "Per ogni articolo applicabile: stato (implementato/parziale/mancante), evidenza tecnica.",
    format: "application/json",
    license: "https://creativecommons.org/licenses/by/4.0/",
    accrualPeriodicity: "monthly",
    containsPersonalData: false,
    gdprSafe: true,
    dctTerms: {
      publisher: "[Nome Istituzione Scolastica / Fornitore]",
      language: "it",
      conformsTo: "https://www.dati.gov.it/onto/dcatapit",
    },
  },
  {
    id: "ds-gap-analysis",
    title: "Gap Analysis Normativa — GDPR, AI Act, AgID, ISO 42001",
    description:
      "Analisi degli scostamenti tra i requisiti normativi applicabili " +
      "(GDPR, AI Act, CAD/AgID, ISO 42001) e lo stato di implementazione del sistema. " +
      "Include priorità di remediation e referenza normativa per ogni gap.",
    format: "application/json",
    license: "https://creativecommons.org/licenses/by/4.0/",
    accrualPeriodicity: "monthly",
    containsPersonalData: false,
    gdprSafe: true,
    dctTerms: {
      publisher: "[Nome Istituzione Scolastica / Fornitore]",
      language: "it",
      conformsTo: "https://www.dati.gov.it/onto/dcatapit",
    },
  },
  {
    id: "ds-audit-log-summary",
    title: "Sommario Log Audit Sistema AI Didattico",
    description:
      "Riassunto aggregato mensile dei log di audit del sistema AI: " +
      "numero azioni valutate, distribuzione per livello di rischio, " +
      "azioni bloccate, override umani. " +
      "Nessun dato individuale — solo aggregati statistici.",
    format: "application/json",
    license: "https://creativecommons.org/licenses/by/4.0/",
    accrualPeriodicity: "monthly",
    containsPersonalData: false,
    gdprSafe: true,
    dctTerms: {
      publisher: "[Nome Istituzione Scolastica / Fornitore]",
      language: "it",
      conformsTo: "https://www.dati.gov.it/onto/dcatapit",
    },
  },
];

export function defineOpenDataStrategy(): OpenDataStrategy {
  return {
    generatedAt: TODAY,
    platform: "dati.gov.it (portale open data PA) + portale istituzionale scolastico",
    license: "CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/deed.it",
    updateFrequency: "weekly (compliance metrics), monthly (AI Act + gap analysis + audit summary)",
    gdprSafeGuarantees: [
      "Tutti i dataset pubblicati contengono esclusivamente dati aggregati",
      "Nessun dato riferibile a singoli docenti, studenti o classi",
      "Dati AI comportamentali: solo metriche statistiche (rate, percentuali, conteggi)",
      "Log di audit: solo conteggi per categoria di rischio",
      "Nessun identificativo (nome, CF, email, ID utente) presente nei dataset",
      "Revisione GDPR pre-publish: ogni export viene validato automaticamente da openDataPublisher",
    ],
    datasets: DATASETS,
    technicalNotes:
      "I dataset sono generati automaticamente da openDataPublisher (src/self-compliance/openDataPublisher.ts). " +
      "Formato DCAT-AP_IT vocabolario controllato. " +
      "Integrazione futura prevista: API REST su Vercel Edge + cron job per aggiornamento automatico.",
    contactPoint: "[Email responsabile open data — da specificare prima del deploy PA]",
    catalogUrl: "https://www.dati.gov.it/catalogo (registrazione richiesta prima del deploy)",
  };
}

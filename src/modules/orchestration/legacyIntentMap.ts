/**
 * modules/orchestration/legacyIntentMap.ts — Sprint B Legacy Intent Extraction
 *
 * Translates DocenteDocAI legacy flows (UDA creation, student management,
 * register, annual planning, resources…) into OrbitIntent structures that
 * are compatible with PlanEngine.buildPlan().
 *
 * Design principles:
 *   - Pure module — no external API calls, no side effects, no store access
 *   - Zero circular dependencies: imports only DomainIntent (type-only)
 *   - Deterministic: same input always yields the same result
 *   - Non-modifying: extending LEGACY_INTENTS never breaks existing behaviour
 *
 * Integration:
 *   PlanEngine.buildPlan() calls matchLegacyIntent() first;
 *   falls back to generic keyword rules only if no legacy intent matches.
 */

import type { DomainIntent } from '@/modules/orbit/DomainIntentEngine';

// ── Types ─────────────────────────────────────────────────────────────────────

/** A single executable step inside a legacy plan — mirrors PlanStep structurally. */
export interface LegacyPlanStep {
  id:              string;
  label:           string;
  action?:         () => void;
  autoExecutable?: boolean;
}

/**
 * A legacy DocenteDocAI flow mapped to an Orbit-compatible intent definition.
 *
 * Each entry in LEGACY_INTENTS corresponds to a known teacher workflow.
 * The `executionPrompt` factory generates a structured prompt sent to the
 * orchestrator when the user clicks "Avvia" in the PlanCard.
 */
export interface OrbitIntent {
  /** Unique stable ID for this legacy intent */
  id:              string;
  /** Lowercase keyword/phrase substrings for matching (all checked via .includes()) */
  keywords:        string[];
  /** Title shown in the PlanCard header */
  title:           string;
  /** Short badge label shown next to the confidence bar */
  intentLabel:     string;
  /** Ordered list of plan steps */
  steps:           LegacyPlanStep[];
  /** Fixed confidence for this domain-specific intent [0, 1] */
  confidence:      number;
  /** Domain mapping for DomainIntentEngine compatibility */
  domain:          DomainIntent;
  /** Generates the structured execution prompt from the raw user input */
  executionPrompt: (input: string) => string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

function countMatches(lower: string, keywords: string[]): number {
  return keywords.reduce((n, kw) => n + (lower.includes(kw) ? 1 : 0), 0);
}

// ── Legacy intent definitions ─────────────────────────────────────────────────

/**
 * Ordered array of legacy DocenteDocAI flow definitions.
 * Checked in declaration order — first intent with score ≥ 1 wins,
 * highest score wins among ties.
 */
export const LEGACY_INTENTS: OrbitIntent[] = [
  // ── UDA (Unità di Apprendimento) ──────────────────────────────────────────
  {
    id:         'create_uda',
    keywords:   ['crea uda', 'nuova uda', 'unità di apprendimento', 'unità didattica', 'crea unità', 'nuova unità'],
    title:      'Creazione UDA',
    intentLabel: 'UDA',
    steps: [
      { id: 'setup',      label: 'Configuro titolo e disciplina' },
      { id: 'objectives', label: 'Definisco obiettivi formativi' },
      { id: 'activities', label: 'Struttura attività e tempi' },
      { id: 'assessment', label: 'Imposto criteri di valutazione' },
    ],
    confidence: 0.88,
    domain:     'lesson_planning',
    executionPrompt: (input) =>
      `[TASK: Creazione UDA (Unità di Apprendimento)]\n` +
      `Richiesta: "${truncate(input, 300)}"\n\n` +
      `Istruzioni: Genera una UDA completa con:\n` +
      `- Titolo, disciplina e classe di riferimento\n` +
      `- Obiettivi formativi (4-6, verbi di Bloom)\n` +
      `- Contenuti disciplinari chiave\n` +
      `- Metodologie didattiche e strumenti\n` +
      `- Attività con durata e modalità (individuale/di gruppo)\n` +
      `- Criteri e griglia di valutazione (format MIUR-compatibile)\n` +
      `- Raccordo interdisciplinare e competenze-chiave europee (se applicabile)`,
  },

  // ── Aggiunta alunno ───────────────────────────────────────────────────────
  {
    id:         'add_student',
    keywords:   ['aggiungi alunno', 'nuovo alunno', 'inserisci studente', 'nuovo studente', 'aggiungi studente', 'iscrivi alunno'],
    title:      'Aggiunta alunno',
    intentLabel: 'Registro',
    steps: [
      { id: 'data',    label: 'Raccolgo dati anagrafici' },
      { id: 'profile', label: 'Configuro profilo scolastico' },
      { id: 'bes',     label: 'Verifico BES/DSA applicabili' },
      { id: 'save',    label: 'Salvo nel registro di classe' },
    ],
    confidence: 0.90,
    domain:     'content_generation',
    executionPrompt: (input) =>
      `[TASK: Gestione registro — inserimento nuovo alunno]\n` +
      `Richiesta: "${truncate(input, 300)}"\n\n` +
      `Guida l'inserimento di un nuovo alunno nel registro di classe.\n` +
      `Dati necessari:\n` +
      `- Nome e cognome\n` +
      `- Data e luogo di nascita\n` +
      `- Classe e sezione\n` +
      `- Eventuali segnalazioni (BES, DSA, disabilità)\n` +
      `- Contatti familiari di riferimento`,
  },

  // ── Compilazione registro ─────────────────────────────────────────────────
  {
    id:         'fill_register',
    keywords:   ['compila registro', 'registro di classe', 'registro presenze', 'appello', 'segnala assenza', 'assenze e presenze', 'apri registro'],
    title:      'Compilazione registro',
    intentLabel: 'Registro',
    steps: [
      { id: 'open',       label: 'Apro il registro di classe' },
      { id: 'attendance', label: 'Registro presenze' },
      { id: 'topics',     label: 'Annoto argomenti svolti' },
      { id: 'notes',      label: 'Aggiungo annotazioni disciplinari' },
    ],
    confidence: 0.88,
    domain:     'content_generation',
    executionPrompt: (input) =>
      `[TASK: Compilazione registro di classe]\n` +
      `Richiesta: "${truncate(input, 300)}"\n\n` +
      `Assistimi nella compilazione del registro elettronico:\n` +
      `- Rilevazione presenze e assenze\n` +
      `- Registro argomenti svolti (breve descrizione)\n` +
      `- Note disciplinari (se presenti)\n` +
      `- Compiti assegnati per la prossima lezione`,
  },

  // ── Programmazione annuale ────────────────────────────────────────────────
  {
    id:         'annual_planning',
    keywords:   ['programmazione annuale', 'piano annuale', 'piano di lavoro annuale', 'programmazione classe', 'pianifica anno scolastico', 'piano didattico annuale'],
    title:      'Programmazione annuale',
    intentLabel: 'Programmazione',
    steps: [
      { id: 'context',  label: 'Analizzo contesto della classe' },
      { id: 'units',    label: 'Definisco unità didattiche' },
      { id: 'timeline', label: 'Distribuisco su mesi e quadrimestri' },
      { id: 'criteria', label: 'Stabilisco criteri di valutazione' },
    ],
    confidence: 0.85,
    domain:     'lesson_planning',
    executionPrompt: (input) =>
      `[TASK: Programmazione didattica annuale]\n` +
      `Richiesta: "${truncate(input, 300)}"\n\n` +
      `Genera una programmazione annuale strutturata con:\n` +
      `- Analisi iniziale della classe (situazione di partenza)\n` +
      `- Obiettivi generali per disciplina (competenze e conoscenze)\n` +
      `- Unità didattiche per quadrimestre con tempi stimati\n` +
      `- Metodologie, strumenti e risorse previste\n` +
      `- Criteri di valutazione e griglia voti\n` +
      `- Raccordo con competenze-chiave europee 2006/2018`,
  },

  // ── Gestione risorse didattiche ───────────────────────────────────────────
  {
    id:         'manage_resources',
    keywords:   ['gestisci risorse', 'materiali didattici', 'carica materiale', 'organizza risorse', 'file didattico', 'archivio materiali'],
    title:      'Gestione risorse didattiche',
    intentLabel: 'Risorse',
    steps: [
      { id: 'catalog',  label: 'Catalogo materiali disponibili' },
      { id: 'select',   label: 'Seleziono risorse pertinenti' },
      { id: 'organize', label: 'Organizzo per unità didattica' },
    ],
    confidence: 0.80,
    domain:     'document_analysis',
    executionPrompt: (input) =>
      `[TASK: Gestione risorse didattiche]\n` +
      `Richiesta: "${truncate(input, 300)}"\n\n` +
      `Assistimi nell'organizzazione e gestione dei materiali didattici:\n` +
      `- Criteri di catalogazione (per disciplina, argomento, livello)\n` +
      `- Suggerimenti di risorse digitali open-source\n` +
      `- Struttura cartelle condivise con gli studenti\n` +
      `- Link ad archivi istituzionali (MIUR, Indire, RCS Scuola)`,
  },

  // ── Piano di lezione sintetico (legacy label) ─────────────────────────────
  {
    id:         'lesson_plan_legacy',
    keywords:   ['prepara lezione', 'crea lezione', 'nuova lezione', 'schema lezione', 'prepara una lezione'],
    title:      'Piano di lezione',
    intentLabel: 'Lezione',
    steps: [
      { id: 'goal',      label: 'Definisco obiettivo della lezione' },
      { id: 'structure', label: 'Struttura contenuti e tempi' },
      { id: 'materials', label: 'Individuo materiali necessari' },
      { id: 'close',     label: 'Genero verifica breve finale' },
    ],
    confidence: 0.83,
    domain:     'lesson_planning',
    executionPrompt: (input) =>
      `[TASK: Piano di lezione]\n` +
      `Richiesta: "${truncate(input, 300)}"\n\n` +
      `Genera un piano di lezione completo con:\n` +
      `- Titolo, disciplina, classe e durata\n` +
      `- Obiettivi di apprendimento (2-4, verbi di Bloom)\n` +
      `- Struttura (apertura, sviluppo, chiusura) con tempi\n` +
      `- Attività e strategie didattiche\n` +
      `- Materiali e strumenti necessari\n` +
      `- Verifica d'apprendimento (es. 3 domande chiave)`,
  },
];

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Find the best-matching legacy intent for the given input text.
 *
 * Matching logic:
 *   - Each intent's keywords are checked via substring inclusion on the lowercased input
 *   - The intent with the highest keyword match count wins
 *   - Returns null if no intent scores ≥ 1 match (falls through to generic PlanEngine rules)
 *
 * Never throws. Always returns null for empty or trivially short input.
 */
export function matchLegacyIntent(input: string): OrbitIntent | null {
  const lower = input.toLowerCase();
  let best:      OrbitIntent | null = null;
  let bestScore  = 0;

  for (const intent of LEGACY_INTENTS) {
    const score = countMatches(lower, intent.keywords);
    if (score > bestScore) {
      bestScore = score;
      best      = intent;
    }
  }

  return bestScore >= 1 ? best : null;
}

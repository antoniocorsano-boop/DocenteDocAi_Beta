/**
 * modules/orbit/DomainIntentEngine.ts — P43 Domain Intent Layer
 *
 * Educational-domain intent classification that sits above the P33 IntentEngine.
 * While IntentEngine classifies at the orchestrator level (simple/multi_step/analysis),
 * DomainIntentEngine classifies at the pedagogical domain level.
 *
 * Output drives:
 *   - PlanEngine.Plan.executionPrompt  → rich structured prompt when Avvia fires
 *   - PlanCardBlock intent badge       → shows domain label to the user
 *   - AgentRouter hint                 → future server-side agent selection
 *
 * Pure function — no external deps, no side effects.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type DomainIntent =
  | 'assessment_creation'
  | 'lesson_planning'
  | 'document_analysis'
  | 'student_evaluation'
  | 'content_generation'
  | 'generic_request';

export interface DomainIntentResult {
  /** Semantic domain category */
  intent:           DomainIntent;
  /** Confidence [0, 1] */
  confidence:       number;
  /** Human-readable label shown in UI */
  label:            string;
  /** Structured execution prompt ready to be sent to the orchestrator */
  executionPrompt:  string;
}

// ── Keyword sets ──────────────────────────────────────────────────────────────

const ASSESSMENT_KW = [
  'verifica', 'test', 'quiz', 'domande', 'interrogazione', 'esercizi',
  'compito', 'valutazione', 'prova', 'quesiti', 'esame',
];

const LESSON_KW = [
  'lezione', 'piano', 'programmazione', 'uda', 'unità didattica',
  'didattica', 'obiettivi', 'argomento', 'spiegazione', 'insegna',
  'presentazione', 'curricolo', 'modulo', 'programmazione annuale',
];

const DOCUMENT_KW = [
  'documento', 'testo', 'leggi', 'analizza', 'riassumi', 'sintesi',
  'file', 'caricato', 'allegato', 'pdf', 'pagina', 'articolo',
  'capitolo', 'estratto', 'paragrafo',
];

const EVALUATION_KW = [
  'feedback', 'valuta', 'corregg', 'voto', 'giudizio', 'elaborato',
  'compito svolto', 'testo dello studente', 'scritto', 'risposta',
  'prova dello studente', 'lavoro dello studente',
];

const CONTENT_KW = [
  'crea', 'scrivi', 'genera', 'prepara', 'costruisci', 'elabora',
  'produci', 'formula', 'redigi', 'componi', 'sviluppa',
];

// ── Intent templates ──────────────────────────────────────────────────────────

const EXECUTION_PROMPTS: Record<DomainIntent, (input: string) => string> = {
  assessment_creation: (input) =>
    `[TASK: Creazione verifica strutturata]\n` +
    `Richiesta: "${truncate(input, 300)}"\n\n` +
    `Istruzioni: Crea una verifica completa con:\n` +
    `- Titolo e materia\n` +
    `- Obiettivi di apprendimento (2-3)\n` +
    `- Domande V/F (3-5)\n` +
    `- Domande a scelta multipla (3-5, con 4 opzioni)\n` +
    `- Domande aperte (2-3)\n` +
    `- Punteggi suggeriti per ogni sezione`,

  lesson_planning: (input) =>
    `[TASK: Piano di lezione strutturato]\n` +
    `Richiesta: "${truncate(input, 300)}"\n\n` +
    `Istruzioni: Genera un piano di lezione completo con:\n` +
    `- Titolo e durata (minuti)\n` +
    `- Obiettivi formativi specifici (3-5, verbi di Bloom)\n` +
    `- Contenuti disciplinari chiave\n` +
    `- Attività pratiche con tempi\n` +
    `- Materiali necessari\n` +
    `- Criteri di valutazione (format MIUR-compatibile)`,

  document_analysis: (input) =>
    `[TASK: Analisi documento strutturata]\n` +
    `Richiesta: "${truncate(input, 300)}"\n\n` +
    `Istruzioni: Analizza il contenuto e produci:\n` +
    `- Sintesi esecutiva (5-8 righe)\n` +
    `- Concetti chiave (lista numerata)\n` +
    `- Punti di attenzione o criticità\n` +
    `- Possibili utilizzi didattici\n` +
    `- Azioni suggerite`,

  student_evaluation: (input) =>
    `[TASK: Valutazione elaborato studente]\n` +
    `Richiesta: "${truncate(input, 300)}"\n\n` +
    `Istruzioni: Valuta il lavoro con:\n` +
    `- Valutazione complessiva (es. ottimo/buono/sufficiente/insufficiente)\n` +
    `- Punti di forza (3-5, specifici)\n` +
    `- Aree di miglioramento (2-4, costruttivi)\n` +
    `- Suggerimenti pratici per lo studente\n` +
    `- Voto numerico su 10 con motivazione`,

  content_generation: (input) =>
    `[TASK: Generazione contenuto didattico]\n` +
    `Richiesta: "${truncate(input, 300)}"\n\n` +
    `Istruzioni: Crea contenuto chiaro, strutturato e pronto per l'uso in classe.\n` +
    `Usa titoli, sotto-sezioni e linguaggio adatto al livello scolastico indicato.\n` +
    `Includi esempi pratici dove utile.`,

  generic_request: (input) =>
    `${truncate(input, 500)}`,
};

const INTENT_LABELS: Record<DomainIntent, string> = {
  assessment_creation: 'Verifica',
  lesson_planning:     'Lezione',
  document_analysis:   'Analisi Doc',
  student_evaluation:  'Valutazione',
  content_generation:  'Contenuto',
  generic_request:     'Richiesta',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

function countMatches(lower: string, keywords: string[]): number {
  return keywords.reduce((n, kw) => n + (lower.includes(kw) ? 1 : 0), 0);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Detect educational domain intent from user input.
 * Never throws. Returns 'generic_request' for trivial or unclassifiable input.
 */
export function detectDomainIntent(input: string): DomainIntentResult {
  const trimmed = input.trim();
  if (trimmed.length < 10) {
    return build('generic_request', 0.5, trimmed);
  }

  const lower = trimmed.toLowerCase();

  const scores: Record<Exclude<DomainIntent, 'generic_request'>, number> = {
    assessment_creation: countMatches(lower, ASSESSMENT_KW),
    lesson_planning:     countMatches(lower, LESSON_KW),
    document_analysis:   countMatches(lower, DOCUMENT_KW),
    student_evaluation:  countMatches(lower, EVALUATION_KW),
    content_generation:  countMatches(lower, CONTENT_KW),
  };

  let winner: Exclude<DomainIntent, 'generic_request'> = 'content_generation';
  let winnerScore = 0;

  for (const [intent, score] of Object.entries(scores) as Array<[Exclude<DomainIntent, 'generic_request'>, number]>) {
    if (score > winnerScore) {
      winnerScore = score;
      winner = intent;
    }
  }

  if (winnerScore === 0) {
    return build('generic_request', 0.50, trimmed);
  }

  // Confidence: 0.60 for 1 match, +0.10 per additional match, cap 0.92
  const confidence = Math.min(0.92, 0.60 + (winnerScore - 1) * 0.10);
  return build(winner, confidence, trimmed);
}

function build(intent: DomainIntent, confidence: number, input: string): DomainIntentResult {
  return {
    intent,
    confidence,
    label:            INTENT_LABELS[intent],
    executionPrompt:  EXECUTION_PROMPTS[intent](input),
  };
}

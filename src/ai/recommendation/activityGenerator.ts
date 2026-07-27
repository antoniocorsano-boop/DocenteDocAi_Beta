/**
 * activityGenerator.ts — Sprint 8: AI Decision Support
 *
 * Transforms a Recommendation into 1–3 targeted learning Activity objects.
 *
 * Activity selection rules:
 *   1. A Bloom-targeted quiz is ALWAYS included (matched to recommended Bloom level)
 *   2. If suggestedAction is 'addExercise' OR 'reschedule', a higher-order exercise
 *      targeting the next Bloom level is also included.
 *   3. If impactScore ≥ 0.50, a what-if scenario activity is appended.
 *
 * Duration scales with Bloom level cognitive load.
 * All content is in Italian.
 */

import type { BloomLevel } from '../pedagogy/bloomsClassifier';
import type { Recommendation, RecommendationAction } from './lessonRecommender';

// ── public types ──────────────────────────────────────────────────────────────

export type ActivityType = 'quiz' | 'exercise' | 'whatif' | 'discussion' | 'lab';

export interface Activity {
  id:               string;
  type:             ActivityType;
  title:            string;
  description:      string;
  targetBloomLevel: BloomLevel;
  durationMinutes:  number;
  instructions:     string;
  /** Back-reference to the Recommendation that triggered this Activity */
  recommendationId: string;
}

// ── constants ─────────────────────────────────────────────────────────────────

const BLOOM_ORDER: BloomLevel[] = [
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
];

const BLOOM_DURATION_MINUTES: Record<BloomLevel, number> = {
  remember:   5,
  understand: 5,
  apply:      10,
  analyze:    12,
  evaluate:   15,
  create:     20,
};

/** Italian quiz templates, one per Bloom level */
const BLOOM_QUIZ: Record<BloomLevel, { title: string; description: string; instructions: string }> = {
  remember: {
    title:        'Quiz di memorizzazione — Ricorda i termini chiave',
    description:  'Verifica la conoscenza dei termini, fatti e definizioni fondamentali dell\'argomento.',
    instructions: 'Rispondere alle 5 domande a scelta multipla. Ogni risposta corretta vale 1 punto. Tempo massimo: 5 minuti.',
  },
  understand: {
    title:        'Quiz di comprensione — Spiega con parole tue',
    description:  'Verifica la capacità di parafrasare, riassumere e spiegare concetti con linguaggio proprio.',
    instructions: 'Per ogni domanda scegliere la spiegazione più accurata tra le 4 proposte. Attenzione ai sinonimi fuorvianti.',
  },
  apply: {
    title:        'Quiz applicativo — Risolvi il problema',
    description:  'Esercizio breve che richiede di applicare una procedura o formula a un caso concreto.',
    instructions: 'Svolgere i 3 esercizi applicativi mostrando il procedimento. Non è ammessa la calcolatrice.',
  },
  analyze: {
    title:        'Quiz analitico — Identifica le relazioni',
    description:  'Test sulla capacità di scomporre un problema e individuare relazioni causa-effetto.',
    instructions: 'Analizzare il caso studio proposto e rispondere alle domande identificando cause, effetti e relazioni tra componenti.',
  },
  evaluate: {
    title:        'Quiz valutativo — Esprime un giudizio motivato',
    description:  'Quesiti che richiedono di confrontare soluzioni alternative e giustificare la scelta migliore.',
    instructions: 'Per ogni scenario scegliere la soluzione ottimale e scrivere in 2–3 righe la motivazione del giudizio.',
  },
  create: {
    title:        'Quiz creativo — Progetta una soluzione',
    description:  'Compito autentico breve: produrre un artefatto, un progetto o una soluzione originale.',
    instructions: 'Progettare in 15–20 minuti una soluzione al problema proposto. Sarà valutata originalità, completezza e fattibilità.',
  },
};

/** What-if scenario templates (rotated by recommendation index) */
const WHATIF_TEMPLATES: Array<{ title: string; description: string; instructions: string }> = [
  {
    title:        'Scenario "E se…" — Cambia una variabile chiave',
    description:  'Simulazione breve per esplorare cosa succede se una condizione del problema cambia. Stimola il pensiero ipotetico.',
    instructions: 'Modificare la variabile indicata nel testo e descrivere in 3–4 righe come cambia il risultato. Confrontare con il caso originale.',
  },
  {
    title:        'Scenario alternativo — Due percorsi a confronto',
    description:  'Esplorazione di due strategie diverse per raggiungere lo stesso obiettivo. Allena il pensiero critico comparativo.',
    instructions: 'Leggere i due percorsi alternativi proposti, analizzare i pro e contro di ciascuno e argomentare la scelta preferita.',
  },
];

// ── helpers ───────────────────────────────────────────────────────────────────

let _actSeq = 0;
function actId(): string {
  return `act-${++_actSeq}`;
}

/**
 * Maps a RecommendationAction to its primary target Bloom level.
 */
export function targetBloomFromAction(action: RecommendationAction): BloomLevel {
  switch (action) {
    case 'addExercise':   return 'apply';
    case 'adjustContent': return 'understand';
    case 'reschedule':    return 'analyze';
    case 'highlightRisk': return 'evaluate';
  }
}

/**
 * Returns the next higher Bloom level (capped at 'create').
 */
function nextBloomLevel(level: BloomLevel): BloomLevel {
  const idx = BLOOM_ORDER.indexOf(level);
  return BLOOM_ORDER[Math.min(idx + 1, BLOOM_ORDER.length - 1)];
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Generate 1–3 Activity objects from a single Recommendation.
 *
 * @param recommendation  The recommendation from `generateRecommendations()`
 *
 * Returns at least 1 activity (a Bloom-targeted quiz).
 * Returns up to 3 activities if the recommendation warrants higher-order exercises.
 */
export function generateActivity(recommendation: Recommendation): Activity[] {
  const { id: recId, suggestedAction, impactScore } = recommendation;
  const bloomLevel = targetBloomFromAction(suggestedAction);
  const activities: Activity[] = [];

  // ── Activity 1: Bloom-targeted quiz (always included) ──────────────────────
  const quiz = BLOOM_QUIZ[bloomLevel];
  activities.push({
    id:               actId(),
    type:             'quiz',
    title:            quiz.title,
    description:      quiz.description,
    targetBloomLevel: bloomLevel,
    durationMinutes:  BLOOM_DURATION_MINUTES[bloomLevel],
    instructions:     quiz.instructions,
    recommendationId: recId,
  });

  // ── Activity 2: Higher-order exercise (addExercise OR reschedule) ──────────
  if (suggestedAction === 'addExercise' || suggestedAction === 'reschedule') {
    const higherLevel = nextBloomLevel(bloomLevel);
    const higherDuration = BLOOM_DURATION_MINUTES[higherLevel];
    activities.push({
      id:               actId(),
      type:             'exercise',
      title:            `Esercizio di approfondimento — ${higherLevel.charAt(0).toUpperCase() + higherLevel.slice(1)}`,
      description:
        `Attività strutturata per consolidare le competenze di ordine superiore (livello: ${higherLevel}) ` +
        `richieste dalla raccomandazione "${recommendation.title}".`,
      targetBloomLevel: higherLevel,
      durationMinutes:  higherDuration,
      instructions:
        `Svolgere l'esercizio proposto applicando le competenze di livello ${higherLevel}. ` +
        'Documentare i passaggi principali del ragionamento. Confrontare il proprio lavoro con il template fornito dal docente.',
      recommendationId: recId,
    });
  }

  // ── Activity 3: What-if scenario (impactScore ≥ 0.50) ─────────────────────
  if (impactScore >= 0.50) {
    const tmpl = WHATIF_TEMPLATES[(_actSeq) % WHATIF_TEMPLATES.length];
    activities.push({
      id:               actId(),
      type:             'whatif',
      title:            tmpl.title,
      description:      tmpl.description,
      targetBloomLevel: 'evaluate',
      durationMinutes:  15,
      instructions:     tmpl.instructions,
      recommendationId: recId,
    });
  }

  return activities;
}

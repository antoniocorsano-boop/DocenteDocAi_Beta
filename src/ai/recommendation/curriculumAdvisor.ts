/**
 * curriculumAdvisor.ts — Sprint 8: AI Decision Support
 *
 * Analyses a sequence of Lezione objects as a whole curriculum unit and
 * generates macro-level Recommendation objects targeting the following
 * curriculum health dimensions:
 *
 *   1. topicDensity     — too many topics in too few lessons → reschedule
 *   2. methodDiversity  — monotone lesson types → adjustContent
 *   3. bloomBalance     — HOTS lessons vs. pure recall → addExercise
 *   4. verificationGap  — long stretches without any Verifica/Test → addExercise
 *   5. coverageGap      — lessons without clear learning objectives → adjustContent
 */

import type { Lezione } from '@/types/uda.types';
import type { Recommendation } from './lessonRecommender';

// ── constants ─────────────────────────────────────────────────────────────────

const HOTS_TYPES  = new Set(['Laboratorio', 'Test', 'Verifica']);
const EXPECTED_LESSON_TYPES = 4;      // diversity threshold
const VERIFICATION_GAP_MAX  = 6;      // at most N lessons without a verification
const MIN_OBJECTIVE_RATIO   = 0.50;   // at least 50 % of lessons should have obiettivi

// ── helpers ───────────────────────────────────────────────────────────────────

let _curSeq = 0;
function cid(): string {
  return `cur-rec-${++_curSeq}`;
}

/** @internal — reset the ID sequence between test runs to ensure deterministic IDs */
export function _resetCurSeqForTesting(): void { _curSeq = 0; }

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

// ── analysis functions ────────────────────────────────────────────────────────

/**
 * Checks whether too many distinct topics appear per block of lessons.
 */
function analyseTopicDensity(lessons: Lezione[]): Recommendation | null {
  if (lessons.length < 3) return null;

  // Proxy for "topic" = distinct non-empty contenuto first-words
  const topics = new Set(
    lessons
      .map(l => l.contenuto?.trim().split(/\s+/)[0]?.toLowerCase() ?? '')
      .filter(Boolean),
  );

  const ratio = topics.size / lessons.length;
  if (ratio <= 0.80) return null; // acceptable density

  const impact = round3(Math.min(0.85, (ratio - 0.80) * 3));
  return {
    id:             cid(),
    title:          'Densità tematica elevata — considera una riorganizzazione',
    description:
      `Rilevati ${topics.size} argomenti distinti in ${lessons.length} lezioni (${(ratio * 100).toFixed(0)}%). ` +
      'Un carico tematico eccessivo riduce l\'apprendimento profondo. Valuta di distribuire i contenuti su più lezioni o di raggruppare argomenti correlati in un\'UDA.',
    impactScore:     impact,
    suggestedAction: 'reschedule',
    source:         'pedagogy',
    tags:           ['Curricolo', 'Densità tematica'],
  };
}

/**
 * Checks for monotone lesson types (low diversity of methods).
 */
function analyseMethodDiversity(lessons: Lezione[]): Recommendation | null {
  if (lessons.length < 4) return null;

  const typesUsed = new Set(
    lessons.map(l => l.tipoLezione ?? 'Teoria').filter(Boolean),
  );

  const diversityScore = typesUsed.size / EXPECTED_LESSON_TYPES;
  if (diversityScore >= 1) return null;

  const impact = round3(Math.min(0.80, (1 - diversityScore) * 0.90));
  return {
    id:             cid(),
    title:          'Metodi didattici poco diversificati',
    description:
      `Vengono usati solo ${typesUsed.size}/${EXPECTED_LESSON_TYPES} tipi di lezione attesi ` +
      `(${[...typesUsed].join(', ')}). ` +
      'Integra laboratori, verifiche formative e attività collaborative per adattarsi ai diversi stili di apprendimento.',
    impactScore:     impact,
    suggestedAction: 'adjustContent',
    source:         'pedagogy',
    tags:           ['Curricolo', 'Metodi didattici'],
  };
}

/**
 * Checks ratio of HOTS-type lessons to purely receptive lessons.
 */
function analyseBloomBalance(lessons: Lezione[]): Recommendation | null {
  if (lessons.length < 3) return null;

  const hotsCount = lessons.filter(l => HOTS_TYPES.has(l.tipoLezione ?? '')).length;
  const ratio = hotsCount / lessons.length;

  if (ratio >= 0.30) return null;

  const impact = round3(Math.min(0.75, (0.30 - ratio) * 2));
  return {
    id:             cid(),
    title:          'Poche attività di ordine superiore (HOTS)',
    description:
      `Solo il ${(ratio * 100).toFixed(0)}% delle lezioni comprende attività pratiche/verifica ` +
      `(obiettivo ≥ 30%). Aggiungi almeno ${Math.ceil(lessons.length * 0.30 - hotsCount)} lezioni di tipo ` +
      'Laboratorio, Test o Verifica nella programmazione.',
    impactScore:     impact,
    suggestedAction: 'addExercise',
    source:         'pedagogy',
    tags:           ['Curricolo', 'HOTS', 'Bloom'],
  };
}

/**
 * Checks for long stretches without a verification lesson.
 */
function analyseVerificationGap(lessons: Lezione[]): Recommendation | null {
  if (lessons.length < VERIFICATION_GAP_MAX) return null;

  const verificationTypes = new Set(['Verifica', 'Test']);
  let maxGap = 0;
  let currentGap = 0;

  for (const l of lessons) {
    if (verificationTypes.has(l.tipoLezione ?? '')) {
      maxGap = Math.max(maxGap, currentGap);
      currentGap = 0;
    } else {
      currentGap++;
    }
  }
  maxGap = Math.max(maxGap, currentGap);

  if (maxGap <= VERIFICATION_GAP_MAX) return null;

  const impact = round3(Math.min(0.70, (maxGap - VERIFICATION_GAP_MAX) * 0.08));
  return {
    id:             cid(),
    title:          `Mancanza di verifiche: ${maxGap} lezioni senza valutazione`,
    description:
      `Il gap massimo tra una verifica e la successiva è di ${maxGap} lezioni (soglia consigliata ≤ ${VERIFICATION_GAP_MAX}). ` +
      'Inserisci verifiche formative intermedie (es. exit ticket, quiz, mini-test) per monitorare l\'apprendimento in modo continuativo.',
    impactScore:     impact,
    suggestedAction: 'addExercise',
    source:         'pedagogy',
    tags:           ['Curricolo', 'Valutazione formativa'],
  };
}

/**
 * Checks what fraction of lessons have explicit learning objectives.
 */
function analyseCoverageGap(lessons: Lezione[]): Recommendation | null {
  if (lessons.length === 0) return null;

  const withObjectives = lessons.filter(l => (l.obiettivi?.trim().length ?? 0) > 0).length;
  const ratio = withObjectives / lessons.length;

  if (ratio >= MIN_OBJECTIVE_RATIO) return null;

  const impact = round3(Math.min(0.65, (MIN_OBJECTIVE_RATIO - ratio) * 1.2));
  return {
    id:             cid(),
    title:          'Obiettivi di apprendimento non dichiarati',
    description:
      `Solo il ${(ratio * 100).toFixed(0)}% delle lezioni ha obiettivi espliciti (soglia ≥ ${MIN_OBJECTIVE_RATIO * 100}%). ` +
      'Inserisci almeno un obiettivo per lezione per permettere all\'AI di allineare meglio le predizioni al contesto didattico.',
    impactScore:     impact,
    suggestedAction: 'adjustContent',
    source:         'pedagogy',
    tags:           ['Curricolo', 'Obiettivi didattici'],
  };
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Analyse a lesson sequence and return curriculum-level recommendations.
 *
 * @param lessonSequence  Ordered array of Lezione objects (as in the register)
 *
 * Returns empty array for < 2 lessons.
 * Results sorted by impactScore descending.
 */
export function generateCurriculumRecommendations(
  lessonSequence: Lezione[],
): Recommendation[] {
  if (lessonSequence.length < 2) return [];

  const candidates = [
    analyseTopicDensity(lessonSequence),
    analyseMethodDiversity(lessonSequence),
    analyseBloomBalance(lessonSequence),
    analyseVerificationGap(lessonSequence),
    analyseCoverageGap(lessonSequence),
  ].filter((r): r is Recommendation => r !== null);

  return candidates.sort((a, b) => b.impactScore - a.impactScore);
}

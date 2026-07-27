/**
 * pedagogyReport.ts — Sprint 6: Pedagogical Alignment
 *
 * Aggregates lesson-level and UDA-level alignment scores into a single
 * PedagogyReport, and generates Italian-language strengths and opportunities
 * suitable for display in the teacher-facing AI DevTools panel.
 */

import type { Lezione } from '@/types/uda.types';
import type { Uda } from '@/types/uda.types';
import {
  scoreLessons,
  scoreAllUdas,
  type AlignmentScore,
  type AlignmentDimension,
} from './alignmentScorer';

// ── types ─────────────────────────────────────────────────────────────────────

export interface PedagogyReport {
  /** ISO timestamp of computation */
  computedAt: string;
  /** Score for the full lesson register (null if no lessons provided) */
  lessonScore: AlignmentScore | null;
  /** Per-UDA scores, sorted by descending overall score */
  udaScores: AlignmentScore[];
  /** Composite of lessonScore and mean of udaScores */
  overallScore: number;
  /** Italian points of strength (max 3) */
  strengths: string[];
  /** Italian opportunities for improvement (max 3) */
  opportunities: string[];
}

// ── string catalogue ──────────────────────────────────────────────────────────

const STRENGTH_MESSAGES: Record<AlignmentDimension, string> = {
  bloomCoverage:
    "Ottima copertura della tassonomia di Bloom: le attività sviluppano competenze a più livelli cognitivi.",
  cognitiveProgression:
    "Progressione cognitiva ben strutturata: le attività si sviluppano gradualmente verso livelli di pensiero superiori.",
  activeLearningRatio:
    "Elevata presenza di attività di ordine superiore (HOTS): gli studenti vengono sollecitati ad applicare, analizzare, valutare e creare.",
  inclusionSignals:
    "Buona sensibilità inclusiva: si rilevano adattamenti e strategie per rispondere ai bisogni educativi speciali.",
  diversityOfMethods:
    "Ricca varietà metodologica: il percorso combina efficacemente diversi approcci didattici.",
};

const OPPORTUNITY_MESSAGES: Record<AlignmentDimension, string> = {
  bloomCoverage:
    "Ampliare la copertura dei livelli cognitivi superiori per stimolare l'analisi critica e la creatività.",
  cognitiveProgression:
    "Riorganizzare le attività in ordine di complessità crescente per guidare meglio l'apprendimento.",
  activeLearningRatio:
    "Aumentare le attività di apprendimento attivo (laboratori, problem-solving, produzione) per superare il 40%.",
  inclusionSignals:
    "Inserire adattamenti espliciti e strategie inclusive per rispondere alla diversità della classe.",
  diversityOfMethods:
    "Diversificare i metodi didattici: affiancare lezioni teoriche con attività pratiche, collaborative e di verifica formativa.",
};

// ── helpers ───────────────────────────────────────────────────────────────────

function dimensionMeans(scores: AlignmentScore[]): Record<AlignmentDimension, number> {
  const dims: AlignmentDimension[] = [
    'bloomCoverage',
    'cognitiveProgression',
    'activeLearningRatio',
    'inclusionSignals',
    'diversityOfMethods',
  ];
  const totals = Object.fromEntries(dims.map(d => [d, 0])) as Record<AlignmentDimension, number>;
  for (const s of scores) {
    for (const d of dims) totals[d] += s.dimensions[d];
  }
  const n = scores.length;
  return Object.fromEntries(dims.map(d => [d, n > 0 ? totals[d] / n : 0])) as Record<AlignmentDimension, number>;
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Generate a full PedagogyReport from lessons and UDAs.
 * Pure function — deterministic for the same inputs.
 */
export function generatePedagogyReport(
  lessons: Lezione[],
  udas: Uda[],
): PedagogyReport {
  const lessonScore = lessons.length > 0
    ? scoreLessons(lessons)
    : null;

  const udaScores = scoreAllUdas(udas);

  // Overall = mean of available scores
  const allScores: AlignmentScore[] = [
    ...(lessonScore ? [lessonScore] : []),
    ...udaScores,
  ];
  const overallScore = allScores.length > 0
    ? parseFloat(
        (allScores.reduce((s, a) => s + a.overallScore, 0) / allScores.length).toFixed(3)
      )
    : 0;

  // Aggregate dimension means for strength / opportunity detection
  const meanDims = dimensionMeans(allScores);

  // Strengths: top-2 dimensions above 0.65
  const dims: AlignmentDimension[] = [
    'bloomCoverage',
    'cognitiveProgression',
    'activeLearningRatio',
    'inclusionSignals',
    'diversityOfMethods',
  ];

  const sorted = [...dims].sort((a, b) => meanDims[b] - meanDims[a]);
  const strengths = sorted
    .filter(d => meanDims[d] >= 0.65)
    .slice(0, 3)
    .map(d => STRENGTH_MESSAGES[d]);

  // Default strength if nothing is strong enough yet
  if (strengths.length === 0 && allScores.length > 0) {
    strengths.push("Il percorso didattico è in via di sviluppo: continuare ad arricchire le attività per raggiungere una piena conformità pedagogica.");
  }

  // Opportunities: bottom-3 dimensions below 0.50
  const opportunities = sorted
    .filter(d => meanDims[d] < 0.50)
    .reverse()
    .slice(0, 3)
    .map(d => OPPORTUNITY_MESSAGES[d]);

  return {
    computedAt: new Date().toISOString(),
    lessonScore,
    udaScores,
    overallScore,
    strengths,
    opportunities,
  };
}

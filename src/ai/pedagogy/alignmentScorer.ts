/**
 * alignmentScorer.ts — Sprint 6: Pedagogical Alignment
 *
 * Scores an UDA (Unità Didattica di Apprendimento) or a set of lessons
 * against a multi-dimensional pedagogical alignment framework:
 *
 *   1. bloomCoverage (0–1)
 *      Fraction of Bloom's levels [remember → create] covered by at least
 *      one phase/objective. Ideal: all 6 levels ≥ 0.80.
 *
 *   2. cognitiveProgression (0–1)
 *      Does the cognitive level increase (or stay varied) across phases
 *      in order? Measured as Spearman rho of (phase index vs. level index).
 *      Positive rho = progression; near 0 = flat; negative = regression.
 *
 *   3. activeLearningRatio (0–1)
 *      Share of phases classified at apply/analyze/evaluate/create ("HOTS").
 *      Target ≥ 0.40.
 *
 *   4. inclusionSignals (0–1)
 *      Presence of inclusive teaching keywords (adattamenti, BES, DSA,
 *      personalizzazione, cooperativo, peer, scaffolding, metacognizione …)
 *      across the UDA introduction, phase descriptions and lesson adattamenti.
 *
 *   5. diversityOfMethods (0–1)
 *      Coverage of distinct lesson types: Teoria, Laboratorio, Verifica,
 *      Disegno, Test, Disposizione, Ricevimento.
 *      Score = distinctTypes / EXPECTED_TYPES (4).
 */

import type { Lezione } from '@/types/uda.types';
import type { Uda } from '@/types/uda.types';
import {
  classifyBloomDistribution,
  BLOOM_LEVELS,
  type BloomDistribution,
  type BloomLevel,
} from './bloomsClassifier';

// ── constants ─────────────────────────────────────────────────────────────────

/** At least this fraction of Bloom's 6 levels must be covered */
const BLOOM_COVERAGE_TARGET = 4 / 6; // ~0.667 → expect at least 4 levels

/** HOTS = Higher-Order Thinking Skills */
const HOTS_LEVELS = new Set<BloomLevel>(['apply', 'analyze', 'evaluate', 'create']);
const HOTS_TARGET = 0.40;

/** Expected distinct lesson types for diversity score */
const EXPECTED_METHOD_DIVERSITY = 4;

const INCLUSION_KEYWORDS = [
  'adattament', 'bes ', 'dsa ', '104', 'personalizzaz', 'personalizzare',
  'cooperativ', 'peer', 'scaffolding', 'metacogniz', 'inclusiv', 'differenziaz',
  'disabilit', 'bisogni', 'supporto', 'aiuto', 'recupero', 'rinforzo',
  'diversificat', 'semplificat',
];

// ── types ─────────────────────────────────────────────────────────────────────

export type AlignmentDimension =
  | 'bloomCoverage'
  | 'cognitiveProgression'
  | 'activeLearningRatio'
  | 'inclusionSignals'
  | 'diversityOfMethods';

export interface AlignmentScore {
  /** The scored entity (UDA id or 'lessons') */
  entityId: string;
  /** Human-readable label */
  label: string;
  /** Composite 0–1 score (weighted mean of dimensions) */
  overallScore: number;
  /** Per-dimension breakdown */
  dimensions: Record<AlignmentDimension, number>;
  /** Bloom's taxonomy distribution */
  bloomDistribution: BloomDistribution;
  /** Issues to highlight: dimension names below threshold */
  weakDimensions: AlignmentDimension[];
  /**
   * Italian-language suggestions, one per weak dimension.
   * Designed to be displayed directly to the teacher.
   */
  suggestions: string[];
}

// ── dimension weights ─────────────────────────────────────────────────────────

const WEIGHTS: Record<AlignmentDimension, number> = {
  bloomCoverage:         0.25,
  cognitiveProgression:  0.20,
  activeLearningRatio:   0.25,
  inclusionSignals:      0.15,
  diversityOfMethods:    0.15,
};

// ── suggestion templates ──────────────────────────────────────────────────────

const SUGGESTIONS_IT: Record<AlignmentDimension, string> = {
  bloomCoverage:
    "La copertura tassonomica è incompleta: integrare attività di livello superiore (analisi, valutazione, creazione) per sviluppare il pensiero critico degli studenti.",
  cognitiveProgression:
    "La progressione cognitiva tra le fasi non è ascendente: riordinare le attività partendo da livelli di ricordo/comprensione e salendo verso applicazione e valutazione.",
  activeLearningRatio:
    "Meno del 40% delle attività coinvolge pensiero di ordine superiore (HOTS): aggiungere compiti di applicazione pratica, analisi critica o produzione creativa.",
  inclusionSignals:
    "Non si rilevano sufficienti segnali di didattica inclusiva: inserire adattamenti espliciti per studenti BES/DSA, tecniche cooperative e scaffolding.",
  diversityOfMethods:
    "La varietà metodologica è limitata: arricchire il percorso con laboratori, esercitazioni pratiche, discussioni guidate e momenti di verifica formativa.",
};

const DIMENSION_THRESHOLDS: Record<AlignmentDimension, number> = {
  bloomCoverage:         BLOOM_COVERAGE_TARGET,
  cognitiveProgression:  0.30,   // rho < 0.30 → regression/flat
  activeLearningRatio:   HOTS_TARGET,
  inclusionSignals:      0.30,
  diversityOfMethods:    0.50,
};

// ── helpers ───────────────────────────────────────────────────────────────────

function spearmanRho(n: number, levelIndices: number[]): number {
  if (n <= 1) return 0;
  const ranks = Array.from({ length: n }, (_, i) => i + 1);
  const mean = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const mr = mean(ranks);
  const ml = mean(levelIndices);
  let num = 0; let dr = 0; let dl = 0;
  for (let i = 0; i < n; i++) {
    const dr2 = ranks[i] - mr;
    const dl2 = levelIndices[i] - ml;
    num += dr2 * dl2;
    dr  += dr2 * dr2;
    dl  += dl2 * dl2;
  }
  if (dr === 0 || dl === 0) return 0;
  return parseFloat((num / Math.sqrt(dr * dl)).toFixed(3));
}

function inclusionScore(texts: string[]): number {
  if (texts.length === 0) return 0;
  const combined = texts.join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const hits = INCLUSION_KEYWORDS.filter(kw => combined.includes(kw.trim())).length;
  return Math.min(1, hits / 5); // 5+ keywords → full score
}

function computeOverall(dims: Record<AlignmentDimension, number>): number {
  return parseFloat(
    (Object.keys(WEIGHTS) as AlignmentDimension[])
      .reduce((sum, d) => sum + dims[d] * WEIGHTS[d], 0)
      .toFixed(3)
  );
}

function buildWeakAndSuggestions(dims: Record<AlignmentDimension, number>): {
  weakDimensions: AlignmentDimension[];
  suggestions: string[];
} {
  const weakDimensions: AlignmentDimension[] = [];
  const suggestions: string[] = [];
  for (const dim of Object.keys(DIMENSION_THRESHOLDS) as AlignmentDimension[]) {
    if (dims[dim] < DIMENSION_THRESHOLDS[dim]) {
      weakDimensions.push(dim);
      suggestions.push(SUGGESTIONS_IT[dim]);
    }
  }
  return { weakDimensions, suggestions };
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Score a single UDA for pedagogical alignment.
 * The UDA's phases descriptions + introduction are used as text corpus.
 */
export function scoreUda(uda: Uda): AlignmentScore {
  // Gather texts for Bloom classification
  const phaseTexts = [
    uda.introduction,
    ...uda.phases.map(p => [p.title, p.description, p.activities].filter(Boolean).join(' ')),
    uda.finalProduct,
    uda.evaluation,
  ].filter(t => t && t.trim().length > 3) as string[];

  const dist = classifyBloomDistribution(phaseTexts);

  // 1. bloomCoverage
  const coveredLevels = BLOOM_LEVELS.filter(l => dist.counts[l] > 0).length;
  const bloomCoverage = parseFloat((coveredLevels / BLOOM_LEVELS.length).toFixed(3));

  // 2. cognitiveProgression — are phases ordered low → high?
  const phaseClassifications = dist.classifications;
  const rho = spearmanRho(phaseClassifications.length, phaseClassifications.map(c => c.levelIndex));
  const cognitiveProgression = parseFloat(((rho + 1) / 2).toFixed(3)); // map [-1,1] → [0,1]

  // 3. activeLearningRatio
  const hotsCount = dist.classifications.filter(c => HOTS_LEVELS.has(c.primaryLevel)).length;
  const activeLearningRatio = dist.classifications.length > 0
    ? parseFloat((hotsCount / dist.classifications.length).toFixed(3))
    : 0;

  // 4. inclusionSignals
  const incTexts = [uda.introduction, uda.evaluation, uda.tools, ...uda.phases.map(p => p.description)].filter(Boolean) as string[];
  const incScore = inclusionScore(incTexts);

  // 5. diversityOfMethods — UDA doesn't have tipoLezione, use phase count as proxy
  const uniquePhaseTypes = new Set(uda.phases.map(p => p.activities.split(' ')[0].toLowerCase())).size;
  const diversityOfMethods = Math.min(1, uniquePhaseTypes / EXPECTED_METHOD_DIVERSITY);

  const dimensions: Record<AlignmentDimension, number> = {
    bloomCoverage,
    cognitiveProgression,
    activeLearningRatio,
    inclusionSignals: incScore,
    diversityOfMethods,
  };

  const overallScore = computeOverall(dimensions);
  const { weakDimensions, suggestions } = buildWeakAndSuggestions(dimensions);

  return {
    entityId:        uda.id,
    label:           uda.title || `UDA ${uda.id}`,
    overallScore,
    dimensions,
    bloomDistribution: dist,
    weakDimensions,
    suggestions,
  };
}

/**
 * Score a set of lessons for pedagogical alignment.
 * Uses contenuto, obiettivi, adattamenti as corpus.
 */
export function scoreLessons(
  lessons: Lezione[],
  entityId = 'lessons',
  label = 'Registro lezioni',
): AlignmentScore {
  if (lessons.length === 0) {
    const emptyDims: Record<AlignmentDimension, number> = {
      bloomCoverage: 0, cognitiveProgression: 0, activeLearningRatio: 0,
      inclusionSignals: 0, diversityOfMethods: 0,
    };
    return {
      entityId, label, overallScore: 0,
      dimensions: emptyDims,
      bloomDistribution: classifyBloomDistribution([]),
      weakDimensions: Object.keys(emptyDims) as AlignmentDimension[],
      suggestions: (Object.keys(emptyDims) as AlignmentDimension[]).map(d => SUGGESTIONS_IT[d]),
    };
  }
  const contentTexts = lessons
    .map(l => [l.contenuto, l.obiettivi, l.compiti, l.contesto].filter(Boolean).join(' '))
    .filter(t => t.trim().length > 3);

  const dist = classifyBloomDistribution(contentTexts);

  // 1. bloomCoverage
  const coveredLevels = BLOOM_LEVELS.filter(l => dist.counts[l] > 0).length;
  const bloomCoverage = parseFloat((coveredLevels / BLOOM_LEVELS.length).toFixed(3));

  // 2. cognitiveProgression — sort lessons by date, check if level trends upward
  const sorted = [...lessons].sort((a, b) => (a.data ?? '').localeCompare(b.data ?? ''));
  const atTexts = sorted
    .map(l => [l.contenuto, l.obiettivi].filter(Boolean).join(' '))
    .filter(t => t.trim().length > 3);
  const dateDist = classifyBloomDistribution(atTexts);
  const rho = spearmanRho(dateDist.classifications.length, dateDist.classifications.map(c => c.levelIndex));
  const cognitiveProgression = parseFloat(((rho + 1) / 2).toFixed(3));

  // 3. activeLearningRatio
  const hotsCount = dist.classifications.filter(c => HOTS_LEVELS.has(c.primaryLevel)).length;
  const activeLearningRatio = dist.classifications.length > 0
    ? parseFloat((hotsCount / dist.classifications.length).toFixed(3))
    : 0;

  // 4. inclusionSignals — from adattamenti and contenuto
  const incTexts = lessons.map(l => [l.contenuto, l.adattamenti, l.obiettivi].filter(Boolean).join(' '));
  const incScore = inclusionScore(incTexts);

  // 5. diversityOfMethods — use tipoLezione spread
  const tipi = lessons.map(l => l.tipoLezione).filter(Boolean);
  const distinctTypes = new Set(tipi).size;
  const diversityOfMethods = Math.min(1, distinctTypes / EXPECTED_METHOD_DIVERSITY);

  const dimensions: Record<AlignmentDimension, number> = {
    bloomCoverage,
    cognitiveProgression,
    activeLearningRatio,
    inclusionSignals: incScore,
    diversityOfMethods,
  };

  const overallScore = computeOverall(dimensions);
  const { weakDimensions, suggestions } = buildWeakAndSuggestions(dimensions);

  return {
    entityId,
    label,
    overallScore,
    dimensions,
    bloomDistribution: dist,
    weakDimensions,
    suggestions,
  };
}

/**
 * Score all UDAs in a list and return sorted by descending overallScore.
 */
export function scoreAllUdas(udas: Uda[]): AlignmentScore[] {
  return udas.map(scoreUda).sort((a, b) => b.overallScore - a.overallScore);
}

/**
 * trustReport.ts — Sprint 7: AI Trust Score
 *
 * Wraps ClassTrustScore into a PedagogyReport-style report with:
 *  - a structured snapshot of trust dimensions
 *  - Italian-language recommendations for the teacher
 *  - a trust trend description (based on student count + data quality)
 */

import type { AIExplanation } from '../explainability/decisionExplainer';
import type { BiasLevel } from '../fairness/biasReport';
import {
  scoreClassTrust,
  type ClassTrustScore,
  type TrustLevel,
} from './trustScoreEngine';

// ── types ─────────────────────────────────────────────────────────────────────

export interface TrustReport {
  /** ISO timestamp of computation */
  computedAt: string;
  /** Full class trust score breakdown */
  classScore: ClassTrustScore;
  /** One-sentence Italian trust summary for the teacher */
  trustSummary: string;
  /** Up to 3 Italian-language recommendations (for weak dimensions) */
  recommendations: string[];
  /** Overall trust level label (Italian) */
  trustLevelLabel: string;
}

// ── string catalogues ─────────────────────────────────────────────────────────

const LEVEL_LABELS_IT: Record<TrustLevel, string> = {
  high:         'Alta fiducia',
  moderate:     'Fiducia moderata',
  low:          'Fiducia bassa',
  insufficient: 'Fiducia insufficiente',
};

const SUMMARIES_IT: Record<TrustLevel, (studentCount: number) => string> = {
  high: (n) =>
    `Il sistema AI è pronto: le predizioni per ${n} studenti sono basate su dati di buona qualità, senza bias significativi rilevati.`,
  moderate: (n) =>
    `Le predizioni per ${n} studenti sono utilizzabili, ma alcune dimensioni richiedono attenzione prima di prendere decisioni critiche.`,
  low: (n) =>
    `Le predizioni per ${n} studenti hanno affidabilità limitata. Si consiglia di raccogliere più dati prima di utilizzare i risultati AI.`,
  insufficient: (n) =>
    `Dati insufficienti per ${n} studenti: le predizioni AI non sono affidabili. Inserire valutazioni e ripetere l'analisi.`,
};

const RECOMMENDATIONS_IT: Record<string, string> = {
  dataQuality:
    'Inserire almeno 5–10 valutazioni per studente, distribuite su più materie e periodi recenti.',
  fairnessScore:
    'Rivedere l\'audit di equità (sezione Bias Detection) e intervenire sui gruppi segnalati prima di usare le predizioni.',
  coverageScore:
    'Completare i dati per gli studenti senza valutazioni sufficienti: le predizioni mancanti distorcono la visione di classe.',
  pedagogyAlignment:
    'Sviluppare il registro lezioni con attività a diversi livelli cognitivi (Bloom) per migliorare la coerenza dell\'analisi AI.',
};

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Generate a TrustReport combining AI explanations, bias level and pedagogy score.
 * Pure function — deterministic for the same inputs.
 *
 * @param explanations   From Sprint 4 `explainClass()`
 * @param biasLevel      From Sprint 5 `generateBiasReport().level`
 * @param pedagogyScore  From Sprint 6 `PedagogyReport.overallScore` (0 if not available)
 * @param affectedIds    Student IDs in high-disparity groups (Sprint 5)
 */
export function generateTrustReport(
  explanations: AIExplanation[],
  biasLevel: BiasLevel,
  pedagogyScore = 0,
  affectedIds: Set<string> = new Set(),
): TrustReport {
  const classScore = scoreClassTrust(explanations, biasLevel, pedagogyScore, affectedIds);
  const trustSummary = SUMMARIES_IT[classScore.trustLevel](classScore.studentCount);
  const trustLevelLabel = LEVEL_LABELS_IT[classScore.trustLevel];

  // recommendations: up to 3, in order of most impactful weak dimension
  const dimOrder: (keyof typeof RECOMMENDATIONS_IT)[] = [
    'dataQuality', 'fairnessScore', 'coverageScore', 'pedagogyAlignment',
  ];
  const recommendations = dimOrder
    .filter(d => (classScore.dimensions as Record<string, number>)[d] < 0.50)
    .slice(0, 3)
    .map(d => RECOMMENDATIONS_IT[d]);

  return {
    computedAt: new Date().toISOString(),
    classScore,
    trustSummary,
    recommendations,
    trustLevelLabel,
  };
}

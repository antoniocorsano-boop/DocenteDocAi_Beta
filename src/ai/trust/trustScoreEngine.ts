/**
 * trustScoreEngine.ts — Sprint 7: AI Trust Score
 *
 * Answers the question: "How much should the teacher trust the AI system's
 * predictions for this class, right now?"
 *
 * This is a SYSTEM-LEVEL score, not a student-level score.
 * It aggregates four orthogonal dimensions:
 *
 *   1. dataQuality      (0.35) — mean confidence across students in the class.
 *      Driven by evaluation volume, recency, consistency and subject spread.
 *      Source: AIExplanation.confidence.score (Sprint 4)
 *
 *   2. fairnessScore    (0.30) — inverse of detected bias severity.
 *      High bias → low trust in protected-group predictions.
 *      Source: BiasLevel (Sprint 5)
 *
 *   3. coverageScore    (0.20) — fraction of students with ≥ medium confidence.
 *      If half the class has insufficient data the whole class score drops.
 *
 *   4. pedagogyAlignment (0.15) — pedagogical coherence of the lesson plan.
 *      A teacher with a sound lesson plan is more likely to have meaningful data.
 *      Source: PedagogyReport.overallScore (Sprint 6)
 */

import type { AIExplanation } from '../explainability/decisionExplainer';
import type { BiasLevel } from '../fairness/biasReport';

// ── types ─────────────────────────────────────────────────────────────────────

export type TrustDimension =
  | 'dataQuality'
  | 'fairnessScore'
  | 'coverageScore'
  | 'pedagogyAlignment';

export type TrustLevel = 'high' | 'moderate' | 'low' | 'insufficient';

export interface StudentTrustScore {
  studentId: string;
  /** 0–1 from AIExplanation.confidence.score */
  dataQualityScore: number;
  /** 0–1: penalized if student belongs to a high-disparity group */
  fairnessPenalty: number;
  /** Weighted combination of the two */
  overallScore: number;
  trustLevel: TrustLevel;
}

export interface ClassTrustScore {
  /** Class-wide composite trust score 0–1 */
  overallScore: number;
  trustLevel: TrustLevel;
  /** Per-dimension breakdown */
  dimensions: Record<TrustDimension, number>;
  /** Per-student breakdown */
  studentScores: StudentTrustScore[];
  /** Italian-language warning messages for low dimensions */
  warningFlags: string[];
  studentCount: number;
  /** Students with confidence >= 0.40 ("medium" threshold) */
  sufficientDataCount: number;
}

// ── constants ─────────────────────────────────────────────────────────────────

const WEIGHTS: Record<TrustDimension, number> = {
  dataQuality:       0.35,
  fairnessScore:     0.30,
  coverageScore:     0.20,
  pedagogyAlignment: 0.15,
};

/** BiasLevel → fairnessScore: high bias = very low trust */
const BIAS_TO_FAIRNESS: Record<BiasLevel, number> = {
  none:     1.00,
  low:      0.85,
  moderate: 0.55,
  high:     0.25,
};

const COVERAGE_THRESHOLD = 0.40;   // confidence >= 0.40 = "sufficient"
const WARNING_THRESHOLD  = 0.50;   // dimension below this triggers a warning

const WARNINGS_IT: Record<TrustDimension, string> = {
  dataQuality:
    'Qualità dati insufficiente: gli studenti hanno troppo poche valutazioni recenti per predizioni affidabili.',
  fairnessScore:
    'Bias rilevato: le predizioni per alcuni gruppi potrebbero non essere eque. Verificare l\'audit di equità.',
  coverageScore:
    'Copertura dati limitata: meno del 50% degli studenti ha dati sufficienti per una stima attendibile.',
  pedagogyAlignment:
    'Allineamento pedagogico basso: analizzare il registro lezioni per migliorare la coerenza didattica.',
};

const TRUST_LEVEL_THRESHOLDS: [number, TrustLevel][] = [
  [0.75, 'high'],
  [0.50, 'moderate'],
  [0.25, 'low'],
  [0,    'insufficient'],
];

// ── helpers ───────────────────────────────────────────────────────────────────

function toTrustLevel(score: number): TrustLevel {
  for (const [threshold, level] of TRUST_LEVEL_THRESHOLDS) {
    if (score >= threshold) return level;
  }
  return 'insufficient';
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

// ── student-level scoring ─────────────────────────────────────────────────────

/**
 * Per-student trust score.
 * `affectedStudentIds` is the set of student IDs that belong to at least one
 * high-disparity group as identified by the bias detector (Sprint 5).
 */
export function scoreStudentTrust(
  explanation: AIExplanation,
  affectedStudentIds: Set<string> = new Set(),
): StudentTrustScore {
  const dq = explanation.confidence.score;
  const fp = affectedStudentIds.has(explanation.studentId) ? 0.50 : 1.00;
  const overall = round3(dq * 0.70 + fp * 0.30);
  return {
    studentId:        explanation.studentId,
    dataQualityScore: round3(dq),
    fairnessPenalty:  round3(fp),
    overallScore:     overall,
    trustLevel:       toTrustLevel(overall),
  };
}

// ── class-level scoring ───────────────────────────────────────────────────────

/**
 * Compute the composite class-level AI Trust Score.
 *
 * @param explanations     Array of AIExplanation from Sprint 4 explainClass()
 * @param biasLevel        BiasLevel from Sprint 5 generateBiasReport()
 * @param pedagogyScore    0–1 from Sprint 6 PedagogyReport.overallScore (default 0 = not computed)
 * @param affectedIds      Set of student IDs in high-disparity groups
 */
export function scoreClassTrust(
  explanations: AIExplanation[],
  biasLevel: BiasLevel,
  pedagogyScore = 0,
  affectedIds: Set<string> = new Set(),
): ClassTrustScore {
  if (explanations.length === 0) {
    const emptyDims: Record<TrustDimension, number> = {
      dataQuality: 0, fairnessScore: 0, coverageScore: 0, pedagogyAlignment: 0,
    };
    return {
      overallScore: 0,
      trustLevel: 'insufficient',
      dimensions: emptyDims,
      studentScores: [],
      warningFlags: Object.values(WARNINGS_IT),
      studentCount: 0,
      sufficientDataCount: 0,
    };
  }

  const studentScores = explanations.map(e => scoreStudentTrust(e, affectedIds));

  // 1. dataQuality — mean confidence
  const dataQuality = round3(
    explanations.reduce((s, e) => s + e.confidence.score, 0) / explanations.length,
  );

  // 2. fairnessScore
  const fairnessScore = BIAS_TO_FAIRNESS[biasLevel];

  // 3. coverageScore — fraction with confidence >= threshold
  const sufficientDataCount = explanations.filter(
    e => e.confidence.score >= COVERAGE_THRESHOLD,
  ).length;
  const coverageScore = round3(sufficientDataCount / explanations.length);

  // 4. pedagogyAlignment — passed in directly from PedagogyReport
  const pedagogyAlignment = round3(pedagogyScore);

  const dimensions: Record<TrustDimension, number> = {
    dataQuality,
    fairnessScore,
    coverageScore,
    pedagogyAlignment,
  };

  // Composite overall score — weighted sum
  const overallScore = round3(
    Object.entries(WEIGHTS).reduce(
      (acc, [dim, weight]) => acc + (dimensions[dim as TrustDimension] * weight),
      0,
    ),
  );

  // Warning flags for weak dimensions
  const warningFlags = (Object.keys(dimensions) as TrustDimension[])
    .filter(d => dimensions[d] < WARNING_THRESHOLD)
    .map(d => WARNINGS_IT[d]);

  return {
    overallScore,
    trustLevel: toTrustLevel(overallScore),
    dimensions,
    studentScores,
    warningFlags,
    studentCount: explanations.length,
    sufficientDataCount,
  };
}

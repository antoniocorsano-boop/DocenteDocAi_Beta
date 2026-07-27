/**
 * decisionExplainer.ts — Top-level facade that combines riskFactorAnalyzer
 * and confidenceModel into a single `AIExplanation` per student.
 *
 * This is the primary entry point for the Explainability module.
 * UI components and Zustand stores should import from here.
 *
 * Relationship to the existing pipeline:
 *   runUnifiedAnalysis → riskPredictions: StudentRiskPrediction[]
 *   explainClass(students, evals, riskPredictions) → Map<id, AIExplanation>
 *
 * The explainer does NOT rerun the risk model — it receives the already-
 * computed `riskProbability` and augments it with factors + confidence.
 */

import type { Studente, Valutazione } from '@/types/student.types';
import type { StudentRiskPrediction } from '../prediction/types';
import { analyzeStudentRiskFactors, analyzeClassRiskFactors } from './riskFactorAnalyzer';
import { computeConfidence, computeClassConfidence } from './confidenceModel';
import type { RiskFactor, StudentRiskFactors } from './riskFactorAnalyzer';
import type { ConfidenceBreakdown } from './confidenceModel';

// ── types ─────────────────────────────────────────────────────────────────────

export type RiskTier = 'critical' | 'at_risk' | 'watch' | 'safe';

/**
 * Complete AI Explanation for one student.
 * Designed to be directly renderable by `StudentInsightPanel`.
 */
export interface AIExplanation {
  studentId: string;
  /** Probability from the risk predictor: [0, 1] */
  riskScore: number;
  /** Semantic tier derived from riskScore */
  riskTier: RiskTier;
  /** Confidence in the prediction quality: 0–1 */
  confidence: ConfidenceBreakdown;
  /** Top contributing factors, sorted by descending impact */
  factors: RiskFactor[];
  /**
   * Narrative summary for the teacher — written in Italian,
   * 1-2 sentences, suitable to show as a callout or tooltip.
   */
  narrative: string;
  /** Subject with the lowest avg grade — null when no evals */
  worstSubject: string | null;
  /** Mean grade across all subjects */
  gradeAverage: number;
  /** Number of distinct subjects with evaluations */
  subjectsCount: number;
}

// ── risk tier logic ───────────────────────────────────────────────────────────

function toRiskTier(prob: number): RiskTier {
  if (prob >= 0.70) return 'critical';
  if (prob >= 0.50) return 'at_risk';
  if (prob >= 0.30) return 'watch';
  return 'safe';
}

// ── narrative builder ─────────────────────────────────────────────────────────

function buildNarrative(
  riskTier: RiskTier,
  factors: RiskFactor[],
  fa: StudentRiskFactors,
  confidence: ConfidenceBreakdown,
): string {
  const topFactor = factors[0]?.label ?? null;

  if (fa.gradeAverage === 0 && fa.subjectsCount === 0) {
    return 'Nessuna valutazione disponibile: è impossibile formulare una stima affidabile.';
  }

  if (confidence.level === 'insufficient' || confidence.level === 'low') {
    return 'Dati insufficienti per una stima affidabile. Inserire più valutazioni.';
  }

  switch (riskTier) {
    case 'critical':
      return topFactor
        ? `Situazione critica: il principale segnale rilevato è "${topFactor}". Intervento prioritario raccomandato.`
        : 'Il profilo complessivo indica un rischio molto elevato. Intervento urgente raccomandato.';
    case 'at_risk':
      return topFactor
        ? `Lo studente è a rischio, principalmente per "${topFactor}". È consigliabile un monitoraggio ravvicinato.`
        : 'Profilo a rischio moderato-alto. Monitorare l\'andamento nelle prossime settimane.';
    case 'watch':
      return fa.worstSubject
        ? `Prestazioni nella norma ma con segnali da monitorare, soprattutto in ${fa.worstSubject}.`
        : 'Prestazioni nella norma con qualche segnale da osservare.';
    case 'safe':
      return fa.gradeAverage >= 8
        ? 'Eccellente profilo accademico. Nessuna criticità rilevata.'
        : 'Nessun segnale critico rilevato. Situazione nella norma.';
  }
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Explains the AI prediction for a single student.
 *
 * @param student          Full `Studente` record
 * @param evaluations      ALL evaluations (filtered internally by studentId)
 * @param riskProbability  Score from `predictStudentRisk` or `runUnifiedAnalysis`
 */
export function explainStudent(
  student: Studente,
  evaluations: Valutazione[],
  riskProbability: number,
): AIExplanation {
  const studentEvals = evaluations.filter(e => e.studenteId === student.id);
  const fa = analyzeStudentRiskFactors(student, evaluations);
  const confidence = computeConfidence(studentEvals);
  const riskTier = toRiskTier(riskProbability);
  const narrative = buildNarrative(riskTier, fa.factors, fa, confidence);

  return {
    studentId: student.id,
    riskScore: riskProbability,
    riskTier,
    confidence,
    factors: fa.factors,
    narrative,
    worstSubject: fa.worstSubject,
    gradeAverage: fa.gradeAverage,
    subjectsCount: fa.subjectsCount,
  };
}

/**
 * Explains AI predictions for a whole class.
 *
 * @param students         All students in the class
 * @param evaluations      All evaluations for the class
 * @param riskPredictions  Output of `runUnifiedAnalysis().riskPredictions`
 * @returns Map keyed by studentId for O(1) lookup in UI components
 */
export function explainClass(
  students: Studente[],
  evaluations: Valutazione[],
  riskPredictions: StudentRiskPrediction[],
): Map<string, AIExplanation> {
  const factorsByStudent = analyzeClassRiskFactors(students, evaluations);
  const confidenceByStudent = computeClassConfidence(
    students.map(s => s.id),
    evaluations,
  );

  const predictionMap = new Map(riskPredictions.map(p => [p.studentId, p.riskProbability]));

  const result = new Map<string, AIExplanation>();

  for (const student of students) {
    const riskProbability = predictionMap.get(student.id) ?? 0;
    const fa = factorsByStudent.get(student.id)!;
    const confidence = confidenceByStudent.get(student.id)!;
    const riskTier = toRiskTier(riskProbability);
    const narrative = buildNarrative(riskTier, fa.factors, fa, confidence);

    result.set(student.id, {
      studentId: student.id,
      riskScore: riskProbability,
      riskTier,
      confidence,
      factors: fa.factors,
      narrative,
      worstSubject: fa.worstSubject,
      gradeAverage: fa.gradeAverage,
      subjectsCount: fa.subjectsCount,
    });
  }

  return result;
}

// Re-export key types so consumers need only one import
export type { RiskFactor, ConfidenceBreakdown };

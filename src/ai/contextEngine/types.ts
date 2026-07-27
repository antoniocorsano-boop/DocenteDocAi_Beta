export type SuggestionType =
  | 'student_at_risk'
  | 'student_excellence'
  | 'missing_assessment'
  | 'learning_gap'

/**
 * Human-readable explanation for Explainable AI (FASE 3).
 * Allows the teacher to understand WHY an insight was generated.
 */
export interface AIExplanation {
  /** One-sentence Italian reason */
  reason: string;
  /** Supporting evidence as bullet-point strings */
  bulletPoints: string[];
  /** Raw source values used in the computation */
  sourceData: {
    average?: number;
    trend?: 'declining' | 'stable' | 'improving';
    sampleCount?: number;
    lowGradeCount?: number;
    subjects?: string[];
  };
}

export interface AISuggestion {
  id: string
  type: SuggestionType
  message: string
  confidence: number
  studentId?: string
  classId?: string
  /** Explainable AI — why this insight was generated */
  explanation?: AIExplanation;
}

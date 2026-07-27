export type HealthGrade = 'ottimo' | 'buono' | 'sufficiente' | 'critico'

export interface ClassHealthDimension {
  /** 0–100 score for this dimension */
  score: number
  label: string
  detail: string
}

export interface ClassHealthIndex {
  /** Overall 0–100 score */
  score: number
  grade: HealthGrade
  dimensions: {
    gradeAverage: ClassHealthDimension
    riskRatio: ClassHealthDimension
    assessmentCoverage: ClassHealthDimension
  }
  summary: string
}

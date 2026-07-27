export type LessonActivityType = 'recupero' | 'attivita' | 'verifica'

export type GapSeverity = 'low' | 'medium' | 'high'

export interface SubjectGap {
  subject: string
  severity: GapSeverity
  /** IDs of students contributing to this gap */
  affectedStudentIds: string[]
  /** Average score across affected students for this subject */
  subjectAverage: number
}

export interface LessonSuggestion {
  id: string
  type: LessonActivityType
  subject: string
  description: string
  rationale: string
  targetStudentIds?: string[]
}

export interface LessonAssistantResponse {
  suggestions: LessonSuggestion[]
  gapsFound: number
  summary: string
}

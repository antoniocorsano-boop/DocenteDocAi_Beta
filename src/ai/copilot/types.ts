export type CopilotCommand =
  | 'students_at_risk'
  | 'top_students'
  | 'class_summary'
  | 'missing_assessments'

export interface CopilotResponse {
  command: CopilotCommand
  message: string
  data?: unknown
}

import type { Studente, Valutazione } from '@/types'
import { predictStudentRisk } from './predictStudentRisk'
import type { StudentRiskPrediction } from './types'

export function predictClassRisk(
  students: Studente[],
  evaluations: Valutazione[],
): StudentRiskPrediction[] {
  return students.map((s) => {
    const studentEvaluations = evaluations.filter((e) => e.studenteId === s.id)
    return predictStudentRisk(s.id, studentEvaluations)
  })
}

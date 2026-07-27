import type { Valutazione } from '@/types'
import type { AIContext } from '../contextEngine/contextBuilder'
import type { GapSeverity, SubjectGap } from './types'

const LOW_THRESHOLD = 6.5
const MEDIUM_THRESHOLD = 5.5
const MIN_EVALS_PER_SUBJECT = 2

function parseVoto(voto: string): number {
  const n = parseFloat(voto.replace(',', '.'))
  return isNaN(n) ? -1 : n
}

function classifySeverity(avg: number): GapSeverity {
  if (avg < MEDIUM_THRESHOLD) return 'high'
  if (avg < LOW_THRESHOLD) return 'medium'
  return 'low'
}

/**
 * Identifies subjects where students are underperforming.
 * Groups evaluations by subject, computes per-student averages,
 * and flags subjects where enough students fall below thresholds.
 */
export function analyzeGaps(context: AIContext): SubjectGap[] {
  const { evaluations } = context

  // Group evaluations by subject → studentId → scores
  const bySubject = new Map<string, Map<string, number[]>>()

  for (const e of evaluations) {
    const score = parseVoto(e.voto)
    if (score < 0) continue

    if (!bySubject.has(e.materia)) bySubject.set(e.materia, new Map())
    const byStudent = bySubject.get(e.materia)!
    if (!byStudent.has(e.studenteId)) byStudent.set(e.studenteId, [])
    byStudent.get(e.studenteId)!.push(score)
  }

  const gaps: SubjectGap[] = []

  for (const [subject, byStudent] of bySubject.entries()) {
    // Students with enough evaluations in this subject
    const studentEntries = [...byStudent.entries()].filter(
      ([, scores]) => scores.length >= MIN_EVALS_PER_SUBJECT,
    )
    if (studentEntries.length === 0) continue

    // Per-student average for this subject
    const studentAvgs = studentEntries.map(([id, scores]) => ({
      id,
      avg: scores.reduce((a, b) => a + b, 0) / scores.length,
    }))

    const subjectAvg =
      studentAvgs.reduce((a, b) => a + b.avg, 0) / studentAvgs.length

    const affectedStudents = studentAvgs.filter((s) => s.avg < LOW_THRESHOLD)
    if (affectedStudents.length === 0) continue

    const severity = classifySeverity(subjectAvg)

    gaps.push({
      subject,
      severity,
      affectedStudentIds: affectedStudents.map((s) => s.id),
      subjectAverage: parseFloat(subjectAvg.toFixed(2)),
    })
  }

  // Sort: high severity first, then by number of affected students
  return gaps.sort((a, b) => {
    const order: Record<GapSeverity, number> = { high: 0, medium: 1, low: 2 }
    if (order[a.severity] !== order[b.severity]) return order[a.severity] - order[b.severity]
    return b.affectedStudentIds.length - a.affectedStudentIds.length
  })
}

// Re-export Valutazione usage check (satisfies the import)
export type { Valutazione }

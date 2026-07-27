import type { AIContext } from '../contextEngine/contextBuilder'
import type { ClassHealthIndex } from './types'
import {
  classifyGrade,
  computeOverallScore,
  scoreFromAssessmentCoverage,
  scoreFromAverage,
  scoreFromRiskRatio,
} from './classHealthScore'

function parseVoto(voto: string): number {
  return parseFloat(voto.replace(',', '.'))
}

/**
 * Computes the Class Health Index from the current AI context.
 *
 * Returns a 0–100 score with a descriptive grade and per-dimension details.
 */
export function computeClassHealthIndex(context: AIContext): ClassHealthIndex {
  const { students, evaluations } = context

  // --- Grade average dimension ---
  const validScores = evaluations
    .map((e) => parseVoto(e.voto))
    .filter((n) => !Number.isNaN(n))

  const classAverage =
    validScores.length > 0
      ? validScores.reduce((sum, n) => sum + n, 0) / validScores.length
      : 0

  const gradeAverageDim = validScores.length > 0
    ? scoreFromAverage(classAverage)
    : { score: 0, label: 'Media voti', detail: 'Nessuna valutazione disponibile' }

  // --- Risk ratio dimension ---
  const AT_RISK_THRESHOLD = 5.5
  const atRiskIds = new Set<string>()
  students.forEach((s) => {
    const studentEvals = evaluations.filter((e) => e.studenteId === s.id)
    if (studentEvals.length === 0) return
    const scores = studentEvals.map((e) => parseVoto(e.voto)).filter((n) => !Number.isNaN(n))
    if (scores.length === 0) return
    const avg = scores.reduce((sum, n) => sum + n, 0) / scores.length
    if (avg < AT_RISK_THRESHOLD) atRiskIds.add(s.id)
  })
  const riskRatioDim = scoreFromRiskRatio(atRiskIds.size, students.length)

  // --- Assessment coverage dimension ---
  const assessmentCoverageDim = scoreFromAssessmentCoverage(evaluations.length, students.length)

  // --- Overall ---
  const overallScore = computeOverallScore(
    gradeAverageDim.score,
    riskRatioDim.score,
    assessmentCoverageDim.score,
  )
  const grade = classifyGrade(overallScore)

  const gradeLabels: Record<typeof grade, string> = {
    ottimo: 'La classe è in ottima salute.',
    buono: 'La classe è in buono stato.',
    sufficiente: 'La classe è sufficiente ma necessita attenzione.',
    critico: 'La situazione della classe è critica. Intervenire subito.',
  }

  return {
    score: overallScore,
    grade,
    dimensions: {
      gradeAverage: gradeAverageDim,
      riskRatio: riskRatioDim,
      assessmentCoverage: assessmentCoverageDim,
    },
    summary: gradeLabels[grade],
  }
}

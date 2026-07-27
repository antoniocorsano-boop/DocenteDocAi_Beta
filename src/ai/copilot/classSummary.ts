import type { AIContext } from '../contextEngine/contextBuilder'
import { analyzeRisk } from '../contextEngine/riskAnalyzer'
import { analyzeExcellence } from '../contextEngine/excellenceAnalyzer'

export interface ClassSummaryResult {
  totalStudents: number
  classAverage: number
  atRiskCount: number
  excellentCount: number
  /** Formatted Italian-language summary ready to display */
  text: string
}

function parseVoto(voto: string): number {
  const n = parseFloat(voto.replace(',', '.'))
  return isNaN(n) ? -1 : n
}

export function generateClassSummary(context: AIContext): ClassSummaryResult {
  const { students, evaluations } = context

  // Compute class-wide average across all evaluations
  const validScores = evaluations.map((e) => parseVoto(e.voto)).filter((n) => n >= 0)
  const classAverage =
    validScores.length > 0
      ? validScores.reduce((acc, v) => acc + v, 0) / validScores.length
      : 0

  const atRiskCount = analyzeRisk(context).length
  const excellentCount = analyzeExcellence(context).length

  const avgDisplay = classAverage > 0 ? classAverage.toFixed(1) : 'N/D'

  const text = [
    `Studenti: ${students.length}`,
    `Media classe: ${avgDisplay}`,
    '',
    `Studenti a rischio: ${atRiskCount}`,
    `Studenti eccellenti: ${excellentCount}`,
  ].join('\n')

  return {
    totalStudents: students.length,
    classAverage: parseFloat(classAverage.toFixed(2)),
    atRiskCount,
    excellentCount,
    text,
  }
}

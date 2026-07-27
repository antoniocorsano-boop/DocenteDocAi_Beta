import type { Valutazione } from '@/types'
import { computeRiskScore, computeTrend } from './riskModel'
import type { StudentRiskPrediction } from './types'

function parseVoto(voto: string): number {
  const n = parseFloat(voto.replace(',', '.'))
  return isNaN(n) ? -1 : n
}

export function predictStudentRisk(
  studentId: string,
  evaluations: Valutazione[],
): StudentRiskPrediction {
  const sorted = [...evaluations].sort((a, b) => a.data.localeCompare(b.data))
  const scores = sorted.map((e) => parseVoto(e.voto)).filter((n) => n >= 0)

  if (scores.length === 0) {
    return { studentId, riskProbability: 0, factors: [] }
  }

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  const trend = computeTrend(scores)
  const riskProbability = computeRiskScore(avg, trend, scores.length)

  const factors: string[] = []
  if (avg < 6) factors.push('media sotto la sufficienza')
  if (trend < 0) factors.push('trend voti negativo')
  if (scores.length < 3) factors.push('poche valutazioni')

  return { studentId, riskProbability, factors }
}

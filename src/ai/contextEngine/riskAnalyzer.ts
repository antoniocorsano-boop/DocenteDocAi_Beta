import type { Valutazione } from '@/types'
import type { AIContext } from './contextBuilder'
import type { AISuggestion, AIExplanation } from './types'

const RISK_THRESHOLD = 5.5
const DECLINE_MIN_SAMPLES = 3

function parseVoto(voto: string): number {
  const n = parseFloat(voto.replace(',', '.'))
  return isNaN(n) ? -1 : n
}

function computeAverage(scores: number[]): number {
  if (scores.length === 0) return 0
  return scores.reduce((acc, v) => acc + v, 0) / scores.length
}

/**
 * Returns true when the last half of scores trends lower than the first half.
 */
function isDeclining(scores: number[]): boolean {
  if (scores.length < DECLINE_MIN_SAMPLES) return false
  const mid = Math.floor(scores.length / 2)
  const early = computeAverage(scores.slice(0, mid))
  const recent = computeAverage(scores.slice(mid))
  return recent < early - 0.5
}

export function analyzeRisk(context: AIContext): AISuggestion[] {
  const { students, evaluations } = context
  const suggestions: AISuggestion[] = []

  for (const student of students) {
    const studentEvals: Valutazione[] = evaluations
      .filter((e) => e.studenteId === student.id)
      .sort((a, b) => a.data.localeCompare(b.data))

    if (studentEvals.length === 0) continue

    const scores = studentEvals.map((e) => parseVoto(e.voto)).filter((n) => n >= 0)
    if (scores.length === 0) continue

    const avg = computeAverage(scores)
    const declining = isDeclining(scores)
    const lowCount = scores.filter((s) => s < RISK_THRESHOLD).length
    const lowRatio = lowCount / scores.length

    const isAtRisk = avg < RISK_THRESHOLD || (declining && lowRatio > 0.3)
    if (!isAtRisk) continue

    // Confidence: higher when average is further below threshold and/or clearly declining
    const avgFactor = Math.min(1, Math.max(0, (RISK_THRESHOLD - avg) / RISK_THRESHOLD))
    const declineFactor = declining ? 0.2 : 0
    const confidence = Math.min(0.99, 0.5 + avgFactor * 0.5 + declineFactor)

    const fullName = `${student.nome} ${student.cognome}`
    const trend = declining ? ' with a declining trend' : ''
    const message = `${fullName} shows an average score of ${avg.toFixed(1)}${trend} — may need additional support`

    const bullets: string[] = [
      `Media voti: ${avg.toFixed(1)}/10`,
      `Valutazioni analizzate: ${scores.length}`,
      `Voti insufficienti (<5,5): ${lowCount} su ${scores.length}`,
    ]
    if (declining) bullets.push('Trend recente negativo (ultimi voti in calo)')

    const explanation: AIExplanation = {
      reason:
        declining
          ? `${fullName} ha un trend in calo e una media di ${avg.toFixed(1)}/10.`
          : `${fullName} ha una media di ${avg.toFixed(1)}/10, sotto la soglia di sufficienza.`,
      bulletPoints: bullets,
      sourceData: {
        average: parseFloat(avg.toFixed(2)),
        trend: declining ? 'declining' : 'stable',
        sampleCount: scores.length,
        lowGradeCount: lowCount,
      },
    }

    suggestions.push({
      id: `risk-${student.id}`,
      type: 'student_at_risk',
      studentId: student.id,
      message,
      confidence: parseFloat(confidence.toFixed(2)),
      explanation,
    })
  }

  return suggestions
}

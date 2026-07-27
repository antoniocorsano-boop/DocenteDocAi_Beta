import type { Valutazione } from '@/types'
import type { AIContext } from './contextBuilder'
import type { AISuggestion, AIExplanation } from './types'

const EXCELLENCE_THRESHOLD = 8.0
const EXCELLENCE_MIN_SAMPLES = 3
const HIGH_CONSISTENCY_STDDEV = 0.8

function parseVoto(voto: string): number {
  const n = parseFloat(voto.replace(',', '.'))
  return isNaN(n) ? -1 : n
}

function computeAverage(scores: number[]): number {
  if (scores.length === 0) return 0
  return scores.reduce((acc, v) => acc + v, 0) / scores.length
}

function computeStdDev(scores: number[]): number {
  if (scores.length < 2) return 0
  const avg = computeAverage(scores)
  const variance = scores.reduce((acc, v) => acc + (v - avg) ** 2, 0) / scores.length
  return Math.sqrt(variance)
}

export function analyzeExcellence(context: AIContext): AISuggestion[] {
  const { students, evaluations } = context
  const suggestions: AISuggestion[] = []

  for (const student of students) {
    const studentEvals: Valutazione[] = evaluations
      .filter((e) => e.studenteId === student.id)
      .sort((a, b) => a.data.localeCompare(b.data))

    if (studentEvals.length < EXCELLENCE_MIN_SAMPLES) continue

    const scores = studentEvals.map((e) => parseVoto(e.voto)).filter((n) => n >= 0)
    if (scores.length < EXCELLENCE_MIN_SAMPLES) continue

    const avg = computeAverage(scores)
    const stdDev = computeStdDev(scores)
    const highCount = scores.filter((s) => s >= EXCELLENCE_THRESHOLD).length
    const highRatio = highCount / scores.length

    const isExcellent = avg >= EXCELLENCE_THRESHOLD && highRatio >= 0.6
    if (!isExcellent) continue

    const isConsistent = stdDev <= HIGH_CONSISTENCY_STDDEV
    const avgFactor = Math.min(1, (avg - EXCELLENCE_THRESHOLD) / (10 - EXCELLENCE_THRESHOLD))
    const consistencyBonus = isConsistent ? 0.15 : 0
    const confidence = Math.min(0.99, 0.7 + avgFactor * 0.15 + consistencyBonus)

    const fullName = `${student.nome} ${student.cognome}`
    const consistencyNote = isConsistent ? ' consistently' : ''
    const message = `${fullName}${consistencyNote} exceeds expectations with an average of ${avg.toFixed(1)} — consider enrichment activities`

    const bullets: string[] = [
      `Media voti: ${avg.toFixed(1)}/10`,
      `Voti ≥ 8: ${highCount} su ${scores.length} (${Math.round(highRatio * 100)}%)`,
      `Valutazioni analizzate: ${scores.length}`,
    ]
    if (isConsistent) bullets.push(`Andamento costante (dev. std. ${stdDev.toFixed(2)})`)

    const explanation: AIExplanation = {
      reason: `${fullName} ha una media di ${avg.toFixed(1)}/10 con ${Math.round(highRatio * 100)}% di voti eccellenti.`,
      bulletPoints: bullets,
      sourceData: {
        average: parseFloat(avg.toFixed(2)),
        trend: 'improving',
        sampleCount: scores.length,
      },
    }

    suggestions.push({
      id: `excellence-${student.id}`,
      type: 'student_excellence',
      studentId: student.id,
      message,
      confidence: parseFloat(confidence.toFixed(2)),
      explanation,
    })
  }

  return suggestions
}

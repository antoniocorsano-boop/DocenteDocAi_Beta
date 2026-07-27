import type { HealthGrade, ClassHealthDimension } from './types'

/**
 * Converts class average (Italian 1–10 scale) to a 0–100 health score.
 *
 * Mapping (linear within ranges):
 *   avg >= 8   → 80–100
 *   avg >= 7   → 65–80
 *   avg >= 6   → 50–65
 *   avg < 6    → 0–50
 */
export function scoreFromAverage(avg: number): ClassHealthDimension {
  let score: number
  if (avg >= 8) {
    score = 80 + ((avg - 8) / 2) * 20
  } else if (avg >= 7) {
    score = 65 + (avg - 7) * 15
  } else if (avg >= 6) {
    score = 50 + (avg - 6) * 15
  } else {
    score = Math.max(0, (avg / 6) * 50)
  }

  return {
    score: parseFloat(Math.min(100, score).toFixed(1)),
    label: 'Media voti',
    detail: `Media classe: ${avg.toFixed(1)}`,
  }
}

/**
 * Converts the fraction of at-risk students to a health score.
 *   0% at risk  → 100
 *   10% at risk → 80
 *   25% at risk → 60
 *   50%+ at risk → 0
 */
export function scoreFromRiskRatio(atRiskCount: number, totalStudents: number): ClassHealthDimension {
  if (totalStudents === 0) {
    return { score: 100, label: 'Studenti a rischio', detail: 'Nessuno studente' }
  }
  const ratio = atRiskCount / totalStudents
  const score = Math.max(0, 100 - ratio * 200)

  return {
    score: parseFloat(Math.min(100, score).toFixed(1)),
    label: 'Studenti a rischio',
    detail: `${atRiskCount} su ${totalStudents} studenti a rischio (${Math.round(ratio * 100)}%)`,
  }
}

/**
 * Converts evaluation coverage to a health score.
 * Coverage = average number of evaluations per student (cap at 5).
 *   5+  evals/student → 100
 *   3   evals/student → 60
 *   1   eval/student  → 20
 *   0                 → 0
 */
export function scoreFromAssessmentCoverage(
  totalEvaluations: number,
  totalStudents: number,
): ClassHealthDimension {
  if (totalStudents === 0) {
    return { score: 0, label: 'Copertura valutazioni', detail: 'Nessuno studente' }
  }
  const evalsPerStudent = totalEvaluations / totalStudents
  const score = Math.min(100, (evalsPerStudent / 5) * 100)

  return {
    score: parseFloat(score.toFixed(1)),
    label: 'Copertura valutazioni',
    detail: `Media ${evalsPerStudent.toFixed(1)} valutazioni/studente`,
  }
}

/**
 * Combines the three dimension scores using weighted average:
 *   grade average   40%
 *   risk ratio      40%
 *   coverage        20%
 */
export function computeOverallScore(
  gradeScore: number,
  riskScore: number,
  coverageScore: number,
): number {
  const weighted = gradeScore * 0.4 + riskScore * 0.4 + coverageScore * 0.2
  return parseFloat(Math.min(100, Math.max(0, weighted)).toFixed(1))
}

export function classifyGrade(score: number): HealthGrade {
  if (score >= 80) return 'ottimo'
  if (score >= 65) return 'buono'
  if (score >= 50) return 'sufficiente'
  return 'critico'
}

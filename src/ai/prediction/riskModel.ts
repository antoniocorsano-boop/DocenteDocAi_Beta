/**
 * Simple, explainable risk model (important for school context).
 *
 * Factors (additive weights, capped at 1.0):
 *   average < 6  → +0.5
 *   trend < 0    → +0.3
 *   evaluationCount < 3 → +0.2
 */
export function computeRiskScore(
  average: number,
  trend: number,
  evaluationCount: number,
): number {
  let score = 0

  if (average < 6) score += 0.5
  if (trend < 0) score += 0.3
  if (evaluationCount < 3) score += 0.2

  return parseFloat(Math.min(score, 1).toFixed(2))
}

/**
 * Linear trend: last score minus first score.
 * Returns 0 when fewer than 2 data points.
 */
export function computeTrend(scores: number[]): number {
  if (scores.length < 2) return 0
  return scores[scores.length - 1] - scores[0]
}

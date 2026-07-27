import { describe, it, expect } from 'vitest'
import type { Studente, Valutazione } from '@/types'
import { computeRiskScore, computeTrend } from '../riskModel'
import { predictStudentRisk } from '../predictStudentRisk'
import { predictClassRisk } from '../predictClassRisk'

// ── helpers ──────────────────────────────────────────────────────────────────

function makeStudent(id: string, nome = 'Test', cognome = 'Studente'): Studente {
  return { id, nome, cognome, classe: '3A' }
}

function makeEval(studenteId: string, voto: string, data: string): Valutazione {
  return {
    id: `eval-${studenteId}-${data}`,
    studenteId,
    materia: 'Matematica',
    data,
    tipo: 'Scritto',
    voto,
  }
}

// ── computeTrend ─────────────────────────────────────────────────────────────

describe('computeTrend', () => {
  it('returns 0 when fewer than 2 scores', () => {
    expect(computeTrend([])).toBe(0)
    expect(computeTrend([7])).toBe(0)
  })

  it('returns positive trend for improving scores', () => {
    expect(computeTrend([5, 6, 7, 8])).toBeGreaterThan(0)
  })

  it('returns negative trend for declining scores', () => {
    expect(computeTrend([8, 7, 6, 5])).toBeLessThan(0)
  })

  it('returns 0 for flat scores', () => {
    expect(computeTrend([7, 7, 7])).toBe(0)
  })
})

// ── computeRiskScore ─────────────────────────────────────────────────────────

describe('computeRiskScore', () => {
  it('returns 0 for a good student (avg>=6, positive trend, enough evals)', () => {
    expect(computeRiskScore(8, 1, 5)).toBe(0)
  })

  it('adds 0.5 when average is below 6', () => {
    expect(computeRiskScore(5, 0, 5)).toBe(0.5)
  })

  it('adds 0.3 when trend is negative', () => {
    expect(computeRiskScore(7, -1, 5)).toBe(0.3)
  })

  it('adds 0.2 when fewer than 3 evaluations', () => {
    expect(computeRiskScore(7, 0, 2)).toBe(0.2)
  })

  it('caps the score at 1.0 even with all risk factors', () => {
    expect(computeRiskScore(4, -2, 1)).toBe(1)
  })
})

// ── predictStudentRisk ────────────────────────────────────────────────────────

describe('predictStudentRisk', () => {
  it('returns zero risk and empty factors for a student with no evaluations', () => {
    const result = predictStudentRisk('s1', [])
    expect(result.riskProbability).toBe(0)
    expect(result.factors).toHaveLength(0)
  })

  it('detects all risk factors for a failing student', () => {
    const evals = [
      makeEval('marco', '5', '2026-01-05'),
      makeEval('marco', '4', '2026-02-01'), // declining trend
    ]
    const result = predictStudentRisk('marco', evals)
    expect(result.riskProbability).toBeGreaterThan(0)
    expect(result.factors).toContain('media sotto la sufficienza')
    expect(result.factors).toContain('trend voti negativo')
    expect(result.factors).toContain('poche valutazioni')
  })

  it('returns zero factors for a high-performing student', () => {
    const evals = [
      makeEval('anna', '8', '2026-01-05'),
      makeEval('anna', '8.5', '2026-01-15'),
      makeEval('anna', '9', '2026-02-01'),
    ]
    const result = predictStudentRisk('anna', evals)
    expect(result.riskProbability).toBe(0)
    expect(result.factors).toHaveLength(0)
  })

  it('respects eval sort order (oldest first) for trend', () => {
    // supply evals in reverse chronological order to test sorting
    const evals = [
      makeEval('luca', '4', '2026-02-15'), // most recent — lower
      makeEval('luca', '8', '2026-01-05'), // oldest — higher
      makeEval('luca', '6', '2026-01-20'),
    ]
    const result = predictStudentRisk('luca', evals)
    expect(result.factors).toContain('trend voti negativo')
  })
})

// ── predictClassRisk ──────────────────────────────────────────────────────────

describe('predictClassRisk', () => {
  it('returns one prediction per student', () => {
    const students = [makeStudent('s1'), makeStudent('s2'), makeStudent('s3')]
    const results = predictClassRisk(students, [])
    expect(results).toHaveLength(3)
    expect(results.map((r) => r.studentId)).toEqual(['s1', 's2', 's3'])
  })

  it('correctly separates evaluations per student', () => {
    const students = [makeStudent('at-risk', 'Marco', 'Rossi'), makeStudent('ok', 'Anna', 'Neri')]
    const evals = [
      makeEval('at-risk', '4', '2026-01-05'),
      makeEval('at-risk', '3.5', '2026-01-15'),
      makeEval('at-risk', '4', '2026-02-01'),
      makeEval('ok', '8', '2026-01-05'),
      makeEval('ok', '8.5', '2026-01-15'),
      makeEval('ok', '9', '2026-02-01'),
    ]
    const results = predictClassRisk(students, evals)
    const riskMap = Object.fromEntries(results.map((r) => [r.studentId, r]))
    expect(riskMap['at-risk'].riskProbability).toBeGreaterThanOrEqual(0.5)
    expect(riskMap['ok'].riskProbability).toBe(0)
  })

  it('returns empty array for empty student list', () => {
    expect(predictClassRisk([], [])).toHaveLength(0)
  })
})

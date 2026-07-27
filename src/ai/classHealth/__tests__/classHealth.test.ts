import { describe, it, expect } from 'vitest'
import {
  scoreFromAverage,
  scoreFromRiskRatio,
  scoreFromAssessmentCoverage,
  computeOverallScore,
  classifyGrade,
} from '../classHealthScore'
import { computeClassHealthIndex } from '../classHealthIndex'
import { buildAIContext } from '../../contextEngine/contextBuilder'
import type { Studente, Valutazione } from '@/types'

// --- Helpers ---
function makeStudent(id: string): Studente {
  return {
    id,
    nome: 'Test',
    cognome: id,
    classe: '3A',
    dataNascita: '2005-01-01',
    note: '',
  } as Studente
}

function makeEval(id: string, studenteId: string, materia: string, voto: string): Valutazione {
  return {
    id,
    studenteId,
    materia,
    voto,
    data: '2024-03-01',
    tipo: 'Scritto' as const,
    note: '',
  } as Valutazione
}

// --- scoreFromAverage ---
describe('scoreFromAverage', () => {
  it('returns near 100 for avg=10', () => {
    const dim = scoreFromAverage(10)
    expect(dim.score).toBeGreaterThanOrEqual(95)
  })

  it('returns ~80 for avg=8', () => {
    const dim = scoreFromAverage(8)
    expect(dim.score).toBeCloseTo(80, 0)
  })

  it('returns ~50 for avg=6', () => {
    const dim = scoreFromAverage(6)
    expect(dim.score).toBeCloseTo(50, 0)
  })

  it('returns <50 for avg<6', () => {
    const dim = scoreFromAverage(4)
    expect(dim.score).toBeLessThan(50)
  })

  it('never exceeds 100', () => {
    const dim = scoreFromAverage(10)
    expect(dim.score).toBeLessThanOrEqual(100)
  })
})

// --- scoreFromRiskRatio ---
describe('scoreFromRiskRatio', () => {
  it('returns 100 when no students at risk', () => {
    const dim = scoreFromRiskRatio(0, 20)
    expect(dim.score).toBe(100)
  })

  it('returns 0 when all students are at risk', () => {
    const dim = scoreFromRiskRatio(20, 20)
    expect(dim.score).toBe(0)
  })

  it('penalises proportionally', () => {
    const half = scoreFromRiskRatio(10, 20)
    const quarter = scoreFromRiskRatio(5, 20)
    expect(quarter.score).toBeGreaterThan(half.score)
  })

  it('handles 0 students', () => {
    const dim = scoreFromRiskRatio(0, 0)
    expect(dim.score).toBe(100)
  })
})

// --- scoreFromAssessmentCoverage ---
describe('scoreFromAssessmentCoverage', () => {
  it('returns 100 when avg evals/student >= 5', () => {
    const dim = scoreFromAssessmentCoverage(50, 10) // 5 per student
    expect(dim.score).toBe(100)
  })

  it('returns 0 for no evaluations', () => {
    const dim = scoreFromAssessmentCoverage(0, 10)
    expect(dim.score).toBe(0)
  })

  it('returns 0 for no students', () => {
    const dim = scoreFromAssessmentCoverage(0, 0)
    expect(dim.score).toBe(0)
  })

  it('scales linearly up to 5 evals/student', () => {
    const dim = scoreFromAssessmentCoverage(25, 10) // 2.5 per student → 50
    expect(dim.score).toBeCloseTo(50, 0)
  })
})

// --- computeOverallScore ---
describe('computeOverallScore', () => {
  it('returns 100 when all dimensions are perfect', () => {
    expect(computeOverallScore(100, 100, 100)).toBe(100)
  })

  it('returns 0 when all dimensions are 0', () => {
    expect(computeOverallScore(0, 0, 0)).toBe(0)
  })

  it('clamps to [0, 100]', () => {
    expect(computeOverallScore(110, 110, 110)).toBe(100)
    expect(computeOverallScore(-10, -10, -10)).toBe(0)
  })
})

// --- classifyGrade ---
describe('classifyGrade', () => {
  it('returns ottimo for score >= 80', () => {
    expect(classifyGrade(80)).toBe('ottimo')
    expect(classifyGrade(100)).toBe('ottimo')
  })

  it('returns buono for 65–79', () => {
    expect(classifyGrade(65)).toBe('buono')
    expect(classifyGrade(75)).toBe('buono')
  })

  it('returns sufficiente for 50–64', () => {
    expect(classifyGrade(50)).toBe('sufficiente')
    expect(classifyGrade(64)).toBe('sufficiente')
  })

  it('returns critico for < 50', () => {
    expect(classifyGrade(0)).toBe('critico')
    expect(classifyGrade(49)).toBe('critico')
  })
})

// --- computeClassHealthIndex (integration) ---
describe('computeClassHealthIndex', () => {
  it('returns ottimo for a top-performing class', () => {
    const students = ['s1', 's2', 's3'].map(makeStudent)
    const evals = [
      makeEval('e1', 's1', 'Matematica', '9'),
      makeEval('e2', 's1', 'Matematica', '9.5'),
      makeEval('e3', 's1', 'Matematica', '10'),
      makeEval('e4', 's2', 'Matematica', '8.5'),
      makeEval('e5', 's2', 'Matematica', '9'),
      makeEval('e6', 's2', 'Matematica', '9.5'),
      makeEval('e7', 's3', 'Matematica', '8'),
      makeEval('e8', 's3', 'Matematica', '9'),
      makeEval('e9', 's3', 'Matematica', '8.5'),
    ]
    const ctx = buildAIContext(students, [], evals)
    const result = computeClassHealthIndex(ctx)
    expect(result.grade).toBe('ottimo')
    expect(result.score).toBeGreaterThanOrEqual(80)
  })

  it('returns critico when most students are at risk', () => {
    const students = ['s1', 's2', 's3', 's4'].map(makeStudent)
    const evals = [
      makeEval('e1', 's1', 'Matematica', '3'),
      makeEval('e2', 's2', 'Matematica', '4'),
      makeEval('e3', 's3', 'Matematica', '3.5'),
      makeEval('e4', 's4', 'Matematica', '4.5'),
    ]
    const ctx = buildAIContext(students, [], evals)
    const result = computeClassHealthIndex(ctx)
    expect(result.grade).toBe('critico')
    expect(result.score).toBeLessThan(50)
  })

  it('handles empty context without throwing', () => {
    const ctx = buildAIContext([], [], [])
    const result = computeClassHealthIndex(ctx)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(typeof result.summary).toBe('string')
  })

  it('exposes all three dimensions', () => {
    const students = [makeStudent('s1')]
    const evals = [makeEval('e1', 's1', 'Scienze', '7')]
    const ctx = buildAIContext(students, [], evals)
    const result = computeClassHealthIndex(ctx)
    expect(result.dimensions.gradeAverage).toBeDefined()
    expect(result.dimensions.riskRatio).toBeDefined()
    expect(result.dimensions.assessmentCoverage).toBeDefined()
  })

  it('accepts comma-separated voto notation', () => {
    const students = [makeStudent('s1')]
    const evals = [makeEval('e1', 's1', 'Storia', '7,5')]
    const ctx = buildAIContext(students, [], evals)
    expect(() => computeClassHealthIndex(ctx)).not.toThrow()
  })
})

import { describe, it, expect } from 'vitest'
import type { Studente, Valutazione, Lezione } from '@/types'
import { buildAIContext } from '../contextBuilder'
import { analyzeRisk } from '../riskAnalyzer'
import { analyzeExcellence } from '../excellenceAnalyzer'
import { generateAISuggestions } from '../suggestionEngine'

// ── helpers ──────────────────────────────────────────────────────────────────

function makeStudent(id: string, nome = 'Test', cognome = 'Student'): Studente {
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

const noLessons: Lezione[] = []

// ── buildAIContext ────────────────────────────────────────────────────────────

describe('buildAIContext', () => {
  it('assembles students, lessons and evaluations into a context object', () => {
    const students = [makeStudent('s1')]
    const evals = [makeEval('s1', '7', '2026-01-10')]
    const ctx = buildAIContext(students, noLessons, evals)
    expect(ctx.students).toBe(students)
    expect(ctx.lessons).toBe(noLessons)
    expect(ctx.evaluations).toBe(evals)
  })
})

// ── analyzeRisk ───────────────────────────────────────────────────────────────

describe('analyzeRisk', () => {
  it('returns a risk suggestion for a student with low average scores', () => {
    const students = [makeStudent('marco', 'Marco', 'Rossi')]
    const evals = [
      makeEval('marco', '4', '2026-01-10'),
      makeEval('marco', '4.5', '2026-01-20'),
      makeEval('marco', '5', '2026-02-01'),
    ]
    const ctx = buildAIContext(students, noLessons, evals)
    const suggestions = analyzeRisk(ctx)
    expect(suggestions).toHaveLength(1)
    expect(suggestions[0].type).toBe('student_at_risk')
    expect(suggestions[0].studentId).toBe('marco')
    expect(suggestions[0].confidence).toBeGreaterThan(0)
    expect(suggestions[0].confidence).toBeLessThanOrEqual(1)
  })

  it('returns a risk suggestion for a student with a declining trend', () => {
    const students = [makeStudent('luca', 'Luca', 'Bianchi')]
    // Early scores good, recent scores drop
    const evals = [
      makeEval('luca', '8', '2026-01-05'),
      makeEval('luca', '7.5', '2026-01-15'),
      makeEval('luca', '5', '2026-02-01'),
      makeEval('luca', '4.5', '2026-02-15'),
      makeEval('luca', '4', '2026-03-01'),
    ]
    const ctx = buildAIContext(students, noLessons, evals)
    const suggestions = analyzeRisk(ctx)
    expect(suggestions).toHaveLength(1)
    expect(suggestions[0].type).toBe('student_at_risk')
  })

  it('returns no risk suggestion for a student with good scores', () => {
    const students = [makeStudent('s2', 'Sofia', 'Verdi')]
    const evals = [
      makeEval('s2', '8', '2026-01-10'),
      makeEval('s2', '8.5', '2026-01-20'),
      makeEval('s2', '9', '2026-02-01'),
    ]
    const ctx = buildAIContext(students, noLessons, evals)
    const suggestions = analyzeRisk(ctx)
    expect(suggestions).toHaveLength(0)
  })

  it('returns no suggestions for empty data', () => {
    const ctx = buildAIContext([], noLessons, [])
    expect(analyzeRisk(ctx)).toHaveLength(0)
  })

  it('skips students with no evaluations', () => {
    const students = [makeStudent('s3', 'No', 'Evals')]
    const ctx = buildAIContext(students, noLessons, [])
    expect(analyzeRisk(ctx)).toHaveLength(0)
  })
})

// ── analyzeExcellence ─────────────────────────────────────────────────────────

describe('analyzeExcellence', () => {
  it('returns an excellence suggestion for a high-performing student', () => {
    const students = [makeStudent('anna', 'Anna', 'Ferrari')]
    const evals = [
      makeEval('anna', '9', '2026-01-10'),
      makeEval('anna', '9.5', '2026-01-20'),
      makeEval('anna', '10', '2026-02-01'),
      makeEval('anna', '8.5', '2026-02-15'),
    ]
    const ctx = buildAIContext(students, noLessons, evals)
    const suggestions = analyzeExcellence(ctx)
    expect(suggestions).toHaveLength(1)
    expect(suggestions[0].type).toBe('student_excellence')
    expect(suggestions[0].studentId).toBe('anna')
    expect(suggestions[0].confidence).toBeGreaterThan(0.7)
  })

  it('returns no suggestion for a student with insufficient samples', () => {
    const students = [makeStudent('s4', 'Poco', 'Dati')]
    const evals = [makeEval('s4', '9', '2026-01-10'), makeEval('s4', '9.5', '2026-01-20')]
    const ctx = buildAIContext(students, noLessons, evals)
    expect(analyzeExcellence(ctx)).toHaveLength(0)
  })

  it('returns no excellence suggestion for a student with average scores', () => {
    const students = [makeStudent('s5', 'Media', 'Studente')]
    const evals = [
      makeEval('s5', '6', '2026-01-10'),
      makeEval('s5', '7', '2026-01-20'),
      makeEval('s5', '6.5', '2026-02-01'),
    ]
    const ctx = buildAIContext(students, noLessons, evals)
    expect(analyzeExcellence(ctx)).toHaveLength(0)
  })

  it('returns no suggestions for empty data', () => {
    expect(analyzeExcellence(buildAIContext([], noLessons, []))).toHaveLength(0)
  })
})

// ── generateAISuggestions ────────────────────────────────────────────────────

describe('generateAISuggestions', () => {
  it('merges risk and excellence suggestions', () => {
    const students = [
      makeStudent('at-risk', 'Marco', 'Rossi'),
      makeStudent('excellent', 'Anna', 'Ferrari'),
    ]
    const evals = [
      makeEval('at-risk', '4', '2026-01-05'),
      makeEval('at-risk', '4', '2026-01-15'),
      makeEval('at-risk', '4.5', '2026-02-01'),
      makeEval('excellent', '9', '2026-01-05'),
      makeEval('excellent', '9.5', '2026-01-15'),
      makeEval('excellent', '9', '2026-02-01'),
      makeEval('excellent', '10', '2026-02-15'),
    ]
    const ctx = buildAIContext(students, noLessons, evals)
    const suggestions = generateAISuggestions(ctx)
    const types = suggestions.map((s) => s.type)
    expect(types).toContain('student_at_risk')
    expect(types).toContain('student_excellence')
  })

  it('returns empty array when context is empty', () => {
    const ctx = buildAIContext([], noLessons, [])
    expect(generateAISuggestions(ctx)).toHaveLength(0)
  })
})

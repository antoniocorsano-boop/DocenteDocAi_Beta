import { describe, it, expect } from 'vitest'
import { runAIPipeline } from '../aiPipeline'
import type { Studente, Valutazione } from '@/types'

function makeStudent(id: string): Studente {
  return { id, nome: 'Test', cognome: id, classe: '3A', dataNascita: '2005-01-01', note: '' } as Studente
}

function makeEval(id: string, studenteId: string, materia: string, voto: string): Valutazione {
  return { id, studenteId, materia, voto, data: '2024-03-01', tipo: 'Scritto' as const, note: '' } as Valutazione
}

describe('runAIPipeline', () => {
  it('returns all required keys', () => {
    const result = runAIPipeline([], [])
    expect(result).toHaveProperty('classHealth')
    expect(result).toHaveProperty('riskSuggestions')
    expect(result).toHaveProperty('excellenceSuggestions')
    expect(result).toHaveProperty('suggestions')
    expect(result).toHaveProperty('riskPredictions')
    expect(result).toHaveProperty('lessonAssistant')
  })

  it('handles empty input without throwing', () => {
    expect(() => runAIPipeline([], [])).not.toThrow()
  })

  it('suggestions = riskSuggestions + excellenceSuggestions', () => {
    const students = ['s1', 's2', 's3'].map(makeStudent)
    // one at-risk student
    const evals = [
      makeEval('e1', 's1', 'Matematica', '3'),
      makeEval('e2', 's1', 'Matematica', '4'),
      makeEval('e3', 's1', 'Matematica', '3.5'),
      // one excellent student
      makeEval('e4', 's2', 'Matematica', '9'),
      makeEval('e5', 's2', 'Matematica', '9.5'),
      makeEval('e6', 's2', 'Matematica', '10'),
    ]
    const result = runAIPipeline(students, evals)
    expect(result.suggestions.length).toBe(
      result.riskSuggestions.length + result.excellenceSuggestions.length,
    )
  })

  it('classHealth score is 0-100', () => {
    const students = ['s1'].map(makeStudent)
    const evals = [makeEval('e1', 's1', 'Fisica', '7')]
    const { classHealth } = runAIPipeline(students, evals)
    expect(classHealth.score).toBeGreaterThanOrEqual(0)
    expect(classHealth.score).toBeLessThanOrEqual(100)
  })

  it('classHealth grade is ottimo for a perfect class', () => {
    const students = ['s1', 's2'].map(makeStudent)
    const evals = [
      makeEval('e1', 's1', 'Matematica', '10'),
      makeEval('e2', 's1', 'Matematica', '10'),
      makeEval('e3', 's1', 'Matematica', '9.5'),
      makeEval('e4', 's2', 'Matematica', '9'),
      makeEval('e5', 's2', 'Matematica', '9.5'),
      makeEval('e6', 's2', 'Matematica', '10'),
    ]
    const { classHealth } = runAIPipeline(students, evals)
    expect(classHealth.grade).toBe('ottimo')
  })

  it('riskPredictions is an array (one entry per student with evals)', () => {
    const students = ['s1', 's2'].map(makeStudent)
    const evals = [
      makeEval('e1', 's1', 'Matematica', '4'),
      makeEval('e2', 's2', 'Matematica', '8'),
    ]
    const { riskPredictions } = runAIPipeline(students, evals)
    expect(Array.isArray(riskPredictions)).toBe(true)
  })

  it('lessonAssistant returns a summary string', () => {
    const students = ['s1'].map(makeStudent)
    const evals = [
      makeEval('e1', 's1', 'Matematica', '3'),
      makeEval('e2', 's1', 'Matematica', '4'),
    ]
    const { lessonAssistant } = runAIPipeline(students, evals)
    expect(typeof lessonAssistant.summary).toBe('string')
  })

  it('is deterministic — same input produces same output', () => {
    const students = ['s1'].map(makeStudent)
    const evals = [makeEval('e1', 's1', 'Arte', '6')]
    const r1 = runAIPipeline(students, evals)
    const r2 = runAIPipeline(students, evals)
    expect(r1.classHealth.score).toBe(r2.classHealth.score)
    expect(r1.suggestions.length).toBe(r2.suggestions.length)
  })
})

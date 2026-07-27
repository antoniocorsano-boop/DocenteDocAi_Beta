import { describe, it, expect } from 'vitest'
import type { Studente, Valutazione, Lezione } from '@/types'
import { buildAIContext } from '../../contextEngine/contextBuilder'
import { analyzeGaps } from '../gapAnalyzer'
import { suggestActivities } from '../activitySuggester'
import { askLessonAssistant } from '../lessonAssistant'

// ── helpers ──────────────────────────────────────────────────────────────────

function makeStudent(id: string): Studente {
  return { id, nome: 'Test', cognome: 'Studente', classe: '3A' }
}

function makeEval(studenteId: string, materia: string, voto: string, data: string): Valutazione {
  return {
    id: `eval-${studenteId}-${materia}-${data}`,
    studenteId,
    materia,
    data,
    tipo: 'Scritto',
    voto,
  }
}

const noLessons: Lezione[] = []

// ── analyzeGaps ───────────────────────────────────────────────────────────────

describe('analyzeGaps', () => {
  it('returns no gaps when all scores are above threshold', () => {
    const evals = [
      makeEval('s1', 'Matematica', '8', '2026-01-05'),
      makeEval('s1', 'Matematica', '8.5', '2026-01-15'),
      makeEval('s2', 'Matematica', '7', '2026-01-05'),
      makeEval('s2', 'Matematica', '7.5', '2026-01-15'),
    ]
    const ctx = buildAIContext([makeStudent('s1'), makeStudent('s2')], noLessons, evals)
    expect(analyzeGaps(ctx)).toHaveLength(0)
  })

  it('detects a high-severity gap when subject average is very low', () => {
    const evals = [
      makeEval('s1', 'Fisica', '4', '2026-01-05'),
      makeEval('s1', 'Fisica', '4.5', '2026-01-15'),
      makeEval('s2', 'Fisica', '5', '2026-01-05'),
      makeEval('s2', 'Fisica', '4', '2026-01-15'),
    ]
    const ctx = buildAIContext([makeStudent('s1'), makeStudent('s2')], noLessons, evals)
    const gaps = analyzeGaps(ctx)
    expect(gaps).toHaveLength(1)
    expect(gaps[0].subject).toBe('Fisica')
    expect(gaps[0].severity).toBe('high')
    expect(gaps[0].affectedStudentIds).toContain('s1')
  })

  it('detects a medium-severity gap for scores between 5.5 and 6.5', () => {
    const evals = [
      makeEval('s1', 'Storia', '6', '2026-01-05'),
      makeEval('s1', 'Storia', '5.5', '2026-01-15'),
      makeEval('s2', 'Storia', '6', '2026-01-05'),
      makeEval('s2', 'Storia', '6', '2026-01-15'),
    ]
    const ctx = buildAIContext([makeStudent('s1'), makeStudent('s2')], noLessons, evals)
    const gaps = analyzeGaps(ctx)
    expect(gaps).toHaveLength(1)
    expect(gaps[0].severity).toBe('medium')
  })

  it('ignores students with fewer than 2 evaluations in a subject', () => {
    const evals = [
      makeEval('s1', 'Chimica', '4', '2026-01-05'), // only 1 eval → ignored
    ]
    const ctx = buildAIContext([makeStudent('s1')], noLessons, evals)
    expect(analyzeGaps(ctx)).toHaveLength(0)
  })

  it('returns empty gaps for empty context', () => {
    const ctx = buildAIContext([], noLessons, [])
    expect(analyzeGaps(ctx)).toHaveLength(0)
  })

  it('sorts gaps: high severity first', () => {
    const evals = [
      // Fisica: high severity
      makeEval('s1', 'Fisica', '4', '2026-01-05'),
      makeEval('s1', 'Fisica', '4.5', '2026-01-15'),
      // Storia: medium severity
      makeEval('s1', 'Storia', '6', '2026-01-05'),
      makeEval('s1', 'Storia', '5.8', '2026-01-15'),
    ]
    const ctx = buildAIContext([makeStudent('s1')], noLessons, evals)
    const gaps = analyzeGaps(ctx)
    expect(gaps[0].severity).toBe('high')
  })
})

// ── suggestActivities ─────────────────────────────────────────────────────────

describe('suggestActivities', () => {
  it('returns empty array for no gaps', () => {
    expect(suggestActivities([])).toHaveLength(0)
  })

  it('suggests recupero + verifica for a high-severity gap', () => {
    const gaps = [{ subject: 'Fisica', severity: 'high' as const, affectedStudentIds: ['s1'], subjectAverage: 4.5 }]
    const suggestions = suggestActivities(gaps)
    const types = suggestions.map((s) => s.type)
    expect(types).toContain('recupero')
    expect(types).toContain('verifica')
  })

  it('suggests recupero + attivita for a medium-severity gap', () => {
    const gaps = [{ subject: 'Storia', severity: 'medium' as const, affectedStudentIds: ['s1'], subjectAverage: 5.8 }]
    const suggestions = suggestActivities(gaps)
    const types = suggestions.map((s) => s.type)
    expect(types).toContain('recupero')
    expect(types).toContain('attivita')
  })

  it('suggests only attivita for a low-severity gap', () => {
    const gaps = [{ subject: 'Arte', severity: 'low' as const, affectedStudentIds: ['s1'], subjectAverage: 6.2 }]
    const suggestions = suggestActivities(gaps)
    expect(suggestions.every((s) => s.type === 'attivita')).toBe(true)
  })

  it('sets targetStudentIds on recupero suggestions', () => {
    const gaps = [{ subject: 'Fisica', severity: 'high' as const, affectedStudentIds: ['s1', 's2'], subjectAverage: 4.0 }]
    const suggestions = suggestActivities(gaps)
    const recupero = suggestions.find((s) => s.type === 'recupero')
    expect(recupero?.targetStudentIds).toEqual(['s1', 's2'])
  })
})

// ── askLessonAssistant ────────────────────────────────────────────────────────

describe('askLessonAssistant', () => {
  it('returns zero gaps and positive summary for a well-performing class', () => {
    const evals = [
      makeEval('s1', 'Matematica', '8', '2026-01-05'),
      makeEval('s1', 'Matematica', '9', '2026-01-15'),
    ]
    const ctx = buildAIContext([makeStudent('s1')], noLessons, evals)
    const res = askLessonAssistant(ctx)
    expect(res.gapsFound).toBe(0)
    expect(res.suggestions).toHaveLength(0)
    expect(res.summary).toContain('Nessuna lacuna')
  })

  it('returns suggestions and a descriptive summary for a struggling class', () => {
    const evals = [
      makeEval('s1', 'Fisica', '4', '2026-01-05'),
      makeEval('s1', 'Fisica', '4.5', '2026-01-15'),
      makeEval('s2', 'Fisica', '5', '2026-01-05'),
      makeEval('s2', 'Fisica', '4', '2026-01-15'),
    ]
    const ctx = buildAIContext([makeStudent('s1'), makeStudent('s2')], noLessons, evals)
    const res = askLessonAssistant(ctx)
    expect(res.gapsFound).toBeGreaterThan(0)
    expect(res.suggestions.length).toBeGreaterThan(0)
    expect(res.summary).toContain('Rilevate')
  })

  it('includes at least one recupero for a class with high-severity gap', () => {
    const evals = [
      makeEval('s1', 'Chimica', '4', '2026-01-05'),
      makeEval('s1', 'Chimica', '3.5', '2026-01-15'),
    ]
    const ctx = buildAIContext([makeStudent('s1')], noLessons, evals)
    const res = askLessonAssistant(ctx)
    expect(res.suggestions.some((s) => s.type === 'recupero')).toBe(true)
  })
})

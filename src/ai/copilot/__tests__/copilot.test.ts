import { describe, it, expect } from 'vitest'
import type { Studente, Valutazione, Lezione } from '@/types'
import { buildCopilotContext } from '../copilotContextBuilder'
import { generateClassSummary } from '../classSummary'
import { askCopilot } from '../copilotEngine'

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

const noLessons: Lezione[] = []

// ── buildCopilotContext ───────────────────────────────────────────────────────

describe('buildCopilotContext', () => {
  it('delegates to buildAIContext and returns the same shape', () => {
    const students = [makeStudent('s1')]
    const evals = [makeEval('s1', '7', '2026-01-10')]
    const ctx = buildCopilotContext(students, noLessons, evals)
    expect(ctx.students).toBe(students)
    expect(ctx.lessons).toBe(noLessons)
    expect(ctx.evaluations).toBe(evals)
  })
})

// ── generateClassSummary ─────────────────────────────────────────────────────

describe('generateClassSummary', () => {
  it('computes correct totals for a mixed class', () => {
    const students = [
      makeStudent('at-risk', 'Marco', 'Rossi'),
      makeStudent('excellent', 'Anna', 'Ferrari'),
      makeStudent('avg', 'Luca', 'Bianchi'),
    ]
    const evals = [
      // at-risk: avg ~4.5
      makeEval('at-risk', '4', '2026-01-05'),
      makeEval('at-risk', '4.5', '2026-01-15'),
      makeEval('at-risk', '5', '2026-02-01'),
      // excellent: avg ~9.3
      makeEval('excellent', '9', '2026-01-05'),
      makeEval('excellent', '9.5', '2026-01-15'),
      makeEval('excellent', '9', '2026-02-01'),
      makeEval('excellent', '10', '2026-02-15'),
      // avg: 6-7 range, no risk/excellence
      makeEval('avg', '6', '2026-01-05'),
      makeEval('avg', '7', '2026-01-15'),
      makeEval('avg', '6.5', '2026-02-01'),
    ]
    const ctx = buildCopilotContext(students, noLessons, evals)
    const summary = generateClassSummary(ctx)

    expect(summary.totalStudents).toBe(3)
    expect(summary.classAverage).toBeGreaterThan(0)
    expect(summary.atRiskCount).toBe(1)
    expect(summary.excellentCount).toBe(1)
    expect(summary.text).toContain('Studenti: 3')
    expect(summary.text).toContain('Studenti a rischio: 1')
    expect(summary.text).toContain('Studenti eccellenti: 1')
  })

  it('returns zero counts and N/D average when context is empty', () => {
    const ctx = buildCopilotContext([], noLessons, [])
    const summary = generateClassSummary(ctx)
    expect(summary.totalStudents).toBe(0)
    expect(summary.classAverage).toBe(0)
    expect(summary.atRiskCount).toBe(0)
    expect(summary.excellentCount).toBe(0)
    expect(summary.text).toContain('N/D')
  })
})

// ── askCopilot — students_at_risk ────────────────────────────────────────────

describe('askCopilot: students_at_risk', () => {
  it('returns risk suggestions when a student has low scores', () => {
    const students = [makeStudent('marco', 'Marco', 'Rossi')]
    const evals = [
      makeEval('marco', '4', '2026-01-05'),
      makeEval('marco', '4', '2026-01-15'),
      makeEval('marco', '4.5', '2026-02-01'),
    ]
    const ctx = buildCopilotContext(students, noLessons, evals)
    const res = askCopilot('students_at_risk', ctx)

    expect(res.command).toBe('students_at_risk')
    expect(res.message).toContain('rischio')
    expect(Array.isArray(res.data)).toBe(true)
    expect((res.data as unknown[]).length).toBe(1)
  })

  it('returns a clear message when no student is at risk', () => {
    const students = [makeStudent('s1', 'Sofia', 'Verdi')]
    const evals = [
      makeEval('s1', '8', '2026-01-05'),
      makeEval('s1', '8.5', '2026-01-15'),
      makeEval('s1', '9', '2026-02-01'),
    ]
    const ctx = buildCopilotContext(students, noLessons, evals)
    const res = askCopilot('students_at_risk', ctx)
    expect(res.message).toContain('Nessuno')
  })
})

// ── askCopilot — top_students ─────────────────────────────────────────────────

describe('askCopilot: top_students', () => {
  it('returns excellence suggestions for a high-performing student', () => {
    const students = [makeStudent('anna', 'Anna', 'Ferrari')]
    const evals = [
      makeEval('anna', '9', '2026-01-05'),
      makeEval('anna', '9.5', '2026-01-15'),
      makeEval('anna', '10', '2026-02-01'),
      makeEval('anna', '9', '2026-02-15'),
    ]
    const ctx = buildCopilotContext(students, noLessons, evals)
    const res = askCopilot('top_students', ctx)

    expect(res.command).toBe('top_students')
    expect(res.message).toContain('eccellente')
    expect(Array.isArray(res.data)).toBe(true)
    expect((res.data as unknown[]).length).toBe(1)
  })

  it('returns a clear message when no top student is detected', () => {
    const students = [makeStudent('s2', 'Media', 'Studente')]
    const evals = [
      makeEval('s2', '6', '2026-01-05'),
      makeEval('s2', '6.5', '2026-01-15'),
      makeEval('s2', '7', '2026-02-01'),
    ]
    const ctx = buildCopilotContext(students, noLessons, evals)
    const res = askCopilot('top_students', ctx)
    expect(res.message).toContain('Nessuna eccellenza')
  })
})

// ── askCopilot — class_summary ────────────────────────────────────────────────

describe('askCopilot: class_summary', () => {
  it('returns a formatted summary with correct data', () => {
    const students = [makeStudent('s3', 'Alice', 'Neri'), makeStudent('s4', 'Bob', 'Gialli')]
    const evals = [
      makeEval('s3', '8', '2026-01-05'),
      makeEval('s3', '8', '2026-01-15'),
      makeEval('s4', '6', '2026-01-05'),
      makeEval('s4', '6', '2026-01-15'),
    ]
    const ctx = buildCopilotContext(students, noLessons, evals)
    const res = askCopilot('class_summary', ctx)

    expect(res.command).toBe('class_summary')
    expect(res.message).toContain('Studenti: 2')
    expect(res.data).toBeDefined()
    const d = res.data as { totalStudents: number; classAverage: number }
    expect(d.totalStudents).toBe(2)
    expect(d.classAverage).toBeCloseTo(7, 0)
  })
})

// ── askCopilot — missing_assessments ─────────────────────────────────────────

describe('askCopilot: missing_assessments', () => {
  it('returns a clear message when no missing assessments are detected', () => {
    const ctx = buildCopilotContext([], noLessons, [])
    const res = askCopilot('missing_assessments', ctx)
    expect(res.command).toBe('missing_assessments')
    expect(res.message).toContain('Nessuna valutazione mancante')
    expect(Array.isArray(res.data)).toBe(true)
    expect((res.data as unknown[]).length).toBe(0)
  })
})

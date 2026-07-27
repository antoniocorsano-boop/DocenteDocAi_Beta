import type { Studente, Valutazione, Lezione } from '@/types'

export interface AIContext {
  students: Studente[]
  lessons: Lezione[]
  evaluations: Valutazione[]
}

export function buildAIContext(
  students: Studente[],
  lessons: Lezione[],
  evaluations: Valutazione[],
): AIContext {
  return { students, lessons, evaluations }
}

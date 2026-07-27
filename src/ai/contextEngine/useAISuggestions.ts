import { useMemo } from 'react'
import type { Studente, Valutazione } from '@/types'
import { buildAIContext } from './contextBuilder'
import { generateAISuggestions } from './suggestionEngine'
import type { AISuggestion } from './types'

/**
 * Memoized hook: runs the AI Context Engine against the given students/evaluations
 * and returns the suggestion list. Re-computes only when inputs change.
 */
export function useAISuggestions(
  students: Studente[],
  evaluations: Valutazione[],
): AISuggestion[] {
  return useMemo(() => {
    const context = buildAIContext(students, [], evaluations)
    return generateAISuggestions(context)
  }, [students, evaluations])
}

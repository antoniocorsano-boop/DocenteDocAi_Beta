import type { AIContext } from '../contextEngine/contextBuilder'
import { analyzeGaps } from './gapAnalyzer'
import { suggestActivities } from './activitySuggester'
import type { LessonAssistantResponse } from './types'

/**
 * Main entry point for the AI Lesson Assistant.
 *
 * Pipeline:
 *   AIContext
 *     ↓ gapAnalyzer  — identifies under-performing subjects
 *     ↓ activitySuggester — maps gaps to recupero / attivita / verifica
 *     ↓ LessonAssistantResponse
 */
export function askLessonAssistant(context: AIContext): LessonAssistantResponse {
  const gaps = analyzeGaps(context)
  const suggestions = suggestActivities(gaps)

  const summary = buildSummary(gaps.length, suggestions.length)

  return { suggestions, gapsFound: gaps.length, summary }
}

function buildSummary(gapsFound: number, suggestionsCount: number): string {
  if (gapsFound === 0) {
    return 'Nessuna lacuna significativa rilevata. La classe è in linea con gli obiettivi.'
  }
  const recuperi = suggestionsCount // already filtered inside suggester
  return (
    `Rilevate ${gapsFound} materia/e con difficoltà. ` +
    `Suggerite ${recuperi} attività (recupero, consolidamento, verifica).`
  )
}

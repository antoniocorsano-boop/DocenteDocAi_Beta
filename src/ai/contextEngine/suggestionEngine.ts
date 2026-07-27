import type { AIContext } from './contextBuilder'
import type { AISuggestion } from './types'
import { analyzeRisk } from './riskAnalyzer'
import { analyzeExcellence } from './excellenceAnalyzer'

export function generateAISuggestions(context: AIContext): AISuggestion[] {
  const riskSuggestions = analyzeRisk(context)
  const excellenceSuggestions = analyzeExcellence(context)
  return [...riskSuggestions, ...excellenceSuggestions]
}

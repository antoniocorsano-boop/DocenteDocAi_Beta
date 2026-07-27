import type { AIContext } from '../contextEngine/contextBuilder'
import { analyzeRisk } from '../contextEngine/riskAnalyzer'
import { analyzeExcellence } from '../contextEngine/excellenceAnalyzer'
import { generateAISuggestions } from '../contextEngine/suggestionEngine'
import { generateClassSummary } from './classSummary'
import type { CopilotCommand, CopilotResponse } from './types'

export function runCopilotCommand(command: CopilotCommand, context: AIContext): CopilotResponse {
  switch (command) {
    case 'students_at_risk': {
      const suggestions = analyzeRisk(context)
      if (suggestions.length === 0) {
        return {
          command,
          message: 'Nessuno studente a rischio rilevato nella selezione corrente.',
          data: [],
        }
      }
      const lines = suggestions.map(
        (s) => `• ${s.message} (confidenza: ${Math.round(s.confidence * 100)}%)`,
      )
      return {
        command,
        message: `${suggestions.length} studente/i a rischio:\n\n${lines.join('\n')}`,
        data: suggestions,
      }
    }

    case 'top_students': {
      const suggestions = analyzeExcellence(context)
      if (suggestions.length === 0) {
        return {
          command,
          message: 'Nessuna eccellenza rilevata nella selezione corrente.',
          data: [],
        }
      }
      const lines = suggestions.map(
        (s) => `• ${s.message} (confidenza: ${Math.round(s.confidence * 100)}%)`,
      )
      return {
        command,
        message: `${suggestions.length} studente/i eccellente/i:\n\n${lines.join('\n')}`,
        data: suggestions,
      }
    }

    case 'class_summary': {
      const summary = generateClassSummary(context)
      return {
        command,
        message: summary.text,
        data: summary,
      }
    }

    case 'missing_assessments': {
      const all = generateAISuggestions(context)
      const missing = all.filter((s) => s.type === 'missing_assessment')
      if (missing.length === 0) {
        return {
          command,
          message: 'Nessuna valutazione mancante rilevata.',
          data: [],
        }
      }
      const lines = missing.map((s) => `• ${s.message}`)
      return {
        command,
        message: `${missing.length} valutazione/i mancante/i:\n\n${lines.join('\n')}`,
        data: missing,
      }
    }
  }
}

import type { Studente, Valutazione, Lezione } from '@/types'
import { buildAIContext, type AIContext } from '../contextEngine/contextBuilder'

/**
 * Thin wrapper around buildAIContext — keeps the Copilot decoupled from the
 * contextEngine internals while reusing the same pure assembler.
 */
export function buildCopilotContext(
  students: Studente[],
  lessons: Lezione[],
  evaluations: Valutazione[],
): AIContext {
  return buildAIContext(students, lessons, evaluations)
}

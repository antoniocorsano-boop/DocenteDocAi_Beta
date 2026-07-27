import type { AIContext } from '../contextEngine/contextBuilder'
import { runCopilotCommand } from './copilotCommands'
import type { CopilotCommand, CopilotResponse } from './types'

/**
 * Main Copilot entry point.
 *
 * Pure function: given a command and a pre-built AIContext, returns a
 * structured CopilotResponse. No side effects.
 */
export function askCopilot(command: CopilotCommand, context: AIContext): CopilotResponse {
  return runCopilotCommand(command, context)
}

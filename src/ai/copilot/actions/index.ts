/**
 * actions/index.ts — barrel export for all Copilot Actions (FASE 2)
 */
export type {
  CopilotAction,
  CopilotActionType,
  ActionUrgency,
  RecoveryPayload,
  OralExamPayload,
  ParentMessagePayload,
} from './types';

export { buildScheduleRecoveryAction } from './scheduleRecovery';
export { buildSuggestOralExamAction } from './suggestOralExam';
export { buildGenerateParentMessageAction } from './generateParentMessage';

/**
 * Convenience: builds all three actions for a given at-risk student.
 * Returns them in the canonical display order.
 */
import type { AISuggestion } from '../../contextEngine/types';
import type { Studente, Valutazione } from '@/types';
import type { CopilotAction } from './types';
import { buildScheduleRecoveryAction } from './scheduleRecovery';
import { buildSuggestOralExamAction } from './suggestOralExam';
import { buildGenerateParentMessageAction } from './generateParentMessage';

export function buildAllActionsForStudent(
  suggestion: AISuggestion,
  student: Studente,
  evaluations: Valutazione[],
): CopilotAction[] {
  return [
    buildSuggestOralExamAction(suggestion, student, evaluations),
    buildScheduleRecoveryAction(suggestion, student, evaluations),
    buildGenerateParentMessageAction(suggestion, student, evaluations),
  ];
}

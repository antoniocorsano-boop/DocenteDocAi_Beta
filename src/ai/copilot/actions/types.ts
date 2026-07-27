/**
 * actions/types.ts — Copilot Action types (FASE 2)
 *
 * A CopilotAction is a concrete, one-click teacher operation proposed by
 * the AI based on diagnostic data. Actions are pure data structures —
 * they carry everything needed to render a dialog, pre-fill a form, or
 * generate a message without further API calls.
 */

export type CopilotActionType =
  | 'schedule_recovery'
  | 'suggest_oral_exam'
  | 'generate_parent_message';

/** Severity matching how urgent the proposed action is */
export type ActionUrgency = 'high' | 'medium' | 'low';

export interface CopilotAction {
  id: string;
  actionType: CopilotActionType;
  urgency: ActionUrgency;
  studentId: string;
  studentName: string;
  /** Subject(s) the action addresses */
  subjects: string[];
  /** Short title shown on the action button */
  label: string;
  /** One-sentence teacher-facing description */
  description: string;
  /** Concrete payload consumed by the executing UI handler */
  payload: RecoveryPayload | OralExamPayload | ParentMessagePayload;
}

// ── per-action payload types ──────────────────────────────────────────────────

export interface RecoveryPayload {
  type: 'schedule_recovery';
  suggestedSessions: number;
  suggestedFormat: 'individual' | 'group';
  objectives: string[];
}

export interface OralExamPayload {
  type: 'suggest_oral_exam';
  suggestedSubject: string;
  rationale: string;
  /** Suggested scheduling window relative to today (days) */
  windowDays: number;
}

export interface ParentMessagePayload {
  type: 'generate_parent_message';
  subject: string;
  body: string;
  /** ISO date the message was generated */
  generatedAt: string;
}

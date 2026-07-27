/**
 * automation/types.ts — Core types for the Autonomous Actions Layer.
 *
 * Design principles:
 *   - Rules are registered programmatically (functions, not serialised).
 *   - Execution log + pending confirmations are persisted to localStorage.
 *   - Every path through the engine goes via actionRouter — stores are never
 *     touched directly.
 */

import type { DocumentIntent } from '../documentAI/types';
import type { DocumentGraphResult } from '../knowledgeGraph/pipeline';
import type { KGEdgeType } from '../knowledgeGraph/types';
import type { ActionResult } from '../../integrations/chat/actionRouter';

// ─── Trigger payloads ─────────────────────────────────────────────────────────

export interface DocumentProcessedPayload {
  intent: DocumentIntent;
  graphResult: DocumentGraphResult;
  /** Raw OCR confidence [0, 1] */
  ocrConfidence: number;
}

export interface AssessmentCreatedPayload {
  studentId: string;
  evaluationId: string;
  materia: string;
  grade: string | number;
}

export interface KgNodeLinkedPayload {
  docNodeId: string;
  linkedNodeId: string;
  edgeType: KGEdgeType;
  /** Auto-link similarity score */
  confidence: number;
}

export type AutomationTriggerType =
  | 'document_processed'
  | 'assessment_created'
  | 'kg_node_linked'
  | 'scheduled_daily'
  | 'school_sync_requested'
  | 'enterprise_workflow_requested'
  | 'manual';

export interface SchoolSyncRequestedPayload {
  entity: 'students' | 'grades' | 'classes';
  providerId: string;
  classCode: string;
  period?: string;
}

export type AutomationTriggerPayload =
  | { type: 'document_processed'; data: DocumentProcessedPayload }
  | { type: 'assessment_created'; data: AssessmentCreatedPayload }
  | { type: 'kg_node_linked'; data: KgNodeLinkedPayload }
  | { type: 'scheduled_daily'; data: { date: string } }
  | { type: 'school_sync_requested'; data: SchoolSyncRequestedPayload }
  | { type: 'enterprise_workflow_requested'; data: { sessionId: string; tenantId: string; documentTitle: string } }
  | { type: 'manual'; data: Record<string, unknown> };

// ─── Condition ────────────────────────────────────────────────────────────────

/** Pure predicate evaluated synchronously before every execution. */
export type AutomationConditionFn = (payload: AutomationTriggerPayload) => boolean;

// ─── Action definition ────────────────────────────────────────────────────────

/**
 * What the engine does when a rule fires.
 *
 * `route_document_intent` — only valid for `document_processed` triggers.
 *   The engine will call `routeDocumentIntent(payload.data.intent)`.
 *
 * `send_chat_message` — emits a plain informational message to registered
 *   chat listeners (no store mutation).
 *
 * `log_only` — records the execution without any side effects. Useful for
 *   audit rules and debugging.
 */
export type AutomationActionDef =
  | { type: 'route_document_intent' }
  | { type: 'send_chat_message'; template: string }
  | { type: 'log_only' };

// ─── Rule ─────────────────────────────────────────────────────────────────────

export interface AutomationRule {
  id: string;
  /** Human-readable name shown in UI and confirmation messages. */
  name: string;
  /** Describes what the rule does — shown in confirmation chats. */
  description: string;
  /** Which trigger type activates this rule. */
  triggerType: AutomationTriggerType;
  /** Predicate; rule fires only when this returns true. */
  condition: AutomationConditionFn;
  /** What to do when the rule fires and is approved. */
  action: AutomationActionDef;
  enabled: boolean;
  /**
   * When true, the engine pauses and asks the user before executing.
   * The teacher can answer YES / NO / ALWAYS.
   * ALWAYS marks the rule as `autoApproved` — future triggers skip confirmation.
   */
  requiresConfirmation: boolean;
  /**
   * Set to true after a teacher answers ALWAYS.
   * Persisted to localStorage by the engine — do not set manually.
   */
  autoApproved?: boolean;
  /**
   * When set, this rule only fires when the active tenant matches.
   * Omit for global rules that apply to all tenants.
   */
  tenantId?: string;
}

// ─── Execution log entry ──────────────────────────────────────────────────────

export type ExecutionStatus =
  | 'executed'
  | 'confirmed'
  | 'rejected'
  | 'pending_confirmation'
  | 'auto_approved'
  | 'skipped'
  | 'error';

export interface AutomationExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  triggeredAt: string;   // ISO-8601
  payload: AutomationTriggerPayload;
  status: ExecutionStatus;
  result?: ActionResult;
  errorMessage?: string;
  /** Timestamp when the user (or autoApprove) resolved the confirmation. */
  resolvedAt?: string;
  resolvedBy?: 'user' | 'auto';
}

// ─── Human-in-the-loop ───────────────────────────────────────────────────────

export interface ConfirmationRequest {
  /** Stable ID — matches the AutomationExecution.id it was created from. */
  id: string;
  ruleId: string;
  ruleName: string;
  description: string;
  /** ISO-8601 timestamp when confirmation was requested. */
  createdAt: string;
  /** Formatted Italian chat message to display to the teacher. */
  chatMessage: string;
  /** Full payload needed to re-execute when the user answers YES/ALWAYS. */
  payload: AutomationTriggerPayload;
}

export type ConfirmationAnswer = 'yes' | 'no' | 'always';

// ─── Observer interfaces ─────────────────────────────────────────────────────

/** Called when a new confirmation request needs to be shown in chat. */
export type ConfirmationListener = (req: ConfirmationRequest) => void;

/** Called when the engine emits a chat informational message. */
export type ChatMessageListener = (message: string) => void;

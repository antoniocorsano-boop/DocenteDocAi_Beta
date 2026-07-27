/**
 * signals.ts — SystemSignal types for the Enterprise CopilotDoc pipeline.
 *
 * Agents MUST emit signals instead of making direct UI decisions.
 * Signals are stored in DecisionMemory and drive NextAction evaluation.
 *
 * Signal flow:
 *   Agent result → decisionMemory.emitSignal() → DecisionMemory.signals[]
 *   → getNextAction(ctx.signals) → NextAction for UI / chat
 *
 * Severity semantics:
 *   info     — informational, no user action required
 *   warning  — user should review soon
 *   critical — blocks pipeline progress; surfaced as TIER_0 by decision engine
 */

export type SystemSignalType =
  | 'COMPLIANCE_UPDATE'  // normative compliance status changed
  | 'NEW_DOCUMENT'       // new regulatory document entered the pipeline
  | 'INTEGRATION_ERROR'  // external integration (Drive, Telegram…) failure
  | 'PERFORMANCE_ALERT'  // student performance crossed a critical threshold
  | 'MISSING_DATA'       // required data for a pipeline step is absent
  | 'ACTION_EXECUTED'    // a copilot-suggested action was executed successfully
  | 'APPROVAL_REQUIRED'; // action blocked — submitted to HITL approval gate

export type SystemSignalSeverity = 'info' | 'warning' | 'critical';

export interface SystemSignal {
  /** Stable identifier — `sig_<timestamp36>_<random6>` */
  id: string;
  type: SystemSignalType;
  severity: SystemSignalSeverity;
  /** Human-readable description (Italian) */
  message: string;
  /** AgentRole string or system source that emitted the signal */
  sourceAgent: string;
  /** Unix timestamp in milliseconds */
  timestamp: number;
  tenantId?: string;
  /** Back-reference to the workflow session that produced this signal */
  sessionId?: string;
}

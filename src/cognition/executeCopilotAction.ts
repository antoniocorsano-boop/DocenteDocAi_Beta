/**
 * executeCopilotAction.ts — Safe execution gate for CopilotBrain suggestions.
 *
 * Pipeline (non-negotiable order):
 *   1. canExecute()       policy gate    → block if compliance/data issue
 *   2. requiresApproval   HITL gate      → submit to approvalGate, emit APPROVAL_REQUIRED, STOP
 *   3. dispatch()         safe handler   → execute the action
 *   4. audit              mandatory      → enterpriseAuditLog.record()
 *   5. signal             mandatory      → decisionMemory.emitSignal()
 *
 * Contract:
 *   - NEVER throws on blocked/approval — returns ExecutionResult with status
 *   - ALWAYS records an audit entry (executed | blocked | pending_approval)
 *   - ALWAYS emits a signal after steps 2 and 3
 *   - Does NOT duplicate store logic — delegates navigation to the caller via `navigateTo`
 *
 * Usage:
 *   const result = executeCopilotAction(suggestedAction, { userId, tenantId });
 *   if (result.status === 'executed')          → navigate to result.navigateTo
 *   if (result.status === 'pending_approval')  → show approval pending UI
 *   if (result.status === 'blocked')           → show result.blockedReason
 */

import { canExecute }               from './policyEngine';
import type { PolicyContext, PolicySubject } from './policyEngine';
import { decisionMemory }           from './decisionMemory';
import type { SuggestedAction }     from './copilotBrain';
import { approvalGate }             from '../services/enterprise/approvalGate';
import { enterpriseAuditLog }       from '../services/enterprise/enterpriseAuditLog';
import { getHandler }               from './actionRegistry';
import { useUserBehaviorStore }     from '../stores/useUserBehaviorStore';
import { trackUseCase }             from './useCaseTelemetry';
import type { UseCaseId }           from './useCaseTelemetry';
import { applySovereigntyGate }     from './sovereigntyRouter';
import { useSovereigntyStore }      from '../stores/useSovereigntyStore';

// ─── Public types ─────────────────────────────────────────────────────────────

export type ExecutionStatus = 'executed' | 'blocked' | 'pending_approval';

export interface ExecutionContext {
  /** Optional user identifier for audit */
  userId?:   string;
  /** Tenant identifier (school/institution) */
  tenantId?: string;
}

export interface ExecutionResult {
  status:             ExecutionStatus;
  actionId:           string;
  /** Human-readable explanation of the outcome */
  message:            string;
  /** Navigation hint for the UI: matches SuggestedAction.type / targetView */
  navigateTo?:        string;
  /** Present when status === 'pending_approval' */
  approvalRequestId?: string;
  /** Present when status === 'blocked' */
  blockedReason?:     string;
}

// ─── Use Case mapping ─────────────────────────────────────────────────────────

const ACTION_TYPE_TO_USE_CASE: Record<string, UseCaseId> = {
  enterprise:  'UC-R5',   // Regulatory document processing + approval gate
  compliance:  'UC-R1',   // Compliance framework check
  copilot:     'UC-R4',   // Copilot engine execution
  students:    'UC-P1',   // Student profile management
  planning:    'UC-P2',   // Annual planning wizard
  uda:         'UC-E1',   // UDA creation / editing
  evaluation:  'UC-E3',   // Evaluation module
  analytics:   'UC-V2',   // Analytics dashboard
  general:     'UC-R4',   // Generic copilot suggestion
};

/** Map a SuggestedAction.type to the closest matching operational UC identifier. */
function resolveUseCaseId(actionType: string): UseCaseId {
  return ACTION_TYPE_TO_USE_CASE[actionType] ?? 'UC-R4';
}

// ─── Policy context builder ───────────────────────────────────────────────────

function buildPolicyContext(ctx: ExecutionContext): PolicyContext {
  const { complianceStatus } = decisionMemory.getState();
  // Only a 'critical' compliance state is a hard block; 'warning' is acceptable
  const complianceOk =
    complianceStatus.gdpr !== 'critical' && complianceStatus.agid !== 'critical';

  return {
    approvalGranted: false,     // not yet — checked separately via requiresApproval path
    complianceOk,
    hasRequiredData: true,      // brain already validated context; executor trusts it
    tenantId:        ctx.tenantId,
    userId:          ctx.userId,
  };
}

// ─── Audit helpers ────────────────────────────────────────────────────────────

function auditExecuted(action: SuggestedAction, ctx: ExecutionContext): void {
  const useCaseId = resolveUseCaseId(action.type);
  enterpriseAuditLog.record({
    action:    'copilot_action_executed',
    details: {
      actionId:  action.id,
      type:      action.type,
      userId:    ctx.userId ?? 'anonymous',
      tenantId:  ctx.tenantId ?? 'unknown',
      status:    'executed',
    },
    complianceTags: ['copilot-execution'],
    tenantId:   ctx.tenantId,
    useCaseId,
    complianceDelta: 0,
  });
  trackUseCase(useCaseId, 'completed', 0, { actionId: action.id, type: action.type });
}

function auditBlocked(action: SuggestedAction, ctx: ExecutionContext, reason: string): void {
  const useCaseId = resolveUseCaseId(action.type);
  enterpriseAuditLog.record({
    action:    'copilot_action_blocked',
    details: {
      actionId:  action.id,
      type:      action.type,
      userId:    ctx.userId ?? 'anonymous',
      tenantId:  ctx.tenantId ?? 'unknown',
      status:    'blocked',
      reason,
    },
    complianceTags: ['copilot-execution', 'policy-block'],
    tenantId:   ctx.tenantId,
    useCaseId,
    complianceDelta: -5,
  });
  trackUseCase(useCaseId, 'compliance_fail', -5, { actionId: action.id, reason });
}

function auditApprovalSubmitted(
  action: SuggestedAction,
  ctx: ExecutionContext,
  approvalRequestId: string,
): void {
  const useCaseId = resolveUseCaseId(action.type);
  enterpriseAuditLog.record({
    action:    'copilot_approval_submitted',
    details: {
      actionId:          action.id,
      type:              action.type,
      userId:            ctx.userId ?? 'anonymous',
      tenantId:          ctx.tenantId ?? 'unknown',
      status:            'pending_approval',
      approvalRequestId,
    },
    complianceTags: ['copilot-execution', 'hitl-required'],
    tenantId:   ctx.tenantId,
    useCaseId,
    complianceDelta: 0,
  });
  trackUseCase(useCaseId, 'started', 0, { actionId: action.id, approvalRequestId });
}

// ─── Main executor ────────────────────────────────────────────────────────────

/**
 * Safely execute a CopilotBrain SuggestedAction.
 *
 * @param action - SuggestedAction from getCopilotPrimaryAction() or getTopSecondaryActions()
 * @param ctx    - Execution context (userId, tenantId) for audit
 *
 * @returns ExecutionResult — always resolves (never throws on block/approval)
 *
 * @example
 * const result = executeCopilotAction(primaryAction, { userId: 'prof.rossi', tenantId: 'istituto_001' });
 * if (result.status === 'executed') navigate(result.navigateTo);
 */
export function executeCopilotAction(
  action: SuggestedAction,
  ctx: ExecutionContext = {},
): ExecutionResult {

  // ── Step 0.5: Sovereignty gate ────────────────────────────────────────────
  // Enforces the user's operational mode (offline_only / assistive_ai / autonomous_ai).
  // Must run before any other check so the user's explicit choice is always honoured.
  const sovConfig = useSovereigntyStore.getState().getConfig();
  const gated     = applySovereigntyGate(action, sovConfig);
  if (!gated) {
    const reason =
      "Azione non consentita: modalità operativa 'Solo Locale' attiva. " +
      'Modifica in Governance → Controllo AI e Dati.';
    auditBlocked(action, ctx, reason);
    decisionMemory.emitSignal({
      type:        'INTEGRATION_ERROR',
      severity:    'warning',
      message:     `Azione "${action.title}" bloccata dalla configurazione sovranità utente`,
      sourceAgent: 'copilot-executor',
      tenantId:    ctx.tenantId,
    });
    return {
      status:        'blocked',
      actionId:      action.id,
      message:       reason,
      blockedReason: reason,
    };
  }
  // Forward sovereignty-upgraded requiresApproval into the HITL gate (assistive_ai mode)
  if (gated.requiresApproval && !action.requiresApproval) {
    action.requiresApproval = true;
  }

  // ── Step 1: Policy gate ──────────────────────────────────────────────────
  const policyCtx = buildPolicyContext(ctx);

  // For soft actions, check compliance + data only.
  // Critical/approval-required actions skip this check and go straight to HITL.
  const softSubject: PolicySubject = { type: action.id, tier: 'soft' };
  if (!canExecute(softSubject, policyCtx)) {
    const reason = !policyCtx.complianceOk
      ? 'Compliance critica (GDPR/AgID) blocca tutte le azioni. Risolvi prima di procedere.'
      : 'Dati necessari assenti.';

    auditBlocked(action, ctx, reason);
    decisionMemory.emitSignal({
      type:        'INTEGRATION_ERROR',
      severity:    'warning',
      message:     `Azione bloccata dalla policy: ${action.title} — ${reason}`,
      sourceAgent: 'copilot-executor',
      tenantId:    ctx.tenantId,
    });

    return {
      status:        'blocked',
      actionId:      action.id,
      message:       reason,
      blockedReason: reason,
    };
  }

  // ── Step 2: HITL gate ────────────────────────────────────────────────────
  if (action.requiresApproval) {
    const request = approvalGate.submit({
      title:         `Approvazione richiesta: ${action.title}`,
      description:   action.description,
      requiredLevel: 'dirigente',
      approvalChain: ['segreteria', 'dirigente'],
      payload:       action,
      kgImpact:      'minor',
      tenantId:      ctx.tenantId,
    });

    auditApprovalSubmitted(action, ctx, request.id);
    decisionMemory.emitSignal({
      type:        'APPROVAL_REQUIRED',
      severity:    'warning',
      message:     `Azione "${action.title}" in attesa di approvazione (${request.id})`,
      sourceAgent: 'copilot-executor',
      tenantId:    ctx.tenantId,
    });

    return {
      status:             'pending_approval',
      actionId:           action.id,
      message:            `Richiesta di approvazione inviata al dirigente. ID: ${request.id}`,
      approvalRequestId:  request.id,
    };
  }

  // ── Step 3: Execute safe action ──────────────────────────────────────────
  // The executor does NOT mutate stores directly — that belongs to UI action handlers.
  // It validates, audits, signals, and returns a navigation hint.
  // The caller (UI button / chat handler) acts on navigateTo.
  const entry      = getHandler(action.type);
  const navigateTo = action.type !== 'general' ? action.type : undefined;

  // Autonomous Mode: auto-invoke handler for low-priority, non-critical, non-approval actions.
  // Handlers in the registry are side-effect-only (analytics, prefetch) — never destructive.
  if (entry?.autonomous && action.priority === 'low' && !action.requiresApproval) {
    entry.handler(action, ctx);
  }

  // ── Step 4: Audit ────────────────────────────────────────────────────────
  auditExecuted(action, ctx);

  // ── Step 4b: Behavior tracking ───────────────────────────────────────────
  useUserBehaviorStore.getState().onActionExecuted(action.id, action.requiresApproval);

  // ── Step 5: Signal ───────────────────────────────────────────────────────
  decisionMemory.emitSignal({
    type:        'ACTION_EXECUTED',
    severity:    'info',
    message:     action.title,
    sourceAgent: 'copilot-executor',
    tenantId:    ctx.tenantId,
  });

  return {
    status:      'executed',
    actionId:    action.id,
    message:     `${action.title} eseguita con successo.`,
    navigateTo,
  };
}

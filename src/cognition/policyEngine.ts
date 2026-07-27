/**
 * policyEngine.ts — Security gate for Enterprise actions.
 *
 * Pure function: canExecute(action, context) → boolean
 *
 * Rules (in order of evaluation):
 *   1. Compliance must be OK — a critical GDPR/AgID state blocks everything
 *   2. Required data must be present
 *   3. Critical-tier or explicitly approval-required actions need a grant
 *
 * This module has NO side effects and NO external imports.
 * Consumers build the PolicyContext from available state and pass it in.
 *
 * @example
 * const ok = canExecute(
 *   { type: 'SEND_OFFICIAL_EMAIL', tier: 'critical', requiresApproval: true },
 *   { approvalGranted: false, complianceOk: true, hasRequiredData: true },
 * );
 * // ok === false  (critical action, no approval granted)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PolicyContext {
  /** True when an explicit HITL approval has been granted for this specific action */
  approvalGranted: boolean;
  /** False when GDPR or AgID compliance is in a blocking ('critical') state */
  complianceOk: boolean;
  /** False when data required to execute the action is absent */
  hasRequiredData: boolean;
  /** Optional: for audit context only — not used in gate logic */
  tenantId?: string;
  userId?: string;
}

export interface PolicySubject {
  /** Action type identifier */
  type: string;
  /** 'soft' — may auto-execute; 'critical' — requires approval */
  tier?: 'soft' | 'critical';
  /** Explicit override: this action requires approval regardless of tier */
  requiresApproval?: boolean;
}

// ── Gate ─────────────────────────────────────────────────────────────────────

/**
 * Returns true when the action may be executed in the given context.
 *
 * Blocked conditions:
 *   - compliance is in critical state (`complianceOk === false`)
 *   - required data is missing (`hasRequiredData === false`)
 *   - action is 'critical'-tier or flags `requiresApproval`, and no grant
 */
export function canExecute(action: PolicySubject, context: PolicyContext): boolean {
  if (!context.complianceOk)      return false;
  if (!context.hasRequiredData)   return false;
  if ((action.tier === 'critical' || action.requiresApproval) && !context.approvalGranted) {
    return false;
  }
  return true;
}

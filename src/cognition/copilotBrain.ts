/**
 * copilotBrain.ts — The Copilot brain: orchestrates state reading + decision making.
 *
 * This module is the SINGLE entry point for UI components and integrations
 * that need "what should the teacher do now?" as a high-level SuggestedAction.
 *
 * Architecture:
 *   - getCopilotPrimaryAction()  → reads ALL state, delegates to getNextAction()
 *   - getTopSecondaryActions()   → same context, returns actions [1..2] via getNextActions()
 *   - mapToSuggested()           → pure mapping NextAction → SuggestedAction
 *
 * Design rules:
 *   - NO new stores (reads from existing Zustand stores via .getState())
 *   - NO duplication of rules (delegates entirely to getNextAction.ts)
 *   - SuggestedAction is the public-surface type; NextAction is the internal type
 *   - Safe to call in non-React contexts (no React hooks used)
 */

import { getNextActions }         from './decisionEngine/getNextAction';
import type { NextAction, NextActionContext } from './decisionEngine/types';
import { decisionMemory }         from './decisionMemory';
import { approvalGate }           from '../services/enterprise';
import { useTeacherModelStore }   from '../stores/useTeacherModelStore';
import { useStudentStore }        from '../stores/useStudentStore';
import { rankActions }            from './rankingEngine';
import type { ScoringFactors, RankedAction }    from './rankingEngine';
import { useUserBehaviorStore }   from '../stores/useUserBehaviorStore';
import { enterpriseAuditLog }     from '../services/enterprise/enterpriseAuditLog';
import { buildUCAdaptiveBoosts }  from './adaptiveAssistant';
import { applySovereigntyGate, getEffectiveMode } from './sovereigntyRouter';
import { useSovereigntyStore }    from '../stores/useSovereigntyStore';

// ─── Public surface type ──────────────────────────────────────────────────────

/**
 * High-level suggested action returned to UI, chat, and demo consumers.
 * Intentionally simpler than the internal NextAction: no targetTab, no icon, no reason.
 */
export interface SuggestedAction {
  /** Stable identifier (same as underlying NextAction id) */
  id:                string;
  /** Short imperative title shown to the user */
  title:             string;
  /** One-sentence explanation of why this action is recommended */
  description:       string;
  /** Urgency level */
  priority:          'high' | 'medium' | 'low';
  /** Semantic category — matches NextAction.targetView or 'enterprise' */
  type:              string;
  /** True if an explicit HITL approval is required before proceeding */
  requiresApproval?: boolean;
}

// ─── Internal context builder ─────────────────────────────────────────────────

/**
 * Reads all available state sources and assembles a complete NextActionContext.
 * This is the "intelligence gathering" step — done once per call, shared
 * between primary and secondary action computation.
 */
function buildContext(): NextActionContext {
  const { capabilityLevel, usageProfile } = useTeacherModelStore.getState();
  const { students }                      = useStudentStore.getState();
  const dmState                           = decisionMemory.getState();
  const pendingCount                      = approvalGate.getPendingCount();

  return {
    eventNames:       new Set<string>(),   // no EventLogger session in this sync context
    capabilityLevel,
    usage: {
      lessonsCreated:      usageProfile.lessonsCreated,
      udaCreated:          usageProfile.udaCreated,
      copilotRequests:     usageProfile.copilotRequests,
      driveConnected:      usageProfile.driveConnected,
      bookServicesLinked:  usageProfile.bookServicesLinked,
      analyticsViews:      usageProfile.analyticsViews,
      workspaceConfigured: usageProfile.workspaceConfigured,
    },
    hasStudents:      students.filter((s) => !s.isArchived).length > 0,
    pendingApprovals: pendingCount,
    signals:          dmState.signals.map((s) => ({ type: s.type, severity: s.severity })),
    complianceStatus: dmState.complianceStatus,
  };
}

// ─── Scoring factors builder ─────────────────────────────────────────────────

function buildScoringFactors(dmState: ReturnType<typeof decisionMemory.getState>): ScoringFactors {
  // Actions executed in the last 24 h from audit log
  const oneDayAgo = Date.now() - 86_400_000;
  const recent = enterpriseAuditLog
    .filterByAction('copilot_action_executed')
    .filter((e) => new Date(e.timestamp).getTime() > oneDayAgo)
    .map((e) => (e.details as Record<string, unknown>)?.['actionId'] as string)
    .filter(Boolean);

  const complianceNonOk =
    dmState.complianceStatus.gdpr !== 'ok' ||
    dmState.complianceStatus.agid !== 'ok';

  return {
    activeSignals:    dmState.signals.map((s) => ({ type: s.type, severity: s.severity })),
    complianceNonOk,
    recentlyExecuted: new Set(recent),
    userProfile:      useUserBehaviorStore.getState().getProfile(),
    // UC-aware adaptive boosts: if a UC is degrading, its action types
    // get a higher score in rankActions so the assistant surfaces them first.
    ucAdaptiveBoosts: buildUCAdaptiveBoosts(),
  };
}

// ─── Mapping: NextAction → SuggestedAction ────────────────────────────────────

function mapToSuggested(action: NextAction): SuggestedAction {
  return {
    id:                action.id,
    title:             action.label,
    description:       action.description,
    priority:          action.priority ?? derivePriority(action),
    type:              action.targetView ?? 'general',
    requiresApproval:  action.requiresApproval,
  };
}

/** Derive a priority for legacy NextActions that predate the priority field */
function derivePriority(action: NextAction): 'high' | 'medium' | 'low' {
  if (action.id.startsWith('da-enterprise-')) return 'high';
  if (action.id === 'da-add-first-student')   return 'high';
  if (action.id === 'da-create-lesson')        return 'medium';
  return 'low';
}

// ─── Sovereignty filter ───────────────────────────────────────────────────────

/**
 * Removes actions that are invisible in the current sovereignty mode.
 * In offline_only mode, AI-type actions are hidden so the UI never shows them.
 * Falls back to the first action if everything is filtered (shouldn't happen
 * because non-AI actions always pass through).
 */
function applySOVFilter(ranked: RankedAction[]): RankedAction[] {
  const sovConfig = useSovereigntyStore.getState().getConfig();
  const effective = getEffectiveMode(sovConfig);
  if (effective !== 'offline_only') return ranked;
  return ranked.filter((a) => applySovereigntyGate(a, sovConfig) !== null);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns THE ONE recommended action for the current teacher state.
 *
 * Combines:
 *   - DecisionMemory signals + compliance
 *   - Enterprise approval gate (pendingCount)
 *   - Teacher model (capabilityLevel, usageProfile)
 *   - Student store (hasStudents)
 *
 * Maps the internal NextAction to the public SuggestedAction surface.
 *
 * @example
 * const action = getCopilotPrimaryAction();
 * // { id: 'da-enterprise-pending-approval', title: '2 approvazioni in attesa', priority: 'high', ... }
 */
export function getCopilotPrimaryAction(): RankedAction {
  const ctx     = buildContext();
  const actions = getNextActions(ctx, 3).map(mapToSuggested);
  const dmState = decisionMemory.getState();
  const ranked  = applySOVFilter(rankActions(actions, buildScoringFactors(dmState)));
  return ranked[0];
}

/**
 * Returns up to 2 secondary (non-primary) recommended actions.
 *
 * Evaluates the SAME rule set as getCopilotPrimaryAction() but skips the
 * first result — no duplication, no extra rules.
 *
 * @example
 * const [alt1, alt2] = getTopSecondaryActions();
 */
export function getTopSecondaryActions(): RankedAction[] {
  const ctx     = buildContext();
  const actions = getNextActions(ctx, 3).map(mapToSuggested);
  const dmState = decisionMemory.getState();
  const ranked  = applySOVFilter(rankActions(actions, buildScoringFactors(dmState)));
  return ranked.slice(1);
}

/**
 * Returns primary + secondaries as a consolidated snapshot.
 * Convenience for components that need all suggestions at once.
 */
export function getCopilotSnapshot(): {
  primary:     RankedAction;
  secondaries: RankedAction[];
} {
  const ctx     = buildContext();
  const actions = getNextActions(ctx, 3).map(mapToSuggested);
  const dmState = decisionMemory.getState();
  const ranked  = applySOVFilter(rankActions(actions, buildScoringFactors(dmState)));
  return {
    primary:     ranked[0],
    secondaries: ranked.slice(1),
  };
}

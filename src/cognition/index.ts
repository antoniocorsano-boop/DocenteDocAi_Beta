/**
 * src/cognition/index.ts — barrel export for the TCM cognition module.
 */

export { cognitionBus } from './CognitionBus';
export type { CognitionEvents } from './CognitionBus';

export { eventMap, getEventMeta, getEventsByPattern, getEventsByType, getCopilotEvents, getPersonalModeEvents } from './eventMap';
export type { AppEvent } from './eventMap';

export { initUsageTracker, _resetUsageTracker } from './UsageTracker';
export type { UsageTrackingStore } from './UsageTracker';

export { initWorkflowPatternDetector, _resetWorkflowDetector } from './WorkflowPatternDetector';
export type { WorkflowStore } from './WorkflowPatternDetector';

export { computeCapability, toJourneyLevel, computeJourneyProgress } from './CapabilityEngine';

export { generateNextActions, generateArtisticNextActions } from './SuggestionEngine';
export type { SuggestionContext } from './SuggestionEngine';

export { createEmptyTeacherModel, mergeUsageFromAnalytics, onSuggestionAccepted, onSuggestionIgnored } from './TeacherModel';

// ── v3: Governance + Logging ──────────────────────────────────────────────────

export {
  DecisionContract,
  validateSuggestion,
  applyContract,
} from './decisionContract';
export type { SuggestionSource, ContractViolation, ValidatableSuggestion } from './decisionContract';

export {
  logEvent,
  getSessionLog,
  replayEvents,
  replayCurrentSession,
  getEventsByType as getLoggedEventsByType,
  getEventsBySource,
  countEvents,
  hasEventOccurred,
  getLastEvent,
  getCurrentSessionId,
  _resetEventLogger,
} from './EventLogger';
export type { LoggedEvent, EventReplay } from './EventLogger';

// ── v4: Progressive Disclosure ─────────────────────────────────────────

export {
  getAvailableFeatures,
  computeCapabilityLevel,
} from './CapabilityEngine';
export type { FeatureKey } from './CapabilityEngine';

export { getPrimaryNextAction } from './SuggestionEngine';

export { buildDecisionExplanation } from './DecisionExplanation';
export type { DecisionExplanation } from './DecisionExplanation';

export { isFeatureAvailable } from './FeatureGate';

// ── v5: Decision Engine — single source of truth for "what to do next" ────────

export { getNextAction } from './decisionEngine/getNextAction';
export type { NextAction, NextActionContext, DecisionPriorityTier } from './decisionEngine/types';

// ── v6: Copilot Brain — DecisionMemory, Signals, PolicyEngine ─────────────────

export { decisionMemory }  from './decisionMemory';
export type { DecisionMemoryState, ComplianceSlot } from './decisionMemory';
export type { SystemSignal, SystemSignalType, SystemSignalSeverity } from './signals';
export { canExecute }      from './policyEngine';
export type { PolicyContext, PolicySubject } from './policyEngine';

// ── v7: Copilot Brain API — public surface ────────────────────────────────────

export { getCopilotPrimaryAction, getTopSecondaryActions, getCopilotSnapshot } from './copilotBrain';
export type { SuggestedAction } from './copilotBrain';
export { getNextActions } from './decisionEngine/getNextAction';

// ── v8: Execution gate ────────────────────────────────────────────────────────

export { executeCopilotAction } from './executeCopilotAction';
export type { ExecutionResult, ExecutionContext, ExecutionStatus } from './executeCopilotAction';

// ── v9: Action Registry + Autonomous Mode ─────────────────────────────────────

export { actionRegistry, getHandler } from './actionRegistry';
export type { RegistryEntry, ActionHandler } from './actionRegistry';

// ── Sprint 11: Proactive Notification Engine ──────────────────────────────────

export { decide as notificationDecide, resetThrottle as resetNotificationThrottle } from './notificationEngine';
export type { NotificationDecision } from './notificationEngine';

// ── Sprint 12: Decision Timeline Builder ─────────────────────────────────────

export {
  buildTimeline,
  filterTimeline,
  clusterTimeline,
  detectAnomalies,
} from './decisionTimeline';
export type {
  DecisionEvent,
  DecisionResult,
  DecisionSource,
  DecisionCategory,
  TimelineFilter,
  ClusteredGroup,
} from './decisionTimeline';

// ── Sprint 13: User Behavior Model ────────────────────────────────────────────

export {
  createEmptyProfile,
  onActionExecuted,
  onActionIgnored,
  onApprovalDelay,
} from './userBehaviorModel';
export type { UserBehaviorProfile } from './userBehaviorModel';

// ── Sprint 14: Dynamic Ranking Engine ─────────────────────────────────────────

export { rankActions } from './rankingEngine';
export type { ScoringFactors, ScoreBreakdown, RankedAction } from './rankingEngine';

// ── Sprint 15: Explainability Layer ───────────────────────────────────────────

export { explainAction } from './explainAction';
export type { ActionExplanation } from './explainAction';

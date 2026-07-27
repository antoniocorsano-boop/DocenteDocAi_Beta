/**
 * decisionEngine/types.ts — canonical NextAction type.
 *
 * NextAction is the SINGLE OUTPUT of the decision engine.
 * Every part of the UI that needs to guide the user MUST use this type —
 * never compute "what to do next" inside a component.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SOURCE-OF-TRUTH RESOLUTION RULES
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Q: What if multiple logic sources compute a "next action"?
 *
 * A: This module (`getNextAction`) is the AUTHORITATIVE source.
 *    All other sources are DERIVED:
 *
 *    - Agent suggestions (AgentSuggestion[]) → secondary, complementary only.
 *      They NEVER override the primary NextAction.
 *    - SuggestionEngine (legacy, src/cognition/SuggestionEngine.ts) → DEPRECATED.
 *      Kept for backward compatibility only. Do NOT add new logic there.
 *    - Chat actionRouter.getNextActionSuggestion() → delegates to getNextAction().
 *      It is a display adapter, not an independent source.
 *
 * If you find logic that computes a "next step" outside this module,
 * it is a violation. Mark it as legacy and propose a deprecation path.
 * DO NOT merge the two implementations — identify the authoritative one and
 * route everything through it.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * FLOW STATE STORAGE RULE
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Guided execution flow state MUST live in `useGuidedExecutionStore`.
 * DO NOT create a new global store for flow state.
 * DO NOT store flow state in component local state.
 */

/**
 * Decision priority tiers used by getNextAction() rule ordering.
 *
 * Rules are evaluated top-to-bottom; first match wins.
 * Tiers must be respected — a TIER 4 rule must never be evaluated
 * before all TIER 1–3 rules are exhausted.
 */
export type DecisionPriorityTier =
  | 'TIER_0_ENTERPRISE'  // Enterprise signals and compliance — highest priority
  | 'TIER_1_BLOCKING'    // Missing critical data; blocks other features
  | 'TIER_2_ONBOARDING'  // Initial workspace setup steps
  | 'TIER_3_ACADEMIC'    // Core instructional workflow (UDA, planning)
  | 'TIER_4_SYSTEM'      // Integration and analytics improvements
  | 'TIER_5_ADVANCED';   // Capability-gated automation and optimizations

/**
 * A single, high-priority recommended action for the current teacher.
 *
 * Rules:
 *   - ONE action at a time (the engine picks the most important one)
 *   - label / cta are display-ready, never internal identifiers
 *   - reason is human-readable (shown in "Perché?" popovers)
 *   - targetTab is the CopilotDocentePanel tab index to highlight (optional)
 *   - targetView is the app-level route/view to navigate to (optional)
 */
export interface NextAction {
  /** Stable identifier — used for deduplication and test assertions */
  id: string;
  /** Short action label (used as chip or heading) */
  label: string;
  /** One-sentence description of what this action does */
  description: string;
  /**
   * Action priority — present only for enterprise-tier actions.
   * Standard onboarding/academic actions do not carry explicit priority.
   */
  priority?: 'high' | 'medium' | 'low';
  /**
   * True when the action requires an explicit HITL approval before execution.
   * Drives PolicyEngine.canExecute() checks.
   */
  requiresApproval?: boolean;
  /**
   * App-level view key to navigate to when the CTA is clicked.
   * Matches the `onNavigate` view keys in Home/Router.
   */
  targetView?: string;
  /**
   * Index of the CopilotDocentePanel tab to highlight.
   * Provides a visual cue directing the user to the right panel.
   */
  targetTab?: number;
  /** Label for the CTA button (e.g. "Inizia", "Apri", "Configura") */
  cta: string;
  /** Human-readable motivation shown in the "Perché?" popover */
  reason: string;
  /** Material Symbols icon name */
  icon: string;
}

/**
 * Minimal context required by `getNextAction`.
 *
 * All fields are read-only to enforce pure-function semantics.
 * The hook `useNextAction` builds this from stores.
 */
export interface NextActionContext {
  /**
   * Names of events that have occurred in the user's session / history.
   * Drives capability level computation and rule evaluation.
   */
  readonly eventNames: ReadonlySet<string>;
  /** Computed CapabilityLevel (1–4) */
  readonly capabilityLevel: 1 | 2 | 3 | 4;
  /** Quantitative usage counters from TeacherModel.usageProfile */
  readonly usage: {
    readonly lessonsCreated: number;
    readonly udaCreated: number;
    readonly copilotRequests: number;
    readonly driveConnected: boolean;
    readonly bookServicesLinked: number;
    readonly analyticsViews: number;
    readonly workspaceConfigured: boolean;
  };
  /** True when the teacher has at least one student */
  readonly hasStudents: boolean;

  // ── Enterprise fields (optional — present only when enterprise layer is active) ──

  /**
   * Number of pending HITL approval requests in the Enterprise approval gate.
   * When > 0, surfaces as a TIER_0_ENTERPRISE action.
   */
  readonly pendingApprovals?: number;
  /**
   * Snapshot of signals from DecisionMemory, mapped to the minimal shape
   * needed by the decision rules (type + severity).
   */
  readonly signals?: ReadonlyArray<{
    readonly type: string;
    readonly severity: 'info' | 'warning' | 'critical';
  }>;
  /**
   * GDPR / AgID compliance status from DecisionMemory.
   * A 'warning' or 'critical' slot triggers a TIER_0_ENTERPRISE rule.
   */
  readonly complianceStatus?: {
    readonly gdpr: 'ok' | 'warning' | 'critical';
    readonly agid: 'ok' | 'warning' | 'critical';
  };
}

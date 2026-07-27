/**
 * actionRegistry.ts — Typed dispatch handlers per SuggestedAction.type.
 *
 * Registry contract:
 *   - handler:    Optional side-effect invoked at execution time (pre-fetch, analytics, etc.).
 *                 Navigation is always handled by the caller via ExecutionResult.navigateTo.
 *   - autonomous: When true, the handler is invoked automatically for low-priority,
 *                 non-approval-required actions (Autonomous Mode).
 *                 Suitable for lightweight data prep or analytics pings — never for
 *                 destructive or approval-required operations.
 *   - category:   Semantic category used by policy classification and analytics.
 *
 * Adding a new action type:
 *   1. Add a key matching SuggestedAction.type / NextAction.targetView.
 *   2. Provide a handler (use `noop` if no side-effect is needed yet).
 *   3. Set autonomous: true only for low-risk, non-critical, reversible actions.
 *   4. Export is automatic via the barrel (src/cognition/index.ts).
 */

import type { SuggestedAction } from './copilotBrain';
import type { ExecutionContext } from './executeCopilotAction';

// ─── Public types ─────────────────────────────────────────────────────────────

/** A callable that executes a side-effect for a given action. */
export type ActionHandler = (action: SuggestedAction, ctx: ExecutionContext) => void;

export interface RegistryEntry {
  /**
   * Side-effect handler invoked after policy + HITL gates pass.
   * Navigation is handled by the caller; this is for supplementary effects.
   */
  handler:    ActionHandler;
  /**
   * When true, the handler is auto-invoked for low-priority (priority === 'low'),
   * non-approval-required actions without waiting for explicit user confirmation.
   * Only set for non-critical, reversible categories.
   */
  autonomous: boolean;
  /** Semantic category — used by analytics and future policy rules. */
  category:   'navigation' | 'data' | 'critical' | 'communication';
}

// ─── Default no-op handler ────────────────────────────────────────────────────

/** Navigation is handled by the caller via ExecutionResult.navigateTo. */
const noop: ActionHandler = (_action, _ctx) => { /* side-effect reserved for future use */ };

// ─── Registry ────────────────────────────────────────────────────────────────

/**
 * Maps SuggestedAction.type → execution handler + metadata.
 *
 * Keys match the targetView values produced by the decision engine rules:
 *   'register', 'lessons', 'planning', 'copilot', 'aula',
 *   'settings', 'analytics', 'enterprise', 'general'.
 *
 * Category semantics:
 *   - 'critical':     Requires human review; never autonomous.
 *   - 'data':         Reads/creates instructional data; low-risk.
 *   - 'navigation':   Pure view-switch; zero data mutation.
 *   - 'communication': Sends or surfaces messages.
 */
export const actionRegistry: Partial<Record<string, RegistryEntry>> = {
  // ── Onboarding & data ───────────────────────────────────────────────────────
  register:   { handler: noop, autonomous: false, category: 'data' },         // add students
  lessons:    { handler: noop, autonomous: true,  category: 'data' },         // create/open lesson
  planning:   { handler: noop, autonomous: false, category: 'data' },         // UDA planning
  analytics:  { handler: noop, autonomous: true,  category: 'data' },         // view analytics

  // ── Navigation ──────────────────────────────────────────────────────────────
  aula:       { handler: noop, autonomous: false, category: 'navigation' },   // classroom view
  copilot:    { handler: noop, autonomous: false, category: 'navigation' },   // copilot panel
  settings:   { handler: noop, autonomous: true,  category: 'navigation' },   // settings view
  general:    { handler: noop, autonomous: false, category: 'navigation' },   // generic fallback

  // ── Critical / enterprise ───────────────────────────────────────────────────
  enterprise: { handler: noop, autonomous: false, category: 'critical' },     // HITL / approval flows
};

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Returns the registry entry for the given action type, or `undefined`
 * for unknown types. Callers must handle the `undefined` case gracefully.
 */
export function getHandler(type: string): RegistryEntry | undefined {
  return actionRegistry[type];
}

/**
 * agents/types.ts — Shared types for the Agent System.
 *
 * Agents are PURE FUNCTIONS: they receive a read-only AgentContext
 * (built from stores by useAgentSuggestions) and return AgentSuggestion[].
 *
 * Rules:
 *   - Agents NEVER import stores — context is passed in
 *   - Agents NEVER create or mutate data
 *   - Agents OUTPUT suggestions only
 *   - Agent IDs must be prefixed with the agent namespace (e.g. 'reg-', 'fin-')
 */

import type { CapabilityLevel } from '../../types/teacherModel.types';
import type { IntegrationMeta } from '../../types/integration.types';
import type { AnalyticsMetrics } from '../../types/analytics.types';
import type { Studente, Valutazione } from '../../types/student.types';
import type { Uda, Lezione } from '../../types/uda.types';
import type { UserProfile } from '../../types';

// ─── Concrete action dispatched when a suggestion is accepted ─────────────────

/**
 * Describes the concrete action to perform when a suggestion is accepted.
 *
 * All agent suggestion actions MUST use this discriminated union.
 * Components are NOT allowed to compute navigation targets on their own.
 */
export type SuggestedAction =
  | { type: 'navigate'; targetView: string }
  | { type: 'navigate_tab'; targetView: string; tabIndex: number }
  | { type: 'open_dialog'; dialogId: string };

// ─── Agent context ────────────────────────────────────────────────────────────

/**
 * Snapshot of system state passed to all agents.
 * Built once per render cycle by `useAgentSuggestions`.
 */
export interface AgentContext {
  readonly capabilityLevel: CapabilityLevel;
  readonly students: ReadonlyArray<Studente>;
  readonly evaluations: ReadonlyArray<Valutazione>;
  readonly uda: ReadonlyArray<Uda>;
  readonly lessons: ReadonlyArray<Lezione>;
  readonly integrations: ReadonlyArray<IntegrationMeta>;
  readonly analyticsMetrics: AnalyticsMetrics;
  readonly user: UserProfile | null;
  /** How many UDA-related events have been logged (from integrationStore.events) */
  readonly recentEventCount: number;
}

// ─── Agent output ─────────────────────────────────────────────────────────────

/**
 * A single contextual suggestion produced by an agent.
 *
 * ALL agents MUST output this exact type — no agent-specific variants allowed.
 * This ensures the orchestrator can rank, deduplicate and render suggestions
 * uniformly, regardless of which agent produced them.
 *
 * Conflict resolution:
 *   - `getNextAction()` always overrides agent suggestions for primary CTA
 *   - Agents are ranked by `priority` (higher = more important)
 *   - Max visible suggestions is governed by `DecisionContract.MAX_SUGGESTIONS`
 */
export interface AgentSuggestion {
  /** Stable ID (format: '<agentPrefix>-<action>') */
  id: string;
  /** Short label for chip / header */
  label: string;
  /** One-sentence description */
  description: string;
  /** Human-readable motivation for "Perché?" transparency */
  reason: string;
  /** Higher = more important (0–100) */
  priority: number;
  /** Material Symbols icon name */
  icon: string;
  /**
   * Stable action key for deduplication and feedback loop.
   * Format: '<domain>.<action>'
   */
  actionKey: string;
  /** App-level view to navigate when suggestion is accepted */
  targetView?: string;
  /** Agent that produced this suggestion — for transparency */
  agentId: string;
  /**
   * Concrete action to execute when the suggestion is accepted.
   * If absent, the consumer falls back to `targetView` navigation.
   */
  action?: SuggestedAction;
  /**
   * Human-readable conditions that must hold for this suggestion to be relevant.
   * Used for transparency ("Perché ora?") and test assertions.
   * Example: ['capabilityLevel >= 2', 'udaCreated === 0']
   *
   * Optional — new agents should populate this; existing agents may omit it.
   */
  conditions?: string[];
}

/** Result from a single agent run */
export interface AgentOutput {
  agentId: string;
  suggestions: AgentSuggestion[];
}

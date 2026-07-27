/**
 * flows/orbitFlow.ts
 *
 * Flow Engine types — multi-step intelligent sequences.
 *
 * An OrbitFlow represents a repeatable sequence of orchestration actions
 * that Orbit has learned from the user's behaviour patterns. It can be
 * triggered automatically (session/time/pattern) or manually by the user.
 *
 * Design:
 *   - Pure types: no side-effects, no stores
 *   - Compatible with existing OrchestrationAction pipeline
 *   - flowTrust mirrors skillTrust (decay/reversal mechanics apply)
 */

import type { CognitiveDomain } from '../cognitiveLayer/types';
import type { SessionMode, TimeContext } from '../session/orbitSession';

// ─── Execution mode ───────────────────────────────────────────────────────────

/**
 * How each step in a flow should be executed.
 *   - silent:   auto-execute, no UI feedback
 *   - ambient:  auto-execute, minimal indicator shown
 *   - explicit: requires user confirmation before running
 */
export type FlowStepMode = 'silent' | 'ambient' | 'explicit';

// ─── FlowStep ─────────────────────────────────────────────────────────────────

/** A single action step within a flow. */
export interface FlowStep {
  /** Unique step ID within the flow */
  stepId:        string;
  /** ctaType — must match an entry in skillRegistry or emergentSkillStore */
  ctaType:       string;
  /** Human-readable label shown in the flow card */
  label:         string;
  /** Semantic domain — used for role-gating */
  domain:        CognitiveDomain;
  /** How this step executes */
  executionMode: FlowStepMode;
  /** Milliseconds to wait after this step before executing the next */
  delayMs?:      number;
}

// ─── FlowTrigger ─────────────────────────────────────────────────────────────

/** Conditions under which a flow is triggered automatically. */
export interface FlowTrigger {
  /** Flow is active in these session modes (empty = all modes) */
  sessionModes?: SessionMode[];
  /** Flow is active in these time contexts (empty = all) */
  timeContexts?: TimeContext[];
  /** ctaType pattern that initiated the learned sequence */
  originPattern?: string;
  /** If true, this flow is manual-only — never auto-triggered */
  manualOnly?: boolean;
}

// ─── OrbitFlow ────────────────────────────────────────────────────────────────

/** A complete named flow — a learned or user-defined action sequence. */
export interface OrbitFlow {
  /** Unique flow ID */
  id:          string;
  /** Human-readable name */
  name:        string;
  /** Short description shown in the JarvisNexus flow card */
  description: string;
  /** Ordered list of steps */
  steps:       FlowStep[];
  /** Trigger conditions for automatic activation */
  trigger:     FlowTrigger;
  /** Trust score [0–1] — mirrors skillTrust mechanics */
  trustScore:  number;
  /** How many times this flow has been successfully executed */
  executionCount: number;
  /** Epoch ms of the last successful execution (0 = never) */
  lastRunAt:   number;
  /** Epoch ms when this flow was first created */
  createdAt:   number;
  /** true = actively shown in JarvisNexus, false = archived */
  active:      boolean;
}

// ─── Flow execution result ────────────────────────────────────────────────────

export interface FlowStepResult {
  stepId:  string;
  ctaType: string;
  success: boolean;
  reason?: string;
  trustRecordId?: string;
}

export interface FlowExecutionResult {
  flowId:       string;
  success:      boolean;
  stepsRun:     number;
  stepsTotal:   number;
  stepResults:  FlowStepResult[];
  /** If false, execution halted at a failed step */
  completedFully: boolean;
}

// ─── Pattern analysis ─────────────────────────────────────────────────────────

/**
 * Minimum frequency for a ctaType sequence to be promoted to a flow.
 * A sequence of N ctaTypes that appears this many times triggers flow creation.
 */
export const FLOW_PATTERN_MIN_FREQUENCY = 3;

/** Maximum number of steps in an auto-generated flow */
export const FLOW_MAX_AUTO_STEPS = 5;

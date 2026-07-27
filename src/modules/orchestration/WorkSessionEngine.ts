/**
 * modules/orchestration/WorkSessionEngine.ts — P43 Work Session Unifier
 *
 * Collapses plan + confidence + explain + actions into a single
 * `work_session` UIBlock so the chat shows ONE clear task + ONE CTA.
 *
 * Returns null → pipeline falls back to P42 DecisionCard / independent blocks.
 *
 * Pure function — no side effects, no external deps at runtime.
 */

import type { UIAction } from '@/types/uiBlocks';

// ── Minimal local types (mirror signal shapes without circular imports) ────────

type Plan = {
  title:      string;
  steps:      Array<{ id: string; label: string }>;
  confidence: number;
} | null;

type ConfidenceSignal = {
  score:       number;
  nextAction?: string;
  factors:     string[];
  shouldShow:  boolean;
} | null;

type ExplainSignal = {
  items:      string[];
  shouldShow: boolean;
} | null;

type Input = {
  plan:       Plan;
  confidence: ConfidenceSignal;
  explain:    ExplainSignal;
  actions:    UIAction[];
};

// ── Output type (mirrors UIBlock 'work_session') ───────────────────────────────

export interface WorkSessionBlock {
  type:               'work_session';
  title:              string;
  currentTask:        string;
  nextAction:         string;
  confidence:         number;
  explainItems?:      string[];
  secondaryActions?:  UIAction[];
}

// ── Builder ───────────────────────────────────────────────────────────────────

/**
 * Build a unified WorkSession block from the available signals.
 *
 * Returns null when there is not enough signal to show a meaningful session
 * (no plan AND no confidence data) → pipeline falls back to P42.
 */
export function buildWorkSession(input: Input): WorkSessionBlock | null {
  const { plan, confidence, explain, actions } = input;

  // 🔒 No signal at all → keep existing pipeline
  if (!plan && !confidence) return null;

  const title = plan?.title ?? 'Elaborazione richiesta';

  const currentTask =
    plan?.steps?.[0]?.label ??
    'Sto preparando la soluzione migliore per te';

  const nextAction =
    confidence?.nextAction ??
    actions?.[0]?.label ??
    'Procedi';

  const confidenceScore =
    confidence?.score ??
    plan?.confidence ??
    0.7;

  const explainItems =
    explain?.shouldShow && explain.items.length > 0
      ? explain.items
      : undefined;

  const secondaryActions = actions.slice(1);

  return {
    type:             'work_session',
    title,
    currentTask,
    nextAction,
    confidence:       confidenceScore,
    explainItems,
    secondaryActions: secondaryActions.length > 0 ? secondaryActions : undefined,
  };
}

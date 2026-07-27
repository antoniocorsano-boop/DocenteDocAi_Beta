/**
 * uiHintsGenerator.ts — Generates StepUIHints for the currently active step.
 *
 * Resolves the DOM element to highlight (if any) and packages display-ready
 * data for GuidedStepOverlay to consume.
 *
 * Architecture rule: CALLED FROM HOOKS/COMPONENTS ONLY — never from the
 * cognition layer directly (live DOM access is a side effect).
 */

import type { ExecutionPlan, StepUIHints } from './types';
import { resolveCurrentStep } from './stepResolver';

/**
 * Generates UI hints for the current step.
 *
 * @param plan            - The active ExecutionPlan.
 * @param currentStepIndex - 0-based index of the current step.
 * @returns StepUIHints ready for consumption by GuidedStepOverlay.
 */
export function generateUIHints(
  plan: ExecutionPlan,
  currentStepIndex: number,
): StepUIHints | null {
  const step = resolveCurrentStep(plan, currentStepIndex);
  if (!step) return null;

  let targetElement: Element | null = null;
  if (step.targetElementHint) {
    try {
      targetElement = document.querySelector(step.targetElementHint);
    } catch {
      // Malformed selector — ignore
    }
  }

  return {
    stepLabel: step.label,
    stepInstruction: step.instruction,
    stepIcon: step.icon,
    targetElement,
    stepIndex: currentStepIndex,
    totalSteps: plan.steps.length,
  };
}

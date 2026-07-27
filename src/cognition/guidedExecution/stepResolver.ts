/**
 * stepResolver.ts — Resolves the currently active step from a plan.
 *
 * Pure function — no side effects.
 */

import type { ExecutionPlan, ExecutionStep } from './types';

/**
 * Returns the active step for a given plan + index.
 * Returns null when the plan is complete.
 */
export function resolveCurrentStep(
  plan: ExecutionPlan,
  currentStepIndex: number,
): ExecutionStep | null {
  return plan.steps[currentStepIndex] ?? null;
}

/**
 * Returns true when all steps have been completed.
 */
export function isPlanComplete(plan: ExecutionPlan, currentStepIndex: number): boolean {
  return currentStepIndex >= plan.steps.length;
}

/**
 * Returns number of remaining steps (including current).
 */
export function remainingSteps(plan: ExecutionPlan, currentStepIndex: number): number {
  return Math.max(0, plan.steps.length - currentStepIndex);
}

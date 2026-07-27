/**
 * cognition/guidedExecution/index.ts — public API barrel.
 */
export type { ExecutionPlan, ExecutionStep, StepUIHints } from './types';
export { buildExecutionPlan }   from './buildExecutionPlan';
export { resolveCurrentStep, isPlanComplete, remainingSteps } from './stepResolver';
export { generateUIHints }      from './uiHintsGenerator';

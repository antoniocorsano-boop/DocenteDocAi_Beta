/**
 * src/copilot/index.ts — barrel export for the Copilot layer.
 *
 * Usage:
 *   import { CopilotProvider, useCopilot } from '@/copilot';
 *   import { suggest, CopilotSuggestion } from '@/copilot';
 *   import { executeCopilotAction } from '@/copilot';
 *   import { explainStudentRisk } from '@/copilot';
 */

export { CopilotProvider, useCopilot } from './CopilotProvider';
export type { CopilotProviderProps, CopilotContextValue } from './CopilotProvider';

export { suggest, hasPredictions } from './CopilotPredictions';
export type { CopilotSuggestion } from './CopilotPredictions';

export { executeCopilotAction, registerCopilotAction } from './CopilotActions';
export type { ActionContext } from './CopilotActions';

export {
    explainStudentRisk,
    explainClassHealth,
    generateInterventionPlan,
} from './CopilotInsights';
export type {
    StudentRiskContext,
    ClassHealthContext,
    InsightResult,
} from './CopilotInsights';

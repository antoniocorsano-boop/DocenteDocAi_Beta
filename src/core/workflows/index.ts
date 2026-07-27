/**
 * src/core/workflows/index.ts — barrel export for the WorkflowEngine module.
 */
export { WorkflowEngine } from './WorkflowEngine';
export { WorkflowRegistry } from './WorkflowRegistry';
export { executeWorkflow } from './WorkflowExecutor';
export type {
    WorkflowDefinition,
    WorkflowStep,
    WorkflowContext,
    WorkflowEventName,
} from './WorkflowRegistry';
export type { WorkflowExecutionResult } from './WorkflowExecutor';

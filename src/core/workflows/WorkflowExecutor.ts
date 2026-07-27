/**
 * WorkflowExecutor.ts — Executes a single workflow step by step.
 *
 * Each step runs with:
 *   - An individual timeout (default 5s)
 *   - Isolated error catching (fire-and-continue unless abortOnError)
 *   - Structured logging via the WorkflowContext
 */

import type { WorkflowDefinition, WorkflowContext, WorkflowStep } from './WorkflowRegistry';
import { logger } from '../../utils/logger';

// ── Helpers ───────────────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number, stepId: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`[WorkflowExecutor] Step "${stepId}" timed out after ${ms}ms`)), ms),
        ),
    ]);
}

// ── Step execution ────────────────────────────────────────────────────────────

async function executeStep(
    step: WorkflowStep,
    ctx: WorkflowContext,
): Promise<{ ok: boolean; error?: unknown }> {
    const timeout = step.timeout ?? 5_000;
    try {
        const result = step.fn(ctx);
        if (result instanceof Promise) {
            await withTimeout(result, timeout, step.id);
        }
        return { ok: true };
    } catch (err) {
        logger.warn(`[WorkflowExecutor] Step "${step.id}" failed:`, err);
        return { ok: false, error: err };
    }
}

// ── Workflow execution ────────────────────────────────────────────────────────

export interface WorkflowExecutionResult {
    workflowId: string;
    stepResults: Array<{ stepId: string; ok: boolean; error?: unknown }>;
    aborted: boolean;
    durationMs: number;
}

/**
 * Executes all steps of a workflow in sequence.
 * Returns a summary of step outcomes.
 */
export async function executeWorkflow(
    workflow: WorkflowDefinition,
    ctx: WorkflowContext,
): Promise<WorkflowExecutionResult> {
    const t0 = performance.now();
    const stepResults: WorkflowExecutionResult['stepResults'] = [];
    let aborted = false;

    const globalTimeout = workflow.timeout ?? 30_000;
    const deadline = Date.now() + globalTimeout;

    for (const step of workflow.steps) {
        if (Date.now() > deadline) {
            logger.warn(`[WorkflowExecutor] Workflow "${workflow.id}" hit global timeout — aborting at step "${step.id}"`);
            aborted = true;
            break;
        }

        const result = await executeStep(step, ctx);
        stepResults.push({ stepId: step.id, ...result });

        if (!result.ok && step.abortOnError) {
            logger.warn(`[WorkflowExecutor] Step "${step.id}" abortOnError=true — stopping workflow "${workflow.id}"`);
            aborted = true;
            break;
        }
    }

    return {
        workflowId: workflow.id,
        stepResults,
        aborted,
        durationMs: parseFloat((performance.now() - t0).toFixed(2)),
    };
}

/**
 * WorkflowEngine.ts — Subscribes to CognitionBus events and runs registered workflows.
 *
 * Usage:
 *   import { WorkflowEngine } from '@/core/workflows/WorkflowEngine';
 *
 *   // Boot once at app startup (call from main.tsx or a top-level effect)
 *   WorkflowEngine.start();
 *
 *   // Teardown on unmount
 *   WorkflowEngine.stop();
 *
 * Workflows react to CognitionBus events automatically after start() is called.
 * Register workflows before calling start() or any time after — the engine
 * dynamically reads WorkflowRegistry on each event.
 */

import { cognitionBus } from '../../cognition/CognitionBus';
import type { CognitionEvents } from '../../cognition/CognitionBus';
import { WorkflowRegistry } from './WorkflowRegistry';
import type { WorkflowContext, WorkflowEventName } from './WorkflowRegistry';
import { executeWorkflow } from './WorkflowExecutor';
import { logger } from '../../utils/logger';

// ── Type helpers ──────────────────────────────────────────────────────────────

type MittHandler<T = unknown> = (event: T) => void;
type ListenerMap = Partial<Record<WorkflowEventName, MittHandler>>;

// ── Engine singleton ──────────────────────────────────────────────────────────

class WorkflowEngineClass {
    private _running = false;
    private readonly _listeners: ListenerMap = {};

    /** Subscribe to all known CognitionBus event names. */
    start(): void {
        if (this._running) return;

        const allEvents = Object.keys(cognitionBus['all'] ?? {}) as WorkflowEventName[];

        // Subscribe to wildcard so we catch ALL emitted events dynamically.
        // mitt supports the '*' wildcard for catching all events.
        const wildcardHandler = (eventName: unknown, payload: unknown) => {
            this._dispatch(
                eventName as WorkflowEventName,
                payload as CognitionEvents[WorkflowEventName],
            );
        };

        // Use mitt's wildcard subscription
        (cognitionBus as unknown as { on: (evt: '*', handler: (type: unknown, payload: unknown) => void) => void })
            .on('*', wildcardHandler as (type: unknown, payload: unknown) => void);

        // Store ref for cleanup
        (this._listeners as Record<string, unknown>)['*'] = wildcardHandler;

        this._running = true;
        logger.info('[WorkflowEngine] Started — listening for all CognitionBus events');
        void allEvents; // suppress unused warning
    }

    /** Unsubscribe all listeners. */
    stop(): void {
        if (!this._running) return;

        const wildcardHandler = (this._listeners as Record<string, unknown>)['*'];
        if (wildcardHandler) {
            (cognitionBus as unknown as { off: (evt: '*', handler: unknown) => void })
                .off('*', wildcardHandler as Parameters<typeof cognitionBus.off>[1]);
        }

        this._running = false;
        logger.info('[WorkflowEngine] Stopped');
    }

    /** Check if the engine is running. */
    get running(): boolean {
        return this._running;
    }

    // ── Internal dispatch ───────────────────────────────────────────────────

    private _dispatch<K extends WorkflowEventName>(
        eventName: K,
        payload: CognitionEvents[K],
    ): void {
        const workflows = WorkflowRegistry.getForEvent(eventName);
        if (workflows.length === 0) return;

        for (const workflow of workflows) {
            if (workflow.enabled === false) continue;

            const ctx: WorkflowContext<K> = {
                event: eventName,
                payload,
                emit: (evt, evtPayload) => cognitionBus.emit(evt, evtPayload),
                log: (message, level = 'debug') => {
                    const logFn = logger[level] as (msg: string) => void;
                    logFn(`[Workflow:${workflow.id}] ${message}`);
                },
            };

            // Fire-and-forget: workflows run async without blocking the event dispatch.
            executeWorkflow(workflow, ctx as WorkflowContext).then(result => {
                if (result.aborted) {
                    logger.warn(`[WorkflowEngine] Workflow "${workflow.id}" aborted after ${result.durationMs}ms`);
                } else {
                    logger.debug(`[WorkflowEngine] Workflow "${workflow.id}" completed in ${result.durationMs}ms`);
                }
            }).catch(err => {
                logger.error(`[WorkflowEngine] Unhandled error in workflow "${workflow.id}":`, err);
            });
        }
    }
}

export const WorkflowEngine = new WorkflowEngineClass();

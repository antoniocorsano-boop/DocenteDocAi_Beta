/**
 * WorkflowRegistry.ts — Catalog of event-driven workflows.
 *
 * A workflow is triggered when a CognitionBus event fires.
 * Each workflow has a list of steps executed in order.
 *
 * Design rules:
 *   - Steps are pure async functions (no direct React/store mutations)
 *   - Side effects go through the WorkflowContext callbacks (injected at runtime)
 *   - Every step obeys an individual timeout; the whole workflow has a global cap
 *   - Failures in one step do NOT abort subsequent steps (fire-and-continue model)
 *     unless `abortOnError: true` is set
 */

import type { CognitionEvents } from '../../cognition/CognitionBus';

// ── Types ─────────────────────────────────────────────────────────────────────

export type WorkflowEventName = keyof CognitionEvents;
export type WorkflowEventPayload<K extends WorkflowEventName> = CognitionEvents[K];

/** Runtime context injected into every workflow step. */
export interface WorkflowContext<K extends WorkflowEventName = WorkflowEventName> {
    /** The triggering event name */
    event: K;
    /** The triggering event payload */
    payload: WorkflowEventPayload<K>;
    /** Emit follow-on events */
    emit: <E extends WorkflowEventName>(event: E, payload: WorkflowEventPayload<E>) => void;
    /** Log a workflow-scoped message */
    log: (message: string, level?: 'debug' | 'info' | 'warn' | 'error') => void;
}

/** A single step in a workflow. */
export interface WorkflowStep {
    /** Human-readable step ID for logging/audit */
    id: string;
    /** The actual action. Returning nothing or a Promise<void> is fine. */
    fn: (ctx: WorkflowContext) => Promise<void> | void;
    /** Individual step timeout in ms (default: 5000) */
    timeout?: number;
    /** If true, a failure in this step aborts remaining steps. Default: false */
    abortOnError?: boolean;
}

/** A complete workflow registration. */
export interface WorkflowDefinition<K extends WorkflowEventName = WorkflowEventName> {
    /** Unique workflow ID */
    id: string;
    /** CognitionBus event that triggers this workflow */
    trigger: K;
    /** Ordered list of steps */
    steps: WorkflowStep[];
    /** Human-readable description */
    description?: string;
    /** Global workflow timeout in ms (default: 30_000) */
    timeout?: number;
    /** If false, the workflow won't run (feature-flag friendly). Default: true */
    enabled?: boolean;
}

// ── Registry ──────────────────────────────────────────────────────────────────

class WorkflowRegistryClass {
    private readonly _map = new Map<string, WorkflowDefinition>();

    /** Register a workflow. Throws on duplicate id. */
    register<K extends WorkflowEventName>(definition: WorkflowDefinition<K>): void {
        if (this._map.has(definition.id)) {
            throw new Error(`[WorkflowRegistry] Workflow already registered: "${definition.id}"`);
        }
        this._map.set(definition.id, definition as WorkflowDefinition);
    }

    /** Get all workflows registered for a specific event trigger. */
    getForEvent<K extends WorkflowEventName>(event: K): WorkflowDefinition<K>[] {
        return Array.from(this._map.values()).filter(
            (w): w is WorkflowDefinition<K> => w.trigger === event,
        );
    }

    /** Check if any workflows are registered for an event. */
    hasForEvent(event: WorkflowEventName): boolean {
        return Array.from(this._map.values()).some(w => w.trigger === event);
    }

    /** Unregister a workflow by id (for testing). */
    unregister(id: string): boolean {
        return this._map.delete(id);
    }

    /** List all registered workflow IDs. */
    ids(): string[] {
        return Array.from(this._map.keys());
    }
}

export const WorkflowRegistry = new WorkflowRegistryClass();

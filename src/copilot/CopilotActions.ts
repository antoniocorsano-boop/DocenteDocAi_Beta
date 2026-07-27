/**
 * CopilotActions.ts — Executable actions triggered by the Copilot layer.
 *
 * Maps each `actionKey` (from CopilotPredictions) to a handler.
 * Handlers receive a payload and a `navigate` callback so they can
 * transition views without depending on React hooks.
 *
 * Design rules:
 *  – No React imports — handlers are pure async functions
 *  – Handlers MUST be fault-tolerant (log, do not throw to callers)
 *  – Emit CognitionBus events to signal completion
 */

import { cognitionBus } from '../cognition/CognitionBus';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ActionContext {
    /** Application navigation callback — avoids importing React hooks */
    navigate: (view: string, ctx?: Record<string, unknown>) => void;
    /** Show a toast notification */
    showToast: (message: string, severity?: 'success' | 'info' | 'warning' | 'error') => void;
}

type ActionHandler = (
    payload: Record<string, unknown>,
    ctx: ActionContext,
) => Promise<void> | void;

// ── Handlers ──────────────────────────────────────────────────────────────────

const _handlers: Record<string, ActionHandler> = {
    'assessment.generate': async (payload, ctx) => {
        ctx.navigate('classroom', { subTab: 'assessments', lessonId: payload['lessonId'] });
        ctx.showToast('Naviga alla sezione Verifiche per generare la verifica', 'info');
    },

    'notes.create': (payload, ctx) => {
        ctx.navigate('classroom', { subTab: 'notes', lessonId: payload['lessonId'] });
    },

    'student.explain_risk': (payload, ctx) => {
        ctx.navigate('analytics', { subTab: 'risk', studentId: payload['studentId'] });
        ctx.showToast('Analisi del rischio disponibile in Analytics', 'info');
    },

    'student.intervention_plan': (payload, ctx) => {
        ctx.navigate('analytics', { subTab: 'copilot', studentId: payload['studentId'] });
        ctx.showToast('Piano di intervento generabile nel Copilot Docente', 'info');
    },

    'uda.schedule_lessons': (payload, ctx) => {
        ctx.navigate('planning', { udaId: payload['udaId'] });
        ctx.showToast('Apri la UDA per pianificare le lezioni', 'info');
    },

    'evaluation.generate_feedback': (payload, ctx) => {
        ctx.navigate('analytics', { subTab: 'evaluations', studentId: payload['studentId'] });
    },

    'backup.verify': (_payload, ctx) => {
        ctx.showToast('Backup ripristinato — controlla i dati nelle sezioni principali', 'success');
    },

    'planning.export_pdf': (_payload, ctx) => {
        ctx.navigate('planning', { export: 'pdf' });
        ctx.showToast("Esportazione PDF avviata dalla sezione Pianificazione", 'info');
    },

    'kb.analyze': (payload, ctx) => {
        ctx.navigate('analytics', { subTab: 'kb', docId: payload['docId'] });
        ctx.showToast('Documento disponibile nella Knowledge Base', 'info');
    },

    'navigation.register': (_payload, ctx) => {
        ctx.navigate('classroom', { subTab: 'register' });
    },

    'navigation.planning': (_payload, ctx) => {
        ctx.navigate('planning');
    },

    'navigation.copilot': (_payload, ctx) => {
        ctx.navigate('copilot');
    },

    'navigation.resources': (_payload, ctx) => {
        ctx.navigate('analytics', { subTab: 'kb' });
    },

    'uda.link_resource': (payload, ctx) => {
        ctx.navigate('planning', { subTab: 'uda', action: 'link_resource', resourceId: payload['resourceId'] });
        ctx.showToast('Vai alla pianificazione per collegare la risorsa alla UDA', 'info');
    },

    'copilot.show_feature_guide': (payload, ctx) => {
        ctx.navigate('copilot', { subTab: 'guide', feature: payload['feature'] });
        ctx.showToast(`Guida disponibile nel Copilot`, 'info');
    },

    'artistic.open': (_payload, ctx) => {
        ctx.navigate('copilot', { subTab: 'artistic' });
        ctx.showToast('Apri il Copilot Docente → tab Artistico per generare attività', 'info');
    },
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Execute a Copilot action by key.
 * Returns true if the action was found and executed, false otherwise.
 */
export async function executeCopilotAction(
    actionKey: string,
    payload: Record<string, unknown>,
    ctx: ActionContext,
): Promise<boolean> {
    const handler = _handlers[actionKey];
    if (!handler) {
        console.warn(`[CopilotActions] Unknown action key: "${actionKey}"`);
        return false;
    }
    try {
        await handler(payload, ctx);
        cognitionBus.emit('copilot.suggestion.accepted', { suggestionId: actionKey });
        return true;
    } catch (err) {
        console.error(`[CopilotActions] Error executing "${actionKey}":`, err);
        return false;
    }
}

/**
 * Register a custom action handler.
 * Useful for plugin system (Step 6) and tests.
 */
export function registerCopilotAction(key: string, handler: ActionHandler): void {
    _handlers[key] = handler;
}

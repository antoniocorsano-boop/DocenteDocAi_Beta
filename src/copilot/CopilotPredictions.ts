/**
 * CopilotPredictions.ts — Proactive suggestions based on CognitionBus events.
 *
 * Maps each event type to a list of contextual suggestions the Copilot
 * can surface to the teacher.  Only non-null suggestions are returned;
 * callers decide how to present them.
 *
 * Design rules:
 *  – Pure functions / no side-effects
 *  – No imports from React tree (safe for Worker use in the future)
 *  – Each suggestion carries an ID so the UI can deduplicate / dismiss
 */

import type { CognitionEvents } from '../cognition/CognitionBus';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CopilotSuggestion {
    /** Globally unique suggestion id — used for accept/reject tracking */
    id: string;
    /** Short label shown in the chip / button */
    label: string;
    /** Optional longer explanation */
    description?: string;
    /**
     * Logical action key — consumed by CopilotActions.execute().
     * Format: "<module>.<verb>", e.g. "assessment.generate"
     */
    actionKey: string;
    /** Contextual data forwarded to the action handler */
    actionPayload?: Record<string, unknown>;
    /** Priority for display ordering (lower = higher priority) */
    priority: number;
}

export type WorkflowEventName = keyof CognitionEvents;

// ── Internal map ──────────────────────────────────────────────────────────────

type SuggestionFactory<K extends WorkflowEventName> = (
    payload: CognitionEvents[K],
) => CopilotSuggestion[];

const _factories: Partial<{
    [K in WorkflowEventName]: SuggestionFactory<K>;
}> = {
    'lesson.created': (p) => [
        {
            id: `suggest.assessment.generate.${p.lessonId ?? Date.now()}`,
            label: 'Genera una verifica',
            description: 'Crea una verifica per questa lezione con Gemini',
            actionKey: 'assessment.generate',
            actionPayload: { lessonId: p.lessonId },
            priority: 1,
        },
        {
            id: `suggest.notes.create.${p.lessonId ?? Date.now()}`,
            label: 'Aggiungi annotazione',
            description: 'Annota osservazioni per questa lezione',
            actionKey: 'notes.create',
            actionPayload: { lessonId: p.lessonId },
            priority: 3,
        },
    ],

    'student.risk.changed': (p) => [
        {
            id: `suggest.student.insight.${p.studentId ?? Date.now()}.${p.risk ?? 'unknown'}`,
            label: 'Perché a rischio?',
            description: 'Spiega con AI le motivazioni del rischio rilevato',
            actionKey: 'student.explain_risk',
            actionPayload: { studentId: p.studentId, risk: p.risk },
            priority: 1,
        },
        {
            id: `suggest.intervention.plan.${p.studentId ?? Date.now()}`,
            label: 'Piano di intervento',
            description: "Genera un piano d'intervento personalizzato",
            actionKey: 'student.intervention_plan',
            actionPayload: { studentId: p.studentId },
            priority: 2,
        },
    ],

    'uda.created': (p) => [
        {
            id: `suggest.uda.schedule.${p.udaId ?? Date.now()}`,
            label: 'Pianifica lezioni',
            description: 'Genera automaticamente la sequenza di lezioni per questa UDA',
            actionKey: 'uda.schedule_lessons',
            actionPayload: { udaId: p.udaId },
            priority: 1,
        },
    ],

    'evaluation.added': (p) => [
        {
            id: `suggest.evaluation.feedback.${p.studentId ?? Date.now()}`,
            label: 'Genera feedback',
            description: 'Crea un feedback personalizzato basato sulle valutazioni',
            actionKey: 'evaluation.generate_feedback',
            actionPayload: { studentId: p.studentId },
            priority: 2,
        },
    ],

    'drive.backup.restored': () => [
        {
            id: `suggest.backup.verify.${Date.now()}`,
            label: 'Verifica integrità dati',
            description: 'Controlla che il backup ripristinato sia completo',
            actionKey: 'backup.verify',
            actionPayload: {},
            priority: 2,
        },
    ],

    'planning.wizard.completed': () => [
        {
            id: `suggest.planning.export.${Date.now()}`,
            label: 'Esporta piano annuale',
            description: 'Scarica il piano in PDF pronto per la firma',
            actionKey: 'planning.export_pdf',
            actionPayload: {},
            priority: 1,
        },
    ],

    'kb.document.uploaded': (p) => [
        {
            id: `suggest.kb.query.${p.docId ?? Date.now()}`,
            label: 'Analizza documento',
            description: 'Chiedi al Copilot di riassumere e indicizzare il documento',
            actionKey: 'kb.analyze',
            actionPayload: { docId: p.docId },
            priority: 2,
        },
    ],

    'class.first_student_added': (p) => [
        {
            id: `suggest.class.first_student.${p.studentId ?? Date.now()}`,
            label: 'Inizia il registro',
            description: 'Ottima mossa! Ora puoi aggiungere una lezione e iniziare a registrare.',
            actionKey: 'navigation.register',
            actionPayload: {},
            priority: 1,
        },
    ],

    'workspace.configured': () => [
        {
            id: `suggest.workspace.start.${Date.now()}`,
            label: 'Crea la prima UDA',
            description: 'Workspace pronto — inizia con una Unità Didattica o aggiungi studenti.',
            actionKey: 'navigation.planning',
            actionPayload: {},
            priority: 1,
        },
    ],

    'feature.discovered': (p) => [
        {
            id: `suggest.feature.guide.${p.feature ?? 'unknown'}.${Date.now()}`,
            label: 'Mostra guida',
            description: `Vuoi una panoramica rapida di questa funzionalità?`,
            actionKey: 'copilot.show_feature_guide',
            actionPayload: { feature: p.feature },
            priority: 2,
        },
    ],

    'book.account.linked': (p) => [
        {
            id: `suggest.book.explore.${p.serviceId ?? Date.now()}`,
            label: 'Esplora risorse digitali',
            description: 'Account collegato — accedi alle risorse del libro direttamente dall\'app.',
            actionKey: 'navigation.resources',
            actionPayload: { serviceId: p.serviceId },
            priority: 1,
        },
    ],

    'book.service.interacted': (p) => [
        {
            id: `suggest.book.integrate.${p.resourceId ?? Date.now()}`,
            label: 'Integra nella UDA',
            description: 'Vuoi collegare questa risorsa alla pianificazione della tua UDA?',
            actionKey: 'uda.link_resource',
            actionPayload: { serviceId: p.serviceId, resourceId: p.resourceId },
            priority: 2,
        },
    ],
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns an ordered list of proactive suggestions for `eventName` + `payload`.
 * Returns an empty array when the event has no registered predictions.
 */
export function suggest<K extends WorkflowEventName>(
    eventName: K,
    payload: CognitionEvents[K],
): CopilotSuggestion[] {
    const factory = _factories[eventName] as SuggestionFactory<K> | undefined;
    if (!factory) return [];
    const suggestions = factory(payload);
    return suggestions.sort((a, b) => a.priority - b.priority);
}

/**
 * Returns whether there are any predictions registered for the given event.
 */
export function hasPredictions(eventName: WorkflowEventName): boolean {
    return eventName in _factories;
}

// @ts-nocheck
/**
 * Tests for src/integrations/chat/actionRouter.ts
 *
 * Verifica che ogni intent esegua le mutation corrette sugli store reali
 * e generi l'ActionResult atteso. Non testa il layer UI né le Edge Function.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { routeIntent, getNextActionSuggestion, publishActionEvent } from '../../src/integrations/chat/actionRouter';
import { useStudentStore } from '../../src/stores/useStudentStore';
import { useAcademicStore } from '../../src/stores/useAcademicStore';
import { useIntegrationStore } from '../../src/stores/useIntegrationStore';
import type { ParsedIntent } from '../../src/types/integration.types';

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeIntent(overrides: Partial<ParsedIntent>): ParsedIntent {
    return {
        action: 'unknown',
        params: {},
        confidence: 1,
        rawText: '',
        source: 'telegram',
        ...overrides,
    };
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
    useStudentStore.getState().actions.resetStudentData();
    useAcademicStore.getState().actions.resetAcademicData();
});

// ─── create_class ──────────────────────────────────────────────────────────────

describe('routeIntent — create_class', () => {
    it('returns requiresApp when className is provided', async () => {
        const result = await routeIntent(makeIntent({ action: 'create_class', params: { className: '2B' } }));
        expect(result.ok).toBe(true);
        expect(result.requiresApp).toBe(true);
        expect(result.message).toContain('2B');
    });

    it('fails gracefully when className is missing', async () => {
        const result = await routeIntent(makeIntent({ action: 'create_class', params: {} }));
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/specifica|classe/i);
    });

    it('detects existing class and reports student count', async () => {
        // Seed student store with an existing class
        useStudentStore.getState().actions.saveStudent({ id: 's1', nome: 'Mario', cognome: 'Rossi', classe: '3A' });

        const result = await routeIntent(makeIntent({ action: 'create_class', params: { className: '3A' } }));
        expect(result.ok).toBe(true);
        expect(result.message).toMatch(/esiste|1 studenti/i);
    });
});

// ─── add_student ───────────────────────────────────────────────────────────────

describe('routeIntent — add_student', () => {
    it('creates a new student in the store', async () => {
        const result = await routeIntent(makeIntent({
            action: 'add_student',
            params: { studentName: 'Giulia Ferrari', className: '2B' },
        }));

        expect(result.ok).toBe(true);
        expect(result.requiresApp).toBe(false);

        const students = useStudentStore.getState().students;
        expect(students).toHaveLength(1);
        expect(students[0].nome).toBe('Giulia');
        expect(students[0].cognome).toBe('Ferrari');
        expect(students[0].classe).toBe('2B');
    });

    it('handles name without class', async () => {
        const result = await routeIntent(makeIntent({
            action: 'add_student',
            params: { studentName: 'Luca Bianchi' },
        }));
        expect(result.ok).toBe(true);
        expect(result.message).toContain('Luca');
    });

    it('fails gracefully when studentName is missing', async () => {
        const result = await routeIntent(makeIntent({ action: 'add_student', params: {} }));
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/specifica/i);
    });
});

// ─── add_evaluation ────────────────────────────────────────────────────────────

describe('routeIntent — add_evaluation', () => {
    beforeEach(() => {
        // Seed a student to evaluate
        useStudentStore.getState().actions.saveStudent({ id: 's99', nome: 'Anna', cognome: 'Verdi', classe: '1C' });
    });

    it('adds evaluation when student is found', async () => {
        const result = await routeIntent(makeIntent({
            action: 'add_evaluation',
            params: { studentName: 'Anna Verdi', grade: '9' },
        }));

        expect(result.ok).toBe(true);
        expect(result.requiresApp).toBe(false);

        const evaluations = useStudentStore.getState().evaluations;
        expect(evaluations).toHaveLength(1);
        expect(evaluations[0].voto).toBe('9');
        expect(evaluations[0].studenteId).toBe('s99');
    });

    it('fails if student not found', async () => {
        const result = await routeIntent(makeIntent({
            action: 'add_evaluation',
            params: { studentName: 'Studente Inesistente', grade: '7' },
        }));
        expect(result.ok).toBe(false);
        expect(result.requiresApp).toBe(true);
        expect(result.message).toMatch(/non trovato/i);
    });

    it('fails when grade or studentName is missing', async () => {
        const result1 = await routeIntent(makeIntent({ action: 'add_evaluation', params: { grade: '8' } }));
        const result2 = await routeIntent(makeIntent({ action: 'add_evaluation', params: { studentName: 'Anna' } }));
        expect(result1.ok).toBe(false);
        expect(result2.ok).toBe(false);
    });
});

// ─── schedule_event ────────────────────────────────────────────────────────────

describe('routeIntent — schedule_event', () => {
    it('creates a calendar event in useAcademicStore', async () => {
        const result = await routeIntent(makeIntent({
            action: 'schedule_event',
            params: { title: 'Consiglio di classe', date: '20/03' },
        }));

        expect(result.ok).toBe(true);
        expect(result.requiresApp).toBe(false);
        expect(result.eventType).toBe('event_scheduled');

        const { eventi } = useAcademicStore.getState();
        expect(eventi).toHaveLength(1);
        expect(eventi[0].titolo).toBe('Consiglio di classe');
        expect(eventi[0].data).toBe('20/03');
    });

    it('uses fallback title when title is empty string', async () => {
        const result = await routeIntent(makeIntent({
            action: 'schedule_event',
            params: { title: '', date: '21/03' },
        }));
        expect(result.ok).toBe(true);
        const { eventi } = useAcademicStore.getState();
        expect(eventi[0].titolo).toBe('Evento da chat');
    });

    it('fails gracefully when both title and date are missing', async () => {
        const result = await routeIntent(makeIntent({ action: 'schedule_event', params: {} }));
        expect(result.ok).toBe(false);
    });
});

// ─── show_students ─────────────────────────────────────────────────────────────

describe('routeIntent — show_students', () => {
    it('returns empty state message when no students exist', async () => {
        const result = await routeIntent(makeIntent({ action: 'show_students', params: {} }));
        expect(result.ok).toBe(true);
        expect(result.message).toMatch(/nessuno|import/i);
        expect(result.requiresApp).toBe(false);
    });

    it('lists students from a specific class', async () => {
        useStudentStore.getState().actions.saveStudent({ id: 's1', nome: 'Marco', cognome: 'Neri', classe: '3A' });
        useStudentStore.getState().actions.saveStudent({ id: 's2', nome: 'Sara', cognome: 'Blu', classe: '2B' });

        const result = await routeIntent(makeIntent({ action: 'show_students', params: { className: '3A' } }));
        expect(result.ok).toBe(true);
        expect(result.message).toContain('Marco');
        expect(result.message).not.toContain('Sara');
    });

    it('does not show archived students', async () => {
        useStudentStore.getState().actions.saveStudent({ id: 'a1', nome: 'Archiviato', cognome: 'Test', classe: '1A', isArchived: true });
        useStudentStore.getState().actions.saveStudent({ id: 'a2', nome: 'Attivo', cognome: 'Test', classe: '1A' });

        const result = await routeIntent(makeIntent({ action: 'show_students', params: {} }));
        expect(result.message).toContain('Attivo');
        expect(result.message).not.toContain('Archiviato');
    });
});

// ─── show_class ────────────────────────────────────────────────────────────────

describe('routeIntent — show_class', () => {
    it('returns setup guidance when no classes exist', async () => {
        const result = await routeIntent(makeIntent({ action: 'show_class', params: {} }));
        expect(result.ok).toBe(true);
        expect(result.message).toMatch(/nessuna|crea/i);
    });

    it('shows class names with student counts', async () => {
        useStudentStore.getState().actions.saveStudent({ id: 's1', nome: 'A', cognome: 'B', classe: '2B' });
        useStudentStore.getState().actions.saveStudent({ id: 's2', nome: 'C', cognome: 'D', classe: '2B' });
        useStudentStore.getState().actions.saveStudent({ id: 's3', nome: 'E', cognome: 'F', classe: '4A' });

        const result = await routeIntent(makeIntent({ action: 'show_class', params: {} }));
        expect(result.ok).toBe(true);
        expect(result.message).toContain('2B');
        expect(result.message).toContain('4A');
        expect(result.message).toContain('2 studenti');
        expect(result.message).toContain('1 studenti');
    });
});

// ─── import_students ──────────────────────────────────────────────────────────

describe('routeIntent — import_students', () => {
    it('returns requiresApp with guidance', async () => {
        const result = await routeIntent(makeIntent({ action: 'import_students', params: {} }));
        expect(result.ok).toBe(true);
        expect(result.requiresApp).toBe(true);
        expect(result.message).toMatch(/csv|excel|importa/i);
    });
});

// ─── drive_sync ────────────────────────────────────────────────────────────────

describe('routeIntent — drive_sync', () => {
    it('refuses sync when Drive is disconnected', async () => {
        const result = await routeIntent(makeIntent({ action: 'drive_sync', params: {} }));
        expect(result.ok).toBe(false);
        expect(result.requiresApp).toBe(true);
        expect(result.message).toMatch(/non è collegato|collega/i);
    });

    it('allows sync when Drive is connected', async () => {
        useIntegrationStore.getState().actions.setIntegrationStatus('google_drive', 'connected');

        const result = await routeIntent(makeIntent({ action: 'drive_sync', params: {} }));
        expect(result.ok).toBe(true);
        expect(result.eventType).toBe('drive_synced');

        // Restore
        useIntegrationStore.getState().actions.disconnectIntegration('google_drive');
    });
});

// ─── unknown intent ────────────────────────────────────────────────────────────

describe('routeIntent — unknown', () => {
    it('returns a helpful next-action suggestion', async () => {
        const result = await routeIntent(makeIntent({ action: 'unknown', params: {} }));
        expect(result.ok).toBe(false);
        expect(result.message.length).toBeGreaterThan(10);
        expect(result.requiresApp).toBe(false);
    });
});

// ─── show_next_step intent ─────────────────────────────────────────────────────

describe('routeIntent — show_next_step', () => {
    it('returns ok:true with a next-action message', async () => {
        const result = await routeIntent(makeIntent({ action: 'show_next_step', params: {} }));
        expect(result.ok).toBe(true);
        expect(result.message.length).toBeGreaterThan(10);
        expect(result.requiresApp).toBe(false);
    });

    it('message reflects current workspace state — no students → create class hint', async () => {
        const result = await routeIntent(makeIntent({ action: 'show_next_step', params: {} }));
        expect(result.message).toMatch(/aggiungi.*classe|crea.*classe|import/i);
    });

    it('message adapts when students exist but no UDA', async () => {
        useStudentStore.getState().actions.saveStudent({ id: 'ns1', nome: 'Mario', cognome: 'Rossi', classe: '2A' });
        const result = await routeIntent(makeIntent({ action: 'show_next_step', params: {} }));
        expect(result.message).toMatch(/uda|lezione|studenti/i);
    });
});

// ─── getNextActionSuggestion ──────────────────────────────────────────────────

describe('getNextActionSuggestion', () => {
    it('suggests creating a class when no students exist', () => {
        const msg = getNextActionSuggestion();
        expect(msg).toMatch(/aggiungi.*classe|crea.*classe|import/i);
    });

    it('suggests creating a UDA when students exist but no UDA', () => {
        useStudentStore.getState().actions.saveStudent({ id: 's1', nome: 'A', cognome: 'B', classe: '1A' });
        const msg = getNextActionSuggestion();
        expect(msg).toMatch(/uda|lezione/i);
    });

    it('suggests calendar events when students + UDA exist but no events', async () => {
        useStudentStore.getState().actions.saveStudent({ id: 's1', nome: 'A', cognome: 'B', classe: '1A' });
        useAcademicStore.getState().actions.setUda([{
            id: 'u1', title: 'Test UDA', classe: '1A', materia: 'Matematica',
            introduction: '', finalProduct: '', competencyIds: [], phases: [],
            evaluation: '', tools: '', startPos: 0, width: 1, color: '#fff', borderColor: '#000', textColor: '#000',
        }]);
        const msg = getNextActionSuggestion();
        expect(msg).toMatch(/lezione|event[io]|riunione/i);
    });
});

// ─── publishActionEvent ────────────────────────────────────────────────────────

describe('publishActionEvent', () => {
    it('does nothing when result.ok is false', () => {
        const before = useIntegrationStore.getState().events.length;
        publishActionEvent(
            makeIntent({ action: 'add_student', source: 'telegram' }),
            { ok: false, message: 'error', requiresApp: false }
        );
        expect(useIntegrationStore.getState().events.length).toBe(before);
    });

    it('does nothing when result has no eventType', () => {
        const before = useIntegrationStore.getState().events.length;
        publishActionEvent(
            makeIntent({ action: 'import_students', source: 'telegram' }),
            { ok: true, message: 'ok', requiresApp: true }
        );
        expect(useIntegrationStore.getState().events.length).toBe(before);
    });

    it('pushes a cross-surface event when ok and eventType are set', () => {
        const before = useIntegrationStore.getState().events.length;
        publishActionEvent(
            makeIntent({ action: 'create_class', source: 'telegram' }),
            { ok: true, message: 'ok', requiresApp: true, eventType: 'class_created', data: { className: '2B' } }
        );
        const events = useIntegrationStore.getState().events;
        expect(events.length).toBe(before + 1);
        expect(events[events.length - 1].type).toBe('class_created');
        expect(events[events.length - 1].source).toBe('telegram');
        expect(events[events.length - 1].payload).toEqual({ className: '2B' });
        expect(events[events.length - 1].acknowledged).toBe(false);
    });
});

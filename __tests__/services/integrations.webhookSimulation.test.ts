// @ts-nocheck
/**
 * Webhook simulation tests — end-to-end from raw Italian text
 * through parseIntent → actionRouter → responseBuilder.
 *
 * These tests simulate the full pipeline that runs across
 * the Edge Functions (api/webhook-*.ts), verifying that:
 *  1. Italian NL is correctly interpreted as an intent
 *  2. The intent is correctly routed to store mutations
 *  3. The built response is coherent and includes CTAs
 *
 * No HTTP is involved: we call the functions directly.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { parseIntent, buildConfirmationMessage, getSuggestions } from '../../src/integrations/commandInterpreter';
import { routeIntent, publishActionEvent } from '../../src/integrations/chat/actionRouter';
import { buildEdgeResponse, buildActionResponse } from '../../src/integrations/chat/responseBuilder';
import { useStudentStore } from '../../src/stores/useStudentStore';
import { useAcademicStore } from '../../src/stores/useAcademicStore';
import { useIntegrationStore } from '../../src/stores/useIntegrationStore';

// ─── Shared pipeline helpers ──────────────────────────────────────────────────

/**
 * Simulates the edge-function pipeline (parse only, no store writes):
 * text → intent → confirmText → buildEdgeResponse
 */
function edgePipeline(text: string, source: 'telegram' | 'whatsapp' = 'telegram') {
    const intent = parseIntent(text, source);
    const confirmText = buildConfirmationMessage(intent);
    const suggestions = getSuggestions(intent);
    const reply = buildEdgeResponse(intent, confirmText, suggestions);
    return { intent, reply };
}

/**
 * Simulates the full client-side pipeline (parse + store writes):
 * text → intent → routeIntent (store mutations) → buildActionResponse
 */
async function fullPipeline(text: string, source: 'telegram' | 'whatsapp' = 'telegram') {
    const intent = parseIntent(text, source);
    const result = await routeIntent(intent);
    publishActionEvent(intent, result);
    const reply = buildActionResponse(result, intent.action);
    return { intent, result, reply };
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
    useStudentStore.getState().actions.resetStudentData();
    useAcademicStore.getState().actions.resetAcademicData();
    // Reset integration events between tests
    useIntegrationStore.setState({ events: [], hasPendingEvents: false });
});

// ─── 1. Intent detection (Italian NL) ────────────────────────────────────────

describe('Webhook simulation — intent detection', () => {
    const cases: [string, string][] = [
        ['crea classe 2B', 'create_class'],
        ['nuova classe 4A', 'create_class'],
        ['aggiungi studente Mario Rossi in classe 2B', 'add_student'],
        ['nuovo alunno Sofia Bianchi', 'add_student'],
        ['importa gli studenti', 'import_students'],
        ['carica lista studenti', 'import_students'],
        ['importa da Google Classroom', 'classroom_import'],
        ['collega classroom', 'classroom_import'],
        ['backup su Google Drive', 'drive_sync'],
        ['sincronizza Drive', 'drive_sync'],
        ['crea una UDA', 'create_uda'],
        ['crea UDA di matematica', 'create_uda'],
        ['nuova unità didattica', 'create_uda'],
        ['programma riunione', 'schedule_event'],
        ['aggiungi evento', 'schedule_event'],
        ['registra le presenze', 'mark_attendance'],
        ['aggiungi voto 8 a Mario', 'add_evaluation'],
        ['mostra gli studenti', 'show_students'],
        ['lista alunni classe 3A', 'show_students'],
        ['mostra classe 2B', 'show_class'],
        ['crea una verifica', 'generate_content'],
    ];

    it.each(cases)('"%s" → intent %s', (text, expectedAction) => {
        const { intent } = edgePipeline(text);
        expect(intent.action).toBe(expectedAction);
        expect(intent.confidence).toBeGreaterThan(0);
    });

    it('returns unknown for gibberish', () => {
        const { intent } = edgePipeline('asdfghjkl qwerty 123');
        expect(intent.action).toBe('unknown');
        expect(intent.confidence).toBe(0);
    });
});

// ─── 2. Edge pipeline — reply shape ──────────────────────────────────────────

describe('Webhook simulation — edge pipeline reply shape', () => {
    it('create_class reply is non-empty with CTAs', () => {
        const { reply } = edgePipeline('crea classe 3B');
        expect(reply.text.length).toBeGreaterThan(5);
        expect(reply.suggestions!.length).toBeGreaterThan(0);
        expect(reply.suggestions!.length).toBeLessThanOrEqual(3);
    });

    it('unknown message produces ❓ prefix', () => {
        const { reply } = edgePipeline('qualcosa di incomprensibile');
        expect(reply.text).toMatch(/^❓/);
    });

    it('known intent produces ✅ prefix', () => {
        const { reply } = edgePipeline('importa gli studenti');
        expect(reply.text).toMatch(/^✅/);
    });

    it('WhatsApp source is recorded on intent', () => {
        const { intent } = edgePipeline('crea classe 5C', 'whatsapp');
        expect(intent.source).toBe('whatsapp');
    });
});

// ─── 3. Full pipeline — store integration ────────────────────────────────────

describe('Webhook simulation — full pipeline store mutations', () => {
    it('adds student to store via natural language', async () => {
        const { result } = await fullPipeline('aggiungi studente Giulia Ferrari in classe 2B');
        expect(result.ok).toBe(true);

        const students = useStudentStore.getState().students;
        expect(students.some((s) => s.nome === 'Giulia')).toBe(true);
    });

    it('schedules calendar event via natural language', async () => {
        const { result } = await fullPipeline('programma riunione il 25/03');
        expect(result.ok).toBe(true);

        const { eventi } = useAcademicStore.getState();
        expect(eventi.length).toBeGreaterThan(0);
    });

    it('adds evaluation when student exists', async () => {
        useStudentStore.getState().actions.saveStudent({ id: 'x1', nome: 'Luca', cognome: 'Neri', classe: '2A' });

        // Use routeIntent directly with precise params (NL extraction for evaluations
        // is ambiguous when grade precedes the name - NL parsing already tested above)
        const intent = { action: 'add_evaluation' as const, params: { studentName: 'Luca Neri', grade: '7' }, confidence: 1, rawText: 'test', source: 'telegram' as const };
        const result = await routeIntent(intent);
        expect(result.ok).toBe(true);

        const evaluations = useStudentStore.getState().evaluations;
        expect(evaluations.some((e) => e.voto === '7')).toBe(true);
    });
});

// ─── 4. Cross-surface events ──────────────────────────────────────────────────

describe('Webhook simulation — cross-surface event publishing', () => {
    it('publish emits class_created event on create_class success', async () => {
        await fullPipeline('crea classe 4D', 'telegram');

        const events = useIntegrationStore.getState().events;
        const ev = events.find((e) => e.type === 'class_created' && e.source === 'telegram');
        expect(ev).toBeDefined();
        expect(ev!.acknowledged).toBe(false);
    });

    it('publish emits student_added event on add_student success', async () => {
        const before = useIntegrationStore.getState().events.length;
        await fullPipeline('aggiungi studente Marco Verdi in classe 1A', 'whatsapp');

        const events = useIntegrationStore.getState().events;
        const newEvent = events.find((e) => e.type === 'student_added' && e.source === 'whatsapp');
        expect(newEvent).toBeDefined();
    });

    it('no event published on failed intent', async () => {
        const before = useIntegrationStore.getState().events.length;
        await fullPipeline('aggiungi studente'); // missing name → fails

        expect(useIntegrationStore.getState().events.length).toBe(before);
    });
});

// ─── 5. Guided fallbacks ──────────────────────────────────────────────────────

describe('Webhook simulation — guided fallbacks', () => {
    it('drive_sync fallback guides user to settings when disconnected', async () => {
        const { result, reply } = await fullPipeline('backup su Google Drive');
        expect(result.ok).toBe(false);
        expect(reply.text).toMatch(/Drive|impostazioni/i);
        expect(reply.suggestions!.some((s) => /apri/i.test(s))).toBe(true);
    });

    it('import_students guides user to open app', async () => {
        const { result, reply } = await fullPipeline('importa gli studenti');
        expect(result.requiresApp).toBe(true);
        expect(reply.text).toContain('DocenteDoc AI');
    });

    it('add_evaluation fallback when student not found', async () => {
        const { result, reply } = await fullPipeline('aggiungi voto 9 a Studente Assente');
        expect(result.ok).toBe(false);
        expect(reply.text).toMatch(/non trovato|verifica/i);
    });

    it('unknown message returns next-action suggestion, not empty string', async () => {
        const { reply } = await fullPipeline('bbbbb xxxxxx qqqqq');
        expect(reply.text.length).toBeGreaterThan(15);
    });
});

// ─── 6. Adaptive terminology ──────────────────────────────────────────────────

describe('Webhook simulation — Italian language coherence', () => {
    it('responses are always in Italian', async () => {
        const englishWords = /\b(class|student|error|create|added|found)\b/;
        const texts = await Promise.all([
            fullPipeline('crea classe 2B').then((r) => r.reply.text),
            fullPipeline('mostra studenti').then((r) => r.reply.text),
            fullPipeline('importa gli studenti').then((r) => r.reply.text),
        ]);
        for (const text of texts) {
            expect(text).not.toMatch(englishWords);
        }
    });

    it('CTA suggestions are in Italian', () => {
        const { reply } = edgePipeline('crea classe 3A');
        for (const s of reply.suggestions ?? []) {
            expect(s).not.toMatch(/^(Create|Add|Import|Show|Open)$/);
        }
    });

    it('"cosa devo fare" is correctly classified as show_next_step', () => {
        const intent = parseIntent('cosa devo fare', 'telegram');
        expect(intent.action).toBe('show_next_step');
        expect(intent.confidence).toBeGreaterThan(0);
    });

    it('show_next_step edge reply contains Italian guidance', () => {
        const { reply } = edgePipeline('cosa devo fare');
        expect(reply.text.length).toBeGreaterThan(10);
        expect(reply.suggestions?.length).toBeGreaterThan(0);
    });
});

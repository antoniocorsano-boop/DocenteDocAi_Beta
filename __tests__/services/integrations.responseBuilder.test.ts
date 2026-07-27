// @ts-nocheck
/**
 * Tests for src/integrations/chat/responseBuilder.ts
 *
 * Tutti pure-function: nessuna dipendenza da store o browser.
 */

import { describe, it, expect } from 'vitest';
import {
    buildEdgeResponse,
    buildActionResponse,
    buildResponse,
    responseToPlainText,
} from '../../src/integrations/chat/responseBuilder';
import type { ParsedIntent } from '../../src/types/integration.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeIntent(overrides: Partial<ParsedIntent>): ParsedIntent {
    return {
        action: 'unknown',
        params: {},
        confidence: 1,
        rawText: 'test',
        source: 'telegram',
        ...overrides,
    };
}

// ─── buildEdgeResponse ────────────────────────────────────────────────────────

describe('buildEdgeResponse', () => {
    it('prefixes ✅ for known intents', () => {
        const intent = makeIntent({ action: 'create_class' });
        const result = buildEdgeResponse(intent, 'Creo la classe 2B.', ['Aggiungi studenti']);
        expect(result.text).toMatch(/^✅/);
        expect(result.text).toContain('Creo la classe 2B.');
    });

    it('prefixes ❓ for unknown intent', () => {
        const intent = makeIntent({ action: 'unknown' });
        const result = buildEdgeResponse(intent, 'Non ho capito.', []);
        expect(result.text).toMatch(/^❓/);
    });

    it('uses provided suggestions when non-empty', () => {
        const intent = makeIntent({ action: 'add_student' });
        const suggestions = ['Opzione 1', 'Opzione 2'];
        const result = buildEdgeResponse(intent, 'Studente aggiunto.', suggestions);
        expect(result.suggestions).toEqual(['Opzione 1', 'Opzione 2']);
    });

    it('falls back to default CTAs when suggestions are empty', () => {
        const intent = makeIntent({ action: 'create_class' });
        const result = buildEdgeResponse(intent, 'Classe creata.', []);
        expect(result.suggestions).toBeDefined();
        expect(result.suggestions!.length).toBeGreaterThan(0);
        expect(result.suggestions!.length).toBeLessThanOrEqual(3);
    });

    it('caps suggestions to 3', () => {
        const intent = makeIntent({ action: 'create_class' });
        const result = buildEdgeResponse(intent, 'ok', ['A', 'B', 'C', 'D', 'E']);
        expect(result.suggestions!.length).toBeLessThanOrEqual(3);
    });

    it('returns default CTAs for unknown action', () => {
        const intent = makeIntent({ action: 'unknown' });
        const result = buildEdgeResponse(intent, 'Non ho capito.', []);
        expect(result.suggestions).toBeDefined();
        expect(result.suggestions!.length).toBeGreaterThan(0);
    });
});

// ─── buildActionResponse ──────────────────────────────────────────────────────

describe('buildActionResponse', () => {
    it('uses ✅ prefix on success', () => {
        const result = buildActionResponse({ ok: true, message: 'Fatto!', requiresApp: false }, 'add_student');
        expect(result.text).toMatch(/^✅/);
    });

    it('uses ⚠️ prefix on failure', () => {
        const result = buildActionResponse({ ok: false, message: 'Errore.', requiresApp: false }, 'add_student');
        expect(result.text).toMatch(/^⚠️/);
    });

    it('appends app link when requiresApp is true', () => {
        const result = buildActionResponse({ ok: true, message: 'Apri per completare.', requiresApp: true }, 'create_uda');
        expect(result.text).toContain('DocenteDoc AI');
        expect(result.suggestions![0]).toMatch(/apri/i);
    });

    it('does not include app link when requiresApp is false', () => {
        const result = buildActionResponse({ ok: true, message: 'Fatto!', requiresApp: false }, 'show_students');
        expect(result.text).not.toContain('DocenteDoc AI');
        // First suggestion should NOT be "Apri DocenteDoc AI"
        expect(result.suggestions![0]).not.toMatch(/^Apri DocenteDoc AI$/);
    });

    it('uses default CTAs for known actions', () => {
        const result = buildActionResponse({ ok: true, message: 'ok', requiresApp: false }, 'show_class');
        expect(result.suggestions!.length).toBeGreaterThan(0);
        expect(result.suggestions!.length).toBeLessThanOrEqual(3);
    });

    it('uses default CTAs for unknown actions', () => {
        const result = buildActionResponse({ ok: false, message: 'nope', requiresApp: false }, 'nonexistent_action');
        expect(result.suggestions!.length).toBeGreaterThan(0);
    });
});

// ─── buildResponse ────────────────────────────────────────────────────────────

describe('buildResponse', () => {
    it('includes the base message', () => {
        const result = buildResponse('Testo base');
        expect(result.text).toContain('Testo base');
    });

    it('includes default CTAs in text', () => {
        const result = buildResponse('Testo base');
        expect(result.text).toContain('Cosa devo fare');
    });

    it('includes custom CTAs when provided', () => {
        const result = buildResponse('Testo', ['Opzione A', 'Opzione B']);
        expect(result.text).toContain('Opzione A');
        expect(result.suggestions).toContain('Opzione A');
    });

    it('caps suggestions to 3', () => {
        const result = buildResponse('Testo', ['A', 'B', 'C', 'D']);
        expect(result.suggestions!.length).toBeLessThanOrEqual(3);
    });
});

// ─── responseToPlainText ──────────────────────────────────────────────────────

describe('responseToPlainText', () => {
    it('returns text as-is when no suggestions', () => {
        const plain = responseToPlainText({ text: 'Messaggio.' });
        expect(plain).toBe('Messaggio.');
    });

    it('appends suggestions as bullet list', () => {
        const plain = responseToPlainText({ text: 'Testo.', suggestions: ['A', 'B'] });
        expect(plain).toContain('Testo.');
        expect(plain).toContain('• A');
        expect(plain).toContain('• B');
    });

    it('handles empty suggestions array', () => {
        const plain = responseToPlainText({ text: 'Solo testo.', suggestions: [] });
        expect(plain).toBe('Solo testo.');
    });
});

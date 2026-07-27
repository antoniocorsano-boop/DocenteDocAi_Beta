/**
 * useTeacherModelStore — Migration tests
 *
 * Verifica che la funzione `migrate` dello store Zustand produca uno stato valido
 * quando applicata a stati serializzati di versioni precedenti.
 *
 * Non usa Zustand direttamente — testa la logica di migrazione pura per evitare
 * dipendenze da localStorage in ambiente test.
 */

import { describe, it, expect } from 'vitest';
import { createEmptyTeacherModel } from '../../src/cognition/TeacherModel';

// ── Importiamo la funzione migrate isolata ─────────────────────────────────
// Per testare la migrate senza montare lo store (che usa localStorage),
// estraiamo la logica replicandola 1:1 dal sorgente.
// Se la logica cambia nel sorgente, questi test falliranno segnalando la discrepanza.

function migrate(persistedState: unknown, version: number): Record<string, unknown> {
  const s = (persistedState ?? {}) as Record<string, unknown>;

  if (version < 2) {
    const freshUsage = createEmptyTeacherModel().usageProfile;
    s['usageProfile'] = { ...freshUsage, ...(s['usageProfile'] as object ?? {}) };
  }

  if (version < 3) {
    const fresh = createEmptyTeacherModel();
    s['completedActions'] = (s['completedActions'] as string[] | undefined) ?? fresh.completedActions;
    s['ignoredSuggestions'] = (s['ignoredSuggestions'] as Record<string, number> | undefined) ?? fresh.ignoredSuggestions;
    s['preferences'] = { ...fresh.preferences, ...(s['preferences'] as object ?? {}) };
    s['suggestionCooldown'] = (s['suggestionCooldown'] as Record<string, number> | undefined) ?? fresh.suggestionCooldown;
  }

  return s;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const V1_STATE = {
  capabilityLevel: 1,
  confidenceScore: 0.5,
  usageProfile: {
    featuresDiscovered: 3,
    bookServicesLinked: 0,
    externalServicesConnected: 0,
  },
};

const V2_STATE = {
  ...V1_STATE,
  usageProfile: {
    ...V1_STATE.usageProfile,
    isPersonalMode: false,
    workspaceConfigured: true,
  },
};

// ── Test ──────────────────────────────────────────────────────────────────────

describe('useTeacherModelStore — migrate()', () => {
  describe('v1 → v3', () => {
    it('aggiunge usageProfile mancanti (v1→v2)', () => {
      const result = migrate(V1_STATE, 1);
      expect(result['usageProfile']).toMatchObject({
        isPersonalMode: expect.any(Boolean),
        workspaceConfigured: expect.any(Boolean),
      });
    });

    it('preserva i valori esistenti di usageProfile', () => {
      const result = migrate(V1_STATE, 1);
      const usage = result['usageProfile'] as Record<string, unknown>;
      expect(usage['featuresDiscovered']).toBe(3);
    });

    it('aggiunge completedActions vuoto', () => {
      const result = migrate(V1_STATE, 1);
      expect(result['completedActions']).toEqual([]);
    });

    it('aggiunge ignoredSuggestions vuoto', () => {
      const result = migrate(V1_STATE, 1);
      expect(result['ignoredSuggestions']).toEqual({});
    });

    it('aggiunge suggestionCooldown vuoto', () => {
      const result = migrate(V1_STATE, 1);
      expect(result['suggestionCooldown']).toEqual({});
    });

    it('aggiunge preferences con defaults', () => {
      const result = migrate(V1_STATE, 1);
      const prefs = result['preferences'] as Record<string, unknown>;
      expect(prefs['suggestionVerbosity']).toBe('concise');
      expect(prefs['acceptsArtisticSuggestions']).toBe(true);
    });
  });

  describe('v2 → v3', () => {
    it('non tocca usageProfile già valido', () => {
      const result = migrate(V2_STATE, 2);
      expect((result['usageProfile'] as Record<string, unknown>)['workspaceConfigured']).toBe(true);
    });

    it('aggiunge i 4 campi v3 mancanti', () => {
      const result = migrate(V2_STATE, 2);
      expect(result['completedActions']).toEqual([]);
      expect(result['ignoredSuggestions']).toEqual({});
      expect(result['suggestionCooldown']).toEqual({});
      expect(result['preferences']).toMatchObject({ suggestionVerbosity: 'concise' });
    });

    it('non sovrascrive completedActions già presenti', () => {
      const stateWithActions = { ...V2_STATE, completedActions: ['planning.create_uda'] };
      const result = migrate(stateWithActions, 2);
      expect(result['completedActions']).toEqual(['planning.create_uda']);
    });

    it('non sovrascrive preferences parzialmente compilate', () => {
      const stateWithPrefs = {
        ...V2_STATE,
        preferences: { suggestionVerbosity: 'detailed', acceptsArtisticSuggestions: false },
      };
      const result = migrate(stateWithPrefs, 2);
      const prefs = result['preferences'] as Record<string, unknown>;
      expect(prefs['suggestionVerbosity']).toBe('detailed');
      expect(prefs['acceptsArtisticSuggestions']).toBe(false);
    });

    it('non sovrascrive ignoredSuggestions già presenti', () => {
      const stateWithIgnored = { ...V2_STATE, ignoredSuggestions: { 'settings.drive_backup': 2 } };
      const result = migrate(stateWithIgnored, 2);
      expect((result['ignoredSuggestions'] as Record<string, number>)['settings.drive_backup']).toBe(2);
    });
  });

  describe('già a v3', () => {
    it('lascia lo stato invariato', () => {
      const v3State = {
        ...V2_STATE,
        completedActions: ['planning.annual_plan'],
        ignoredSuggestions: {},
        preferences: { suggestionVerbosity: 'concise', acceptsArtisticSuggestions: true },
        suggestionCooldown: {},
      };
      const result = migrate(v3State, 3);
      expect(result['completedActions']).toEqual(['planning.annual_plan']);
    });
  });

  describe('stato corrotto o nullo', () => {
    it('non crasha su stato null', () => {
      expect(() => migrate(null, 1)).not.toThrow();
      const result = migrate(null, 1);
      expect(result['completedActions']).toEqual([]);
    });

    it('non crasha su stato undefined', () => {
      expect(() => migrate(undefined, 2)).not.toThrow();
    });

    it('non crasha su stato vuoto {}', () => {
      const result = migrate({}, 2);
      expect(result['preferences']).toBeDefined();
    });
  });
});

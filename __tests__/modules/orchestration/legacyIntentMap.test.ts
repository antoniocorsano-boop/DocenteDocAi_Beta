/**
 * __tests__/modules/orchestration/legacyIntentMap.test.ts — Sprint D
 *
 * Unit tests for legacyIntentMap.ts (Sprint B — Legacy Intent Extraction).
 *
 * All functions under test are pure — no mocks, no React, no stores.
 *
 * Contracts verified:
 *   1.  matchLegacyIntent() returns null for empty / very short input
 *   2.  matchLegacyIntent() matches each registered intent by its keywords
 *   3.  matchLegacyIntent() returns null when no keyword matches
 *   4.  Highest keyword-count intent wins when multiple match
 *   5.  executionPrompt() is a non-empty string for every intent
 *   6.  All intents have confidence in the [0, 1] range
 *   7.  All intents have non-empty steps arrays
 *   8.  All steps have non-empty id and label
 *
 * PlanEngine integration:
 *   9.  buildPlan() returns a legacy-sourced Plan for "crea uda" input
 *   10. buildPlan() intentLabel matches the legacy intent's intentLabel
 *   11. buildPlan() falls through to generic rules when no legacy intent matches
 */

import { describe, it, expect } from 'vitest';
import {
  matchLegacyIntent,
  LEGACY_INTENTS,
} from '../../../src/modules/orchestration/legacyIntentMap';
import { buildPlan } from '../../../src/modules/orbit/PlanEngine';

// ── Contract 1-3: matchLegacyIntent basic ─────────────────────────────────────

describe('matchLegacyIntent — null cases', () => {
  it('returns null for empty string', () => {
    expect(matchLegacyIntent('')).toBeNull();
  });

  it('returns null for whitespace-only input', () => {
    expect(matchLegacyIntent('   ')).toBeNull();
  });

  it('returns null when no keyword matches', () => {
    expect(matchLegacyIntent('qualcosa di completamente generico')).toBeNull();
  });

  it('returns null for trivially short input with no keywords', () => {
    expect(matchLegacyIntent('ciao')).toBeNull();
  });
});

// ── Contract 2: each intent is reachable via its own keywords ─────────────────

describe('matchLegacyIntent — keyword routing', () => {
  it('matches create_uda via "crea uda"', () => {
    const result = matchLegacyIntent('crea uda sulla seconda guerra mondiale');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('create_uda');
  });

  it('matches create_uda via "unità di apprendimento"', () => {
    const result = matchLegacyIntent('prepara una unità di apprendimento su matematica');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('create_uda');
  });

  it('matches add_student via "aggiungi alunno"', () => {
    const result = matchLegacyIntent('aggiungi alunno Marco Rossi nella classe 3A');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('add_student');
  });

  it('matches add_student via "nuovo studente"', () => {
    const result = matchLegacyIntent('ho un nuovo studente da inserire nel registro');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('add_student');
  });

  it('matches fill_register via "compila registro"', () => {
    const result = matchLegacyIntent('compila registro di classe per oggi');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('fill_register');
  });

  it('matches fill_register via "registro presenze"', () => {
    const result = matchLegacyIntent('apri il registro presenze della 2B');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('fill_register');
  });

  it('matches annual_planning via "programmazione annuale"', () => {
    const result = matchLegacyIntent('crea una programmazione annuale per italiano');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('annual_planning');
  });

  it('matches annual_planning via "piano annuale"', () => {
    const result = matchLegacyIntent('vorrei un piano annuale per la classe 4C');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('annual_planning');
  });

  it('matches manage_resources via "materiali didattici"', () => {
    const result = matchLegacyIntent('organizza i materiali didattici per questa settimana');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('manage_resources');
  });

  it('matches lesson_plan_legacy via "prepara lezione"', () => {
    const result = matchLegacyIntent('prepara lezione su frazioni per domani');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('lesson_plan_legacy');
  });

  it('matches lesson_plan_legacy via "crea lezione"', () => {
    const result = matchLegacyIntent('crea lezione interattiva per la 1A');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('lesson_plan_legacy');
  });
});

// ── Contract 4: highest score wins ───────────────────────────────────────────

describe('matchLegacyIntent — score tiebreak', () => {
  it('returns the intent with the most keyword matches', () => {
    // "crea uda" matches create_uda twice (crea+uda both in keywords);
    // lesson_plan_legacy only matches "crea" once
    const result = matchLegacyIntent('crea uda completa per quest\'anno');
    expect(result!.id).toBe('create_uda');
  });
});

// ── Contract 5-8: intent structural validation ────────────────────────────────

describe('LEGACY_INTENTS — structural integrity', () => {
  it('every intent has a non-empty title', () => {
    for (const intent of LEGACY_INTENTS) {
      expect(intent.title.trim().length).toBeGreaterThan(0);
    }
  });

  it('every intent has confidence in [0, 1]', () => {
    for (const intent of LEGACY_INTENTS) {
      expect(intent.confidence).toBeGreaterThanOrEqual(0);
      expect(intent.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('every intent has at least one step', () => {
    for (const intent of LEGACY_INTENTS) {
      expect(intent.steps.length).toBeGreaterThan(0);
    }
  });

  it('every step has a non-empty id and label', () => {
    for (const intent of LEGACY_INTENTS) {
      for (const step of intent.steps) {
        expect(step.id.trim().length).toBeGreaterThan(0);
        expect(step.label.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('every intent produces a non-empty executionPrompt', () => {
    for (const intent of LEGACY_INTENTS) {
      const prompt = intent.executionPrompt('test input per verifica prompt');
      expect(typeof prompt).toBe('string');
      expect(prompt.trim().length).toBeGreaterThan(0);
    }
  });

  it('every intent has at least one keyword', () => {
    for (const intent of LEGACY_INTENTS) {
      expect(intent.keywords.length).toBeGreaterThan(0);
    }
  });

  it('all intent IDs are unique', () => {
    const ids = LEGACY_INTENTS.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── Contracts 9-11: PlanEngine integration ────────────────────────────────────

describe('buildPlan — legacy intent integration', () => {
  it('[9] returns a Plan for "crea uda sulla fotosintesi"', () => {
    const plan = buildPlan('crea uda sulla fotosintesi clorofilliana');
    expect(plan).not.toBeNull();
    expect(plan!.title).toBe('Creazione UDA');
  });

  it('[10] intentLabel matches the legacy intent label', () => {
    const plan = buildPlan('crea uda sulla fotosintesi clorofilliana');
    expect(plan!.intentLabel).toBe('UDA');
  });

  it('[10] confidence matches the legacy intent confidence', () => {
    const plan = buildPlan('crea uda sulla fotosintesi clorofilliana');
    expect(plan!.confidence).toBe(0.88);
  });

  it('[10] steps come from the legacy intent definition', () => {
    const plan = buildPlan('crea uda sulla fotosintesi clorofilliana');
    const ids = plan!.steps.map(s => s.id);
    expect(ids).toContain('setup');
    expect(ids).toContain('objectives');
  });

  it('[10] executionPrompt contains the TASK prefix', () => {
    const plan = buildPlan('crea uda sulla fotosintesi clorofilliana');
    expect(plan!.executionPrompt).toContain('[TASK:');
  });

  it('[11] falls through to generic rules for non-legacy input', () => {
    // "crea una verifica" does NOT match any legacy keyword exactly
    // but matches PlanEngine ASSESSMENT_KEYWORDS → title = 'Creazione verifica'
    const plan = buildPlan('crea una verifica sulle frazioni per la 3B');
    expect(plan).not.toBeNull();
    expect(plan!.title).toBe('Creazione verifica');
  });

  it('[11] returns null for input shorter than 15 chars', () => {
    expect(buildPlan('ciao')).toBeNull();
  });
});

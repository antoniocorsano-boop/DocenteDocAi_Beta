/**
 * __tests__/modules/orbit/worldRegistry.test.ts — Sprint D
 *
 * Unit tests for worldRegistry.ts and worldTypes.ts (Sprint C — Mondi Orbitanti).
 *
 * All functions under test are pure / sync — no mocks, no React, no stores.
 *
 * Contracts verified:
 *   1.  worldRegistry.list() includes all default worlds after module load
 *   2.  worldRegistry.resolve() returns correct WorldConfig for known IDs
 *   3.  worldRegistry.resolve() returns undefined for unknown IDs
 *   4.  worldRegistry.has() returns true only for registered IDs
 *   5.  worldRegistry.listExcept() excludes the given ID
 *   6.  worldRegistry.register() silently overwrites on duplicate ID
 *   7.  All default worlds have non-empty required fields
 *   8.  All default worlds have at least one keyword
 *   9.  All default world domains are valid DomainIntent values
 *   10. worldRegistry.list() returns a defensive copy (mutation-safe)
 */

import { describe, it, expect, afterEach } from 'vitest';
import { worldRegistry } from '../../../src/modules/orbit/worldRegistry';
import type { DomainIntent } from '../../../src/modules/orbit/DomainIntentEngine';

const VALID_DOMAIN_INTENTS: DomainIntent[] = [
  'assessment_creation',
  'lesson_planning',
  'document_analysis',
  'student_evaluation',
  'content_generation',
  'generic_request',
];

// ── Contract 1: default worlds are registered ─────────────────────────────────

describe('worldRegistry — default worlds', () => {
  it('[1] includes didattica', () => {
    expect(worldRegistry.has('didattica')).toBe(true);
  });

  it('[1] includes cultura', () => {
    expect(worldRegistry.has('cultura')).toBe(true);
  });

  it('[1] includes benessere', () => {
    expect(worldRegistry.has('benessere')).toBe(true);
  });

  it('[1] list() returns at least 3 worlds', () => {
    expect(worldRegistry.list().length).toBeGreaterThanOrEqual(3);
  });
});

// ── Contract 2-3: resolve ─────────────────────────────────────────────────────

describe('worldRegistry — resolve', () => {
  it('[2] resolves didattica with correct label', () => {
    const w = worldRegistry.resolve('didattica');
    expect(w).toBeDefined();
    expect(w!.label).toBe('Didattica');
  });

  it('[2] resolves cultura with correct icon', () => {
    const w = worldRegistry.resolve('cultura');
    expect(w).toBeDefined();
    expect(w!.icon).toBe('menu_book');
  });

  it('[3] returns undefined for unknown world', () => {
    expect(worldRegistry.resolve('nonexistent_world_xyz')).toBeUndefined();
  });
});

// ── Contract 4: has ───────────────────────────────────────────────────────────

describe('worldRegistry — has', () => {
  it('[4] returns true for registered world', () => {
    expect(worldRegistry.has('benessere')).toBe(true);
  });

  it('[4] returns false for unregistered world', () => {
    expect(worldRegistry.has('mondo_inesistente')).toBe(false);
  });
});

// ── Contract 5: listExcept ────────────────────────────────────────────────────

describe('worldRegistry — listExcept', () => {
  it('[5] excludes the specified world', () => {
    const worlds = worldRegistry.listExcept('didattica');
    expect(worlds.find(w => w.id === 'didattica')).toBeUndefined();
  });

  it('[5] includes all other registered worlds', () => {
    const worlds = worldRegistry.listExcept('didattica');
    expect(worlds.find(w => w.id === 'cultura')).toBeDefined();
    expect(worlds.find(w => w.id === 'benessere')).toBeDefined();
  });

  it('[5] returns all worlds when given unknown id', () => {
    const all = worldRegistry.list().length;
    const except = worldRegistry.listExcept('notregistered').length;
    expect(except).toBe(all);
  });
});

// ── Contract 6: overwrite ─────────────────────────────────────────────────────

describe('worldRegistry — register overwrite', () => {
  afterEach(() => {
    // Restore didattica to its original state after overwrite tests
    worldRegistry.register({
      id:       'didattica',
      label:    'Didattica',
      description: 'Pianificazione lezioni, UDA, verifiche e materiali scolastici',
      icon:     'school',
      domain:   'lesson_planning',
      keywords: ['lezione', 'uda'],
    });
  });

  it('[6] silently overwrites duplicate id', () => {
    worldRegistry.register({
      id:       'didattica',
      label:    'Didattica Overwritten',
      description: 'test',
      icon:     'school',
      domain:   'lesson_planning',
      keywords: ['test'],
    });
    expect(worldRegistry.resolve('didattica')!.label).toBe('Didattica Overwritten');
    // Still only one entry for this id
    const didatticaEntries = worldRegistry.list().filter(w => w.id === 'didattica');
    expect(didatticaEntries.length).toBe(1);
  });
});

// ── Contract 7-9: structural integrity of default worlds ─────────────────────

describe('default worlds — structural integrity', () => {
  it('[7] every world has non-empty id, label, description, icon', () => {
    for (const w of worldRegistry.list()) {
      expect(w.id.trim().length).toBeGreaterThan(0);
      expect(w.label.trim().length).toBeGreaterThan(0);
      expect(w.description.trim().length).toBeGreaterThan(0);
      expect(w.icon.trim().length).toBeGreaterThan(0);
    }
  });

  it('[8] every world has at least one keyword', () => {
    for (const w of worldRegistry.list()) {
      expect(w.keywords.length).toBeGreaterThan(0);
    }
  });

  it('[9] every world domain is a valid DomainIntent', () => {
    for (const w of worldRegistry.list()) {
      expect(VALID_DOMAIN_INTENTS).toContain(w.domain);
    }
  });
});

// ── Contract 10: defensive copy ───────────────────────────────────────────────

describe('worldRegistry — defensive copy', () => {
  it('[10] mutating the returned list does not affect internal state', () => {
    const list1 = worldRegistry.list();
    const countBefore = list1.length;
    list1.push({ id: 'fake', label: 'Fake', description: '', icon: '', domain: 'generic_request', keywords: [] });
    const list2 = worldRegistry.list();
    expect(list2.length).toBe(countBefore);
  });
});

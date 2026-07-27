// @ts-nocheck
/**
 * __tests__/stores/useWorldStore.test.ts
 *
 * Unit tests for src/stores/useWorldStore.ts (Fase 6 — Mondi Orbitanti)
 *
 * Coverage:
 *   - Initial state: activeWorldId = 'didattica', visitedWorldIds = ['didattica']
 *   - setActiveWorld — switches world, appends to visitedWorldIds
 *   - setActiveWorld — no-op on visited list if world already visited
 *   - resetToDefault — returns activeWorldId to 'didattica', preserves visited history
 *   - Selectors: selectActiveWorldId, selectHasVisited
 *   - Structural contracts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  useWorldStore,
  selectActiveWorldId,
  selectHasVisited,
} from '../../src/stores/useWorldStore';

// ── Reset helper ──────────────────────────────────────────────────────────────

function resetStore() {
  useWorldStore.setState({ activeWorldId: 'didattica', visitedWorldIds: ['didattica'] });
}

// ── Initial state ─────────────────────────────────────────────────────────────

describe('useWorldStore — initial state', () => {
  beforeEach(resetStore);

  it('activeWorldId defaults to "didattica"', () => {
    expect(useWorldStore.getState().activeWorldId).toBe('didattica');
  });

  it('visitedWorldIds starts with ["didattica"]', () => {
    expect(useWorldStore.getState().visitedWorldIds).toEqual(['didattica']);
  });
});

// ── setActiveWorld ────────────────────────────────────────────────────────────

describe('useWorldStore — setActiveWorld', () => {
  beforeEach(resetStore);

  it('switches activeWorldId to the new world', () => {
    useWorldStore.getState().actions.setActiveWorld('cultura');
    expect(useWorldStore.getState().activeWorldId).toBe('cultura');
  });

  it('appends new world to visitedWorldIds', () => {
    useWorldStore.getState().actions.setActiveWorld('cultura');
    expect(useWorldStore.getState().visitedWorldIds).toContain('cultura');
  });

  it('preserves order: original worlds come first', () => {
    useWorldStore.getState().actions.setActiveWorld('cultura');
    useWorldStore.getState().actions.setActiveWorld('benessere');
    const ids = useWorldStore.getState().visitedWorldIds;
    expect(ids[0]).toBe('didattica');
    expect(ids[1]).toBe('cultura');
    expect(ids[2]).toBe('benessere');
  });

  it('does NOT duplicate a world already in visitedWorldIds', () => {
    useWorldStore.getState().actions.setActiveWorld('cultura');
    useWorldStore.getState().actions.setActiveWorld('cultura');
    const ids = useWorldStore.getState().visitedWorldIds;
    const count = ids.filter((id) => id === 'cultura').length;
    expect(count).toBe(1);
  });

  it('switching back to "didattica" does not duplicate it', () => {
    useWorldStore.getState().actions.setActiveWorld('cultura');
    useWorldStore.getState().actions.setActiveWorld('didattica');
    const ids = useWorldStore.getState().visitedWorldIds;
    const count = ids.filter((id) => id === 'didattica').length;
    expect(count).toBe(1);
  });

  it('can switch to a custom world ID not in defaults', () => {
    useWorldStore.getState().actions.setActiveWorld('scienze');
    expect(useWorldStore.getState().activeWorldId).toBe('scienze');
    expect(useWorldStore.getState().visitedWorldIds).toContain('scienze');
  });

  it('handles multiple sequential world switches', () => {
    useWorldStore.getState().actions.setActiveWorld('cultura');
    useWorldStore.getState().actions.setActiveWorld('benessere');
    useWorldStore.getState().actions.setActiveWorld('cultura');
    expect(useWorldStore.getState().activeWorldId).toBe('cultura');
    // visitedWorldIds still has 3 unique entries
    const ids = useWorldStore.getState().visitedWorldIds;
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── resetToDefault ────────────────────────────────────────────────────────────

describe('useWorldStore — resetToDefault', () => {
  beforeEach(resetStore);

  it('sets activeWorldId back to "didattica"', () => {
    useWorldStore.getState().actions.setActiveWorld('cultura');
    useWorldStore.getState().actions.resetToDefault();
    expect(useWorldStore.getState().activeWorldId).toBe('didattica');
  });

  it('preserves visitedWorldIds (cross-session learning signal)', () => {
    useWorldStore.getState().actions.setActiveWorld('cultura');
    useWorldStore.getState().actions.setActiveWorld('benessere');
    useWorldStore.getState().actions.resetToDefault();
    const ids = useWorldStore.getState().visitedWorldIds;
    expect(ids).toContain('cultura');
    expect(ids).toContain('benessere');
  });

  it('does not clear visitedWorldIds when already at default', () => {
    const before = useWorldStore.getState().visitedWorldIds.length;
    useWorldStore.getState().actions.resetToDefault();
    expect(useWorldStore.getState().visitedWorldIds.length).toBe(before);
  });
});

// ── selectActiveWorldId ────────────────────────────────────────────────────────

describe('selectActiveWorldId', () => {
  beforeEach(resetStore);

  it('returns the current activeWorldId', () => {
    expect(selectActiveWorldId(useWorldStore.getState())).toBe('didattica');
  });

  it('reflects updates after setActiveWorld', () => {
    useWorldStore.getState().actions.setActiveWorld('benessere');
    expect(selectActiveWorldId(useWorldStore.getState())).toBe('benessere');
  });
});

// ── selectHasVisited ───────────────────────────────────────────────────────────

describe('selectHasVisited', () => {
  beforeEach(resetStore);

  it('returns true for "didattica" (initial world)', () => {
    expect(selectHasVisited('didattica')(useWorldStore.getState())).toBe(true);
  });

  it('returns false for a world not yet visited', () => {
    expect(selectHasVisited('cultura')(useWorldStore.getState())).toBe(false);
  });

  it('returns true after visiting a world', () => {
    useWorldStore.getState().actions.setActiveWorld('cultura');
    expect(selectHasVisited('cultura')(useWorldStore.getState())).toBe(true);
  });

  it('returns false for an unknown world ID', () => {
    expect(selectHasVisited('nonexistent')(useWorldStore.getState())).toBe(false);
  });
});

// ── Structural contracts ───────────────────────────────────────────────────────

describe('useWorldStore structural contracts', () => {
  it('exports useWorldStore as a function', () => {
    expect(typeof useWorldStore).toBe('function');
  });

  it('exports selectActiveWorldId as a function', () => {
    expect(typeof selectActiveWorldId).toBe('function');
  });

  it('exports selectHasVisited as a function', () => {
    expect(typeof selectHasVisited).toBe('function');
  });

  it('actions object contains all expected actions', () => {
    const { actions } = useWorldStore.getState();
    const expected = ['setActiveWorld', 'resetToDefault'];
    expected.forEach((key) => {
      expect(typeof actions[key]).toBe('function');
    });
  });

  it('visitedWorldIds is always an array', () => {
    expect(Array.isArray(useWorldStore.getState().visitedWorldIds)).toBe(true);
  });

  it('visitedWorldIds has no duplicates in initial state', () => {
    const ids = useWorldStore.getState().visitedWorldIds;
    expect(new Set(ids).size).toBe(ids.length);
  });
});

/**
 * stores/useWorldStore.ts — Orbit World Store (Fase 6 — Mondi Orbitanti)
 *
 * Zustand persist store for the active Orbit world and visited worlds.
 * Persists to localStorage under key: 'orbit_worlds_v1'
 *
 * Design:
 *   - activeWorldId: current focused world — defaults to 'didattica'
 *   - visitedWorldIds: ordered list of worlds the user has entered this session
 *   - Actions nested under .actions (consistent with project store conventions)
 *   - Changing key 'orbit_worlds_v1' causes re-presentation to all users — increment with migration
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorldState {
  /** ID of the currently focused world */
  activeWorldId:   string;
  /** Ordered list of world IDs visited — first = oldest, last = most recent */
  visitedWorldIds: string[];

  actions: {
    /**
     * Set the active world.
     * Automatically appends to visitedWorldIds if not already present.
     */
    setActiveWorld: (id: string) => void;
    /**
     * Reset world state to defaults (e.g. on session clear).
     * Does NOT clear visited history — preserves cross-session learning signal.
     */
    resetToDefault: () => void;
  };
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useWorldStore = create<WorldState>()(
  persist(
    (set) => ({
      activeWorldId:   'didattica',
      visitedWorldIds: ['didattica'],

      actions: {
        setActiveWorld: (id) =>
          set((state) => ({
            activeWorldId:   id,
            visitedWorldIds: state.visitedWorldIds.includes(id)
              ? state.visitedWorldIds
              : [...state.visitedWorldIds, id],
          })),

        resetToDefault: () =>
          set((state) => ({
            activeWorldId:   'didattica',
            visitedWorldIds: state.visitedWorldIds, // preserve history
          })),
      },
    }),
    {
      name:    'orbit_worlds_v1',
      // Only persist data fields — not action functions
      partialize: (state) => ({
        activeWorldId:   state.activeWorldId,
        visitedWorldIds: state.visitedWorldIds,
      }),
    },
  ),
);

// ── Selectors ─────────────────────────────────────────────────────────────────

/** Returns the active world ID without subscribing to the full store. */
export const selectActiveWorldId = (state: WorldState): string =>
  state.activeWorldId;

/** Returns whether a given world has been visited. */
export const selectHasVisited = (id: string) =>
  (state: WorldState): boolean =>
    state.visitedWorldIds.includes(id);

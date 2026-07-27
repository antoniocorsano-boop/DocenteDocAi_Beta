/**
 * cognitiveLayer/cognitiveStore.ts
 *
 * Zustand persisted store per le CognitiveEntry del layer cognitivo.
 *
 * Persistenza: localStorage key 'cognitive-layer-storage'
 * Struttura: entries: CognitiveEntry[] (append-only by design)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CognitiveEntry, CognitiveDomain } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CognitiveState {
  entries: CognitiveEntry[];
}

interface CognitiveActions {
  addEntry(entry: CognitiveEntry): void;
  getByTenant(tenantId: string): CognitiveEntry[];
  getByDomain(domain: CognitiveDomain, tenantId?: string): CognitiveEntry[];
  listRecent(n: number, tenantId?: string): CognitiveEntry[];
  clearAll(): void;
}

type CognitiveStore = CognitiveState & CognitiveActions;

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCognitiveStore = create<CognitiveStore>()(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────────────────────
      entries: [],

      // ── Actions ────────────────────────────────────────────────────────────

      addEntry(entry) {
        set(state => ({ entries: [...state.entries, entry] }));
      },

      getByTenant(tenantId) {
        return get().entries.filter(e => e.tenantId === tenantId);
      },

      getByDomain(domain, tenantId) {
        return get().entries.filter(
          e => e.domain === domain && (!tenantId || e.tenantId === tenantId),
        );
      },

      listRecent(n, tenantId) {
        const all = tenantId
          ? get().entries.filter(e => e.tenantId === tenantId)
          : get().entries;
        return [...all].sort((a, b) => b.enteredAt - a.enteredAt).slice(0, n);
      },

      clearAll() {
        set({ entries: [] });
      },
    }),
    {
      name: 'cognitive-layer-storage',
    },
  ),
);

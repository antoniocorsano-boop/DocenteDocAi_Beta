/**
 * salesPackStore.ts
 *
 * Zustand store con persistenza localStorage per il Sales Pack System.
 *
 * Fase 1: localStorage (chiave "sales-pack-storage")
 * Fase 2 (predisposizione): struttura ready per API backend/Supabase
 *
 * Versioning: ogni tenant ha un contatore indipendente.
 * Il contatore è persisted su "sales-pack-versions".
 */

import { create }    from 'zustand';
import { persist }   from 'zustand/middleware';
import type { SalesPack, SalesPackMeta } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SalesPackState {
  /** Tutti i packs (caricati da localStorage al mount) */
  packs: SalesPack[];

  /** Aggiunge un pack e lo persiste */
  addPack: (pack: SalesPack) => void;

  /** Restituisce i metadati di tutti i packs ordinati per data desc */
  listMeta: () => SalesPackMeta[];

  /** Restituisce un pack completo per ID */
  getById: (id: string) => SalesPack | undefined;

  /** Restituisce i packs di un tenant ordinati per version asc */
  getByTenant: (tenantId: string) => SalesPack[];

  /** Cancella un pack per ID */
  removePack: (id: string) => void;

  /** Resetta tutto lo store (admin only) */
  clearAll: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSalesPackStore = create<SalesPackState>()(
  persist(
    (set, get) => ({
      packs: [],

      addPack: (pack) =>
        set(state => ({ packs: [...state.packs, pack] })),

      listMeta: () => {
        return [...get().packs]
          .sort((a, b) => b.createdAt - a.createdAt)
          .map(({ id, tenantId, createdAt, createdBy, version, complianceScore, complianceStatus, aiEnabled }) => ({
            id, tenantId, createdAt, createdBy, version, complianceScore, complianceStatus, aiEnabled,
          }));
      },

      getById: (id) => get().packs.find(p => p.id === id),

      getByTenant: (tenantId) =>
        get().packs
          .filter(p => p.tenantId === tenantId)
          .sort((a, b) => a.version - b.version),

      removePack: (id) =>
        set(state => ({ packs: state.packs.filter(p => p.id !== id) })),

      clearAll: () => set({ packs: [] }),
    }),
    {
      name:    'sales-pack-storage',
      version: 1,
      // Predisposizione per migrazione verso API backend (fase 2):
      // sostituire con un middleware custom che chiama fetch().
    },
  ),
);

// ─── Versioning helper ────────────────────────────────────────────────────────

const VERSION_STORAGE_KEY = 'sales-pack-versions';

/**
 * Restituisce il prossimo numero di versione per un tenant e lo incrementa.
 * Persistito su localStorage separato dai dati (più leggero).
 */
export function getNextVersion(tenantId: string): number {
  let counters: Record<string, number>;
  try {
    counters = JSON.parse(localStorage.getItem(VERSION_STORAGE_KEY) ?? '{}');
  } catch {
    counters = {};
  }
  const next = (counters[tenantId] ?? 0) + 1;
  counters[tenantId] = next;
  localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(counters));
  return next;
}

/**
 * Legge la versione corrente per un tenant senza incrementarla.
 */
export function getCurrentVersion(tenantId: string): number {
  try {
    const counters: Record<string, number> = JSON.parse(
      localStorage.getItem(VERSION_STORAGE_KEY) ?? '{}',
    );
    return counters[tenantId] ?? 0;
  } catch {
    return 0;
  }
}

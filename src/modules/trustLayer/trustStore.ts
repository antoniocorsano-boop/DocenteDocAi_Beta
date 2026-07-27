/**
 * trustLayer/trustStore.ts
 *
 * Zustand store persistente per la catena Trust Layer.
 *
 * - Ogni tenant ha la propria catena di record.
 * - I record sono immutabili una volta inseriti.
 * - Il store persiste su localStorage (chiave "trust-layer-storage").
 * - Predisposto per migrazione a backend (struttura API-ready).
 */

import { create }  from 'zustand';
import { persist } from 'zustand/middleware';
import type { TrustRecord, TrustRecordMeta } from './types';

// ─── State ────────────────────────────────────────────────────────────────────

interface TrustState {
  /** Tutti i record della catena (ordinati per timestamp asc alla scrittura) */
  records: TrustRecord[];

  /** Aggiunge un record immutabile alla catena */
  addRecord: (record: TrustRecord) => void;

  /** Restituisce i record di un tenant ordinati per timestamp asc */
  getByTenant: (tenantId: string) => TrustRecord[];

  /** Restituisce i metadati (view leggera per liste) */
  listMeta: (tenantId?: string) => TrustRecordMeta[];

  /** Restituisce l'ultimo record di un tenant (testa della catena) */
  getHead: (tenantId: string) => TrustRecord | undefined;

  /** Restituisce un record per ID */
  getById: (id: string) => TrustRecord | undefined;

  /** Reset completo (admin only / test) */
  clearAll: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useTrustStore = create<TrustState>()(
  persist(
    (set, get) => ({
      records: [],

      addRecord: (record) =>
        set(state => ({ records: [...state.records, record] })),

      getByTenant: (tenantId) =>
        get().records
          .filter(r => r.tenantId === tenantId)
          .sort((a, b) => a.timestamp - b.timestamp),

      listMeta: (tenantId?) =>
        get().records
          .filter(r => !tenantId || r.tenantId === tenantId)
          .sort((a, b) => b.timestamp - a.timestamp)
          .map(({ id, timestamp, eventType, tenantId: t, actorId, description, hash, prevHash }) => ({
            id, timestamp, eventType, tenantId: t, actorId, description, hash, prevHash,
          })),

      getHead: (tenantId) =>
        get()
          .getByTenant(tenantId)
          .at(-1),

      getById: (id) => get().records.find(r => r.id === id),

      clearAll: () => set({ records: [] }),
    }),
    {
      name:    'trust-layer-storage',
      version: 1,
    },
  ),
);

/**
 * capabilitySystem/capabilityStore.ts
 *
 * Zustand persisted store per lo stato delle capability per tenant.
 *
 * Persistenza: localStorage key 'capability-system-storage'
 *
 * Pattern: lo stato DEFAULT parte dal registro (capabilityRegistry).
 * Un unlock sovrascrive lo stato per quel tenant+capabilityId.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CapabilityRecord, CapabilityState, CapabilityTier } from './types';

// ─── Store types ──────────────────────────────────────────────────────────────

interface CapabilityStoreState {
  /** Overrides per-tenant: key = `${tenantId}:${capabilityId}` */
  overrides: Record<string, CapabilityRecord>;
}

interface CapabilityStoreActions {
  /**
   * Sblocca una capability per un tenant.
   * Sovrascrive eventuale override esistente.
   */
  unlock(
    tenantId: string,
    capabilityId: string,
    tier: CapabilityTier,
    unlockedBy: string,
  ): void;

  /**
   * Blocca una capability (stato → 'locked').
   * Non rimuove l'override, sostituisce lo stato.
   */
  lock(tenantId: string, capabilityId: string): void;

  /**
   * Legge lo stato override per uno specifico tenant + capability.
   * Restituisce null se non c'è override (bisogna usare il default del registry).
   */
  getOverride(tenantId: string, capabilityId: string): CapabilityRecord | null;

  /**
   * Restituisce tutti gli override per un tenant.
   */
  getByTenant(tenantId: string): CapabilityRecord[];

  clearAll(): void;
}

type CapabilityStore = CapabilityStoreState & CapabilityStoreActions;

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCapabilityStore = create<CapabilityStore>()(
  persist(
    (set, get) => ({
      overrides: {},

      unlock(tenantId, capabilityId, tier, unlockedBy) {
        const key = `${tenantId}:${capabilityId}`;
        const record: CapabilityRecord = {
          tenantId,
          capabilityId,
          state: 'active',
          tier,
          unlockedAt: Date.now(),
          unlockedBy,
        };
        set(state => ({ overrides: { ...state.overrides, [key]: record } }));
      },

      lock(tenantId, capabilityId) {
        const key = `${tenantId}:${capabilityId}`;
        const existing = get().overrides[key];
        if (!existing) return;
        set(state => ({
          overrides: {
            ...state.overrides,
            [key]: { ...existing, state: 'locked' as CapabilityState },
          },
        }));
      },

      getOverride(tenantId, capabilityId) {
        return get().overrides[`${tenantId}:${capabilityId}`] ?? null;
      },

      getByTenant(tenantId) {
        return Object.values(get().overrides).filter(r => r.tenantId === tenantId);
      },

      clearAll() {
        set({ overrides: {} });
      },
    }),
    {
      name: 'capability-system-storage',
    },
  ),
);

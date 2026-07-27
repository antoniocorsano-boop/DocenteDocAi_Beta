/**
 * capabilitySystem/capabilityService.ts
 *
 * API di business per il sistema di capability.
 *
 * Risolve lo stato effettivo combinando:
 *   1. Il registro statico (default)
 *   2. Gli override per-tenant dallo store
 *
 * Questo garantisce che una capability non presente nello store
 * usi comunque lo stato del registro come fallback.
 */

import { useCapabilityStore } from './capabilityStore';
import { getCapabilityById, ALL_CAPABILITIES } from './capabilityRegistry';
import type { Capability, CapabilityGate, CapabilityState, CapabilityTier } from './types';

// ─── Query helpers ────────────────────────────────────────────────────────────

/**
 * Risolve lo stato effettivo di una capability per un tenant,
 * applicando eventuali override dello store.
 */
function resolveState(tenantId: string, capabilityId: string): CapabilityState {
  const override = useCapabilityStore.getState().getOverride(tenantId, capabilityId);
  if (override) return override.state;
  const base = getCapabilityById(capabilityId);
  return base?.state ?? 'hidden';
}

/**
 * Verifica se una capability è abilitata per un tenant.
 *
 * @returns  CapabilityGate — { allowed, state, upgradeCta }
 */
export function checkCapability(tenantId: string, capabilityId: string): CapabilityGate {
  const state = resolveState(tenantId, capabilityId);
  const base = getCapabilityById(capabilityId);
  return {
    allowed: state === 'active',
    state,
    upgradeCta: state !== 'active' ? base?.upgradeCta : undefined,
  };
}

/**
 * Shorthand booleano.
 */
export function isCapabilityEnabled(tenantId: string, capabilityId: string): boolean {
  return checkCapability(tenantId, capabilityId).allowed;
}

/**
 * Restituisce la lista completa di capability per un tenant,
 * arricchita con lo stato effettivo (override o default).
 * Esclude le HIDDEN (non visibili da UI a meno di isAdmin).
 */
export function listCapabilities(tenantId: string, includeHidden = false): Capability[] {
  return ALL_CAPABILITIES
    .filter(c => includeHidden || resolveState(tenantId, c.id) !== 'hidden')
    .map(c => ({
      ...c,
      state: resolveState(tenantId, c.id),
    }));
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Sblocca una capability per un tenant (uso admin).
 * Crea struscia audit nel trust layer (fire-and-forget).
 */
export async function unlockCapability(
  tenantId: string,
  capabilityId: string,
  tier: CapabilityTier,
  unlockedBy: string,
): Promise<void> {
  useCapabilityStore.getState().unlock(tenantId, capabilityId, tier, unlockedBy);

  // Trust record — importato dinamicamente per evitare circolarità
  try {
    const { createTrustRecord } = await import('../trustLayer');
    void createTrustRecord({
      eventType: 'CONFIG_CHANGE',
      tenantId,
      actorId: unlockedBy,
      description: `Capability sbloccata: ${capabilityId} (tier: ${tier})`,
      payload: { capabilityId, tier, unlockedBy },
    });
  } catch {
    // Trust record non bloccante
  }
}

/**
 * Blocca una capability per un tenant (uso admin).
 */
export function lockCapability(tenantId: string, capabilityId: string): void {
  useCapabilityStore.getState().lock(tenantId, capabilityId);
}

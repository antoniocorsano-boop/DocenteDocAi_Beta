/**
 * salesPackService.ts
 *
 * Orchestrazione del ciclo di vita di un Sales Pack:
 *  1. Genera i contenuti (salesPackGenerator)
 *  2. Assegna ID, tenant, versione
 *  3. Persiste nello store
 *  4. Registra record nel Trust Layer (catena hash)
 *  5. Traccia in audit trail (slog)
 *
 * La funzione principale è createSalesPack(tenantId, createdBy).
 */

import { generateSalesPack }    from './salesPackGenerator';
import { useSalesPackStore, getNextVersion } from './salesPackStore';
import { slog }                 from '../../utils/structuredLogger';
import { createTrustRecord }    from '../trustLayer/trustService';
import type { SalesPack }       from './types';

// ─── ID generator ─────────────────────────────────────────────────────────────

function generatePackId(tenantId: string, version: number): string {
  const ts   = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 7);
  return `sp_${tenantId}_v${version}_${ts}_${rand}`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Crea un nuovo Sales Pack completo, lo persiste e lo restituisce.
 * Registra anche un record nel Trust Layer per tracciabilità immutabile.
 *
 * @param tenantId   ID del tenant / ente (es. "ic_napoli_01")
 * @param createdBy  ID o email dell'admin che genera il pack
 * @returns          SalesPack completo già salvato nello store
 */
export function createSalesPack(tenantId: string, createdBy: string): SalesPack {
  slog.info('AUDIT', 'createSalesPack avviato', { tenantId, createdBy });

  const version   = getNextVersion(tenantId);
  const id        = generatePackId(tenantId, version);
  const createdAt = Date.now();

  // Genera tutti i contenuti documentali dal runtime reale
  const contents  = generateSalesPack();

  const pack: SalesPack = {
    id,
    tenantId,
    createdAt,
    createdBy,
    version,
    ...contents,
  };

  // Persiste nello store Zustand (localStorage)
  useSalesPackStore.getState().addPack(pack);

  // Trust Layer: registra creazione pack nella catena hash (fire & forget)
  void createTrustRecord({
    eventType:   'PACK_CREATED',
    tenantId,
    actorId:     createdBy,
    description: `Sales Pack v${version} generato — score ${pack.complianceScore}%`,
    payload:     {
      packId:           id,
      version,
      complianceScore:  pack.complianceScore,
      complianceStatus: pack.complianceStatus,
      aiEnabled:        pack.aiEnabled,
    },
  });

  slog.info('AUDIT', 'Sales Pack creato e persistito', {
    id, tenantId, version,
    complianceScore:  pack.complianceScore,
    complianceStatus: pack.complianceStatus,
  });

  return pack;
}

/**
 * Recupera un pack dal store per ID.
 * Restituisce undefined se non trovato.
 */
export function getSalesPackById(id: string): SalesPack | undefined {
  return useSalesPackStore.getState().getById(id);
}

/**
 * Restituisce tutti i pack di un tenant.
 */
export function getSalesPacksByTenant(tenantId: string): SalesPack[] {
  return useSalesPackStore.getState().getByTenant(tenantId);
}

/**
 * Cancella un pack per ID.
 * Solo admin può chiamare questa funzione — il controllo accessi
 * è responsabilità del chiamante (SalesPackPanel).
 */
export function deleteSalesPack(id: string): void {
  slog.info('AUDIT', 'Sales Pack eliminato', { id });
  useSalesPackStore.getState().removePack(id);
}

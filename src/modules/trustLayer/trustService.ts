/**
 * trustLayer/trustService.ts
 *
 * API principale del Trust Layer.
 *
 * Funzioni pubbliche:
 *   createTrustRecord(params)  → crea e registra un record nella catena
 *   verifyChain(tenantId)      → verifica integrità della catena per tenant
 *   getTrustAnchor(tenantId)   → hash della testa della catena (per export)
 *
 * Pattern catena:
 *   record[n].hash include record[n].prevHash = record[n-1].hash
 *   → manomettere un record invalida tutti i successivi
 */

import { computeRecordHash } from './trustHash';
import { useTrustStore }     from './trustStore';
import type { TrustRecord, TrustEventType, ChainVerificationResult } from './types';
import { slog }              from '../../utils/structuredLogger';

// ─── ID generator ─────────────────────────────────────────────────────────────

function generateRecordId(tenantId: string, eventType: string): string {
  const ts   = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 7);
  return `tr_${tenantId}_${eventType.toLowerCase()}_${ts}_${rand}`;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export type CreateTrustRecordParams = {
  eventType:   TrustEventType;
  tenantId:    string;
  actorId:     string;
  description: string;
  payload?:    Record<string, unknown>;
};

/**
 * Crea un nuovo record trust, lo aggancia alla catena e lo persiste.
 *
 * Restituisce il record completo con hash già calcolato.
 * ASYNC perché usa Web Crypto API per SHA-256.
 */
export async function createTrustRecord(
  params: CreateTrustRecordParams,
): Promise<TrustRecord> {
  const { eventType, tenantId, actorId, description, payload = {} } = params;

  const head    = useTrustStore.getState().getHead(tenantId);
  const prevHash = head?.hash ?? '';
  const id       = generateRecordId(tenantId, eventType);
  const timestamp = Date.now();

  const hash = await computeRecordHash({
    id, timestamp, eventType, tenantId, actorId, description, payload, prevHash,
  });

  const record: TrustRecord = {
    id, timestamp, eventType, tenantId, actorId, description, payload, hash, prevHash,
  };

  useTrustStore.getState().addRecord(record);

  slog.info('AUDIT', 'Trust record creato', {
    id, eventType, tenantId, actorId, hash: hash.slice(0, 16) + '…',
  });

  return record;
}

/**
 * Verifica l'integrità dell'intera catena per un tenant.
 *
 * Ricalcola l'hash di ogni record e controlla:
 *   1. hash == computeRecordHash(record senza hash)
 *   2. record[n].prevHash == record[n-1].hash
 */
export async function verifyChain(tenantId: string): Promise<ChainVerificationResult> {
  const chain = useTrustStore.getState().getByTenant(tenantId);

  if (chain.length === 0) {
    return { valid: true, totalRecords: 0, firstBroken: null, checkedAt: Date.now() };
  }

  let prevHash = '';
  for (const record of chain) {
    // Verifica link catena
    if (record.prevHash !== prevHash) {
      return {
        valid: false,
        totalRecords: chain.length,
        firstBroken: record.id,
        checkedAt: Date.now(),
      };
    }
    // Verifica hash del record
    const expected = await computeRecordHash({
      id:          record.id,
      timestamp:   record.timestamp,
      eventType:   record.eventType,
      tenantId:    record.tenantId,
      actorId:     record.actorId,
      description: record.description,
      payload:     record.payload,
      prevHash:    record.prevHash,
    });
    if (expected !== record.hash) {
      return {
        valid: false,
        totalRecords: chain.length,
        firstBroken: record.id,
        checkedAt: Date.now(),
      };
    }
    prevHash = record.hash;
  }

  slog.info('AUDIT', 'Verifica catena trust completata', {
    tenantId, totalRecords: chain.length, valid: true,
  });

  return {
    valid: true,
    totalRecords: chain.length,
    firstBroken: null,
    checkedAt: Date.now(),
  };
}

/**
 * Restituisce l'hash della testa della catena (ultimo record) per un tenant.
 * Utile per inserire in documenti esportati come "firma trust".
 */
export function getTrustAnchor(tenantId: string): string {
  const head = useTrustStore.getState().getHead(tenantId);
  return head?.hash ?? '';
}

/**
 * Restituisce il numero di record nella catena di un tenant.
 */
export function getTrustChainLength(tenantId: string): number {
  return useTrustStore.getState().getByTenant(tenantId).length;
}

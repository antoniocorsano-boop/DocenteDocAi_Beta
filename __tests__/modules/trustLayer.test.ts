/**
 * trustLayer.test.ts — Test suite completa per il Trust Layer.
 *
 * Copre:
 *   - computeRecordHash: deterministico, cambio input = hash diverso
 *   - createTrustRecord: fields, catena, prevHash
 *   - versioning catena (prevHash linkage)
 *   - verifyChain: valid chain, broken chain
 *   - getTrustAnchor: restituisce hash testa
 *   - store: addRecord, getByTenant, listMeta, getHead, getById, clearAll
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { computeRecordHash }   from '../../src/modules/trustLayer/trustHash';
import { useTrustStore }        from '../../src/modules/trustLayer/trustStore';
import {
  createTrustRecord,
  verifyChain,
  getTrustAnchor,
  getTrustChainLength,
}                               from '../../src/modules/trustLayer/trustService';

// ─── Mock slog ────────────────────────────────────────────────────────────────

vi.mock('../../src/utils/structuredLogger', () => ({
  slog: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  useTrustStore.getState().clearAll();
  localStorage.removeItem('trust-layer-storage');
});

// ─── computeRecordHash ────────────────────────────────────────────────────────

describe('computeRecordHash', () => {
  it('produce un hash non vuoto', async () => {
    const hash = await computeRecordHash({
      id:          'test-id',
      timestamp:   1234567890,
      eventType:   'PACK_CREATED',
      tenantId:    'tenant_a',
      actorId:     'admin@test.it',
      description: 'test evento',
      payload:     { foo: 'bar' },
      prevHash:    '',
    });
    expect(hash.length).toBeGreaterThan(0);
  });

  it('è deterministico: stesso input produce stesso hash', async () => {
    const input = {
      id: 'x', timestamp: 1000, eventType: 'AI_ACTION',
      tenantId: 't', actorId: 'a', description: 'd', payload: {}, prevHash: '',
    } as const;
    const h1 = await computeRecordHash(input);
    const h2 = await computeRecordHash(input);
    expect(h1).toBe(h2);
  });

  it('input diverso → hash diverso', async () => {
    const base = {
      id: 'x', timestamp: 1000, eventType: 'AI_ACTION' as const,
      tenantId: 't', actorId: 'a', description: 'd', payload: {}, prevHash: '',
    };
    const h1 = await computeRecordHash(base);
    const h2 = await computeRecordHash({ ...base, description: 'diverso' });
    expect(h1).not.toBe(h2);
  });
});

// ─── createTrustRecord ───────────────────────────────────────────────────────

describe('createTrustRecord', () => {
  it('crea un record con tutti i campi richiesti', async () => {
    const record = await createTrustRecord({
      eventType:   'PACK_CREATED',
      tenantId:    'tenant_test',
      actorId:     'admin@test.it',
      description: 'Sales Pack v1 generato',
      payload:     { packId: 'sp_001' },
    });

    expect(record.id).toBeTruthy();
    expect(record.tenantId).toBe('tenant_test');
    expect(record.actorId).toBe('admin@test.it');
    expect(record.eventType).toBe('PACK_CREATED');
    expect(record.hash.length).toBeGreaterThan(0);
    expect(record.prevHash).toBe('');  // primo record → prevHash vuoto
    expect(record.timestamp).toBeGreaterThan(0);
  });

  it('il record viene salvato nello store', async () => {
    const record = await createTrustRecord({
      eventType:   'DOCUMENT_GENERATED',
      tenantId:    'tenant_store',
      actorId:     'user@test.it',
      description: 'DPIA generata',
    });

    const found = useTrustStore.getState().getById(record.id);
    expect(found?.id).toBe(record.id);
  });

  it('catena: il secondo record ha prevHash = hash del primo', async () => {
    const r1 = await createTrustRecord({
      eventType: 'PACK_CREATED', tenantId: 'chain_tenant',
      actorId: 'a', description: 'primo',
    });
    const r2 = await createTrustRecord({
      eventType: 'DOCUMENT_EXPORTED', tenantId: 'chain_tenant',
      actorId: 'a', description: 'secondo',
    });

    expect(r2.prevHash).toBe(r1.hash);
  });

  it('catena 3 record: ogni prevHash punta al hash precedente', async () => {
    const r1 = await createTrustRecord({ eventType: 'USER_LOGIN', tenantId: 'chain3', actorId: 'a', description: '1' });
    const r2 = await createTrustRecord({ eventType: 'AI_ACTION',  tenantId: 'chain3', actorId: 'a', description: '2' });
    const r3 = await createTrustRecord({ eventType: 'DATA_EXPORT',tenantId: 'chain3', actorId: 'a', description: '3' });

    expect(r2.prevHash).toBe(r1.hash);
    expect(r3.prevHash).toBe(r2.hash);
  });

  it('tenant diversi hanno catene indipendenti', async () => {
    const ra = await createTrustRecord({ eventType: 'PACK_CREATED', tenantId: 'tenantA', actorId: 'a', description: 'A1' });
    const rb = await createTrustRecord({ eventType: 'PACK_CREATED', tenantId: 'tenantB', actorId: 'b', description: 'B1' });

    // Entrambi i primi record devono avere prevHash vuoto
    expect(ra.prevHash).toBe('');
    expect(rb.prevHash).toBe('');
  });
});

// ─── verifyChain ─────────────────────────────────────────────────────────────

describe('verifyChain', () => {
  it('catena vuota → valida', async () => {
    const result = await verifyChain('tenant_empty');
    expect(result.valid).toBe(true);
    expect(result.totalRecords).toBe(0);
    expect(result.firstBroken).toBeNull();
  });

  it('catena di 3 record validi → valid=true', async () => {
    await createTrustRecord({ eventType: 'USER_LOGIN',   tenantId: 'verify_t', actorId: 'a', description: '1' });
    await createTrustRecord({ eventType: 'PACK_CREATED', tenantId: 'verify_t', actorId: 'a', description: '2' });
    await createTrustRecord({ eventType: 'DATA_EXPORT',  tenantId: 'verify_t', actorId: 'a', description: '3' });

    const result = await verifyChain('verify_t');
    expect(result.valid).toBe(true);
    expect(result.totalRecords).toBe(3);
    expect(result.firstBroken).toBeNull();
  });

  it('catena manomessa → valid=false, firstBroken != null', async () => {
    await createTrustRecord({ eventType: 'PACK_CREATED', tenantId: 'tampered', actorId: 'a', description: '1' });
    const r2 = await createTrustRecord({ eventType: 'AI_ACTION', tenantId: 'tampered', actorId: 'a', description: '2' });

    // Manometti un record direttamente nello store
    useTrustStore.setState(state => ({
      records: state.records.map(r =>
        r.id === r2.id ? { ...r, description: 'TAMPERED' } : r,
      ),
    }));

    const result = await verifyChain('tampered');
    expect(result.valid).toBe(false);
    expect(result.firstBroken).toBe(r2.id);
  });
});

// ─── getTrustAnchor ───────────────────────────────────────────────────────────

describe('getTrustAnchor', () => {
  it('restituisce stringa vuota se catena vuota', () => {
    expect(getTrustAnchor('empty_tenant')).toBe('');
  });

  it('restituisce hash del record più recente', async () => {
    const r1 = await createTrustRecord({ eventType: 'PACK_CREATED',    tenantId: 'anchor_t', actorId: 'a', description: '1' });
    const r2 = await createTrustRecord({ eventType: 'DOCUMENT_SIGNED', tenantId: 'anchor_t', actorId: 'a', description: '2' });

    const anchor = getTrustAnchor('anchor_t');
    expect(anchor).toBe(r2.hash);
    expect(anchor).not.toBe(r1.hash);
  });
});

// ─── getTrustChainLength ──────────────────────────────────────────────────────

describe('getTrustChainLength', () => {
  it('0 per tenant senza record', () => {
    expect(getTrustChainLength('no_tenant')).toBe(0);
  });

  it('conta correttamente i record di un tenant', async () => {
    await createTrustRecord({ eventType: 'USER_LOGIN', tenantId: 'count_t', actorId: 'a', description: '1' });
    await createTrustRecord({ eventType: 'AI_ACTION',  tenantId: 'count_t', actorId: 'a', description: '2' });
    expect(getTrustChainLength('count_t')).toBe(2);
  });
});

// ─── Store operations ────────────────────────────────────────────────────────

describe('useTrustStore', () => {
  it('listMeta restituisce tutti i record con campi meta', async () => {
    await createTrustRecord({ eventType: 'PACK_CREATED', tenantId: 'meta_t', actorId: 'a', description: 'test' });
    const meta = useTrustStore.getState().listMeta('meta_t');
    expect(meta.length).toBe(1);
    expect(meta[0]).toHaveProperty('hash');
    expect(meta[0]).toHaveProperty('prevHash');
    expect(meta[0]).not.toHaveProperty('payload');
  });

  it('clearAll svuota lo store', async () => {
    await createTrustRecord({ eventType: 'USER_LOGIN', tenantId: 'clear_t', actorId: 'a', description: 'x' });
    useTrustStore.getState().clearAll();
    expect(useTrustStore.getState().records.length).toBe(0);
  });

  it('getHead restituisce undefined per tenant senza record', () => {
    expect(useTrustStore.getState().getHead('missing')).toBeUndefined();
  });
});

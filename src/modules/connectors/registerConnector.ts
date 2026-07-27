/**
 * registerConnector.ts — Connettore (mock) registro elettronico.
 *
 * Simula il recupero dei dati del registro tramite un set di record mock.
 * In produzione, sostituire fetch() con una chiamata alle API del registro
 * scolastico istituzionale (es. Axios, spaggiari, classeviva).
 *
 * Non effettua chiamate di rete reali.
 */

import type { Connector, ExternalRecord } from './types';

// ─── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_RECORDS: Omit<ExternalRecord, 'fetchedAt'>[] = [
  {
    id:      'reg-001',
    source:  'register',
    content: 'Registro: 3A Matematica — 15 presenti, 3 assenti. Note: recupero argomento integrali.',
    tags:    ['registro', 'classe', 'presenze'],
    meta:    { classe: '3A', materia: 'Matematica', presenti: 15, assenti: 3 },
  },
  {
    id:      'reg-002',
    source:  'register',
    content: 'Registro: 2B Scienze — 18 presenti, 1 assente. Lezione svolta: ecosistemi.',
    tags:    ['registro', 'classe', 'presenze'],
    meta:    { classe: '2B', materia: 'Scienze', presenti: 18, assenti: 1 },
  },
];

// ─── Connector ────────────────────────────────────────────────────────────────

export const registerConnector: Connector = {
  id: 'register',

  async fetch(): Promise<ExternalRecord[]> {
    // Mock: ritorna i record con timestamp aggiornato
    await Promise.resolve(); // microtask tick per compatibilità async
    return MOCK_RECORDS.map(r => ({ ...r, fetchedAt: Date.now() }));
  },
};

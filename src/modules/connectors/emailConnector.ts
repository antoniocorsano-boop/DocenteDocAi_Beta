/**
 * emailConnector.ts — Connettore (mock) email istituzionale.
 *
 * Simula il recupero di email rilevanti dalla casella istituzionale del docente.
 * In produzione, sostituire fetch() con l'integration OAuth di Google Workspace
 * o Microsoft 365 — mai esporre token lato client.
 *
 * Non effettua chiamate di rete reali.
 */

import type { Connector, ExternalRecord } from './types';

// ─── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_EMAILS: Omit<ExternalRecord, 'fetchedAt'>[] = [
  {
    id:      'email-001',
    source:  'email',
    content: 'Oggetto: Circolare n.42 — Adozione libri di testo a.s. 2026/27. '
           + 'Si comunica che le adozioni devono essere inviate entro il 30/04.',
    tags:    ['circolare', 'amministrativo', 'scadenza'],
    meta:    { from: 'preside@istituto.edu.it', subject: 'Circolare n.42 — Adozione libri' },
  },
  {
    id:      'email-002',
    source:  'email',
    content: 'Oggetto: Riunione dipartimento Matematica — Giovedì 20 marzo ore 15:00. '
           + 'Ordine del giorno: revisione prove comuni.',
    tags:    ['riunione', 'dipartimento', 'pedagogical'],
    meta:    { from: 'coordinatore@istituto.edu.it', subject: 'Riunione dipartimento Matematica' },
  },
];

// ─── Connector ────────────────────────────────────────────────────────────────

export const emailConnector: Connector = {
  id: 'email',

  async fetch(): Promise<ExternalRecord[]> {
    await Promise.resolve();
    return MOCK_EMAILS.map(r => ({ ...r, fetchedAt: Date.now() }));
  },
};

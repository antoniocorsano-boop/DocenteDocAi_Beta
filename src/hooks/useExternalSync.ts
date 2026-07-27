/**
 * useExternalSync.ts — Polling loop per i connettori esterni Orbit.
 *
 * Esegue fetch() su tutti i connettori registrati ogni 2 minuti e inietta
 * i record recuperati nel cognitive layer via ingestInput.
 *
 * Il loop avvia al mount e si ferma all'unmount.
 * Non blocca il render — gestisce errori con silent catch per non interrompere
 * il polling in caso di connettore temporaneamente irraggiungibile.
 *
 * @param tenantId - ID del tenant attivo (usato per l'ingestione)
 */

import { useEffect } from 'react';
import { ingestInput }        from '../modules/cognitiveLayer';
import { registerConnector }  from '../modules/connectors/registerConnector';
import { emailConnector }     from '../modules/connectors/emailConnector';
import { fileConnector }      from '../modules/connectors/fileConnector';
import type { Connector, ExternalRecord } from '../modules/connectors/types';

// ─── Connectors registry ───────────────────────────────────────────────────────

const CONNECTORS: Connector[] = [
  registerConnector,
  emailConnector,
  fileConnector,
];

/** Intervallo di polling in ms (2 minuti) */
const POLL_INTERVAL_MS = 2 * 60 * 1_000;

// ─── Sync function ────────────────────────────────────────────────────────────

async function syncAll(tenantId: string): Promise<void> {
  for (const connector of CONNECTORS) {
    try {
      const records: ExternalRecord[] = await connector.fetch();
      for (const rec of records) {
        // fileConnector already calls ingestInput internally — skip re-ingestion
        if (rec.source === 'file') continue;
        await ingestInput({
          tenantId,
          sourceId:  rec.id,
          inputType: 'text',
          content:   rec.content,
          label:     rec.tags[0]
            ? `[${rec.source}] ${rec.tags[0]}`
            : `[${rec.source}] record`,
        });
      }
    } catch {
      // Silent: non interrompe il polling per un singolo connettore fallito
    }
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useExternalSync(tenantId: string): void {
  useEffect(() => {
    // Prima sync immediata al mount
    void syncAll(tenantId);

    const intervalId = setInterval(() => {
      void syncAll(tenantId);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [tenantId]);
}

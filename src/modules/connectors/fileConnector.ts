/**
 * fileConnector.ts — Connettore file locali per Orbit.
 *
 * Permette di iniettare documenti/file nel cognitive layer tramite il
 * meccanismo `ingestInput` standard. In questa versione mock gestisce
 * un buffer in memoria di file temporanei.
 *
 * Uso tipico: drag-and-drop, clipboard paste o selettore file avanzato.
 * Il buffer viene svuotato dopo ogni fetch() per evitare duplicati.
 */

import { ingestInput } from '../cognitiveLayer';
import type { Connector, ExternalRecord } from './types';

// ─── In-memory buffer ─────────────────────────────────────────────────────────

const _buffer: ExternalRecord[] = [];

/**
 * Aggiunge un file al buffer del connettore per la prossima sync.
 * Chiamata dal drag-and-drop handler o da un selettore file.
 */
export function enqueueFile(
  name:    string,
  content: string,
  tags:    string[] = [],
): void {
  _buffer.push({
    id:        `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    source:    'file',
    content,
    tags:      ['file', ...tags],
    meta:      { name },
    fetchedAt: Date.now(),
  });
}

// ─── Connector ────────────────────────────────────────────────────────────────

export const fileConnector: Connector = {
  id: 'file',

  async fetch(): Promise<ExternalRecord[]> {
    const records = _buffer.splice(0); // svuota il buffer atomicamente
    // Delega direttamente a ingestInput per i file (side-effect intenzionale)
    for (const rec of records) {
      await ingestInput({
        tenantId:  'default',
        sourceId:  rec.id,
        inputType: 'file',
        content:   rec.content,
        label:     (rec.meta?.['name'] as string | undefined) ?? 'File caricato',
      });
    }
    return records;
  },
};

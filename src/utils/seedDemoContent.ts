/**
 * seedDemoContent.ts — Popola il sistema con contenuti demo per onboarding/presentazione.
 *
 * Idempotente: se i contenuti demo esistono già (riconosciuti tramite sourceId),
 * la funzione ritorna immediatamente senza inserire duplicati.
 *
 * Usa `ingestInput` per passare per la pipeline cognitiva completa
 * (classificazione → store → suggerimenti).
 */

import { ingestInput }        from '../modules/cognitiveLayer';
import { useCognitiveStore }  from '../modules/cognitiveLayer/cognitiveStore';

const DEMO_SOURCE_IDS = ['demo-eval-001', 'demo-report-002'] as const;
type DemoSourceId = typeof DEMO_SOURCE_IDS[number];

/**
 * Precarica 2 contenuti demo nello spazio cognitivo del tenant.
 *
 * @param tenantId - ID tenant attivo
 */
export async function seedDemoContent(tenantId: string): Promise<void> {
  const existing = useCognitiveStore.getState().listRecent(100, tenantId);
  const alreadySeeded = existing.some(e =>
    DEMO_SOURCE_IDS.includes(e.sourceId as DemoSourceId),
  );
  if (alreadySeeded) return;

  await ingestInput({
    tenantId,
    sourceId:  'demo-eval-001',
    inputType: 'text',
    content:
      'Mario Rossi ha ottenuto 7/10 nella verifica di matematica del 15/03. ' +
      'Difficoltà rilevate nel calcolo algebrico e nella comprensione delle equazioni ' +
      'di secondo grado. Consigliato approfondimento individualizzato.',
    label: 'Valutazione — Mario Rossi (Matematica)',
    meta:  { demo: true },
  });

  await ingestInput({
    tenantId,
    sourceId:  'demo-report-002',
    inputType: 'text',
    content:
      'Report mensile classe 3A — Marzo 2026. Partecipazione media: 85%. ' +
      '3 studenti con BES attivi (PDP aggiornato). ' +
      'UDA "Energia e Ambiente" in corso, scadenza 15/04. ' +
      'Note: 2 assenze prolungate da segnalare al coordinatore.',
    label: 'Report Mensile — Classe 3A',
    meta:  { demo: true },
  });
}

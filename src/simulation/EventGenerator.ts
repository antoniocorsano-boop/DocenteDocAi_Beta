/**
 * simulation/EventGenerator.ts — Mappa eventi in parametri di ingestInput.
 *
 * Converte un LessonEvent nel payload di ingestInput basandosi sul skillHint,
 * producendo contenuti realistici per la pipeline cognitiva.
 */

import type { LessonEvent } from './types';
import type { CognitiveInputType } from '../modules/cognitiveLayer/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EventIngestionParams {
  inputType:  CognitiveInputType;
  content:    string;
  label:      string;
  meta:       Record<string, unknown>;
}

// ─── Generator ────────────────────────────────────────────────────────────────

export class EventGenerator {
  static generateInput(event: LessonEvent): EventIngestionParams {
    const base: Pick<EventIngestionParams, 'meta'> = {
      meta: {
        classeId:  event.classeId,
        materia:   event.materia,
        skillHint: event.skillHint,
        simulated: true,
      },
    };

    switch (event.skillHint) {
      case 'LOAD_LESSON_MATERIAL':
      case 'LOAD_DELIVERABLE':
      case 'UPLOAD_FILE':
        return {
          inputType: 'file',
          content:   `[PDF] Materiale didattico — ${event.materia}, classe ${event.classeId}. Argomenti: introduzione all'unità, obiettivi formativi, esercizi guidati.`,
          label:     `Materiale ${event.materia} ${event.classeId}`,
          meta:      { ...base.meta, fileType: 'pdf', size: 512_000 },
        };

      case 'SEND_EMAIL':
        return {
          inputType: 'text',
          content:   `Comunicazione alle famiglie della classe ${event.classeId}: si informa che le attività di ${event.materia} proseguiranno regolarmente. Eventuali variazioni al programma saranno comunicate tempestivamente.`,
          label:     `Email famiglie ${event.classeId}`,
          meta:      { ...base.meta, channel: 'email' },
        };

      case 'RUN_AUDIT':
      case 'GENERATE_DPIA':
        return {
          inputType: 'compliance',
          content:   'Audit automatico: verifica registro presenze completo, materiali didattici conformi GDPR, log attività docente aggiornato. Nessuna anomalia rilevata per il periodo corrente.',
          label:     'Audit compliance giornaliero',
          meta:      { ...base.meta, type: 'scheduled_audit' },
        };

      case 'OPEN_SCHEDULE':
        return {
          inputType: 'system_event',
          content:   `Apertura orario giornaliero — ${new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}. Lezioni in programma: ${event.classeId} ${event.materia}.`,
          label:     'Apertura orario',
          meta:      base.meta,
        };

      default:
        return {
          inputType: 'system_event',
          content:   `${event.label ?? event.skillHint} — Classe ${event.classeId} — Materia: ${event.materia}.`,
          label:     event.label ?? `${event.materia} ${event.classeId}`,
          meta:      base.meta,
        };
    }
  }
}

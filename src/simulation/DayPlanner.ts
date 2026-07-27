/**
 * simulation/DayPlanner.ts — Piano giornaliero di simulazione.
 *
 * Contiene la giornata tipo demo (8 eventi per 3 classi realistiche)
 * e la classe DayPlanner per la gestione dell'ordinamento.
 */

import type { LessonEvent } from './types';

// ─── Default demo day ─────────────────────────────────────────────────────────

/** Giornata demo: 3 classi, mix di skill pedagogiche + compliance */
export const DEFAULT_DAY: LessonEvent[] = [
  {
    time:      '08:00',
    classeId:  '3A',
    materia:   'Matematica',
    skillHint: 'OPEN_SCHEDULE',
    duration:  2,
    label:     'Apertura orario giornaliero',
  },
  {
    time:      '08:10',
    classeId:  '3A',
    materia:   'Matematica',
    skillHint: 'START_LESSON',
    duration:  4,
    label:     'Avvio lezione 3A — Matematica',
  },
  {
    time:      '08:20',
    classeId:  '3A',
    materia:   'Matematica',
    skillHint: 'MARK_ATTENDANCE',
    duration:  3,
    label:     'Segna presenze 3A',
  },
  {
    time:      '09:00',
    classeId:  '3A',
    materia:   'Matematica',
    skillHint: 'LOAD_LESSON_MATERIAL',
    duration:  4,
    label:     'Carica materiale didattico 3A',
  },
  {
    time:      '10:00',
    classeId:  '4B',
    materia:   'Fisica',
    skillHint: 'OPEN_CLASS_CONTEXT',
    duration:  3,
    label:     'Contesto classe 4B — Fisica',
  },
  {
    time:      '10:10',
    classeId:  '4B',
    materia:   'Fisica',
    skillHint: 'MANAGE_LESSON',
    duration:  4,
    label:     'Gestisci lezione 4B',
  },
  {
    time:      '11:00',
    classeId:  '5C',
    materia:   'Scienze',
    skillHint: 'SEND_EMAIL',
    duration:  3,
    label:     'Notifica famiglie 5C',
  },
  {
    time:      '12:00',
    classeId:  'all',
    materia:   'Compliance',
    skillHint: 'RUN_AUDIT',
    duration:  5,
    label:     'Audit compliance fine mattinata',
  },
];

// ─── DayPlanner ───────────────────────────────────────────────────────────────

export class DayPlanner {
  constructor(public readonly lessons: LessonEvent[] = DEFAULT_DAY) {}

  /** Prossimo evento dopo `currentTime`, o `null` se la giornata è finita. */
  getNextEvent(currentTime: Date): LessonEvent | null {
    return this.lessons.find(
      l => this._eventDate(l).getTime() > currentTime.getTime(),
    ) ?? null;
  }

  getAllEvents(): LessonEvent[] {
    return this.lessons;
  }

  private _eventDate(event: LessonEvent): Date {
    const today = new Date();
    const [h, m] = event.time.split(':').map(Number);
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m);
  }
}

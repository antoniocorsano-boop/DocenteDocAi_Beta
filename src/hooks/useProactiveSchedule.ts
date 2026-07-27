/**
 * useProactiveSchedule.ts — Timer-driven hook per suggerimenti time-sensitive.
 *
 * Ogni 60 secondi controlla le lezioni di oggi in useAcademicStore.
 * Se una lezione non svolta inizia entro 5 minuti viene ingesta nel Cognitive
 * Layer come system_event — appare in JarvisIndicator come suggerimento Orbit.
 *
 * De-duplicate per lezione tramite sessionStorage (chiave reset ogni giorno).
 */

import { useEffect } from 'react';

import { useAcademicStore }  from '../stores/useAcademicStore';
import { useSettingsStore }  from '../stores/useSettingsStore';
import { ingestInput }       from '../modules/cognitiveLayer';

const POLL_INTERVAL_MS = 60_000;
const TRIGGER_MINS     = 5;         // finestra di attivazione: ≤ 5 minuti

// ─── Helpers ──────────────────────────────────────────────────────────────────

function minsToOrarioInizio(orarioInizio: string): number {
  const [h, m] = orarioInizio.split(':').map(Number);
  const now = new Date();
  const startMs = new Date(
    now.getFullYear(), now.getMonth(), now.getDate(), h, m,
  ).getTime();
  return Math.floor((startMs - Date.now()) / 60_000);
}

function sessionKey(lezioneId: string): string {
  return `orbit_schedule_fired_${lezioneId}_${new Date().toISOString().slice(0, 10)}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Va montato una sola volta (es. UserWorkspace accanto a useUniversalInput).
 *
 * @param tenantId — ID del tenant corrente (letto da tenantRegistry)
 */
export function useProactiveSchedule(tenantId: string): void {
  useEffect(() => {
    const check = (): void => {
      const { lessons } = useAcademicStore.getState();
      const { settings } = useSettingsStore.getState();

      const todayStr    = new Date().toISOString().slice(0, 10);
      const todayLeft   = Object.values(lessons).filter(
        l => l.data === todayStr && !l.svolta,
      );
      if (todayLeft.length === 0) return;

      const orarioInizio = settings.orarioInizio ?? '08:00';
      const mins         = minsToOrarioInizio(orarioInizio);

      if (mins > TRIGGER_MINS || mins <= 0) return;  // fuori dalla finestra

      const next = todayLeft[0];
      const key  = sessionKey(next.id);
      if (sessionStorage.getItem(key)) return;       // già iniettato oggi

      sessionStorage.setItem(key, '1');

      // Contenuto con parole chiave pedagogiche: la classificazione è stabile.
      const content = [
        `Lezione imminente: ${next.materia} — classe ${next.classe}.`,
        `Mancano ${mins} minuti. Tipo: ${next.tipoLezione ?? 'non specificato'}.`,
        'Apri il registro o prepara il materiale didattico per la lezione.',
      ].join(' ');

      void ingestInput({
        tenantId,
        sourceId:  `schedule-${next.id}`,
        inputType: 'system_event',
        content,
        label:     `${next.materia} — ${mins} min.`,
        meta: {
          classeId:    next.classe,
          lessonType:  next.tipoLezione,
          lessonId:    next.id,
          minsToLesson: mins,
        },
      });
    };

    check();                                          // controllo immediato
    const id = setInterval(check, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [tenantId]);
}

/**
 * entryDecision.ts — Jarvis Decision Engine
 *
 * Decide la vista iniziale all'apertura dell'app.
 * Jarvis legge schedule + entries e restituisce una decisione:
 *
 *   lesson-takeover  → apertura immediata LessonLanding (lezione ≤ 10 min)
 *   schedule-prime   → apertura ScheduleLanding (lezione ≤ 30 min)
 *   suggestion       → evidenzia entry urgente, modalità proattiva
 *   idle             → workspace normale
 *
 * Zero side-effects: la funzione è pura (legge solo state Zustand).
 */

import { useAcademicStore } from '../../stores/useAcademicStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import type { CognitiveEntry } from '../cognitiveLayer/types';
import type { ScheduleContext } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EntryDecision =
  | { type: 'lesson-takeover'; ctx: ScheduleContext; lessonLabel: string }
  | { type: 'schedule-prime'; ctx: ScheduleContext }
  | { type: 'suggestion'; entryId: string }
  | { type: 'idle' };

// ─── Constants ────────────────────────────────────────────────────────────────

/** Minuti all'inizio lezione che scattano il takeover schermo intero */
const TAKEOVER_MINS = 10;
/** Minuti all'inizio lezione che aprono la vista orario in anticipo */
const PRIME_MINS    = 30;
/** Minuti dopo l'inizio lezione durante i quali il takeover è ancora valido */
const POST_START_GRACE_MINS = 90;

const URGENT_TAGS = new Set(['urgente', 'scadenza', 'gdpr', 'violazione', 'dpia', 'audit']);

// ─── Engine ───────────────────────────────────────────────────────────────────

/**
 * Decide la vista iniziale ottimale per il docente.
 *
 * L'ordine di priorità è:
 *   1. Lezione imminente / in corso         → lesson-takeover
 *   2. Lezione entro 30 min                 → schedule-prime
 *   3. Entry compliance o urgente presente  → suggestion
 *   4. Default                              → idle
 *
 * @param entries - lista delle CognitiveEntry recenti (già ordinata per recenza)
 * @param now     - timestamp corrente (iniettabile per test, default Date.now())
 */
export function decideInitialView(
  entries: CognitiveEntry[],
  now = Date.now(),
): EntryDecision {
  // 1. Leggi schedule dal tenant
  const { lessons }  = useAcademicStore.getState();
  const { settings } = useSettingsStore.getState();

  const todayStr     = new Date(now).toISOString().slice(0, 10);
  const todayLessons = Object.values(lessons).filter(
    l => l.data === todayStr && !l.svolta,
  );

  if (todayLessons.length > 0) {
    // Prendi la prima lezione non ancora svolta
    const next = todayLessons[0];
    const [h, m] = (settings.orarioInizio ?? '08:00').split(':').map(Number);
    const d = new Date(now);
    const startMs = new Date(
      d.getFullYear(), d.getMonth(), d.getDate(), h, m,
    ).getTime();
    const minsToLesson = Math.floor((startMs - now) / 60_000);

    const ctx: ScheduleContext = {
      currentLessonId: next.id,
      activeClassId:   next.classe,
      nextLessonAt:    startMs,
      lessonType:      next.tipoLezione,
      minsToLesson,
    };

    // Lezione imminente o in corso → takeover schermo intero
    if (minsToLesson <= TAKEOVER_MINS && minsToLesson > -POST_START_GRACE_MINS) {
      const lessonLabel = `${next.classe} — ${next.materia ?? 'Lezione'}`;
      return { type: 'lesson-takeover', ctx, lessonLabel };
    }

    // Lezione prossima entro la finestra → prime orario
    if (minsToLesson > TAKEOVER_MINS && minsToLesson <= PRIME_MINS) {
      return { type: 'schedule-prime', ctx };
    }
  }

  // 2. Entry urgente in store → proactive mode
  if (entries.length > 0) {
    const urgentEntry = entries.find(
      e =>
        e.domain === 'compliance' ||
        e.tags.some(t => URGENT_TAGS.has(t.toLowerCase())),
    );
    if (urgentEntry) return { type: 'suggestion', entryId: urgentEntry.id };
  }

  return { type: 'idle' };
}

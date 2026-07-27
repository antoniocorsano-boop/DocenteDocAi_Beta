/**
 * session/orbitSession.ts
 *
 * Orbit Session Engine — context-aware session layer.
 *
 * Risponde alla domanda: "In quale modalità operativa si trova il docente
 * ORA?" basandosi su ora del giorno, calendario lezioni e ultima attività.
 *
 * Design:
 *   - Pure functions: nessun side-effect, nessun import di stores
 *   - Deterministic: stesso input → stesso output
 *   - Lightweight: O(n) sulle lezioni del giorno
 */

import type { ScheduleContext } from '../cognitiveLayer/types';
import type { ActiveAgent }    from '../../theme/agentPersonality';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Modalità operativa principale del docente.
 *   - teaching:       sta tenendo o sta per tenere lezione (entro 15 min)
 *   - planning:       pomeriggio/sera — progettazione UDA, materiali, valutazioni
 *   - administrative: compiti burocratici / compliance / documenti PA
 */
export type SessionMode = 'teaching' | 'planning' | 'administrative';

/**
 * Fase oraria della giornata scolastica.
 *   - morning:   08:00–09:30 (pre-lezione, registro)
 *   - lesson:    in corso (minsToLesson <= 0 && minsToLesson > -60)
 *   - break:     intervallo tra lezioni (rilevato da gap > 0 dopo lesson)
 *   - afternoon: 13:30+ (pianificazione, burocrazia)
 */
export type TimeContext = 'morning' | 'lesson' | 'break' | 'afternoon';

/** Sessione Orbit corrente — derivata deterministicamente. */
export interface OrbitSession {
  /** Modalità operativa — guida il ranking delle azioni nell'orchestratore */
  mode:              SessionMode;
  /** ID classe attiva (se in lezione o imminente) */
  activeClassId?:    string;
  /** ID lezione corrente (se in lezione o imminente) */
  currentLessonId?:  string;
  /** Fase oraria granulare */
  timeContext:       TimeContext;
  /** Etichetta leggibile della fase (es. "Lezione in corso", "Pomeriggio") */
  phaseLabel:        string;
  /** Epoch ms dell'ultima derivazione */
  derivedAt:         number;
  /**
   * Agents active in this session (populated by the workspace when flows are running).
   * Used by the presence engine to apply personality-based presence adjustments.
   */
  agents?:           ActiveAgent[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Minuti prima della lezione in cui si entra in modalità "teaching" */
const TEACHING_PRE_WINDOW_MINS = 15;

/** Minuti dopo inizio lezione oltre i quali si esce da "lesson" */
const LESSON_DURATION_MINS = 60;

/** Ora (0–23) a partire dalla quale inizia il pomeriggio */
const AFTERNOON_HOUR = 13;

/** Ora (0–23) a partire dalla quale inizia la mattina scolastica */
const MORNING_HOUR = 8;

// ─── Core derivation ──────────────────────────────────────────────────────────

/**
 * Deriva la sessione Orbit dal momento corrente e dal contesto orario.
 *
 * @param now             - Timestamp corrente (default: Date.now())
 * @param scheduleContext - Contesto orario opzionale (da useAcademicStore)
 * @param recentDomains   - Domini degli ultimi 5 entry cognitivi (hint attività)
 */
export function deriveSession(
  now:              Date = new Date(),
  scheduleContext?: ScheduleContext,
  recentDomains?:   string[],
): OrbitSession {
  const hour    = now.getHours();
  const base    = now.getTime();

  // ── Lesson / teaching detection ─────────────────────────────────────────
  if (scheduleContext) {
    const { minsToLesson, currentLessonId, activeClassId } = scheduleContext;

    if (minsToLesson !== undefined) {
      // In-lesson: started but within duration
      if (minsToLesson <= 0 && minsToLesson > -LESSON_DURATION_MINS) {
        return {
          mode:             'teaching',
          activeClassId,
          currentLessonId,
          timeContext:      'lesson',
          phaseLabel:       'Lezione in corso',
          derivedAt:        base,
        };
      }
      // Pre-lesson: imminent (within window)
      if (minsToLesson > 0 && minsToLesson <= TEACHING_PRE_WINDOW_MINS) {
        return {
          mode:             'teaching',
          activeClassId,
          currentLessonId,
          timeContext:      'morning',
          phaseLabel:       `Lezione tra ${minsToLesson} min`,
          derivedAt:        base,
        };
      }
      // Brief break between lessons (0-30 min after lesson end)
      if (minsToLesson < -LESSON_DURATION_MINS && minsToLesson > -(LESSON_DURATION_MINS + 30)) {
        return {
          mode:             'teaching',
          activeClassId,
          currentLessonId,
          timeContext:      'break',
          phaseLabel:       'Intervallo',
          derivedAt:        base,
        };
      }
    }
  }

  // ── Time-of-day fallback ─────────────────────────────────────────────────

  // Afternoon / evening — planning mode
  if (hour >= AFTERNOON_HOUR) {
    // Compliance/admin hint from recent entries
    const hasAdminHint = recentDomains?.some(
      d => d === 'compliance' || d === 'administrative',
    ) ?? false;
    return {
      mode:        hasAdminHint ? 'administrative' : 'planning',
      timeContext: 'afternoon',
      phaseLabel:  hasAdminHint ? 'Adempimenti amministrativi' : 'Pianificazione',
      derivedAt:   base,
    };
  }

  // Morning school hours — teaching readiness
  if (hour >= MORNING_HOUR) {
    return {
      mode:        'teaching',
      timeContext: 'morning',
      phaseLabel:  'Preparazione lezione',
      derivedAt:   base,
    };
  }

  // Pre-morning / night — planning
  return {
    mode:        'planning',
    timeContext: 'morning',
    phaseLabel:  'Fuori orario',
    derivedAt:   base,
  };
}

// ─── Action boost map ─────────────────────────────────────────────────────────

/**
 * ctaTypes da promuovere (priority -1) in base alla modalità sessione.
 * Usato da buildContext() nell'orchestrationService.
 */
export const SESSION_BOOST_MAP: Record<SessionMode, readonly string[]> = {
  teaching: [
    'OPEN_CLASS_CONTEXT',
    'MARK_ATTENDANCE',
    'OPEN_REGISTER',
    'LOAD_DELIVERABLE',
    'START_LESSON',
  ],
  planning: [
    'EXPORT_UDA',
    'LOAD_MATERIAL',
    'GENERATE_UDA',
    'REVIEW_EVALUATION',
    'SAVE_NOTES',
  ],
  administrative: [
    'OPEN_COMPLIANCE_CHECK',
    'GENERATE_DPIA',
    'EXPORT_AUDIT',
    'REVIEW_GDPR',
    'SUBMIT_DOCUMENT',
  ],
} as const;

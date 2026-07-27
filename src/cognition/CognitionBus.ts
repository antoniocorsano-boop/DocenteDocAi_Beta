/**
 * CognitionBus — lightweight mitt-based event bus for the TCM module.
 *
 * This is NOT the global EventBus described in Roadmap STEP 2.
 * When that global bus is implemented, CognitionBus becomes a subscriber.
 *
 * Usage:
 *   import { cognitionBus } from '@/cognition/CognitionBus';
 *   cognitionBus.emit('lesson.created', { lessonId: '123' });
 *   cognitionBus.on('lesson.created', handler);
 */

import mitt from 'mitt';
import { logEvent } from './EventLogger';
import { eventMap } from './eventMap';

export type CognitionEvents = {
  // ── Registro / Lezioni ────────────────────────────────────────────────
  'lesson.created': { lessonId?: string };
  'lesson.updated': { lessonId?: string };
  'lesson.deleted': { lessonId?: string };
  'attendance.recorded': { lessonId?: string };
  // ── Valutazioni ───────────────────────────────────────────────────────
  'assessment.generated': { assessmentId?: string };
  'evaluation.added': { studentId?: string };
  'evaluation.bulk_added': { count?: number };
  'rubric.created': { rubricId?: string };
  // ── UDA / Progettazione ───────────────────────────────────────────────
  'uda.created': { udaId?: string };
  'uda.updated': { udaId?: string };
  'planning.wizard.completed': Record<string, never>;
  'annual.plan.created': Record<string, never>;
  // ── Studenti ──────────────────────────────────────────────────────────
  'student.added': { studentId?: string };
  'student.profile.updated': { studentId?: string };
  'student.risk.changed': { studentId?: string; risk?: string };
  // — Crescita classe (milestone)
  'class.first_student_added': { studentId?: string };
  'class.roster.completed': { studentCount?: number };
  // ── Knowledge Base ────────────────────────────────────────────────────
  'kb.document.uploaded': { docId?: string };
  'kb.document.queried': { query?: string };
  // ── AI / Copilot ──────────────────────────────────────────────────────
  'copilot.suggestion.accepted': { suggestionId?: string };
  'copilot.suggestion.rejected': { suggestionId?: string };
  'copilot.manual_prompt': Record<string, never>;
  'copilot.automation.enabled': Record<string, never>;
  'ai.pipeline.completed': { pipeline?: string };
  'ai.interaction': Record<string, never>;
  // ── Drive ─────────────────────────────────────────────────────────────
  'drive.connected': Record<string, never>;
  'drive.backup.saved': Record<string, never>;
  'drive.backup.restored': Record<string, never>;
  // ── Navigazione ───────────────────────────────────────────────────────
  'navigation.view_changed': { from?: string; to?: string };
  // ── Export ────────────────────────────────────────────────────────────
  'export.generated': { format?: 'pdf' | 'csv'; type?: string };
  // ── Analytics ─────────────────────────────────────────────────────────
  'analytics.viewed': Record<string, never>;
  // ── Workspace / Uso personale ─────────────────────────────────────────
  /** Docente aggiorna una preferenza (tema, lingua, layout, privacy…) */
  'teacher.preference.updated': { key?: string; value?: string };
  /** Prima configurazione completata (wizard / onboarding settings) */
  'workspace.configured': Record<string, never>;
  /** Docente raggiunge un'area/feature per la prima volta */
  'feature.discovered': { feature?: string };
  /** Passaggio tra modalità personale e modalità classe */
  'session.mode': { mode?: 'personal' | 'classroom' };
  // ── Libri / Servizi esterni ───────────────────────────────────────────
  /** Collegamento account libro di testo / editore */
  'book.account.linked': { serviceId?: string; bookIsbn?: string; publisher?: string };
  /** Interazione con un servizio libro collegato */
  'book.service.interacted': { serviceId?: string; action?: string; resourceId?: string };
  /** Connessione generica a servizio esterno (LMS, registro, portale PA…) */
  'external.service.connected': { serviceId?: string; serviceType?: string };
  // ── AI Artistica Educativa ────────────────────────────────────────────
  /** Il Consilium Artistico ha generato attività AI per una UDA */
  'artistic.suggestions.generated': { count?: number; subject?: string; gradeLevel?: string };
  // ── Sistema ───────────────────────────────────────────────────────────
  'app.session.started': Record<string, never>;
  'onboarding.completed': Record<string, never>;
};

// ── Evento di feedback suggestion ────────────────────────────────────────────
// Aggiunto qui per evitare dipendenza circolare con il SuggestionEngine
export type SuggestionFeedbackEvents = {
  'suggestion.accepted': { actionKey: string; suggestionId: string };
  'suggestion.ignored': { actionKey: string; suggestionId: string };
};

// ── Bus interno (mitt raw) ────────────────────────────────────────────────────

const _rawBus = mitt<CognitionEvents>();

// ── Validazione eventi ────────────────────────────────────────────────────────

const _knownEventNames = new Set<string>();
function _loadKnownEvents(): void {
  if (_knownEventNames.size > 0) return; // già caricata
  for (const e of eventMap) {
    _knownEventNames.add(e.name);
  }
}

function _validateEventType(type: keyof CognitionEvents): void {
  _loadKnownEvents();
  if (!_knownEventNames.has(type as string)) {
    // Warning non bloccante: gli eventi non mappati possono esistere in test/stub
    if (import.meta.env.DEV) {
      console.warn(`[CognitionBus] Evento non registrato nell'eventMap: "${String(type)}"`);
    }
  }
}

// ── Debounce utility ─────────────────────────────────────────────────────────

/**
 * Per-event debounce map.
 * Events fired within DEBOUNCE_MS of the previous same-type event are coalesced:
 * only the last payload wins. This prevents update cascades on high-frequency
 * interactions (e.g. rapid UDA edits, student bulk-adds).
 *
 * Events that must NOT be debounced (critical one-shot semantics):
 *   - anything in INSTANT_EVENTS below
 */
const DEBOUNCE_MS = 150;
const INSTANT_EVENTS = new Set<keyof CognitionEvents>([
  // App lifecycle — must propagate immediately
  'app.session.started',
  'onboarding.completed',
  'drive.connected',
  'drive.backup.restored',
  'copilot.automation.enabled',
  // User semantic actions — one-shot, never high-frequency
  'uda.created',
  'planning.wizard.completed',
  'kb.document.uploaded',
  'feature.discovered',
  'workspace.configured',
]);

const _debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

function _debouncedEmit<K extends keyof CognitionEvents>(
  type: K,
  payload: CognitionEvents[K],
  emitFn: () => void,
): void {
  if (INSTANT_EVENTS.has(type)) {
    emitFn();
    return;
  }
  const existing = _debounceTimers.get(type as string);
  if (existing !== undefined) clearTimeout(existing);
  _debounceTimers.set(
    type as string,
    setTimeout(() => {
      _debounceTimers.delete(type as string);
      emitFn();
    }, DEBOUNCE_MS),
  );
}

// ── CognitionBus con logging + validation ────────────────────────────────────

/**
 * Singleton CognitionBus — import this everywhere.
 *
 * Extend: il bus intercetta ogni emit per:
 *   1. Validare il tipo evento contro l'eventMap
 *   2. Loggare strutturalmente via EventLogger (sessionId, source, payload)
 */
export const cognitionBus: typeof _rawBus & {
  emitFrom: <K extends keyof CognitionEvents>(
    type: K,
    payload: CognitionEvents[K],
    source: string,
  ) => void;
} = Object.assign(_rawBus, {
  /**
   * Emit con source esplicita per tracciabilità.
   * Preferire questo a `cognitionBus.emit()` quando si conosce il modulo emettente.
   */
  emitFrom<K extends keyof CognitionEvents>(
    type: K,
    payload: CognitionEvents[K],
    source: string,
  ): void {
    _validateEventType(type);
    _debouncedEmit(type, payload, () => {
      logEvent(type, payload, source);
      _rawBus.emit(type, payload);
    });
  },
});

// Intercetta anche gli emit "naked" (backwards-compat) per il logging
const _originalEmit = _rawBus.emit.bind(_rawBus);
_rawBus.emit = function <K extends keyof CognitionEvents>(
  type: K,
  payload?: CognitionEvents[K],
): void {
  _validateEventType(type);
  const p = payload ?? ({} as CognitionEvents[K]);
  _debouncedEmit(type, p, () => {
    logEvent(type, p, 'unknown');
    _originalEmit(type, p);
  });
};

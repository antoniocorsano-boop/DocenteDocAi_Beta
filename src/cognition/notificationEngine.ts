/**
 * notificationEngine.ts — Sprint 11: Proactive Notification Engine.
 *
 * Pure decision engine — zero React, zero side-effects.
 * Decides whether a SystemSignal should produce a user notification
 * and what form it should take, applying anti-fatigue throttle rules.
 *
 * Anti-fatigue contract:
 *   - Max 1 critical notification every 5 minutes
 *   - Max 1 suggestion notification per (type+source) key every 30 minutes
 *   - Skip if a notification for the same actionId is already pending
 *   - warning + info: no throttle (pass-through)
 *
 * Usage:
 *   const decision = notificationEngine.decide(signal, pendingIds);
 *   if (decision) showToast(decision.title, decision.type);
 */

import type { SystemSignal, SystemSignalType } from './signals';

// ── Public types ──────────────────────────────────────────────────────────────

export interface NotificationDecision {
  /** Notification category — maps to MD3 color token */
  type:          'critical' | 'warning' | 'suggestion' | 'info';
  /** Short Italian title */
  title:         string;
  /** Full Italian message from the originating signal */
  message:       string;
  /** Back-reference to the signal.id that triggered this notification */
  actionId:      string;
  /** 0–1 urgency score for UI prioritisation */
  urgencyScore:  number;
}

// ── Anti-fatigue constants ────────────────────────────────────────────────────

const CRITICAL_COOLDOWN_MS   = 5  * 60 * 1_000; //  5 minutes
const SUGGESTION_COOLDOWN_MS = 30 * 60 * 1_000; // 30 minutes

// ── Throttle state (module-level, survives re-renders) ────────────────────────

let _lastCriticalTs: number = 0;
const _lastSuggestionTs: Record<string, number> = {};

// ── Pure helpers ──────────────────────────────────────────────────────────────

function urgencyScore(signal: SystemSignal): number {
  if (signal.severity === 'critical') return 1.0;
  if (signal.severity === 'warning')  return 0.6;
  return 0.3;
}

function typeFromSignal(signal: SystemSignal): NotificationDecision['type'] {
  if (signal.severity === 'critical')        return 'critical';
  if (signal.severity === 'warning')         return 'warning';
  if (signal.type === 'ACTION_EXECUTED')     return 'info';
  return 'suggestion';
}

const SIGNAL_TITLES: Record<SystemSignalType, string> = {
  COMPLIANCE_UPDATE:  'Aggiornamento conformità',
  NEW_DOCUMENT:       'Nuovo documento normativo',
  INTEGRATION_ERROR:  'Errore integrazione',
  PERFORMANCE_ALERT:  'Alerta performance alunni',
  MISSING_DATA:       'Dati mancanti',
  ACTION_EXECUTED:    'Azione completata',
  APPROVAL_REQUIRED:  'Approvazione richiesta',
};

/** Suggestion throttle key — debounces by signal type + source agent */
function suggestionKey(signal: SystemSignal): string {
  return `${signal.type}::${signal.sourceAgent}`;
}

// ── Core decision function ────────────────────────────────────────────────────

/**
 * Decide whether a SystemSignal should generate a user notification.
 *
 * @param signal         - The signal to evaluate.
 * @param pendingIds     - IDs of notifications already pending in the UI queue.
 *                         If the signal's id is already present, skip.
 * @returns              - A NotificationDecision, or null if throttled / duplicate.
 */
export function decide(
  signal:     SystemSignal,
  pendingIds: string[] = [],
): NotificationDecision | null {
  const now  = Date.now();
  const type = typeFromSignal(signal);

  // ── Duplicate guard ────────────────────────────────────────────────────────
  if (pendingIds.includes(signal.id)) return null;

  // ── Critical: max 1 every 5 min ───────────────────────────────────────────
  if (type === 'critical') {
    if (now - _lastCriticalTs < CRITICAL_COOLDOWN_MS) return null;
    _lastCriticalTs = now;
    return { type, title: SIGNAL_TITLES[signal.type], message: signal.message, actionId: signal.id, urgencyScore: urgencyScore(signal) };
  }

  // ── Suggestion: max 1 per key every 30 min ─────────────────────────────────
  if (type === 'suggestion') {
    const key = suggestionKey(signal);
    if (now - (_lastSuggestionTs[key] ?? 0) < SUGGESTION_COOLDOWN_MS) return null;
    _lastSuggestionTs[key] = now;
    return { type, title: SIGNAL_TITLES[signal.type], message: signal.message, actionId: signal.id, urgencyScore: urgencyScore(signal) };
  }

  // ── warning + info: always pass through ───────────────────────────────────
  return {
    type,
    title:        SIGNAL_TITLES[signal.type],
    message:      signal.message,
    actionId:     signal.id,
    urgencyScore: urgencyScore(signal),
  };
}

/**
 * Reset all throttle state.
 * Intended for unit tests only — never call in production paths.
 */
export function resetThrottle(): void {
  _lastCriticalTs = 0;
  for (const key of Object.keys(_lastSuggestionTs)) {
    delete _lastSuggestionTs[key];
  }
}

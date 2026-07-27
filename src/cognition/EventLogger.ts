/**
 * EventLogger.ts — Logging strutturato degli eventi cognitivi
 *
 * Registra ogni evento del CognitionBus con:
 *   - event type
 *   - timestamp
 *   - source (chi ha emesso)
 *   - payload
 *   - sessionId
 *
 * Funzionalità chiave:
 *   - `logEvent(...)` — registra un evento nella sessione corrente
 *   - `replayEvents(sessionId)` — ricostruisce la sequenza per debug
 *   - `getSessionLog()` — log completo della sessione attiva
 *   - `clearSession()` — reset (usato in test)
 *
 * Il logger è in-memory (no persistenza) per default.
 * Usa localStorage solo per la sessione corrente (chiave 'dcai-event-log').
 * I log non contengono dati personali: solo metadati comportamentali.
 */

import type { CognitionEvents } from './CognitionBus';

// ── Tipi ─────────────────────────────────────────────────────────────────────

export interface LoggedEvent<K extends keyof CognitionEvents = keyof CognitionEvents> {
  /** Tipo di evento (es. 'uda.created') */
  event: K;
  /** Timestamp Unix ms */
  timestamp: number;
  /** Modulo/componente che ha emesso l'evento */
  source: string;
  /** Payload dell'evento */
  payload: CognitionEvents[K];
  /** ID sessione (generato a ogni avvio app) */
  sessionId: string;
}

export interface EventReplay {
  sessionId: string;
  events: LoggedEvent[];
  startedAt: number;
  summary: string;
}

// ── Sessione ──────────────────────────────────────────────────────────────────

const SESSION_KEY = 'dcai-event-log-session';
const LOG_KEY = 'dcai-event-log';
const MAX_LOG_SIZE = 500; // eventi massimi in memoria per sessione

/**
 * Genera o recupera il sessionId della sessione corrente.
 * Il sessionId è stabile per tutta la durata dell'app (finché la pagina non viene
 * ricaricata) e viene salvato in sessionStorage per isolare le sessioni.
 */
function getOrCreateSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `session-${Date.now()}`;
  }
}

// ── Store in-memory ───────────────────────────────────────────────────────────

let _sessionId: string = getOrCreateSessionId();
let _log: LoggedEvent[] = [];
let _sessionStartedAt: number = Date.now();

// ── API pubblica ──────────────────────────────────────────────────────────────

/**
 * Registra un evento nel log strutturato.
 * Chiamato automaticamente dal CognitionBus quando `EventLogger.init()` è attivo.
 */
export function logEvent<K extends keyof CognitionEvents>(
  event: K,
  payload: CognitionEvents[K],
  source: string = 'unknown',
): void {
  // In production skip entirely — no sessionStorage writes, no GDPR-sensitive behaviour logs
  if (!import.meta.env.DEV) return;

  const entry: LoggedEvent<K> = {
    event,
    timestamp: Date.now(),
    source,
    payload,
    sessionId: _sessionId,
  };

  _log.push(entry as LoggedEvent);

  // Mantieni dimensione massima (ring buffer — scarta i più vecchi)
  if (_log.length > MAX_LOG_SIZE) {
    _log = _log.slice(_log.length - MAX_LOG_SIZE);
  }

  // Sincronizza su sessionStorage per persistenza intra-sessione
  try {
    sessionStorage.setItem(LOG_KEY, JSON.stringify(_log.slice(-100))); // ultimi 100 per perf
  } catch {
    // sessionStorage potrebbe non essere disponibile (private browsing, quota)
  }
}

/**
 * Restituisce il log completo della sessione corrente.
 */
export function getSessionLog(): readonly LoggedEvent[] {
  return _log;
}

/**
 * Ricostruisce e analizza gli eventi di una sessione specifica.
 *
 * Uso debug:
 * ```ts
 * const replay = replayEvents('session-1234567890-abc');
 * console.log(replay.summary);
 * ```
 *
 * Risponde alla domanda: "Perché il sistema ha suggerito X?"
 */
export function replayEvents(sessionId: string): EventReplay {
  const events = _log.filter((e) => e.sessionId === sessionId);

  const summary = buildReplaySummary(events);

  return {
    sessionId,
    events,
    startedAt: events[0]?.timestamp ?? _sessionStartedAt,
    summary,
  };
}

/**
 * Replay della sessione attiva.
 */
export function replayCurrentSession(): EventReplay {
  return replayEvents(_sessionId);
}

/**
 * Genera una stringa human-readable che spiega la sequenza di eventi.
 */
function buildReplaySummary(events: LoggedEvent[]): string {
  if (events.length === 0) return 'Nessun evento registrato in questa sessione.';

  const lines = events.map((e, i) => {
    const t = new Date(e.timestamp).toISOString().slice(11, 19);
    const payloadStr = Object.keys(e.payload as object).length > 0
      ? ` [${JSON.stringify(e.payload)}]`
      : '';
    return `  ${i + 1}. [${t}] ${e.event}${payloadStr} ← ${e.source}`;
  });

  return `Sessione ${events[0]?.sessionId} — ${events.length} eventi:\n${lines.join('\n')}`;
}

/**
 * Filtra il log per tipo di evento.
 */
export function getEventsByType<K extends keyof CognitionEvents>(
  type: K,
): LoggedEvent<K>[] {
  return _log.filter((e): e is LoggedEvent<K> => e.event === type);
}

/**
 * Filtra il log per sorgente.
 */
export function getEventsBySource(source: string): LoggedEvent[] {
  return _log.filter((e) => e.source === source);
}

/**
 * Conta gli eventi di un determinato tipo nella sessione corrente.
 */
export function countEvents(type: keyof CognitionEvents): number {
  return _log.filter((e) => e.event === type).length;
}

/**
 * Verifica se un evento di un certo tipo è già stato emesso nella sessione.
 */
export function hasEventOccurred(type: keyof CognitionEvents): boolean {
  return _log.some((e) => e.event === type);
}

/**
 * Restituisce l'ultimo evento di un certo tipo.
 */
export function getLastEvent<K extends keyof CognitionEvents>(
  type: K,
): LoggedEvent<K> | undefined {
  const matching = _log.filter((e): e is LoggedEvent<K> => e.event === type);
  return matching[matching.length - 1];
}

/**
 * Restituisce il sessionId corrente.
 */
export function getCurrentSessionId(): string {
  return _sessionId;
}

/**
 * Reset completo del logger (usato in test).
 * In produzione NON chiamare direttamente.
 */
export function _resetEventLogger(): void {
  _sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  _log = [];
  _sessionStartedAt = Date.now();
  try {
    sessionStorage.removeItem(LOG_KEY);
    sessionStorage.setItem(SESSION_KEY, _sessionId);
  } catch {
    // ignore
  }
}

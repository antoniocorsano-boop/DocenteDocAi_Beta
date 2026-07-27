/**
 * structuredLogger.ts — C20: JSON logging centralizzato.
 *
 * Estende il logger base con persistenza strutturata in un ring buffer
 * localStorage (max 500 voci). Ogni entry è un JSON serializzabile con:
 *   level, category, message, data, timestamp, sessionId.
 *
 * Usage:
 *   import { slog } from './structuredLogger';
 *   slog.error('AI_GATE', 'Sovereignty block', { useCaseId: 'UC-R4' });
 *   slog.info ('COMPLIANCE', 'Score aggiornato', { score: 82 });
 *   const errors = slog.getRecentErrors(10);
 *   const json   = slog.flush();
 */

import { logger } from './logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LogLevel    = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory =
  | 'AI_GATE'
  | 'COMPLIANCE'
  | 'SOVEREIGNTY'
  | 'AUDIT'
  | 'TELEMETRY'
  | 'BACKUP'
  | 'FEATURE_FLAG'
  | 'USE_CASE'
  | 'UI'
  | 'SYSTEM';

export interface StructuredLogEntry {
  id:         string;
  timestamp:  string;
  level:      LogLevel;
  category:   LogCategory;
  message:    string;
  data?:      Record<string, unknown>;
  sessionId:  string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY  = 'structured_logs_v1';
const MAX_ENTRIES  = 500;
const SESSION_ID   = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ─── Internal helpers ─────────────────────────────────────────────────────────

let _counter = 0;

function makeId(): string {
  return `log_${SESSION_ID}_${++_counter}`;
}

function readBuffer(): StructuredLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StructuredLogEntry[]) : [];
  } catch {
    return [];
  }
}

function writeBuffer(entries: StructuredLogEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage may be full — drop oldest entry and retry once
    try {
      const trimmed = entries.slice(-Math.floor(MAX_ENTRIES / 2));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // noop
    }
  }
}

function append(entry: StructuredLogEntry): void {
  const buf = readBuffer();
  buf.push(entry);
  // Ring buffer: keep only the last MAX_ENTRIES entries
  const trimmed = buf.length > MAX_ENTRIES ? buf.slice(buf.length - MAX_ENTRIES) : buf;
  writeBuffer(trimmed);
}

function createEntry(
  level:    LogLevel,
  category: LogCategory,
  message:  string,
  data?:    Record<string, unknown>,
): StructuredLogEntry {
  return {
    id:        makeId(),
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    data,
    sessionId: SESSION_ID,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const slog = {
  /** Log debug — solo dev, non persiste. */
  debug(category: LogCategory, message: string, data?: Record<string, unknown>): void {
    logger.debug(`[${category}] ${message}`, data ?? '');
    // debug entries are not persisted to save space
  },

  /** Log info — persiste nel buffer locale. */
  info(category: LogCategory, message: string, data?: Record<string, unknown>): void {
    logger.info(`[${category}] ${message}`, data ?? '');
    append(createEntry('info', category, message, data));
  },

  /** Log warn — persiste nel buffer locale + console.warn. */
  warn(category: LogCategory, message: string, data?: Record<string, unknown>): void {
    logger.warn(`[${category}] ${message}`, data ?? '');
    append(createEntry('warn', category, message, data));
  },

  /** Log error — persiste nel buffer locale + console.error. */
  error(category: LogCategory, message: string, data?: Record<string, unknown>): void {
    logger.error(`[${category}] ${message}`, data ?? '');
    append(createEntry('error', category, message, data));
  },

  /**
   * Restituisce le ultime N voci di errore.
   * Utile per alert errori critici in dashboard.
   */
  getRecentErrors(n = 20): StructuredLogEntry[] {
    return readBuffer()
      .filter((e) => e.level === 'error')
      .slice(-n);
  },

  /**
   * Restituisce le ultime N voci per categoria.
   */
  getByCategory(category: LogCategory, n = 50): StructuredLogEntry[] {
    return readBuffer()
      .filter((e) => e.category === category)
      .slice(-n);
  },

  /**
   * Restituisce tutte le voci come JSON string (per export/diagnostica).
   */
  flush(): string {
    return JSON.stringify(readBuffer(), null, 2);
  },

  /**
   * Cancella il buffer (solo per test o reset esplicito utente).
   */
  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // noop
    }
  },

  /**
   * Restituisce il numero di voci nel buffer.
   */
  count(): number {
    return readBuffer().length;
  },
} as const;

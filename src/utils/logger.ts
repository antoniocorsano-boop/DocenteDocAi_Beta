/**
 * Logger centralizzato — rispetta NODE_ENV e il flag di produzione Vite.
 *
 * Livelli:
 *  - debug / audit  →  visibili SOLO in sviluppo (import.meta.env.DEV)
 *  - info           →  visibile SOLO in sviluppo
 *  - warn           →  sempre visibile (problemi non critici)
 *  - error          →  sempre visibile (errori recuperabili o fatali)
 *
 * Utilizzo:
 *   import { logger } from '../utils/logger';
 *   logger.debug('valore attuale', value);
 *   logger.audit('Audit: Utente ha cliccato su X');
 *   logger.warn('Attenzione:', msg);
 *   logger.error('Operazione fallita:', err);
 */

const IS_DEV = import.meta.env.DEV;

export const logger = {
  /** Messaggi di debug: visibili solo in sviluppo. */
   
  debug: (...args: unknown[]): void => { if (IS_DEV) console.debug(...args); },

  /** Messaggi di audit/telemetria (click, navigazione, azioni utente): solo in sviluppo. */
   
  audit: (...args: unknown[]): void => { if (IS_DEV) console.log('[Audit]', ...args); },

  /** Messaggi informativi: visibili solo in sviluppo. */
   
  info: (...args: unknown[]): void => { if (IS_DEV) console.info(...args); },

  /** Avvisi non critici: sempre visibili. */
   
  warn: (...args: unknown[]): void => { console.warn(...args); },

  /** Errori: sempre visibili. */
   
  error: (...args: unknown[]): void => { console.error(...args); },
} as const;

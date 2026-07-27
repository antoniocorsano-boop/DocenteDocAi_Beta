/**
 * connectors/types.ts — Tipi condivisi per il layer connector di Orbit.
 *
 * Un Connector è un adattatore che recupera (e opzionalmente invia) dati
 * da un sistema esterno (registro elettronico, email istituzionale, storage).
 * Tutti i connettori sono readonly e mock in questa versione — nessuna
 * chiamata di rete reale nell'implementazione attuale.
 */

// ─── ExternalRecord ──────────────────────────────────────────────────────────

/**
 * Record generico prodotto da qualsiasi connettore.
 * Il campo `source` identifica l'origine per il dispatch nel cognitive layer.
 */
export interface ExternalRecord {
  /** ID univoco del record (generato localmente o rimappato dal source) */
  id:        string;
  /** ID connettore sorgente ('register' | 'email' | 'file' | …) */
  source:    string;
  /** Contenuto testuale normalizzato da ingestire nel cognitive layer */
  content:   string;
  /** Tag semantici estratti o assegnati dal connettore */
  tags:      string[];
  /** Metadati arbitrari specifici del connettore */
  meta?:     Record<string, unknown>;
  /** Timestamp di recupero (epoch ms) */
  fetchedAt: number;
}

// ─── Connector ───────────────────────────────────────────────────────────────

/**
 * Interfaccia generica dei connettori Orbit.
 *
 * @typeParam T - Tipo del record recuperato (default: ExternalRecord)
 */
export interface Connector<T = ExternalRecord> {
  /** Identificatore univoco del connettore */
  readonly id: string;
  /**
   * Recupera i record più recenti dalla sorgente.
   * Deve essere idempotente: chiamate ripetute non creano duplicati a sorgente.
   */
  fetch(): Promise<T[]>;
  /**
   * Invia un record alla sorgente (opzionale — non tutti i connettori scrivono).
   */
  send?(payload: T): Promise<void>;
}

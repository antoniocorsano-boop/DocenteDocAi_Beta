/**
 * trustLayer/types.ts
 *
 * Definizione del Trust Layer: catena di record immutabili con hash SHA-256.
 * Ogni record referenzia l'hash del record precedente → catena verificabile.
 *
 * Uso: audit trail, firma documenti, notarizzazione locale.
 */

// ─── TrustRecord ─────────────────────────────────────────────────────────────

export type TrustEventType =
  | 'DOCUMENT_GENERATED'    // PDF/HTML generato
  | 'DOCUMENT_EXPORTED'     // Export/stampa attivato
  | 'DOCUMENT_SIGNED'       // Firma digitale
  | 'PACK_CREATED'          // Sales Pack creato
  | 'PACK_DELETED'          // Sales Pack eliminato
  | 'COMPLIANCE_RUN'        // Audit compliance eseguito
  | 'AI_ACTION'             // Azione AI copilot
  | 'USER_LOGIN'            // Accesso utente
  | 'USER_CONSENT'          // Consenso GDPR
  | 'DATA_EXPORT'           // Export dati
  | 'DATA_DELETION'         // Cancellazione dati
  | 'CONFIG_CHANGE'         // Modifica configurazione
  | 'TRUST_ANCHOR';         // Àncora manuale (admin)

/** Record singolo nella catena trust */
export type TrustRecord = {
  /** ID univoco del record */
  id:          string;
  /** Timestamp di creazione (ms epoch) */
  timestamp:   number;
  /** Tipo di evento */
  eventType:   TrustEventType;
  /** Tenant a cui appartiene il record */
  tenantId:    string;
  /** Utente che ha generato l'evento */
  actorId:     string;
  /** Descrizione leggibile dell'evento */
  description: string;
  /** Payload opzionale (serializzato JSON) */
  payload:     Record<string, unknown>;
  /** Hash SHA-256 del contenuto di questo record (senza hash field) */
  hash:        string;
  /** Hash del record precedente nella catena ('' per il primo record) */
  prevHash:    string;
};

/** Metadati leggeri per le liste */
export type TrustRecordMeta = Pick<
  TrustRecord,
  'id' | 'timestamp' | 'eventType' | 'tenantId' | 'actorId' | 'description' | 'hash' | 'prevHash'
>;

/** Risultato verifica integrità catena */
export type ChainVerificationResult = {
  valid:        boolean;
  totalRecords: number;
  firstBroken:  string | null;  // ID del primo record corrotto, null se valido
  checkedAt:    number;
};

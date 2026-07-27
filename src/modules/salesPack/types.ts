/**
 * src/modules/salesPack/types.ts
 *
 * Tipi del modulo Sales Pack.
 * Un SalesPack è un bundle documentale completo generato per la vendita PA:
 *  - onePager         : descrizione esecutiva del prodotto
 *  - demoScript       : script guidato per demo a dirigenti scolastici / USR
 *  - dpia             : testo plain della DPIA GDPR Art.35
 *  - auditVerbaleHTML : verbale audit formale (HTML, per stampa/PDF)
 *  - auditVerbaleTXT  : verbale audit in testo plain
 *  - complianceReport : report conformità (testo strutturato)
 */

export type SalesPack = {
  /** ID univoco del pack (UUID v4-style basato su timestamp + random) */
  id:          string;
  /** Tenant / ente richiedente (es. "scuola_pilota_napoli") */
  tenantId:    string;
  /** Timestamp di creazione (ms epoch) */
  createdAt:   number;
  /** ID / email dell'admin che ha generato il pack */
  createdBy:   string;
  /** Versione incrementale per tenant (1, 2, 3…) */
  version:     number;

  /** One-pager in testo strutturato (markdown-like) */
  onePager:          string;
  /** Script demo guidato per presentazione PA */
  demoScript:        string;
  /** DPIA GDPR Art.35 in testo plain */
  dpia:              string;
  /** Verbale audit PA in HTML autocontenuto (per stampa/PDF) */
  auditVerbaleHTML:  string;
  /** Verbale audit PA in testo plain (per email / archivi) */
  auditVerbaleTXT:   string;
  /** Report conformità GDPR/AI Act/AgID in testo strutturato */
  complianceReport:  string;

  /** Score globale PA al momento della generazione (0–100) */
  complianceScore:   number;
  /** Stato conformità al momento della generazione */
  complianceStatus:  'CONFORME' | 'PARZIALMENTE_CONFORME' | 'NON_CONFORME';
  /** AI abilitata al momento della generazione */
  aiEnabled:         boolean;
};

/** Metadati leggeri per la lista packs (senza contenuti testuali) */
export type SalesPackMeta = Pick<
  SalesPack,
  'id' | 'tenantId' | 'createdAt' | 'createdBy' | 'version' | 'complianceScore' | 'complianceStatus' | 'aiEnabled'
>;

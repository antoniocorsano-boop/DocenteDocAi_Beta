/**
 * cognitiveLayer/types.ts
 *
 * Cognitive Layer base: input universale, classificazione, suggerimenti.
 *
 * Architettura:
 *   Input (testo, file, AI output, azione) →
 *   CognitiveClassifier → CognitiveEntry →
 *   SuggestionEngine → CognitiveSuggestion[]
 *
 * Obiettivo: ogni contenuto che entra nel sistema viene classificato
 * semanticamente e genera suggerimenti contestuali per l'utente.
 */

// ─── Input types ──────────────────────────────────────────────────────────────

/** Tipo di input accettato dal Cognitive Layer */
export type CognitiveInputType =
  | 'text'          // Testo libero (nota, documento, prompt)
  | 'file'          // File caricato (.txt, .md, .csv, .pdf)
  | 'ai_output'     // Output generato da AI (UDA, DPIA, report)
  | 'user_action'   // Azione dell'utente (generazione, export, login)
  | 'compliance'    // Evento compliance (score, violazione, audit)
  | 'system_event'; // Evento di sistema (backup, migrazione, tenant)

// ─── Domain classification ────────────────────────────────────────────────────

/** Dominio semantico dell'input */
export type CognitiveDomain =
  | 'pedagogical'    // UDA, valutazioni, didattica, curriculum
  | 'compliance'     // GDPR, AI Act, AgID, DPIA, audit
  | 'administrative' // Documenti PA, verbali, notifiche, burocrazia
  | 'technical'      // Configurazione, deploy, sistema, performance
  | 'commercial'     // Sales pack, pricing, pilota, offerta PA
  | 'operational'    // Log, backup, recovery, monitoraggio
  | 'unknown';       // Non classificabile

/** Livello di confidenza della classificazione */
export type ClassificationConfidence = 'high' | 'medium' | 'low';

// ─── CognitiveEntry ───────────────────────────────────────────────────────────

/** Unità di conoscenza classificata nel Cognitive Layer */
export type CognitiveEntry = {
  /** ID univoco dell'entry */
  id:         string;
  /** Tenant/ente appartenenza */
  tenantId:   string;
  /** Tipo di input originale */
  inputType:  CognitiveInputType;
  /** Dominio semantico classificato */
  domain:     CognitiveDomain;
  /** Livello di confidenza della classificazione */
  confidence: ClassificationConfidence;
  /** Contenuto testuale (estratto o intero) */
  content:    string;
  /** Etichetta/titolo dell'entry (opzionale) */
  label:      string;
  /** Timestamp di ingresso */
  enteredAt:  number;
  /** ID dell'autore / sistema che ha prodotto l'input */
  sourceId:   string;
  /** Tag semantici estratti (es. ['gdpr', 'uda', 'pilota']) */
  tags:       string[];
  /** Metadati opzionali strutturati */
  meta:       Record<string, unknown>;
};

// ─── Suggestions ─────────────────────────────────────────────────────────────

/** Tipo di suggerimento generato dal Cognitive Layer */
export type CognitiveSuggestionType =
  | 'ACTION'         // Suggerisce un'azione specifica (genera, esporta)
  | 'INSIGHT'        // Fornisce un'informazione contestuale
  | 'WARNING'        // Avvisa di un potenziale problema
  | 'NEXT_STEP'      // Suggerisce il passo successivo del flusso
  | 'CROSS_DOMAIN';  // Connessione tra domini diversi

/** Priorità del suggerimento */
export type SuggestionPriority = 'critical' | 'high' | 'medium' | 'low';

/** Suggerimento generato dal Cognitive Layer */
export type CognitiveSuggestion = {
  /** ID univoco */
  id:         string;
  /** Tipo di suggerimento */
  type:       CognitiveSuggestionType;
  /** Priorità */
  priority:   SuggestionPriority;
  /** Dominio di appartenenza del suggerimento */
  domain:     CognitiveDomain;
  /** Titolo breve (max 60 caratteri) */
  title:      string;
  /** Descrizione estesa */
  description: string;
  /** Label del pulsante CTA (opzionale) */
  cta?:       string;
  /** Tipo azione CTA (per il consumer) */
  ctaType?:   string;
  /** Entry che ha generato questo suggerimento */
  sourceEntryId: string;
  /** Timestamp di generazione */
  generatedAt: number;
};

// ─── Classification result ────────────────────────────────────────────────────

/** Risultato della classificazione di un input */
export type ClassificationResult = {
  domain:     CognitiveDomain;
  confidence: ClassificationConfidence;
  tags:       string[];
};

// ─── Schedule context ─────────────────────────────────────────────────────────

/**
 * Contesto orario del docente al momento del click sul menu.
 * Popolato lazily da UserWorkspace leggendo useAcademicStore one-shot.
 * Consente a suggestionEngine di produrre azioni time-sensitive.
 */
export interface ScheduleContext {
  /** ID della lezione corrente o imminente */
  currentLessonId?: string;
  /** ID / nome classe attiva */
  activeClassId?:   string;
  /** Epoch ms della prossima lezione */
  nextLessonAt?:    number;
  /** Tipo di lezione imminente */
  lessonType?:      'Teoria' | 'Disegno' | 'Laboratorio' | 'Test' | 'Verifica' | 'Disposizione' | 'Ricevimento';
  /** Minuti alla prossima lezione (negativo = già in corso) */
  minsToLesson?:    number;
}

// ============================================================================
// FUNDING DOMAIN — bandi, finanziamenti, candidature, compliance PA/GDPR
// ============================================================================

/** Tipo di progetto educativo per cui si richiedono finanziamenti */
export type ProjectType = 'Pilota AI' | 'Curriculum Innovativo' | 'Inclusione Digitale';

/** Stato del ciclo di vita di una candidatura */
export type SubmissionStatus = 'bozza' | 'inviato' | 'approvato' | 'rifiutato';

/** Livello di compliance normativa */
export type ComplianceLevel = 'conforme' | 'parziale' | 'non-conforme';

// ── Opportunità di finanziamento ─────────────────────────────────────────────

export interface FundingOpportunity {
  /** Identificativo univoco bando */
  id: string;
  /** Titolo del bando */
  titolo: string;
  /** Ente erogatore (MIM, CE, Regione, …) */
  ente: string;
  /** Data scadenza ISO YYYY-MM-DD */
  scadenza: string;
  /** Range budget in formato leggibile */
  budget: string;
  /** Tipi di progetto compatibili */
  tipoProgetto: ProjectType[];
  /** Requisiti formali obbligatori */
  requisiti: string[];
  /** Descrizione estesa del bando */
  descrizione: string;
  /** Urgenza (0-1): quanto è vicina la scadenza e quanto è raro il bando */
  urgencyScore: number;
  /** Impatto pedagogico atteso (0-1) */
  impactScore: number;
  /** URL ufficiale bando (opzionale) */
  url?: string;
  /** Attività AI suggerite per massimizzare l'impatto */
  suggestedActivities?: string[];
  /** Budget indicativo per voce di spesa (opzionale, AI-generated) */
  budgetBreakdown?: { voce: string; percentuale: number }[];
}

// ── Raccomandazioni AI ───────────────────────────────────────────────────────

export interface FundingRecommendation {
  id: string;
  titolo: string;
  descrizione: string;
  /** Valore pedagogico: come migliora l'apprendimento */
  pedagogicValue: string;
  /** Valore trust: come rafforza la fiducia scuola-famiglia */
  trustValue: string;
  /** Valore curricolare: come arricchisce il curricolo */
  curriculumValue: string;
  priorita: 'alta' | 'media' | 'bassa';
  /** Bando di riferimento */
  bandoId?: string;
}

// ── Report finale ────────────────────────────────────────────────────────────

export interface FundingReport {
  /** Tipo progetto selezionato */
  projectType: ProjectType;
  /** Score urgenza aggregato (0-1) */
  urgencyScore: number;
  /** Score compliance normativa (0-1) */
  complianceScore: number;
  /** Bandi disponibili, ordinati per relevance */
  fundingOpportunities: FundingOpportunity[];
  /** Raccomandazioni AI pedagogico/curricolari */
  recommendations: FundingRecommendation[];
  /** Documenti necessari per la candidatura */
  documentsNeeded: string[];
  /** ISO timestamp generazione report */
  generatedAt: string;
  /** Statistiche contesto classe */
  contextStats: {
    lessonCount: number;
    studentCount: number;
    udaCount: number;
    aiMaturita: 'bassa' | 'media' | 'alta';
  };
}

// ── Candidatura ──────────────────────────────────────────────────────────────

export interface CandidaturaSubmission {
  bandoId: string;
  status: SubmissionStatus;
  /** Elenco documenti allegati */
  documents: string[];
  dataSottomissione?: string;
  note?: string;
  /** Probabilità approvazione calcolata (0-1) */
  probabilitaApprovazione?: number;
  /** Bozza testuale candidatura (AI-generated) */
  bozzaTestuale?: string;
}

// ── Compliance check ─────────────────────────────────────────────────────────

export interface ComplianceCheck {
  /** Registro trattamenti GDPR art.30 + consenso alunni + DPA AI */
  gdpr: boolean;
  /** Identità digitale SPID/CIE docente */
  spid: boolean;
  /** SLA e dichiarazione accessibilità (Legge Stanca / WCAG 2.1 AA) */
  sla: boolean;
  /** DPA firmato con fornitore AI */
  dpa: boolean;
}

// ── Profilo utente per il modulo finanziamenti ───────────────────────────────

export interface UserFundingProfile {
  className: string;
  istituto?: string;
  regione?: string;
  hasSpid?: boolean;
  hasGdprRegistry?: boolean;
  hasDpa?: boolean;
  hasSla?: boolean;
  /** Anni di esperienza con AI in classe */
  aiExperienceYears?: number;
}

// ── Simulazione approvazione ─────────────────────────────────────────────────

export interface ApprovazioneSimulation {
  bandoId: string;
  probabilita: number; // 0-1
  fattoriPositivi: string[];
  fattoriRischio: string[];
  suggerimenti: string[];
}

// ============================================================================
// AI MATURITÀ PLUGIN — tipi domini per il dashboard di maturità AI
// Modulo dominio: src/types/aiMaturita.types.ts
// ============================================================================

// ── Modalità di interazione ──────────────────────────────────────────────────

/**
 * Modalità di interazione con il sistema AI.
 * Influenza solo i pannelli del plugin Maturità AI.
 *
 * - classica:       suggerimenti base, nessuna predizione.
 * - semi-osmotica:  suggerimenti avanzati con analisi trend parziali.
 * - osmotica:       tutto predittivo e proattivo, AI guida il workflow.
 */
export type InteractionMode = 'classica' | 'semi-osmotica' | 'osmotica';

// ── Sezioni della dashboard ──────────────────────────────────────────────────

/** Identificatori delle 6 sezioni di maturità valutate */
export type SectionId =
  | 'pedagogia'
  | 'trust'
  | 'curriculum'
  | 'gdpr'
  | 'accessibilita'
  | 'pa_readiness';

// ── Blockers ─────────────────────────────────────────────────────────────────

/** Severità di un blocker: impatta il punteggio e la priorità di risoluzione */
export type BlockerSeverity = 'critica' | 'media' | 'bassa';

/** Un ostacolo che abbassa il punteggio di una sezione */
export interface Blocker {
  /** Identificativo univoco del blocker */
  id: string;
  /** Descrizione leggibile del problema */
  descrizione: string;
  /** Gravità del problema */
  severita: BlockerSeverity;
  /** Azione specifica suggerita per risolvere il blocker */
  azioneSuggerita: string;
}

// ── Sezione Maturità ─────────────────────────────────────────────────────────

/** Una sezione valutata nel dashboard di maturità AI */
export interface MaturitaSection {
  /** ID univoco della sezione */
  id: SectionId;
  /** Etichetta leggibile */
  label: string;
  /** Nome icona MUI (material icons) */
  icon: string;
  /** Punteggio corrente 0-100 */
  score: number;
  /** Peso relativo per il calcolo del global score (es. 0.25) */
  weight: number;
  /** Blockers attivi che abbassano il punteggio */
  blockers: Blocker[];
  /** Raccomandazioni testuali per migliorare il punteggio */
  recommendations: string[];
  /** Se la sezione è collassata nell'UI */
  collapsed: boolean;
  /** ISO timestamp dell'ultimo aggiornamento */
  lastUpdated: string;
}

// ── Store State ───────────────────────────────────────────────────────────────

/** Stato del plugin Maturità AI (persisto su localStorage) */
export interface MaturitaState {
  /** Sezioni della dashboard con punteggi e blockers */
  sections: MaturitaSection[];
  /** Modalità di interazione correntemente selezionata */
  interactionMode: InteractionMode;
  /**
   * Punteggio globale pesato (0-100), calcolato al momento del load/recalculate.
   * Non persistito — viene ricalcolato da sections ad ogni accesso.
   */
  globalScore: number;
  /** Loading state per operazioni async (non persistito) */
  isLoading: boolean;
  /** Ultimo errore (non persistito) */
  error: string | null;
}

// ── Store Actions ─────────────────────────────────────────────────────────────

/** Azioni disponibili sullo store Maturità AI */
export interface MaturitaActions {
  /** Imposta la modalità di interazione */
  setInteractionMode: (mode: InteractionMode) => void;
  /** Apre/chiude una sezione dalla dashboard */
  toggleSection: (id: SectionId) => void;
  /** Ricalcola il globalScore dai punteggi attuali delle sezioni */
  recalculate: () => void;
  /** Resetta tutto allo stato seed dei mock data */
  reset: () => void;
  /**
   * Idrata lo store con sezioni calcolate dalla pipeline reale.
   * Sostituisce le sezioni correnti e ricalcola il globalScore.
   */
  hydrate: (sections: MaturitaSection[]) => void;
}

/** Tipo completo dello store Zustand */
export type MaturitaStore = MaturitaState & { actions: MaturitaActions };

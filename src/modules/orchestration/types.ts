/**
 * orchestration/types.ts
 *
 * Tipi del layer di orchestrazione — il "cervello runtime" che coordina
 * Cognitive Layer, Capability System e Trust Layer in un contesto unificato.
 *
 * OrchestrationContext è ephemeral: viene calcolato on-demand da buildContext()
 * e non viene persistito. Non richiede uno Zustand store.
 *
 * Separazione intenzionale:
 *   - suggestions[]  → dati raw per il pannello admin (piena verbosità)
 *   - actions[]      → derivati, semplificati, per la ThumbMenu (separation of concerns)
 */

import type { CognitiveDomain, CognitiveSuggestion, ScheduleContext } from '../cognitiveLayer/types';
import type { Capability } from '../capabilitySystem/types';
import type { UserRole } from '../../services/tenant/types';
import type { OrbitSession } from '../session/orbitSession';

export type { ScheduleContext };
export type { OrbitSession };

// ─── Trust status ──────────────────────────────────────────────────────────────

/** Stato della catena trust per un tenant. */
export type TrustStatus = 'verified' | 'broken' | 'empty';

// ─── OrchestrationAction ──────────────────────────────────────────────────────

/**
 * Azione derivata da una CognitiveSuggestion, pronta per il rendering
 * nella ThumbMenu. Non contiene dati raw — solo ciò che serve alla UI.
 */
export interface OrchestrationAction {
  /** ID univoco (derivato da suggestion.id) */
  id:            string;
  /** Label leggibile per la UI */
  label:         string;
  /** Capability richiesta per l'esecuzione (undefined = sempre abilitata) */
  capabilityId?: string;
  /** Ordine di priorità per il layout radiale: 1=critical, 2=high, 3=medium, 4=low */
  priority:      number;
  /** Tipo di azione — payload per executeAction */
  ctaType:       string;
  /** Dominio semantico di provenienza */
  domain:        CognitiveDomain;
  /**
   * Metadati arbitrari (es. skillId per dynamic skills).
   * Usato da executeAction per routing esteso.
   */
  meta?:         Record<string, unknown>;
}

// ─── OrchestrationContext ─────────────────────────────────────────────────────

/**
 * Contesto di orchestrazione calcolato on-demand per un input specifico.
 * Contiene tutto ciò che serve alla UI per mostrare azioni contestuali.
 */
export interface OrchestrationContext {
  /** ID dell'input/entry che ha generato questo context */
  inputId:      string;
  /** Suggerimenti raw del Cognitive Layer (per admin panel) */
  suggestions:  CognitiveSuggestion[];
  /** Azioni derivate per la ThumbMenu (già filtrate per ruolo) */
  actions:      OrchestrationAction[];
  /** Lista capability del tenant (con stato effettivo) */
  capabilities: Capability[];
  /** Stato della catena trust */
  trustStatus:  TrustStatus;
}

// ─── OrchestrationOptions ────────────────────────────────────────────────────

/** Opzioni per buildContext — filtri di ruolo e dominio. */
export interface OrchestrationOptions {
  /** ID del tenant attivo */
  tenantId:         string;
  /** Ruolo utente — determina quali azioni sono visibili */
  role?:            UserRole;
  /** Dominio utente — contesto operativo corrente */
  domain?:          'school' | 'admin';
  /** Numero massimo di suggerimenti da considerare (default: 10) */
  maxSuggestions?:  number;
  /**
   * Contesto orario del docente (popolato lazily).
   * Passato a suggestionEngine per azioni time-sensitive (OPEN_REGISTER,
   * LOAD_DELIVERABLE) senza polling continuo del calendario.
   */
  scheduleContext?: ScheduleContext;
  /**
   * Sessione Orbit corrente — usata per re-ranking contestuale delle azioni.
   * teaching  → boost OPEN_CLASS_CONTEXT, MARK_ATTENDANCE
   * planning  → boost EXPORT_UDA, LOAD_MATERIAL
   * administrative → boost compliance/audit actions
   */
  session?: OrbitSession;
}

// ─── ExecuteActionResult ──────────────────────────────────────────────────────

/** Risultato dell'esecuzione di un'azione. */
export interface ExecuteActionResult {
  /** true se l'azione è stata eseguita */
  success:    boolean;
  /** Messaggio di errore se success === false */
  reason?:    string;
  /** ID del TrustRecord creato (se applicabile) */
  trustRecordId?: string;
}

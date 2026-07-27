/**
 * capabilitySystem/types.ts
 *
 * Tipi per il sistema di capability (feature flags a livello tenant).
 *
 * Una Capability è una funzionalità dell'applicazione che può essere:
 *   - ACTIVE   → già sbloccata e disponibile
 *   - LOCKED   → visibile ma non abilitata (preview / upsell)
 *   - HIDDEN   → non visibile (futura / non annunciata)
 *
 * Le capability sono aggregate in CapabilityModule (raggruppamento logico).
 */

// ─── Core types ───────────────────────────────────────────────────────────────

export type CapabilityState = 'active' | 'locked' | 'hidden';

export type CapabilityTier = 'free' | 'pilot' | 'standard' | 'enterprise';

export type CapabilityCategory =
  | 'ai'
  | 'compliance'
  | 'commercial'
  | 'pedagogical'
  | 'administrative'
  | 'integration'
  | 'advanced';

export interface Capability {
  /** Identificatore univoco della capability, es. 'cognitive_layer', 'sales_pack' */
  id: string;
  /** Nome leggibile dalla UI */
  name: string;
  /** Descrizione breve visible in pannelli e tooltip */
  description: string;
  /** Icona (nome MUI icon, es. 'Psychology') */
  icon: string;
  /** Categoria di raggruppamento */
  category: CapabilityCategory;
  /** Tier minimo richiesto per abilitarla */
  requiredTier: CapabilityTier;
  /** Stato corrente dell'installazione per questo tenant */
  state: CapabilityState;
  /** Possibile CTA quando locked, es. 'Richiedi accesso' */
  upgradeCta?: string;
  /** Data di sblocco (se state === 'active') */
  unlockedAt?: number;
  /** Actor che l'ha sbloccata */
  unlockedBy?: string;
}

export interface CapabilityModule {
  /** Identificatore del modulo, es. 'ai_pipeline' */
  moduleId: string;
  /** Nome del modulo */
  name: string;
  /** Lista di capability ID appartenenti a questo modulo */
  capabilityIds: string[];
}

// ─── Gate type ────────────────────────────────────────────────────────────────

/**
 * Risultato di una verifica di capabilità.
 * Usato per decisioni condizionali nei componenti.
 */
export interface CapabilityGate {
  allowed: boolean;
  state: CapabilityState;
  upgradeCta?: string;
}

// ─── Store state ──────────────────────────────────────────────────────────────

export interface CapabilityRecord {
  tenantId: string;
  capabilityId: string;
  state: CapabilityState;
  tier: CapabilityTier;
  unlockedAt?: number;
  unlockedBy?: string;
}

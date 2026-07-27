/**
 * orchestration/skillRegistry.ts
 *
 * SkillRegistry — registro dinamico delle skill di Orbit Jarvis.
 *
 * Sostituisce la mappa statica CTA_CAPABILITY_MAP: ogni skill può essere
 * registrata all'avvio senza modificare orchestrationService.ts.
 *
 * Uso:
 *   import { skillRegistry } from './skillRegistry';
 *   skillRegistry.register({ ctaType: 'MY_ACTION', ... });
 *   skillRegistry.resolve('MY_ACTION');   // → OrbitSkill | undefined
 *
 * Design:
 *   - Singleton module-level (non uno Zustand store — no persistence)
 *   - Pure sync — nessun side-effect
 *   - Thread-safe per singola tab (SPA)
 */

import type { CognitiveDomain } from '../cognitiveLayer/types';
import type { UserRole } from '../../services/tenant/types';
import type { CognitiveSuggestion } from '../cognitiveLayer/types';
import type { ExecuteActionResult, OrchestrationOptions } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Definizione di una skill registrabile nell'Orbit SkillRegistry.
 *
 * handler è opzionale: se assente, executeAction() usa il behaviore di
 * default (capability check → TrustRecord).
 * Se presente, executeAction() delega completamente al handler.
 */
export interface OrbitSkill {
  /** Tipo di azione — chiave univoca (es. 'RUN_AUDIT', 'OPEN_REGISTER') */
  ctaType: string;
  /** Label leggibile (usata in fallback ThumbMenu se non disponibile da CognitiveSuggestion) */
  label: string;
  /** Capability gate: undefined = sempre disponibile */
  capabilityId?: string;
  /** Ruoli autorizzati: undefined = tutti */
  allowedRoles?: UserRole[];
  /** Dominio semantico principale */
  domain: CognitiveDomain;
  /** Handler custom opzionale — sostituisce il comportamento default di executeAction */
  handler?: (
    suggestion: CognitiveSuggestion,
    opts: OrchestrationOptions,
  ) => Promise<ExecuteActionResult>;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

class SkillRegistryImpl {
  private _skills = new Map<string, OrbitSkill>();

  /**
   * Registra una skill. Sovrascrive silenziosamente se ctaType già presente.
   */
  register(skill: OrbitSkill): void {
    this._skills.set(skill.ctaType, skill);
  }

  /**
   * Resituisce la skill per ctaType, o undefined se non registrata.
   */
  resolve(ctaType: string): OrbitSkill | undefined {
    return this._skills.get(ctaType);
  }

  /**
   * Lista di tutte le skill registrate (copia difensiva).
   */
  list(): OrbitSkill[] {
    return [...this._skills.values()];
  }

  /**
   * Verifica se un ruolo è autorizzato ad eseguire una skill.
   * Se allowedRoles non è definito, tutti i ruoli sono autorizzati.
   */
  isAllowedForRole(ctaType: string, role?: UserRole): boolean {
    const skill = this._skills.get(ctaType);
    if (!skill || !skill.allowedRoles || skill.allowedRoles.length === 0) return true;
    if (!role) return false;
    return skill.allowedRoles.includes(role);
  }
}

export const skillRegistry = new SkillRegistryImpl();

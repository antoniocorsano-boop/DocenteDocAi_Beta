/**
 * decisionContract.ts — Contratto di Governance del Sistema Cognitivo
 *
 * ⚖️ LEGGE FONDANTE: "L'AI non deve mai sostituire il docente.
 *    Deve renderlo più consapevole delle proprie possibilità."
 *
 * Ogni suggerimento prodotto dal sistema DEVE passare dalla validazione
 * di questo contratto. I suggerimenti che lo violano vengono scartati.
 *
 * Modifiche a questo file richiedono approvazione architetturale esplicita.
 */

// ── Tipi interni ─────────────────────────────────────────────────────────────

export type SuggestionSource = 'copilot' | 'pattern' | 'artistic';

export interface ContractViolation {
  rule: string;
  detail: string;
}

export interface ValidatableSuggestion {
  id: string;
  actionKey?: string;
  source?: SuggestionSource;
  reason?: string;
  priority?: number;
}

// ── Contratto ────────────────────────────────────────────────────────────────

export const DecisionContract = {
  /**
   * Massimo numero di suggerimenti attivi mostrati all'utente.
   * Protegge dall'overload cognitivo.
   */
  MAX_SUGGESTIONS: 3,

  /**
   * Ogni suggerimento deve avere un actionKey stabile per tracciabilità,
   * deduplicazione e feedback loop.
   */
  mustHaveActionKey: true,

  /**
   * Sorgenti consentite di suggerimenti.
   * Nessun suggerimento può provenire da sorgenti non registrate.
   */
  allowedSuggestionSources: ['copilot', 'pattern', 'artistic'] as const,

  /**
   * Nessuna automazione può avvenire senza azione esplicita del docente.
   * Il sistema può suggerire, MAI eseguire autonomamente.
   */
  forbidSilentAutomation: true,

  /**
   * Ogni suggerimento deve avere un `reason` leggibile:
   * il docente deve sempre poter capire "perché me lo stai mostrando?"
   */
  requireTraceability: true,

  /**
   * Durata del cooldown per lo stesso actionKey (6 ore).
   * Evita spam cognitivo sullo stesso suggerimento.
   */
  COOLDOWN_MS: 6 * 60 * 60 * 1000,

  /**
   * Livello minimo (capabilityLevel) per i suggerimenti artistici.
   * Il Consilium Artistico entra solo da livello praticante (≥ 2).
   */
  ARTISTIC_MIN_CAPABILITY_LEVEL: 2,

  /**
   * Quante volte un suggerimento può essere ignorato prima che la
   * sua priorità venga ridotta automaticamente nel TeacherModel.
   */
  IGNORED_THRESHOLD_FOR_DEPRIORITIZE: 3,

  /**
   * Priorità base per i suggerimenti di fallback (fail-safe).
   * Sempre inferiore ai suggerimenti normali.
   */
  FALLBACK_PRIORITY: -1,
} as const;

// ── Validazione ───────────────────────────────────────────────────────────────

/**
 * Valida un suggerimento contro il DecisionContract.
 * Restituisce un array di violazioni (vuoto = conforme).
 */
export function validateSuggestion(sug: ValidatableSuggestion): ContractViolation[] {
  const violations: ContractViolation[] = [];

  if (DecisionContract.mustHaveActionKey && !sug.actionKey) {
    violations.push({
      rule: 'mustHaveActionKey',
      detail: `Suggestion "${sug.id}" manca di actionKey — impossibile tracciare o deduplicare.`,
    });
  }

  if (DecisionContract.requireTraceability && !sug.reason) {
    violations.push({
      rule: 'requireTraceability',
      detail: `Suggestion "${sug.id}" manca di reason — il docente non può capire il perché.`,
    });
  }

  if (
    sug.source !== undefined &&
    !DecisionContract.allowedSuggestionSources.includes(sug.source)
  ) {
    violations.push({
      rule: 'allowedSuggestionSources',
      detail: `Suggestion "${sug.id}" ha sorgente non consentita: "${sug.source}".`,
    });
  }

  return violations;
}

/**
 * Applica il DecisionContract a un array di suggerimenti.
 * I suggerimenti non conformi vengono eliminati (con warning in dev).
 * Garantisce che il risultato non superi MAX_SUGGESTIONS.
 */
export function applyContract<T extends ValidatableSuggestion>(suggestions: T[]): T[] {
  const valid: T[] = [];

  for (const sug of suggestions) {
    const violations = validateSuggestion(sug);
    if (violations.length > 0) {
      if (import.meta.env.DEV) {
        for (const v of violations) {
          console.warn(`[DecisionContract] Violazione "${v.rule}": ${v.detail}`);
        }
      }
      continue; // scarta
    }
    valid.push(sug);
  }

  return valid.slice(0, DecisionContract.MAX_SUGGESTIONS);
}

/**
 * orchestration/emergentSkillStore.ts
 *
 * Store in-memory per le skill emergenti confermate dall'utente.
 *
 * Ciclo di vita di una DynamicSkill:
 *   1. pattern rilevato da patternDetector
 *   2. utente conferma → register()
 *   3. ogni esecuzione → incrementUsage() (confidence +0.10, cap 1.0)
 *   4. decay() chiamato periodicamente → confidence -0.15; rimozione se < 0.05
 *
 * Non persiste a localStorage (PRE-PROD: intentional).
 * Non usa Zustand: dati effimeri, non richiedono re-render globale.
 */

import type { CognitiveDomain } from '../cognitiveLayer/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DynamicSkillAction {
  /** ctaType da eseguire quando la skill viene attivata */
  ctaType:   string;
  /** Payload opzionale (riservato per espansioni future) */
  payload?:  Record<string, unknown>;
}

export interface DynamicSkillTrigger {
  /** Dominio di contesto che attiva la skill (opzionale = qualsiasi) */
  domain?:    CognitiveDomain;
  /** Tag di contesto. Un overlap di ≥1 tag attiva il match */
  tags?:      string[];
  /** Tipo di input (opzionale — es. 'text') */
  inputType?: string;
}

export interface DynamicSkill {
  /** ID univoco generato alla creazione */
  id:          string;
  /** Label leggibile (auto-generato da ctaType o personalizzato) */
  name:        string;
  /** Condizioni di attivazione della skill */
  trigger:     DynamicSkillTrigger;
  /** Sequenza di azioni da eseguire */
  actions:     DynamicSkillAction[];
  /** Contatore utilizzi confermati */
  usageCount:  number;
  /** Rilevanza 0–1 (aumenta con uso, decresce con inattività) */
  confidence:  number;
  /** Epoch ms della creazione */
  createdAt:   number;
  /** Epoch ms dell'ultimo utilizzo */
  lastUsedAt?: number;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface MatchContext {
  domain?:    CognitiveDomain;
  tags?:      string[];
  inputType?: string;
}

const CONFIDENCE_GAIN  = 0.10;
const CONFIDENCE_DECAY = 0.15;
const CONFIDENCE_MIN   = 0.05;
const INITIAL_CONFIDENCE = 0.55;

class EmergentSkillStore {
  private _skills = new Map<string, DynamicSkill>();

  /** Registra una nuova skill emergente confermata dall'utente. */
  register(skill: DynamicSkill): void {
    this._skills.set(skill.id, skill);
  }

  /** Risolve una skill per ID. */
  resolve(id: string): DynamicSkill | undefined {
    return this._skills.get(id);
  }

  /** Lista di tutte le skill registrate (copia). */
  list(): DynamicSkill[] {
    return [...this._skills.values()];
  }

  /**
   * Restituisce le skill attivabili nel contesto corrente.
   *
   * Una skill è attiva se:
   *   – il dominio coincide (o non è specificato nel trigger), E/O
   *   – almeno 1 tag del contesto è presente nel trigger.tags
   *
   * Ordinate per confidence decrescente.
   */
  match(ctx: MatchContext): DynamicSkill[] {
    const results: DynamicSkill[] = [];

    for (const skill of this._skills.values()) {
      const { trigger } = skill;

      const domainMatch = !trigger.domain || trigger.domain === ctx.domain;
      const tagMatch =
        !trigger.tags?.length ||
        (ctx.tags ?? []).some(t => trigger.tags!.includes(t));

      if (domainMatch && tagMatch) {
        results.push(skill);
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Restituisce la prima skill che contiene `ctaType` tra le proprie actions.
   * Usato dal loop di auto-fire per verificare se un pattern corrisponde
   * a una skill già confermata senza passare per l'ID.
   */
  resolveByCtaType(ctaType: string): DynamicSkill | undefined {
    for (const skill of this._skills.values()) {
      if (skill.actions.some(a => a.ctaType === ctaType)) return skill;
    }
    return undefined;
  }

  /**
   * Incrementa usageCount e aumenta confidence (+0.10, cap 1.0).
   * Chiamare dopo ogni esecuzione riuscita.
   */
  incrementUsage(id: string): void {
    const skill = this._skills.get(id);
    if (!skill) return;
    skill.usageCount  += 1;
    skill.confidence   = Math.min(1, skill.confidence + CONFIDENCE_GAIN);
    skill.lastUsedAt   = Date.now();
  }

  /**
   * Applica un tick di decay a tutte le skill.
   * Rimuove quelle scese sotto la soglia minima.
   *
   * Da chiamare periodicamente (es. all'avvio dell'app, o ogni ora).
   */
  decay(): void {
    for (const [id, skill] of this._skills) {
      skill.confidence -= CONFIDENCE_DECAY;
      if (skill.confidence < CONFIDENCE_MIN) {
        this._skills.delete(id);
      }
    }
  }

  /** Costruisce una DynamicSkill da un pattern rilevato. */
  buildFromPattern(params: {
    ctaType:   string;
    name:      string;
    domain?:   CognitiveDomain;
    tags?:     string[];
    inputType?: string;
  }): DynamicSkill {
    return {
      id:         `dsk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name:       params.name,
      trigger: {
        domain:    params.domain,
        tags:      params.tags ?? [],
        inputType: params.inputType,
      },
      actions:    [{ ctaType: params.ctaType }],
      usageCount: 0,
      confidence: INITIAL_CONFIDENCE,
      createdAt:  Date.now(),
    };
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const emergentSkillStore = new EmergentSkillStore();

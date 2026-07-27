/**
 * hooks/useSkillSuggestion.ts
 *
 * Hook React che espone la proposta di skill emergente all'utente.
 *
 * – Ogni 5 secondi chiama detectPattern().
 * – Se viene rilevato un pattern non ancora suggerito nella sessione,
 *   aggiorna `skillDraft` con i dati del pattern rilevato.
 * – `confirmSkill` costruisce e registra la DynamicSkill, poi pulisce il log.
 * – `dismissSkill` pulisce il log senza creare la skill.
 *
 * Dedup sessione: usa sessionStorage per evitare di riproporre lo stesso
 * ctaType già suggerito (dimenticato al reload = comportamento desiderato).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearActionLog,
  detectPattern,
  type DetectedPattern,
} from '../modules/orchestration/patternDetector';
import { emergentSkillStore } from '../modules/orchestration/emergentSkillStore';
import { useTrustStore }       from '../stores/useTrustStore';
import { getExecutionVisibility } from '../modules/trust/trustEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SkillDraft = DetectedPattern;

export interface UseSkillSuggestionReturn {
  /** Pattern in attesa di conferma, o null. */
  skillDraft:    SkillDraft | null;
  /** Confirma la creazione della skill e registra nello store. */
  confirmSkill:  () => void;
  /** Ignora il suggerimento senza creare la skill. */
  dismissSkill:  () => void;
  /**
   * Numero totale di auto-esecuzioni questa sessione (silent + ambient).
   */
  autoFiredCount: number;
  /**
   * Numero di auto-esecuzioni in modalità ambient (trust 0.75–0.89).
   * Usato da UserWorkspace per attivare il micro-glow sull'hub button.
   */
  ambientFiredCount: number;
  /**
   * Segnala che l'utente ha annullato un'azione auto-eseguita da Jarvis.
   * Applica una penaltà forte su skillTrust[skillId] (-0.20).
   */
  reportReversal: (skillId: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS   = 5_000;
const SESSION_KEY_PREFIX = 'jarvis_dismissed_skill_';
const DYNAMIC_PREFIX     = 'DYNAMIC_SKILL::';
/** Ogni N tick del poll da 5s si applica un tick di decay (720 × 5s = 60 min). */
const DECAY_EVERY_N_TICKS = 720;

// ─── Label lookup ─────────────────────────────────────────────────────────────

const CTA_LABELS: Record<string, string> = {
  OPEN_REGISTER:           'Apri registro',
  ADD_ANNOTATION:          'Aggiungi annotazione',
  START_LESSON:            'Avvia lezione',
  OPEN_RESOURCES:          'Apri risorse',
  NEW_UDA:                 'Nuova UDA',
  OPEN_PLANNING:           'Apri pianificazione',
  SAVE_DOCUMENT:           'Salva documento',
  GENERATE_REPORT:         'Genera report',
  OPEN_EVALUATION:         'Apri valutazione',
  SEND_NOTIFICATION:       'Invia notifica',
  // Estensibile: aggiungere voci al crescere del sistema
};

/** Genera un nome leggibile in italiano per un ctaType. */
export function autoName(ctaType: string): string {
  if (ctaType.startsWith(DYNAMIC_PREFIX)) {
    return 'Skill personalizzata';
  }
  return CTA_LABELS[ctaType] ?? ctaType.replace(/_/g, ' ').toLowerCase();
}

// ─── Session dedup ────────────────────────────────────────────────────────────

function wasDismissed(ctaType: string): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY_PREFIX + ctaType) === '1';
  } catch {
    return false;
  }
}

function markDismissed(ctaType: string): void {
  try {
    sessionStorage.setItem(SESSION_KEY_PREFIX + ctaType, '1');
  } catch {
    /* storage non disponibile — silenzioso */
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSkillSuggestion(): UseSkillSuggestionReturn {
  const [skillDraft, setSkillDraft]         = useState<SkillDraft | null>(null);
  const [autoFiredCount, setAutoFiredCount] = useState(0);
  const [ambientFiredCount, setAmbientFiredCount] = useState(0);
  const autoFiredRef    = useRef(0);
  const ambientFiredRef = useRef(0);
  const decayTickRef    = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      // Non proporre se c'è già un draft in attesa
      if (skillDraft !== null) return;

      // ── Decay periodico (ogni 60 min) ───────────────────────────────────
      decayTickRef.current += 1;
      if (decayTickRef.current >= DECAY_EVERY_N_TICKS) {
        decayTickRef.current = 0;
        const storeActions = useTrustStore.getState().actions;
        for (const skill of emergentSkillStore.list()) {
          storeActions.decaySkill(skill.id);
        }
      }

      const pattern = detectPattern();
      if (!pattern) return;

      // ── 3-tier execution visibility ──────────────────────────────────
      // silent   (≥ 0.90) — opera senza nessun segnale
      // ambient  (0.75–0.89) — opera + micro-glow sull'hub button
      // explicit (< 0.75)  — mostra card di proposta come al solito
      const existingSkill = emergentSkillStore.resolveByCtaType(pattern.ctaType);
      if (existingSkill) {
        const trust      = useTrustStore.getState().score;
        const visibility = getExecutionVisibility(existingSkill.id, trust);
        if (visibility === 'silent' || visibility === 'ambient') {
          emergentSkillStore.incrementUsage(existingSkill.id);
          useTrustStore.getState().actions.applyEvent({
            type: 'skill_used',
            skillId: existingSkill.id,
          });
          clearActionLog();
          autoFiredRef.current += 1;
          setAutoFiredCount(autoFiredRef.current);
          if (visibility === 'ambient') {
            ambientFiredRef.current += 1;
            setAmbientFiredCount(ambientFiredRef.current);
          }
          return;
        }
      }
      // ── Explicit path (card proposta) ───────────────────────────────
      if (wasDismissed(pattern.ctaType)) return;

      setSkillDraft(pattern);
    }, POLL_INTERVAL_MS);

    return clearTimer;
  }, [clearTimer, skillDraft]);

  const confirmSkill = useCallback(() => {
    if (!skillDraft) return;

    const skill = emergentSkillStore.buildFromPattern({
      ctaType:   skillDraft.ctaType,
      name:      autoName(skillDraft.ctaType),
      domain:    skillDraft.domain,
      tags:      skillDraft.tags,
    });

    emergentSkillStore.register(skill);
    clearActionLog();
    markDismissed(skillDraft.ctaType);
    setSkillDraft(null);
  }, [skillDraft]);

  const dismissSkill = useCallback(() => {
    if (!skillDraft) return;
    markDismissed(skillDraft.ctaType);
    clearActionLog();
    setSkillDraft(null);
  }, [skillDraft]);

  /**
   * Segnala a Jarvis che l'utente ha annullato un'azione auto-eseguita.
   * Applica penaltà -0.20 su skillTrust[skillId] e -0.05 su systemTrust.
   */
  const reportReversal = useCallback((skillId: string): void => {
    useTrustStore.getState().actions.applyEvent({
      type: 'skill_auto_reversed',
      skillId,
    });
  }, []);

  return { skillDraft, confirmSkill, dismissSkill, autoFiredCount, ambientFiredCount, reportReversal };
}

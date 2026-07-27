/**
 * stores/useTrustStore.ts
 *
 * Zustand persist store per il Trust Engine di Jarvis.
 * Persiste il TrustScore in localStorage (chiave: jarvis_trust_v1).
 *
 * Uso minimo:
 *   const score = useTrustStore(s => s.score);
 *   useTrustStore.getState().actions.applyEvent({ type: 'delta_dismissed', ... })
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_TRUST,
  applyTrustEvent,
  decaySkillTrust,
  trustHealthScore,
  type TrustScore,
  type TrustEvent,
} from '../modules/trust/trustEngine';

// ─── State shape ──────────────────────────────────────────────────────────────

interface TrustState {
  score: TrustScore;
  actions: {
    /** Aggiorna il trust score in risposta a un evento (apply/dismiss/correct/reversed). */
    applyEvent:      (event: TrustEvent) => void;
    /** Azzera il trust per una skill specifica (es. quando rimossa). */
    resetSkillTrust: (skillId: string)   => void;
    /** Applica un tick di decadimento al skillTrust di una skill inattiva. */
    decaySkill:      (skillId: string)   => void;
    /** Ripristina il punteggio di default (es. reset stato utente). */
    reset:           ()                  => void;
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useTrustStore = create<TrustState>()(
  persist(
    (set) => ({
      score: DEFAULT_TRUST,
      actions: {
        applyEvent: (event) =>
          set((s) => ({ score: applyTrustEvent(event, s.score) })),

        resetSkillTrust: (skillId) =>
          set((s) => ({
            score: {
              ...s.score,
              skillTrust: { ...s.score.skillTrust, [skillId]: 0.50 },
            },
          })),

        decaySkill: (skillId) =>
          set((s) => ({ score: decaySkillTrust(s.score, skillId) })),

        reset: () => set({ score: DEFAULT_TRUST }),
      },
    }),
    {
      name:       'jarvis_trust_v1',
      partialize: (s) => ({ score: s.score }),
    },
  ),
);

// ─── Derived selectors ────────────────────────────────────────────────────────

/** Health score composito [0–100] per display. */
export const selectTrustHealth = (s: TrustState): number =>
  trustHealthScore(s.score);

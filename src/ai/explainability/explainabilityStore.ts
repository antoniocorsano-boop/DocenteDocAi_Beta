/**
 * explainabilityStore.ts — Zustand store for the Explainability module.
 *
 * Holds per-student `AIExplanation` records produced by `explainClass()`.
 * No persistence: explanations are recomputed on demand from live data.
 *
 * Typical usage:
 *   1. AI analysis completes  →  call `actions.explain(students, evals, riskPredictions)`
 *   2. UI components read     →  `useExplainabilityStore(s => s.explanations.get(id))`
 */

import { create } from 'zustand';
import type { Studente, Valutazione } from '@/types/student.types';
import type { StudentRiskPrediction } from '../prediction/types';
import { explainClass, explainStudent } from './decisionExplainer';
import type { AIExplanation } from './decisionExplainer';

// ── types ─────────────────────────────────────────────────────────────────────

interface ExplainabilityState {
  /** Map of studentId → AIExplanation, populated after explain() */
  explanations: Map<string, AIExplanation>;
  /** Whether an explanation run is in progress (future async extension point) */
  computing: boolean;
  /** Last error, if any */
  error: string | null;
  /** ISO timestamp of last successful explain call */
  lastComputedAt: string | null;
}

interface ExplainabilityActions {
  /**
   * (Re-)compute explanations for a whole class.
   * Typically called right after runUnifiedAnalysis completes.
   */
  explain: (
    students: Studente[],
    evaluations: Valutazione[],
    riskPredictions: StudentRiskPrediction[],
  ) => void;

  /**
   * Explain a single student without replacing the rest of the class.
   * Useful for on-demand drill-down in StudentInsightPanel.
   */
  explainOne: (
    student: Studente,
    evaluations: Valutazione[],
    riskProbability: number,
  ) => void;

  /** Remove all stored explanations */
  clear: () => void;
}

export type ExplainabilityStore = ExplainabilityState & { actions: ExplainabilityActions };

// ── store ─────────────────────────────────────────────────────────────────────

export const useExplainabilityStore = create<ExplainabilityStore>()((set) => ({
  // ── state ──────────────────────────────────────────────────────────────────
  explanations: new Map(),
  computing: false,
  error: null,
  lastComputedAt: null,

  // ── actions ────────────────────────────────────────────────────────────────
  actions: {
    explain(students, evaluations, riskPredictions) {
      try {
        const explanations = explainClass(students, evaluations, riskPredictions);
        set({
          explanations,
          computing: false,
          error: null,
          lastComputedAt: new Date().toISOString(),
        });
      } catch (err) {
        set({ error: err instanceof Error ? err.message : String(err), computing: false });
      }
    },

    explainOne(student, evaluations, riskProbability) {
      try {
        const explanation = explainStudent(student, evaluations, riskProbability);
        set(s => {
          const next = new Map(s.explanations);
          next.set(student.id, explanation);
          return { explanations: next, error: null };
        });
      } catch (err) {
        set({ error: err instanceof Error ? err.message : String(err) });
      }
    },

    clear() {
      set({ explanations: new Map(), lastComputedAt: null, error: null });
    },
  },
}));

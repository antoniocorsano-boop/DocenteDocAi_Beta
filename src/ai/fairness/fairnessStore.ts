/**
 * fairnessStore.ts — Sprint 5: Bias Detection
 *
 * Ephemeral Zustand store (no persistence) that holds the latest bias report
 * for the active class. Follows the same pattern as explainabilityStore.ts.
 */

import { create } from 'zustand';
import type { Studente } from '@/types/student.types';
import type { AIExplanation } from '../explainability/decisionExplainer';
import { generateBiasReport, type BiasReport } from './biasReport';

// ── types ────────────────────────────────────────────────────────────────────

interface FairnessState {
  report:          BiasReport | null;
  computing:       boolean;
  error:           string | null;
  lastComputedAt:  string | null;
}

interface FairnessActions {
  /**
   * Compute (or re-compute) the bias report for the given students and
   * the explanation map produced by the Sprint 4 explainabilityStore.
   */
  compute(students: Studente[], explanations: Map<string, AIExplanation>): void;
  /** Clear the current report. */
  clear(): void;
}

export type FairnessStore = FairnessState & { actions: FairnessActions };

// ── store ─────────────────────────────────────────────────────────────────────

export const useFairnessStore = create<FairnessStore>()((set) => ({
  // state
  report:         null,
  computing:      false,
  error:          null,
  lastComputedAt: null,

  // actions
  actions: {
    compute(students, explanations) {
      if (students.length === 0) {
        set({ report: null, error: 'Nessuno studente disponibile.', computing: false });
        return;
      }
      set({ computing: true, error: null });
      try {
        const report = generateBiasReport(students, explanations);
        set({
          report,
          computing:      false,
          error:          null,
          lastComputedAt: report.computedAt,
        });
      } catch (err) {
        set({
          computing: false,
          error: err instanceof Error ? err.message : 'Errore nel calcolo del bias report.',
        });
      }
    },

    clear() {
      set({ report: null, error: null, lastComputedAt: null });
    },
  },
}));

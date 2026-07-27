/**
 * trustStore.ts — Sprint 7: AI Trust Score
 *
 * Ephemeral Zustand store (no persistence) that holds the latest AI Trust
 * Report for the active class analysis session.
 * Follows the same pattern as fairnessStore.ts (Sprint 5).
 */

import { create } from 'zustand';
import type { AIExplanation } from '../explainability/decisionExplainer';
import type { BiasLevel } from '../fairness/biasReport';
import { generateTrustReport, type TrustReport } from './trustReport';

// ── types ─────────────────────────────────────────────────────────────────────

interface TrustState {
  report:         TrustReport | null;
  computing:      boolean;
  error:          string | null;
  lastComputedAt: string | null;
}

interface TrustActions {
  /**
   * Compute (or re-compute) the trust report.
   *
   * @param explanations  From Sprint 4 `explainClass()`
   * @param biasLevel     From Sprint 5 `generateBiasReport().level`
   * @param pedagogyScore From Sprint 6 `PedagogyReport.overallScore`
   * @param affectedIds   From Sprint 5 — student IDs in high-disparity groups
   */
  compute(
    explanations: AIExplanation[],
    biasLevel: BiasLevel,
    pedagogyScore?: number,
    affectedIds?: Set<string>,
  ): void;
  /** Clear the current report and any error state. */
  clear(): void;
}

export type TrustStore = TrustState & { actions: TrustActions };

// ── store ─────────────────────────────────────────────────────────────────────

export const useTrustStore = create<TrustStore>()((set) => ({
  // state
  report:         null,
  computing:      false,
  error:          null,
  lastComputedAt: null,

  // actions
  actions: {
    compute(explanations, biasLevel, pedagogyScore = 0, affectedIds = new Set()) {
      if (explanations.length === 0) {
        set({
          report:    null,
          error:     'Nessuna spiegazione AI disponibile per il calcolo del punteggio di fiducia.',
          computing: false,
        });
        return;
      }
      set({ computing: true, error: null });
      try {
        const report = generateTrustReport(explanations, biasLevel, pedagogyScore, affectedIds);
        set({
          report,
          computing:      false,
          error:          null,
          lastComputedAt: report.computedAt,
        });
      } catch (err) {
        set({
          computing: false,
          error: err instanceof Error
            ? err.message
            : 'Errore nel calcolo del punteggio di fiducia AI.',
        });
      }
    },

    clear() {
      set({ report: null, error: null, lastComputedAt: null });
    },
  },
}));

/**
 * recommendationStore.ts — Sprint 8: AI Decision Support
 *
 * Ephemeral Zustand store (no persistence) for recommendation results.
 * Follows the same pattern as trustStore.ts (Sprint 7).
 */

import { create } from 'zustand';
import type { PedagogyReport } from '../pedagogy/pedagogyReport';
import type { TrustReport } from '../trust/trustReport';
import type { BenchmarkMetrics } from '../simulation/benchmarkMetrics';
import { generateRecommendations, type Recommendation } from './lessonRecommender';

// ── types ─────────────────────────────────────────────────────────────────────

interface RecommendationState {
  recommendations: Recommendation[];
  computing:       boolean;
  error:           string | null;
  lastComputedAt:  string | null;
}

interface RecommendationActions {
  /**
   * Compute (or re-compute) recommendations from the three signal sources.
   * At least one input array must be non-empty.
   */
  compute(
    pedagogyReports: PedagogyReport[],
    trustReports:    TrustReport[],
    benchmarks:      BenchmarkMetrics[],
  ): void;
  /** Clear all results and errors. */
  clear(): void;
}

export type RecommendationStore = RecommendationState & { actions: RecommendationActions };

// ── store ─────────────────────────────────────────────────────────────────────

export const useRecommendationStore = create<RecommendationStore>()((set) => ({
  // state
  recommendations: [],
  computing:       false,
  error:           null,
  lastComputedAt:  null,

  // actions
  actions: {
    compute(pedagogyReports, trustReports, benchmarks) {
      if (
        pedagogyReports.length === 0 &&
        trustReports.length === 0 &&
        benchmarks.length === 0
      ) {
        set({
          recommendations: [],
          error:           'Nessun dato disponibile per generare raccomandazioni. Calcola prima il report pedagogico, il punteggio di fiducia e le simulazioni.',
          computing:       false,
        });
        return;
      }

      set({ computing: true, error: null });

      try {
        const recommendations = generateRecommendations(
          pedagogyReports,
          trustReports,
          benchmarks,
        );

        set({
          recommendations,
          computing:      false,
          error:          recommendations.length === 0
            ? null
            : null,
          lastComputedAt: new Date().toISOString(),
        });
      } catch (err) {
        set({
          computing: false,
          error:     err instanceof Error
            ? err.message
            : 'Errore nel calcolo delle raccomandazioni AI.',
        });
      }
    },

    clear() {
      set({
        recommendations: [],
        error:           null,
        lastComputedAt:  null,
        computing:       false,
      });
    },
  },
}));

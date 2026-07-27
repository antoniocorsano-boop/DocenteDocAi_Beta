/**
 * pedagogyStore.ts — Sprint 6: Pedagogical Alignment
 *
 * Ephemeral Zustand store (no persistence) that holds the latest pedagogy
 * report for the teacher's current lesson register and UDA set.
 * Follows the same pattern as fairnessStore.ts (Sprint 5).
 */

import { create } from 'zustand';
import type { Lezione } from '@/types/uda.types';
import type { Uda } from '@/types/uda.types';
import { generatePedagogyReport, type PedagogyReport } from './pedagogyReport';

// ── types ─────────────────────────────────────────────────────────────────────

interface PedagogyState {
  report:         PedagogyReport | null;
  computing:      boolean;
  error:          string | null;
  lastComputedAt: string | null;
}

interface PedagogyActions {
  /**
   * Compute (or re-compute) a PedagogyReport for the given lessons and UDAs.
   * Either argument may be an empty array; the report handles the missing data.
   */
  compute(lessons: Lezione[], udas: Uda[]): void;
  /** Clear the current report and any error state. */
  clear(): void;
}

export type PedagogyStore = PedagogyState & { actions: PedagogyActions };

// ── store ─────────────────────────────────────────────────────────────────────

export const usePedagogyStore = create<PedagogyStore>()((set) => ({
  // state
  report:         null,
  computing:      false,
  error:          null,
  lastComputedAt: null,

  // actions
  actions: {
    compute(lessons, udas) {
      if (lessons.length === 0 && udas.length === 0) {
        set({
          report:    null,
          error:     'Nessuna lezione né UDA disponibile per l\'analisi pedagogica.',
          computing: false,
        });
        return;
      }
      set({ computing: true, error: null });
      try {
        const report = generatePedagogyReport(lessons, udas);
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
            : 'Errore nel calcolo del report pedagogico.',
        });
      }
    },

    clear() {
      set({ report: null, error: null, lastComputedAt: null });
    },
  },
}));

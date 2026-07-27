/**
 * simulationStore.ts — Ephemeral Zustand store for the AI Simulation Engine.
 *
 * Results are kept in memory only (no persist middleware) — they reset on
 * page reload.  This is intentional: simulations are dev/devtools artefacts,
 * not user data.
 */

import { create } from 'zustand';
import { generateScenario } from './scenarioGenerator';
import {
  runSimulation,
  runSimulationBatchFromCount,
} from './simulationRunner';
import type { SimulationResult } from './simulationRunner';

// ── types ─────────────────────────────────────────────────────────────────────

interface SimulationState {
  /** All simulation results collected in this session */
  runs: SimulationResult[];
  /** Whether a batch is currently executing */
  running: boolean;
  /** Batch completion progress: 0–100 */
  progress: number;
  /** Epoch ms of the last completed run (null if no runs yet) */
  lastRunAt: number | null;
  /** Last error message, if any */
  error: string | null;
}

interface SimulationActions {
  /** Run one scenario.  When `seed` is omitted a random seed is used. */
  runScenario: (seed?: number) => void;
  /**
   * Run a batch of `count` scenarios asynchronously.
   * Invokes `onProgress(pct)` after each run (pct = 0–100).
   */
  runBatch: (count?: number, onProgress?: (pct: number) => void) => Promise<void>;
  /** Remove all stored run results */
  clearResults: () => void;
}

export type SimulationStore = SimulationState & { actions: SimulationActions };

// ── store ─────────────────────────────────────────────────────────────────────

export const useSimulationStore = create<SimulationStore>()((set, get) => ({
  // ── state ──────────────────────────────────────────────────────────────────
  runs: [],
  running: false,
  progress: 0,
  lastRunAt: null,
  error: null,

  // ── actions ────────────────────────────────────────────────────────────────
  actions: {
    runScenario(seed?: number) {
      if (get().running) return;
      try {
        const scenario = generateScenario(seed);
        const result = runSimulation(scenario);
        set(s => ({
          runs: [result, ...s.runs],
          lastRunAt: Date.now(),
          error: null,
        }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        set({ error: msg });
      }
    },

    async runBatch(count = 10, onProgress) {
      if (get().running) return;
      set({ running: true, progress: 0, error: null });

      try {
        const results = await runSimulationBatchFromCount(
          count,
          undefined,
          (done, total) => {
            const pct = Math.round((done / total) * 100);
            set({ progress: pct });
            onProgress?.(pct);
          },
        );

        set(s => ({
          runs: [...results.reverse(), ...s.runs], // newest first
          lastRunAt: Date.now(),
          running: false,
          progress: 100,
        }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        set({ running: false, progress: 0, error: msg });
      }
    },

    clearResults() {
      set({ runs: [], progress: 0, lastRunAt: null, error: null });
    },
  },
}));

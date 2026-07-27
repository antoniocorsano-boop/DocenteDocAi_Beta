/**
 * useAISnapshotStore.ts
 *
 * Persisted Zustand store for AI pipeline snapshots.
 * Saves one snapshot per (className × calendar-day); prunes to max 30 per class.
 * Storage key: 'docentedoc-ai-snapshots'
 *
 * Schema v2 (Sprint 1): added schemaVersion, classAverage, predictions.
 * V1 records are migrated transparently on hydration via schemaMigration.ts.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIPipelineResult } from '../ai/pipeline/aiPipeline';
import type { HealthGrade } from '../ai/classHealth/types';
import type { StudentForecast } from '../ai/copilot/trendEngine';
import { migrateSnapshotArray, AI_SNAPSHOT_SCHEMA_VERSION } from '../ai/migration/schemaMigration';

// ============================================================================
// TYPES
// ============================================================================

export interface AISnapshot {
  /** Schema version — used for safe localStorage migration */
  schemaVersion: typeof AI_SNAPSHOT_SCHEMA_VERSION;
  /** Unique key — `${className}::${date}` */
  id: string;
  className: string;
  /** ISO date YYYY-MM-DD */
  date: string;
  score: number;
  grade: HealthGrade;
  riskCount: number;
  excellenceCount: number;
  /** Class grade average (0 when no evaluations) — added in v2 */
  classAverage: number;
  /** Per-student forecasts for sparkline charts — added in v2 */
  predictions: StudentForecast[];
}

interface AISnapshotState {
  snapshots: AISnapshot[];
}

interface AISnapshotActions {
  /**
   * Upsert a snapshot for the given class and today's date.
   * Prunes to a max of MAX_PER_CLASS entries per class (oldest removed first).
   */
  saveSnapshot: (className: string, pipeline: AIPipelineResult) => void;
  /** Return snapshots for a class, sorted by date ascending. */
  getSnapshots: (className: string) => AISnapshot[];
  /** Remove all snapshots for a specific class. */
  clearClass: (className: string) => void;
}

export type AISnapshotStore = AISnapshotState & { actions: AISnapshotActions };

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_PER_CLASS = 30;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// ============================================================================
// STORE
// ============================================================================

export const useAISnapshotStore = create<AISnapshotStore>()(
  persist(
    (set, get) => ({
      snapshots: [],

      actions: {
        saveSnapshot: (className, pipeline) => {
          const date = todayISO();
          const id = `${className}::${date}`;
          const avg = pipeline.classHealth.score > 0
            ? parseFloat((pipeline.classHealth.score / 10).toFixed(1))
            : 0;
          const next: AISnapshot = {
            schemaVersion: AI_SNAPSHOT_SCHEMA_VERSION,
            id,
            className,
            date,
            score: Math.round(pipeline.classHealth.score),
            grade: pipeline.classHealth.grade,
            riskCount: pipeline.riskSuggestions.length,
            excellenceCount: pipeline.excellenceSuggestions.length,
            classAverage: avg,
            predictions: [],
          };

          set((state) => {
            // Upsert
            const without = state.snapshots.filter((s) => s.id !== id);
            const withNext = [...without, next];

            // Prune: keep latest MAX_PER_CLASS per class
            const forClass = withNext
              .filter((s) => s.className === className)
              .sort((a, b) => a.date.localeCompare(b.date));

            const pruned =
              forClass.length > MAX_PER_CLASS
                ? forClass.slice(forClass.length - MAX_PER_CLASS)
                : forClass;

            const otherClasses = withNext.filter((s) => s.className !== className);
            return { snapshots: [...otherClasses, ...pruned] };
          });
        },

        getSnapshots: (className) =>
          get()
            .snapshots.filter((s) => s.className === className)
            .sort((a, b) => a.date.localeCompare(b.date)),

        clearClass: (className) =>
          set((state) => ({
            snapshots: state.snapshots.filter((s) => s.className !== className),
          })),
      },
    }),
    {
      name: 'docentedoc-ai-snapshots',
      // Migrate v1 → v2 on hydration so legacy localStorage data is not lost
      merge: (persisted, current) => {
        const raw = (persisted as { snapshots?: unknown[] })?.snapshots ?? [];
        const migrated = migrateSnapshotArray(Array.isArray(raw) ? raw : []);
        return { ...current, snapshots: migrated };
      },
    }
  )
);

import { useMemo, useEffect, useRef } from 'react'
import type { Studente, Valutazione, Lezione } from '@/types'
import { runAIPipeline, type AIPipelineResult } from './aiPipeline'
import { useAISnapshotStore, type AISnapshot } from '../../stores/useAISnapshotStore'
import type { AISuggestion } from '../contextEngine/types'

// ============================================================================
// RETURN TYPE
// ============================================================================

/**
 * Extends the pure AIPipelineResult with store-backed snapshot data and
 * convenience aliases, so consumers need only a single hook call.
 */
export interface AIPipelineHookResult extends AIPipelineResult {
  /** Alias for `suggestions` — all AI suggestions for the current cohort */
  studentSuggestions: AISuggestion[]
  /** Daily snapshots for the selected class, sorted ascending by date */
  snapshots: AISnapshot[]
  /** True when ≥2 snapshots exist and AITrendPanel can render */
  trendAvailable: boolean
  /** Remove all stored snapshots for the current class */
  clearSnapshots: () => void
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Central AI orchestrator hook.
 *
 * Runs the full pipeline, persists a daily snapshot to localStorage,
 * and exposes snapshot history so callers need only one hook.
 *
 * Usage:
 *   const ai = useAIPipeline(selectedClass, students, evaluations)
 *   ai.classHealth / ai.studentSuggestions / ai.snapshots / ai.trendAvailable
 */
export function useAIPipeline(
  className: string,
  students: Studente[],
  evaluations: Valutazione[],
  lessons: Lezione[] = [],
): AIPipelineHookResult {
  // -- Pure pipeline (memoized) -----------------------------------------------
  const pipeline = useMemo(
    () => runAIPipeline(students, evaluations, lessons),
    [students, evaluations, lessons],
  )

  // -- Snapshot store ----------------------------------------------------------
  const snapshotActions = useAISnapshotStore((s) => s.actions)
  const snapshots = useAISnapshotStore((s) =>
    s.snapshots
      .filter((snap) => snap.className === className)
      .sort((a, b) => a.date.localeCompare(b.date)),
  )

  // -- Auto-save once per (className × calendar-day) --------------------------
  const savedRef = useRef(new Set<string>())
  useEffect(() => {
    if (!className || students.length === 0) return
    const key = `${className}::${new Date().toISOString().slice(0, 10)}`
    if (savedRef.current.has(key)) return
    savedRef.current.add(key)
    snapshotActions.saveSnapshot(className, pipeline)
  }, [className, pipeline, students.length, snapshotActions])

  // -- Combined result --------------------------------------------------------
  return {
    ...pipeline,
    studentSuggestions: pipeline.suggestions,
    snapshots,
    trendAvailable: snapshots.length >= 2,
    clearSnapshots: () => snapshotActions.clearClass(className),
  }
}

/**
 * simulation/simulationStore.ts — Zustand store bridge.
 *
 * Permette al SimulationEngine (imperativo) di comunicare con React
 * tramite un store reattivo condiviso.
 *
 * Naming convention: _actions è il namespace delle mutazioni (pattern
 * già usato in useUIStore del progetto).
 */

import { create } from 'zustand';
import type { LessonEvent, SimulationMetrics, LandingType, SimStatus } from './types';
import type { ScheduleContext } from '../modules/orchestration/types';

// ─── State shape ──────────────────────────────────────────────────────────────

interface SimulationState {
  status:          SimStatus;
  currentEvent:    LessonEvent | null;
  elapsedEvents:   number;
  totalEvents:     number;
  metrics:         SimulationMetrics[];
  activeLanding:   LandingType | null;
  scheduleCtx:     ScheduleContext | null;
  speedMultiplier: number;

  _actions: {
    setStatus:        (status: SimStatus) => void;
    setCurrentEvent:  (event: LessonEvent | null) => void;
    setProgress:      (elapsed: number, total: number) => void;
    setActiveLanding: (type: LandingType | null, ctx?: ScheduleContext) => void;
    logMetric:        (metric: SimulationMetrics) => void;
    setSpeed:         (multiplier: number) => void;
    reset:            () => void;
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSimulationStore = create<SimulationState>((set) => ({
  status:          'idle',
  currentEvent:    null,
  elapsedEvents:   0,
  totalEvents:     0,
  metrics:         [],
  activeLanding:   null,
  scheduleCtx:     null,
  speedMultiplier: 60,   // default: 1 secondo per minuto (demo veloce)

  _actions: {
    setStatus:       (status)       => set({ status }),
    setCurrentEvent: (currentEvent) => set({ currentEvent }),
    setProgress:     (elapsed, total) =>
      set({ elapsedEvents: elapsed, totalEvents: total }),
    setActiveLanding: (activeLanding, ctx) =>
      set({ activeLanding, scheduleCtx: ctx ?? null }),
    logMetric: (metric) =>
      set(s => ({ metrics: [...s.metrics, metric] })),
    setSpeed:  (speedMultiplier) => set({ speedMultiplier }),
    reset:     () => set({
      status:        'idle',
      currentEvent:  null,
      elapsedEvents: 0,
      metrics:       [],
      activeLanding: null,
      scheduleCtx:   null,
    }),
  },
}));

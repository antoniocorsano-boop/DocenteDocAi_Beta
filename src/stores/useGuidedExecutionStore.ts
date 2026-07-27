/**
 * useGuidedExecutionStore.ts — Zustand store for Guided Execution System.
 *
 * Manages whether guided mode is active and which step is current.
 * Zero business logic — acts only as state container.
 */

import { create } from 'zustand';
import type { ExecutionPlan } from '../cognition/guidedExecution/types';

interface GuidedExecutionState {
  /** True when guided mode is active */
  isActive: boolean;
  /** The active plan, or null when not in guided mode */
  plan: ExecutionPlan | null;
  /** 0-based index of the current step */
  currentStepIndex: number;

  /** Activate guided mode with a plan (resets progress) */
  start: (plan: ExecutionPlan) => void;
  /** Advance to the next step; auto-exits when plan completes */
  nextStep: () => void;
  /** Exit guided mode without completing */
  exit: () => void;
}

export const useGuidedExecutionStore = create<GuidedExecutionState>((set, get) => ({
  isActive: false,
  plan: null,
  currentStepIndex: 0,

  start: (plan) =>
    set({ isActive: true, plan, currentStepIndex: 0 }),

  nextStep: () => {
    const { plan, currentStepIndex } = get();
    if (!plan) return;
    const next = currentStepIndex + 1;
    if (next >= plan.steps.length) {
      // Plan complete — exit guided mode
      set({ isActive: false, plan: null, currentStepIndex: 0 });
    } else {
      set({ currentStepIndex: next });
    }
  },

  exit: () =>
    set({ isActive: false, plan: null, currentStepIndex: 0 }),
}));

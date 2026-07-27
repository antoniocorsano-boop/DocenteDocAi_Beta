/**
 * stores/useOrbitFeaturesStore.ts — Orbit Feature Flags Store (Fase 8 — UI Inhibition)
 *
 * Zustand persist store for Orbit's soft UI inhibition feature flags.
 * Persists to localStorage under key: 'orbit_features_v1'
 *
 * INVARIANT (non-derogable):
 *   Inhibition is ALWAYS soft — sets hidden:true on panels; never hard-deletes them.
 *   Legacy logic remains accessible to the IA at all times.
 *   Mirrors the adaptBlocks() invariant: content is never discarded.
 *
 * Default state: coexistence mode — orbitFullControl = false, no overrides.
 * Old UI is fully visible until Orbit explicitly takes control.
 *
 * Persist key: 'orbit_features_v1'
 *   Changing this key resets all feature flags for existing users.
 *   Increment only with an explicit migration plan.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { PanelId, OrbitFeatureFlags } from '@/types/features.types';
import { createDefaultFlags } from '@/modules/orbit/featureFlagEngine';

// ── State shape ───────────────────────────────────────────────────────────────

interface OrbitFeaturesState extends OrbitFeatureFlags {
  actions: {
    /**
     * Activate full Orbit orchestration control.
     * All panels without an explicit override become hidden.
     * Equivalent to: flags.orbitFullControl = true
     */
    enableOrbitFullControl: () => void;

    /**
     * Return to coexistence mode.
     * Panels become visible again unless a per-panel override (true) is set.
     * Does NOT clear panelOverrides — preserves granular settings.
     */
    disableOrbitFullControl: () => void;

    /**
     * Set a per-panel override.
     * @param panelId - Panel to override
     * @param hidden  - true = force hidden; false = force visible
     */
    overridePanel: (panelId: PanelId, hidden: boolean) => void;

    /**
     * Remove the per-panel override for `panelId`.
     * Panel reverts to default (driven by orbitFullControl).
     */
    resetOverride: (panelId: PanelId) => void;

    /**
     * Remove ALL per-panel overrides.
     * Does NOT change orbitFullControl.
     */
    resetAllOverrides: () => void;

    /**
     * Full reset to default state: coexistence mode, no overrides.
     * Equivalent to calling disableOrbitFullControl() + resetAllOverrides().
     */
    resetToDefault: () => void;
  };
}

// ── Store ─────────────────────────────────────────────────────────────────────

const defaults = createDefaultFlags();

export const useOrbitFeaturesStore = create<OrbitFeaturesState>()(
  persist(
    (set) => ({
      ...defaults,

      actions: {
        enableOrbitFullControl: () =>
          set({ orbitFullControl: true }),

        disableOrbitFullControl: () =>
          set({ orbitFullControl: false }),

        overridePanel: (panelId, hidden) =>
          set((state) => ({
            panelOverrides: { ...state.panelOverrides, [panelId]: hidden },
          })),

        resetOverride: (panelId) =>
          set((state) => {
            const { [panelId]: _removed, ...rest } = state.panelOverrides;
            return { panelOverrides: rest };
          }),

        resetAllOverrides: () =>
          set({ panelOverrides: {} }),

        resetToDefault: () =>
          set({ orbitFullControl: false, panelOverrides: {} }),
      },
    }),
    {
      name: 'orbit_features_v1',
      // Only persist flag data — not action functions
      partialize: (state) => ({
        orbitFullControl: state.orbitFullControl,
        panelOverrides:   state.panelOverrides,
      }),
    },
  ),
);

// ── Selectors ─────────────────────────────────────────────────────────────────

/**
 * Returns whether the given panel is currently overridden (hidden).
 * Does NOT account for orbitFullControl — use featureFlagEngine.shouldInhibitPanel()
 * for full resolution including orbitFullControl.
 *
 * Usage: `useOrbitFeaturesStore(selectIsPanelOverridden('classroom'))`
 */
export const selectIsPanelOverridden =
  (panelId: PanelId) =>
  (state: OrbitFeaturesState): boolean | undefined =>
    state.panelOverrides[panelId];

/**
 * Returns the full OrbitFeatureFlags data (without actions).
 * Pass the result directly to featureFlagEngine functions.
 *
 * Usage: `const flags = useOrbitFeaturesStore(selectFlags)`
 */
export const selectFlags = (state: OrbitFeaturesState): OrbitFeatureFlags => ({
  orbitFullControl: state.orbitFullControl,
  panelOverrides:   state.panelOverrides,
});

/**
 * hooks/useOrbitInhibition.ts — Orbit UI Inhibition hook (Fase 8 / Fase 9 wiring)
 *
 * Bridges the Orbit feature flag store with the legacy panel rendering layer.
 * Provides a simple React interface over `featureFlagEngine` + `useOrbitFeaturesStore`.
 *
 * INVARIANT (non-derogable):
 *   Panels are NEVER unmounted when inhibited.
 *   Inhibited panels receive `data-orbit-inhibited="true"` and `aria-hidden="true"`.
 *   The legacy component tree stays mounted so the IA can access its logic.
 *   Mirrors adaptBlocks() invariant: content hidden, never deleted.
 *
 * Usage:
 *   const { isInhibited, inhibitionReason } = useOrbitInhibition('classroom');
 *   const allResults = useAllPanelInhibition();
 */

import { useMemo } from 'react';
import {
  shouldInhibitPanel,
  resolveAllPanels,
} from '@/modules/orbit/featureFlagEngine';
import {
  useOrbitFeaturesStore,
  selectFlags,
} from '@/stores/useOrbitFeaturesStore';
import type { PanelId, PanelInhibitionResult } from '@/types/features.types';
import type { View } from '@/types';

// ── View → PanelId mapping ────────────────────────────────────────────────────

/**
 * Maps legacy app `View` values to the corresponding Orbit `PanelId`.
 * Views not listed here are Orbit-native and not subject to inhibition.
 */
export const VIEW_TO_PANEL_ID: Partial<Record<View, PanelId>> = {
  // classroom panel
  'aula':              'classroom',
  'aula-session':      'classroom',

  // copilot panel
  'copilot':           'copilot',

  // settings panel
  'settings':          'settings',

  // register panel
  'register':          'register',

  // dashboard panel
  'home':              'dashboard',
  'teacher-dashboard': 'dashboard',
  'workspace':         'dashboard',

  // planner panel
  'uda':               'planner',
  'progettazione-hub': 'planner',
  'lessons':           'planner',
  'timetable':         'planner',
  'curriculum-manager':'planner',

  // evaluation panel
  'evaluations':       'evaluation',
  'rubriche':          'evaluation',
  'competency-levels': 'evaluation',
} as const;

// ── Single-panel hook ─────────────────────────────────────────────────────────

export interface OrbitInhibitionResult {
  /** Whether this panel should be soft-hidden by Orbit. */
  isInhibited: boolean;
  /** Reason for the current inhibition state (matches PanelInhibitionResult.reason). */
  inhibitionReason: PanelInhibitionResult['reason'];
}

/**
 * Returns the Orbit inhibition state for a specific `PanelId`.
 *
 * @example
 * const { isInhibited, inhibitionReason } = useOrbitInhibition('classroom');
 */
export function useOrbitInhibition(panelId: PanelId): OrbitInhibitionResult {
  const flags = useOrbitFeaturesStore(selectFlags);

  return useMemo(() => {
    const inhibited = shouldInhibitPanel(panelId, flags);
    // Re-derive full reason by calling resolveAllPanels for single panel
    const results = resolveAllPanels(flags, [panelId]);
    const reason = results[0]?.reason ?? 'default_shown';
    return { isInhibited: inhibited, inhibitionReason: reason };
  }, [panelId, flags]);
}

// ── View-based convenience hook ───────────────────────────────────────────────

/**
 * Returns the Orbit inhibition state for a given app `View`.
 * Views without a PanelId mapping are never inhibited.
 *
 * @example
 * const { isInhibited } = useViewInhibition('copilot');
 */
export function useViewInhibition(view: View): OrbitInhibitionResult {
  const panelId = VIEW_TO_PANEL_ID[view];
  const flags = useOrbitFeaturesStore(selectFlags);

  return useMemo(() => {
    if (!panelId) {
      return { isInhibited: false, inhibitionReason: 'default_shown' };
    }
    const inhibited = shouldInhibitPanel(panelId, flags);
    const results = resolveAllPanels(flags, [panelId]);
    const reason = results[0]?.reason ?? 'default_shown';
    return { isInhibited: inhibited, inhibitionReason: reason };
  }, [panelId, flags]);
}

// ── All-panels hook ───────────────────────────────────────────────────────────

/**
 * Returns inhibition results for all 7 legacy panels.
 * Useful for debug panels or settings UIs showing Orbit control status.
 *
 * @example
 * const all = useAllPanelInhibition();
 * all.find(r => r.panelId === 'copilot')?.inhibited
 */
export function useAllPanelInhibition(): PanelInhibitionResult[] {
  const flags = useOrbitFeaturesStore(selectFlags);
  return useMemo(() => resolveAllPanels(flags), [flags]);
}

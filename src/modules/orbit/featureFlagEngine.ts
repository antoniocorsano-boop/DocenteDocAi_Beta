/**
 * modules/orbit/featureFlagEngine.ts — Orbit UI Inhibition Engine (Fase 8)
 *
 * Pure functions for resolving which legacy UI panels should be hidden when
 * Orbit has full or partial orchestration control.
 *
 * INVARIANT (non-derogable, matching adaptBlocks invariant):
 *   Inhibition is ALWAYS soft — panels are hidden (display: none / conditional render),
 *   never unmounted or hard-deleted. Legacy logic remains accessible to the IA at all times.
 *
 * Resolution order:
 *   1. panelOverrides[panelId] is defined  → override wins (true = hidden, false = shown)
 *   2. orbitFullControl === true           → hidden (Orbit in control)
 *   3. else                                → shown (coexistence mode, default)
 */

import type {
  PanelId,
  OrbitFeatureFlags,
  PanelInhibitionResult,
} from '@/types/features.types';

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Ordered list of all known legacy panel IDs.
 * Used by getInhibitedPanels() when no explicit subset is provided.
 */
export const ALL_PANELS: PanelId[] = [
  'classroom',
  'copilot',
  'settings',
  'register',
  'dashboard',
  'planner',
  'evaluation',
];

// ── Core engine ───────────────────────────────────────────────────────────────

/**
 * Resolves whether a single panel should be inhibited (hidden).
 *
 * Returns a full `PanelInhibitionResult` with reason for logging/debug.
 *
 * @param panelId - ID of the panel to resolve
 * @param flags   - Current OrbitFeatureFlags from useOrbitFeaturesStore
 */
export function resolveInhibition(
  panelId: PanelId,
  flags:   OrbitFeatureFlags,
): PanelInhibitionResult {
  const override = flags.panelOverrides[panelId];

  // Tier 1: explicit per-panel override (wins over everything)
  if (override === true) {
    return { panelId, inhibited: true,  reason: 'manual_override_hidden' };
  }
  if (override === false) {
    return { panelId, inhibited: false, reason: 'manual_override_shown' };
  }

  // Tier 2: global flag
  if (flags.orbitFullControl) {
    return { panelId, inhibited: true,  reason: 'orbit_full_control' };
  }

  // Tier 3: default — coexistence mode, panel visible
  return { panelId, inhibited: false, reason: 'default_shown' };
}

/**
 * Convenience wrapper — returns only the boolean inhibition result.
 * Use when the reason isn't needed (e.g. conditional render in components).
 *
 * @param panelId - ID of the panel to check
 * @param flags   - Current OrbitFeatureFlags
 */
export function shouldInhibitPanel(
  panelId: PanelId,
  flags:   OrbitFeatureFlags,
): boolean {
  return resolveInhibition(panelId, flags).inhibited;
}

/**
 * Returns the full resolution result for every panel in `panels`.
 * Defaults to ALL_PANELS if not provided.
 *
 * @param flags  - Current OrbitFeatureFlags
 * @param panels - Subset of panels to inspect (default: ALL_PANELS)
 */
export function resolveAllPanels(
  flags:   OrbitFeatureFlags,
  panels?: PanelId[],
): PanelInhibitionResult[] {
  return (panels ?? ALL_PANELS).map((id) => resolveInhibition(id, flags));
}

/**
 * Returns the IDs of all panels that are currently inhibited.
 *
 * @param flags  - Current OrbitFeatureFlags
 * @param panels - Subset of panels to inspect (default: ALL_PANELS)
 */
export function getInhibitedPanels(
  flags:   OrbitFeatureFlags,
  panels?: PanelId[],
): PanelId[] {
  return resolveAllPanels(flags, panels)
    .filter((r) => r.inhibited)
    .map((r) => r.panelId);
}

/**
 * Returns the IDs of all panels that are currently visible (not inhibited).
 *
 * @param flags  - Current OrbitFeatureFlags
 * @param panels - Subset of panels to inspect (default: ALL_PANELS)
 */
export function getVisiblePanels(
  flags:   OrbitFeatureFlags,
  panels?: PanelId[],
): PanelId[] {
  return resolveAllPanels(flags, panels)
    .filter((r) => !r.inhibited)
    .map((r) => r.panelId);
}

/**
 * Creates a default OrbitFeatureFlags object (coexistence mode — nothing inhibited).
 * Useful for tests and store initialization.
 */
export function createDefaultFlags(): OrbitFeatureFlags {
  return {
    orbitFullControl: false,
    panelOverrides:   {},
  };
}

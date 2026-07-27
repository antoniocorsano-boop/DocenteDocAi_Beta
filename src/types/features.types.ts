/**
 * types/features.types.ts — Orbit Feature Flags types (Fase 8 — UI Inhibition)
 *
 * Defines the data model for Orbit's soft UI inhibition system.
 *
 * Design:
 *   - Pure types: no side effects, no imports from non-type modules
 *   - Soft-only: inhibition is always reversible — never a hard delete
 *   - Two-tier: global flag (orbitFullControl) + per-panel granular overrides
 *   - The invariant "never delete content, only hidden: true" is embedded in the model
 *
 * Inhibition resolution order (checked in featureFlagEngine.ts):
 *   1. panelOverrides[panelId] = false → explicitly shown (override wins)
 *   2. panelOverrides[panelId] = true  → explicitly hidden (override wins)
 *   3. orbitFullControl = true         → all panels hidden by default
 *   4. orbitFullControl = false        → panel shown (default)
 */

// ── Panel IDs ─────────────────────────────────────────────────────────────────

/**
 * Identifies a legacy UI panel/view that Orbit can soft-inhibit.
 *
 * Identifiers match the route / primary component name for traceability:
 *   `classroom`  → ClassroomView + all classroom sub-tabs
 *   `copilot`    → CopilotDocentePanel + 12 sub-tabs
 *   `settings`   → Settings + all 7 settings panels
 *   `register`   → RegisterView
 *   `dashboard`  → TeacherDashboard
 *   `planner`    → UdaPlanner / ProgettazioneHub
 *   `evaluation` → EvaluationModule
 */
export type PanelId =
  | 'classroom'
  | 'copilot'
  | 'settings'
  | 'register'
  | 'dashboard'
  | 'planner'
  | 'evaluation';

// ── Feature flags ─────────────────────────────────────────────────────────────

/**
 * Root Orbit feature flag object.
 * Persisted in localStorage via useOrbitFeaturesStore ('orbit_features_v1').
 */
export interface OrbitFeatureFlags {
  /**
   * Global inhibition switch.
   * When true: all legacy panels are hidden unless explicitly overridden to false.
   * When false: panels are shown unless explicitly overridden to true.
   * Default: false (Orbit in coexistence mode — old UI still fully visible).
   */
  orbitFullControl: boolean;

  /**
   * Per-panel granular overrides.
   * true  → panel explicitly hidden (regardless of orbitFullControl)
   * false → panel explicitly shown  (overrides orbitFullControl = true)
   * absent → resolved from orbitFullControl
   */
  panelOverrides: Partial<Record<PanelId, boolean>>;
}

// ── Resolution result ─────────────────────────────────────────────────────────

/**
 * Full inhibition resolution result for a single panel.
 * Consumers can use `inhibited` directly or inspect `reason` for logging/debug.
 */
export interface PanelInhibitionResult {
  panelId:   PanelId;
  /** Whether the panel should be hidden */
  inhibited: boolean;
  reason:
    | 'manual_override_hidden'   // panelOverrides[panelId] = true
    | 'manual_override_shown'    // panelOverrides[panelId] = false
    | 'orbit_full_control'       // orbitFullControl = true, no override
    | 'default_shown';           // orbitFullControl = false, no override
}

/**
 * __tests__/modules/orbit/featureFlagEngine.test.ts
 *
 * Unit tests for src/modules/orbit/featureFlagEngine.ts (Fase 8 — UI Inhibition)
 *
 * Coverage:
 *   - createDefaultFlags() — coexistence mode defaults
 *   - resolveInhibition() — override tier, orbitFullControl tier, default
 *   - shouldInhibitPanel() — boolean convenience wrapper
 *   - resolveAllPanels() — all panels + subset
 *   - getInhibitedPanels() — filter inhibited IDs
 *   - getVisiblePanels() — filter visible IDs
 *   - ALL_PANELS constant — completeness contract
 *   - Invariant: soft-only (no missing panels)
 *   - Structural contracts (exports, types)
 */

import { describe, it, expect } from 'vitest';
import {
  ALL_PANELS,
  resolveInhibition,
  shouldInhibitPanel,
  resolveAllPanels,
  getInhibitedPanels,
  getVisiblePanels,
  createDefaultFlags,
} from '../../../src/modules/orbit/featureFlagEngine';
import type { OrbitFeatureFlags } from '../../../src/types/features.types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const defaultFlags = (): OrbitFeatureFlags => createDefaultFlags();

const fullControlFlags = (): OrbitFeatureFlags => ({
  orbitFullControl: true,
  panelOverrides:   {},
});

// ── createDefaultFlags ────────────────────────────────────────────────────────

describe('createDefaultFlags', () => {
  it('returns orbitFullControl = false', () => {
    expect(createDefaultFlags().orbitFullControl).toBe(false);
  });

  it('returns empty panelOverrides', () => {
    expect(createDefaultFlags().panelOverrides).toEqual({});
  });
});

// ── resolveInhibition — default mode ─────────────────────────────────────────

describe('resolveInhibition — default (coexistence) mode', () => {
  it('all panels are shown by default', () => {
    const flags = defaultFlags();
    for (const panelId of ALL_PANELS) {
      const result = resolveInhibition(panelId, flags);
      expect(result.inhibited).toBe(false);
      expect(result.reason).toBe('default_shown');
    }
  });
});

// ── resolveInhibition — orbitFullControl ─────────────────────────────────────

describe('resolveInhibition — orbitFullControl = true', () => {
  it('inhibits all panels when orbitFullControl = true', () => {
    const flags = fullControlFlags();
    for (const panelId of ALL_PANELS) {
      const result = resolveInhibition(panelId, flags);
      expect(result.inhibited).toBe(true);
      expect(result.reason).toBe('orbit_full_control');
    }
  });
});

// ── resolveInhibition — manual overrides ─────────────────────────────────────

describe('resolveInhibition — manual overrides', () => {
  it('override true hides panel regardless of orbitFullControl = false', () => {
    const flags: OrbitFeatureFlags = {
      orbitFullControl: false,
      panelOverrides:   { classroom: true },
    };
    const result = resolveInhibition('classroom', flags);
    expect(result.inhibited).toBe(true);
    expect(result.reason).toBe('manual_override_hidden');
  });

  it('override false shows panel even when orbitFullControl = true', () => {
    const flags: OrbitFeatureFlags = {
      orbitFullControl: true,
      panelOverrides:   { copilot: false },
    };
    const result = resolveInhibition('copilot', flags);
    expect(result.inhibited).toBe(false);
    expect(result.reason).toBe('manual_override_shown');
  });

  it('override true trumps orbitFullControl = true → reason is manual_override_hidden', () => {
    const flags: OrbitFeatureFlags = {
      orbitFullControl: true,
      panelOverrides:   { dashboard: true },
    };
    const result = resolveInhibition('dashboard', flags);
    expect(result.inhibited).toBe(true);
    expect(result.reason).toBe('manual_override_hidden');
  });

  it('panel without override follows orbitFullControl when true', () => {
    const flags: OrbitFeatureFlags = {
      orbitFullControl: true,
      panelOverrides:   { classroom: false },  // only classroom is overridden
    };
    // copilot has no override → resolved from orbitFullControl
    const result = resolveInhibition('copilot', flags);
    expect(result.inhibited).toBe(true);
    expect(result.reason).toBe('orbit_full_control');
  });

  it('panel without override follows orbitFullControl when false', () => {
    const flags: OrbitFeatureFlags = {
      orbitFullControl: false,
      panelOverrides:   { classroom: true },  // only classroom is overridden
    };
    // copilot has no override → resolved from orbitFullControl
    const result = resolveInhibition('copilot', flags);
    expect(result.inhibited).toBe(false);
    expect(result.reason).toBe('default_shown');
  });

  it('returns correct panelId in result', () => {
    const flags = defaultFlags();
    const result = resolveInhibition('evaluation', flags);
    expect(result.panelId).toBe('evaluation');
  });
});

// ── shouldInhibitPanel ────────────────────────────────────────────────────────

describe('shouldInhibitPanel', () => {
  it('returns false in coexistence mode', () => {
    expect(shouldInhibitPanel('classroom', defaultFlags())).toBe(false);
  });

  it('returns true with orbitFullControl = true', () => {
    expect(shouldInhibitPanel('settings', fullControlFlags())).toBe(true);
  });

  it('returns true with manual override hidden', () => {
    const flags: OrbitFeatureFlags = { orbitFullControl: false, panelOverrides: { register: true } };
    expect(shouldInhibitPanel('register', flags)).toBe(true);
  });

  it('returns false with manual override shown even when orbitFullControl = true', () => {
    const flags: OrbitFeatureFlags = { orbitFullControl: true, panelOverrides: { planner: false } };
    expect(shouldInhibitPanel('planner', flags)).toBe(false);
  });
});

// ── resolveAllPanels ──────────────────────────────────────────────────────────

describe('resolveAllPanels', () => {
  it('returns result for every panel in ALL_PANELS by default', () => {
    const results = resolveAllPanels(defaultFlags());
    expect(results.length).toBe(ALL_PANELS.length);
  });

  it('returns result for custom subset', () => {
    const results = resolveAllPanels(defaultFlags(), ['classroom', 'copilot']);
    expect(results.length).toBe(2);
    expect(results.map((r) => r.panelId)).toEqual(['classroom', 'copilot']);
  });

  it('all inhibited when orbitFullControl = true', () => {
    const results = resolveAllPanels(fullControlFlags());
    expect(results.every((r) => r.inhibited)).toBe(true);
  });

  it('none inhibited in default mode', () => {
    const results = resolveAllPanels(defaultFlags());
    expect(results.every((r) => !r.inhibited)).toBe(true);
  });
});

// ── getInhibitedPanels ────────────────────────────────────────────────────────

describe('getInhibitedPanels', () => {
  it('returns empty array in coexistence mode', () => {
    expect(getInhibitedPanels(defaultFlags())).toHaveLength(0);
  });

  it('returns all panels when orbitFullControl = true', () => {
    const inhibited = getInhibitedPanels(fullControlFlags());
    expect(inhibited.sort()).toEqual([...ALL_PANELS].sort());
  });

  it('returns only overridden panels when orbitFullControl = false', () => {
    const flags: OrbitFeatureFlags = {
      orbitFullControl: false,
      panelOverrides:   { classroom: true, copilot: true },
    };
    const inhibited = getInhibitedPanels(flags);
    expect(inhibited.sort()).toEqual(['classroom', 'copilot'].sort());
  });

  it('excludes manually-shown panel from inhibited list when orbitFullControl = true', () => {
    const flags: OrbitFeatureFlags = {
      orbitFullControl: true,
      panelOverrides:   { settings: false },
    };
    const inhibited = getInhibitedPanels(flags);
    expect(inhibited).not.toContain('settings');
  });
});

// ── getVisiblePanels ──────────────────────────────────────────────────────────

describe('getVisiblePanels', () => {
  it('returns all panels in coexistence mode', () => {
    const visible = getVisiblePanels(defaultFlags());
    expect(visible.sort()).toEqual([...ALL_PANELS].sort());
  });

  it('returns empty array when orbitFullControl = true, no overrides', () => {
    expect(getVisiblePanels(fullControlFlags())).toHaveLength(0);
  });

  it('returns manually-shown panel even when orbitFullControl = true', () => {
    const flags: OrbitFeatureFlags = {
      orbitFullControl: true,
      panelOverrides:   { copilot: false },
    };
    const visible = getVisiblePanels(flags);
    expect(visible).toContain('copilot');
    expect(visible).not.toContain('classroom');
  });
});

// ── ALL_PANELS constant ───────────────────────────────────────────────────────

describe('ALL_PANELS', () => {
  it('contains all 7 legacy panel IDs', () => {
    expect(ALL_PANELS).toHaveLength(7);
  });

  it('contains expected panel IDs', () => {
    const expected = ['classroom', 'copilot', 'settings', 'register', 'dashboard', 'planner', 'evaluation'];
    expected.forEach((id) => expect(ALL_PANELS).toContain(id));
  });

  it('has no duplicates', () => {
    const unique = new Set(ALL_PANELS);
    expect(unique.size).toBe(ALL_PANELS.length);
  });
});

// ── Soft-only invariant ───────────────────────────────────────────────────────

describe('soft-only invariant', () => {
  it('resolveAllPanels always returns same length as input panels', () => {
    const results = resolveAllPanels(fullControlFlags());
    // Full control hides all — but all panels must still be in the result set
    expect(results.length).toBe(ALL_PANELS.length);
  });

  it('inhibited + visible panels always sum to total panel count', () => {
    const flags: OrbitFeatureFlags = {
      orbitFullControl: true,
      panelOverrides:   { copilot: false, settings: false },
    };
    const inhibited = getInhibitedPanels(flags);
    const visible   = getVisiblePanels(flags);
    expect(inhibited.length + visible.length).toBe(ALL_PANELS.length);
  });
});

// ── Structural contracts ───────────────────────────────────────────────────────

describe('featureFlagEngine structural contracts', () => {
  it('exports ALL_PANELS as non-empty array', () => {
    expect(Array.isArray(ALL_PANELS)).toBe(true);
    expect(ALL_PANELS.length).toBeGreaterThan(0);
  });

  it('exports resolveInhibition as function', () => {
    expect(typeof resolveInhibition).toBe('function');
  });

  it('exports shouldInhibitPanel as function', () => {
    expect(typeof shouldInhibitPanel).toBe('function');
  });

  it('exports resolveAllPanels as function', () => {
    expect(typeof resolveAllPanels).toBe('function');
  });

  it('exports getInhibitedPanels as function', () => {
    expect(typeof getInhibitedPanels).toBe('function');
  });

  it('exports getVisiblePanels as function', () => {
    expect(typeof getVisiblePanels).toBe('function');
  });

  it('exports createDefaultFlags as function', () => {
    expect(typeof createDefaultFlags).toBe('function');
  });
});

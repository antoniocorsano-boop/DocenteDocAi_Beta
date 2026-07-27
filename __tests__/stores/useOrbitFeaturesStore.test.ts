// @ts-nocheck
/**
 * __tests__/stores/useOrbitFeaturesStore.test.ts
 *
 * Unit tests for src/stores/useOrbitFeaturesStore.ts (Fase 8 — UI Inhibition)
 *
 * Coverage:
 *   - Initial state (coexistence defaults: orbitFullControl = false)
 *   - enableOrbitFullControl / disableOrbitFullControl
 *   - overridePanel — sets per-panel hidden flag
 *   - resetOverride — removes override for single panel
 *   - resetAllOverrides — clears all overrides, keeps orbitFullControl
 *   - resetToDefault — full reset
 *   - Selectors: selectFlags, selectIsPanelOverridden
 *   - Structural contracts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  useOrbitFeaturesStore,
  selectFlags,
  selectIsPanelOverridden,
} from '../../src/stores/useOrbitFeaturesStore';

// ── Reset helper ──────────────────────────────────────────────────────────────

function resetStore() {
  useOrbitFeaturesStore.setState({ orbitFullControl: false, panelOverrides: {} });
}

// ── Initial state ─────────────────────────────────────────────────────────────

describe('useOrbitFeaturesStore — initial state', () => {
  beforeEach(resetStore);

  it('starts in coexistence mode (orbitFullControl = false)', () => {
    expect(useOrbitFeaturesStore.getState().orbitFullControl).toBe(false);
  });

  it('starts with no panel overrides', () => {
    expect(useOrbitFeaturesStore.getState().panelOverrides).toEqual({});
  });
});

// ── enableOrbitFullControl ────────────────────────────────────────────────────

describe('useOrbitFeaturesStore — enableOrbitFullControl', () => {
  beforeEach(resetStore);

  it('sets orbitFullControl = true', () => {
    useOrbitFeaturesStore.getState().actions.enableOrbitFullControl();
    expect(useOrbitFeaturesStore.getState().orbitFullControl).toBe(true);
  });

  it('does not clear panelOverrides', () => {
    useOrbitFeaturesStore.getState().actions.overridePanel('classroom', false);
    useOrbitFeaturesStore.getState().actions.enableOrbitFullControl();
    expect(useOrbitFeaturesStore.getState().panelOverrides.classroom).toBe(false);
  });
});

// ── disableOrbitFullControl ───────────────────────────────────────────────────

describe('useOrbitFeaturesStore — disableOrbitFullControl', () => {
  beforeEach(resetStore);

  it('sets orbitFullControl = false', () => {
    useOrbitFeaturesStore.getState().actions.enableOrbitFullControl();
    useOrbitFeaturesStore.getState().actions.disableOrbitFullControl();
    expect(useOrbitFeaturesStore.getState().orbitFullControl).toBe(false);
  });

  it('preserves panelOverrides when disabling', () => {
    useOrbitFeaturesStore.getState().actions.overridePanel('copilot', true);
    useOrbitFeaturesStore.getState().actions.enableOrbitFullControl();
    useOrbitFeaturesStore.getState().actions.disableOrbitFullControl();
    expect(useOrbitFeaturesStore.getState().panelOverrides.copilot).toBe(true);
  });
});

// ── overridePanel ─────────────────────────────────────────────────────────────

describe('useOrbitFeaturesStore — overridePanel', () => {
  beforeEach(resetStore);

  it('sets override to true for a panel', () => {
    useOrbitFeaturesStore.getState().actions.overridePanel('settings', true);
    expect(useOrbitFeaturesStore.getState().panelOverrides.settings).toBe(true);
  });

  it('sets override to false for a panel', () => {
    useOrbitFeaturesStore.getState().actions.overridePanel('register', false);
    expect(useOrbitFeaturesStore.getState().panelOverrides.register).toBe(false);
  });

  it('can override multiple panels independently', () => {
    useOrbitFeaturesStore.getState().actions.overridePanel('classroom', true);
    useOrbitFeaturesStore.getState().actions.overridePanel('copilot', false);
    const { panelOverrides } = useOrbitFeaturesStore.getState();
    expect(panelOverrides.classroom).toBe(true);
    expect(panelOverrides.copilot).toBe(false);
  });

  it('replaces an existing override', () => {
    useOrbitFeaturesStore.getState().actions.overridePanel('dashboard', true);
    useOrbitFeaturesStore.getState().actions.overridePanel('dashboard', false);
    expect(useOrbitFeaturesStore.getState().panelOverrides.dashboard).toBe(false);
  });
});

// ── resetOverride ─────────────────────────────────────────────────────────────

describe('useOrbitFeaturesStore — resetOverride', () => {
  beforeEach(resetStore);

  it('removes the override for the specified panel', () => {
    useOrbitFeaturesStore.getState().actions.overridePanel('planner', true);
    useOrbitFeaturesStore.getState().actions.resetOverride('planner');
    expect(useOrbitFeaturesStore.getState().panelOverrides.planner).toBeUndefined();
  });

  it('does not affect other overrides', () => {
    useOrbitFeaturesStore.getState().actions.overridePanel('planner', true);
    useOrbitFeaturesStore.getState().actions.overridePanel('evaluation', true);
    useOrbitFeaturesStore.getState().actions.resetOverride('planner');
    expect(useOrbitFeaturesStore.getState().panelOverrides.evaluation).toBe(true);
  });

  it('is a no-op for a panel without an override', () => {
    expect(() =>
      useOrbitFeaturesStore.getState().actions.resetOverride('classroom'),
    ).not.toThrow();
    expect(useOrbitFeaturesStore.getState().panelOverrides.classroom).toBeUndefined();
  });
});

// ── resetAllOverrides ─────────────────────────────────────────────────────────

describe('useOrbitFeaturesStore — resetAllOverrides', () => {
  beforeEach(resetStore);

  it('clears all panelOverrides', () => {
    useOrbitFeaturesStore.getState().actions.overridePanel('classroom', true);
    useOrbitFeaturesStore.getState().actions.overridePanel('copilot', false);
    useOrbitFeaturesStore.getState().actions.resetAllOverrides();
    expect(useOrbitFeaturesStore.getState().panelOverrides).toEqual({});
  });

  it('does not change orbitFullControl', () => {
    useOrbitFeaturesStore.getState().actions.enableOrbitFullControl();
    useOrbitFeaturesStore.getState().actions.overridePanel('settings', true);
    useOrbitFeaturesStore.getState().actions.resetAllOverrides();
    expect(useOrbitFeaturesStore.getState().orbitFullControl).toBe(true);
  });
});

// ── resetToDefault ────────────────────────────────────────────────────────────

describe('useOrbitFeaturesStore — resetToDefault', () => {
  beforeEach(resetStore);

  it('sets orbitFullControl = false', () => {
    useOrbitFeaturesStore.getState().actions.enableOrbitFullControl();
    useOrbitFeaturesStore.getState().actions.resetToDefault();
    expect(useOrbitFeaturesStore.getState().orbitFullControl).toBe(false);
  });

  it('clears all panelOverrides', () => {
    useOrbitFeaturesStore.getState().actions.overridePanel('classroom', true);
    useOrbitFeaturesStore.getState().actions.resetToDefault();
    expect(useOrbitFeaturesStore.getState().panelOverrides).toEqual({});
  });
});

// ── selectFlags ───────────────────────────────────────────────────────────────

describe('selectFlags', () => {
  beforeEach(resetStore);

  it('returns orbitFullControl and panelOverrides', () => {
    const flags = selectFlags(useOrbitFeaturesStore.getState());
    expect(flags).toHaveProperty('orbitFullControl');
    expect(flags).toHaveProperty('panelOverrides');
  });

  it('does not include actions in the returned flags', () => {
    const flags = selectFlags(useOrbitFeaturesStore.getState());
    expect(flags).not.toHaveProperty('actions');
  });

  it('reflects current state', () => {
    useOrbitFeaturesStore.getState().actions.enableOrbitFullControl();
    useOrbitFeaturesStore.getState().actions.overridePanel('copilot', false);
    const flags = selectFlags(useOrbitFeaturesStore.getState());
    expect(flags.orbitFullControl).toBe(true);
    expect(flags.panelOverrides.copilot).toBe(false);
  });
});

// ── selectIsPanelOverridden ────────────────────────────────────────────────────

describe('selectIsPanelOverridden', () => {
  beforeEach(resetStore);

  it('returns undefined when no override is set', () => {
    const result = selectIsPanelOverridden('classroom')(useOrbitFeaturesStore.getState());
    expect(result).toBeUndefined();
  });

  it('returns true when override is hidden', () => {
    useOrbitFeaturesStore.getState().actions.overridePanel('classroom', true);
    const result = selectIsPanelOverridden('classroom')(useOrbitFeaturesStore.getState());
    expect(result).toBe(true);
  });

  it('returns false when override is shown', () => {
    useOrbitFeaturesStore.getState().actions.overridePanel('copilot', false);
    const result = selectIsPanelOverridden('copilot')(useOrbitFeaturesStore.getState());
    expect(result).toBe(false);
  });
});

// ── Structural contracts ───────────────────────────────────────────────────────

describe('useOrbitFeaturesStore structural contracts', () => {
  it('exports useOrbitFeaturesStore as a function', () => {
    expect(typeof useOrbitFeaturesStore).toBe('function');
  });

  it('exports selectFlags as a function', () => {
    expect(typeof selectFlags).toBe('function');
  });

  it('exports selectIsPanelOverridden as a function', () => {
    expect(typeof selectIsPanelOverridden).toBe('function');
  });

  it('actions object contains all expected actions', () => {
    const { actions } = useOrbitFeaturesStore.getState();
    const expected = [
      'enableOrbitFullControl',
      'disableOrbitFullControl',
      'overridePanel',
      'resetOverride',
      'resetAllOverrides',
      'resetToDefault',
    ];
    expected.forEach((key) => {
      expect(typeof actions[key]).toBe('function');
    });
  });
});

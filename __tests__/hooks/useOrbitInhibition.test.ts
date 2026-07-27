// @ts-nocheck
/**
 * __tests__/hooks/useOrbitInhibition.test.ts — Unit tests (Fase 9)
 *
 * Coverage:
 *   - VIEW_TO_PANEL_ID mapping correctness (all 7 panel buckets)
 *   - useOrbitInhibition — default, orbitFullControl, manual overrides
 *   - useViewInhibition — view with mapping, view without mapping
 *   - useAllPanelInhibition — returns all 7 panels with correct shape
 *   - Structural contracts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import {
  VIEW_TO_PANEL_ID,
  useOrbitInhibition,
  useViewInhibition,
  useAllPanelInhibition,
} from '../../src/hooks/useOrbitInhibition';
import { useOrbitFeaturesStore } from '../../src/stores/useOrbitFeaturesStore';
import { ALL_PANELS } from '../../src/modules/orbit/featureFlagEngine';

// ── Reset helper ───────────────────────────────────────────────────────────────

function resetStore() {
  useOrbitFeaturesStore.setState({ orbitFullControl: false, panelOverrides: {} });
}

// ── VIEW_TO_PANEL_ID mapping ───────────────────────────────────────────────────

describe('VIEW_TO_PANEL_ID', () => {
  it('maps "home" to "dashboard"', () => {
    expect(VIEW_TO_PANEL_ID['home']).toBe('dashboard');
  });

  it('maps "teacher-dashboard" to "dashboard"', () => {
    expect(VIEW_TO_PANEL_ID['teacher-dashboard']).toBe('dashboard');
  });

  it('maps "workspace" to "dashboard"', () => {
    expect(VIEW_TO_PANEL_ID['workspace']).toBe('dashboard');
  });

  it('maps "aula" to "classroom"', () => {
    expect(VIEW_TO_PANEL_ID['aula']).toBe('classroom');
  });

  it('maps "aula-session" to "classroom"', () => {
    expect(VIEW_TO_PANEL_ID['aula-session']).toBe('classroom');
  });

  it('maps "copilot" to "copilot"', () => {
    expect(VIEW_TO_PANEL_ID['copilot']).toBe('copilot');
  });

  it('maps "settings" to "settings"', () => {
    expect(VIEW_TO_PANEL_ID['settings']).toBe('settings');
  });

  it('maps "register" to "register"', () => {
    expect(VIEW_TO_PANEL_ID['register']).toBe('register');
  });

  it('maps "uda" to "planner"', () => {
    expect(VIEW_TO_PANEL_ID['uda']).toBe('planner');
  });

  it('maps "progettazione-hub" to "planner"', () => {
    expect(VIEW_TO_PANEL_ID['progettazione-hub']).toBe('planner');
  });

  it('maps "lessons" to "planner"', () => {
    expect(VIEW_TO_PANEL_ID['lessons']).toBe('planner');
  });

  it('maps "timetable" to "planner"', () => {
    expect(VIEW_TO_PANEL_ID['timetable']).toBe('planner');
  });

  it('maps "evaluations" to "evaluation"', () => {
    expect(VIEW_TO_PANEL_ID['evaluations']).toBe('evaluation');
  });

  it('maps "rubriche" to "evaluation"', () => {
    expect(VIEW_TO_PANEL_ID['rubriche']).toBe('evaluation');
  });

  it('does not map Orbit-native views (e.g. "welcome")', () => {
    expect(VIEW_TO_PANEL_ID['welcome']).toBeUndefined();
  });

  it('covers all 7 PanelId values at least once', () => {
    const mapped = new Set(Object.values(VIEW_TO_PANEL_ID));
    const expected = ['classroom', 'copilot', 'settings', 'register', 'dashboard', 'planner', 'evaluation'];
    expected.forEach((p) => expect(mapped.has(p)).toBe(true));
  });
});

// ── useOrbitInhibition ─────────────────────────────────────────────────────────

describe('useOrbitInhibition — default coexistence mode', () => {
  beforeEach(resetStore);

  it('isInhibited = false for every panel by default', () => {
    ALL_PANELS.forEach((panelId) => {
      const { result } = renderHook(() => useOrbitInhibition(panelId));
      expect(result.current.isInhibited).toBe(false);
    });
  });

  it('inhibitionReason is "default_shown" by default', () => {
    const { result } = renderHook(() => useOrbitInhibition('classroom'));
    expect(result.current.inhibitionReason).toBe('default_shown');
  });
});

describe('useOrbitInhibition — orbitFullControl = true', () => {
  beforeEach(resetStore);

  it('isInhibited = true when orbitFullControl is enabled', () => {
    const { result } = renderHook(() => useOrbitInhibition('dashboard'));

    act(() => {
      useOrbitFeaturesStore.getState().actions.enableOrbitFullControl();
    });

    expect(result.current.isInhibited).toBe(true);
  });

  it('inhibitionReason is "orbit_full_control"', () => {
    const { result } = renderHook(() => useOrbitInhibition('copilot'));

    act(() => {
      useOrbitFeaturesStore.getState().actions.enableOrbitFullControl();
    });

    expect(result.current.inhibitionReason).toBe('orbit_full_control');
  });

  it('isInhibited reverts to false when orbitFullControl is disabled', () => {
    const { result } = renderHook(() => useOrbitInhibition('settings'));

    act(() => {
      useOrbitFeaturesStore.getState().actions.enableOrbitFullControl();
    });
    expect(result.current.isInhibited).toBe(true);

    act(() => {
      useOrbitFeaturesStore.getState().actions.disableOrbitFullControl();
    });
    expect(result.current.isInhibited).toBe(false);
  });
});

describe('useOrbitInhibition — manual overrides', () => {
  beforeEach(resetStore);

  it('override(true): panel is inhibited even without orbitFullControl', () => {
    const { result } = renderHook(() => useOrbitInhibition('register'));

    act(() => {
      useOrbitFeaturesStore.getState().actions.overridePanel('register', true);
    });

    expect(result.current.isInhibited).toBe(true);
    expect(result.current.inhibitionReason).toBe('manual_override_hidden');
  });

  it('override(false): panel is visible even with orbitFullControl=true', () => {
    const { result } = renderHook(() => useOrbitInhibition('planner'));

    act(() => {
      useOrbitFeaturesStore.getState().actions.enableOrbitFullControl();
      useOrbitFeaturesStore.getState().actions.overridePanel('planner', false);
    });

    expect(result.current.isInhibited).toBe(false);
    expect(result.current.inhibitionReason).toBe('manual_override_shown');
  });

  it('resetOverride: panel returns to default after override is removed', () => {
    const { result } = renderHook(() => useOrbitInhibition('evaluation'));

    act(() => {
      useOrbitFeaturesStore.getState().actions.overridePanel('evaluation', true);
    });
    expect(result.current.isInhibited).toBe(true);

    act(() => {
      useOrbitFeaturesStore.getState().actions.resetOverride('evaluation');
    });
    expect(result.current.isInhibited).toBe(false);
  });
});

// ── useViewInhibition ─────────────────────────────────────────────────────────

describe('useViewInhibition', () => {
  beforeEach(resetStore);

  it('returns isInhibited=false for a mapped view in coexistence mode', () => {
    const { result } = renderHook(() => useViewInhibition('home'));
    expect(result.current.isInhibited).toBe(false);
  });

  it('returns isInhibited=false for an unmapped Orbit-native view always', () => {
    const { result } = renderHook(() => useViewInhibition('welcome'));
    act(() => {
      useOrbitFeaturesStore.getState().actions.enableOrbitFullControl();
    });
    // Orbit-native views are never inhibited
    expect(result.current.isInhibited).toBe(false);
    expect(result.current.inhibitionReason).toBe('default_shown');
  });

  it('returns isInhibited=true when mapped panel is inhibited by orbitFullControl', () => {
    const { result } = renderHook(() => useViewInhibition('copilot'));

    act(() => {
      useOrbitFeaturesStore.getState().actions.enableOrbitFullControl();
    });

    expect(result.current.isInhibited).toBe(true);
  });

  it('"aula-session" view maps to "classroom" and is inhibited with orbitFullControl', () => {
    const { result } = renderHook(() => useViewInhibition('aula-session'));

    act(() => {
      useOrbitFeaturesStore.getState().actions.enableOrbitFullControl();
    });

    expect(result.current.isInhibited).toBe(true);
    expect(result.current.inhibitionReason).toBe('orbit_full_control');
  });
});

// ── useAllPanelInhibition ─────────────────────────────────────────────────────

describe('useAllPanelInhibition', () => {
  beforeEach(resetStore);

  it('returns results for all 7 panels', () => {
    const { result } = renderHook(() => useAllPanelInhibition());
    expect(result.current).toHaveLength(7);
  });

  it('all panels are visible in coexistence mode', () => {
    const { result } = renderHook(() => useAllPanelInhibition());
    result.current.forEach((r) => expect(r.inhibited).toBe(false));
  });

  it('all panels are inhibited when orbitFullControl=true', () => {
    const { result } = renderHook(() => useAllPanelInhibition());

    act(() => {
      useOrbitFeaturesStore.getState().actions.enableOrbitFullControl();
    });

    result.current.forEach((r) => expect(r.inhibited).toBe(true));
  });

  it('each result has panelId, inhibited, reason properties', () => {
    const { result } = renderHook(() => useAllPanelInhibition());
    result.current.forEach((r) => {
      expect(r).toHaveProperty('panelId');
      expect(r).toHaveProperty('inhibited');
      expect(r).toHaveProperty('reason');
    });
  });
});

// ── Structural contracts ───────────────────────────────────────────────────────

describe('useOrbitInhibition — structural contracts', () => {
  it('VIEW_TO_PANEL_ID is a plain object', () => {
    expect(typeof VIEW_TO_PANEL_ID).toBe('object');
    expect(VIEW_TO_PANEL_ID).not.toBeNull();
  });

  it('useOrbitInhibition is a function', () => {
    expect(typeof useOrbitInhibition).toBe('function');
  });

  it('useViewInhibition is a function', () => {
    expect(typeof useViewInhibition).toBe('function');
  });

  it('useAllPanelInhibition is a function', () => {
    expect(typeof useAllPanelInhibition).toBe('function');
  });
});

// @ts-nocheck
/**
 * __tests__/components/orbit/OrbitControlPanel.test.tsx
 *
 * Unit tests for src/components/orbit/OrbitControlPanel.tsx
 *
 * Coverage:
 *  - Rendering: accordion title, subtitle with inhibited count, panel labels
 *  - Global orbitFullControl toggle → enableOrbitFullControl / disableOrbitFullControl
 *  - Per-panel switch state (none / orbitFullControl / override=true / override=false)
 *  - Per-panel reason chips (predefinito / nascosto da Orbit / nascosto manualmente / visibile manualmente)
 *  - Per-panel override actions: overridePanel / resetOverride
 *  - Reset all overrides button
 *  - onToggle callback
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { OrbitControlPanel } from '../../../src/components/orbit/OrbitControlPanel';
import { useOrbitFeaturesStore } from '../../../src/stores/useOrbitFeaturesStore';
import { ALL_PANELS } from '../../../src/modules/orbit/featureFlagEngine';
import { M3ThemeProvider } from '../../../src/theme/theme';

// ── Helpers ────────────────────────────────────────────────────────────────────

function resetStore() {
  useOrbitFeaturesStore.setState({ orbitFullControl: false, panelOverrides: {} });
}

/** Render inside M3ThemeProvider (required for MUI Accordion theme tokens). */
const wrap = (ui: React.ReactElement) => render(ui, { wrapper: M3ThemeProvider });

const defaultProps = { expanded: true, onToggle: vi.fn() };

/**
 * Index helpers for MUI Switch elements.
 * MUI v7 Switch renders role="switch" but aria-label via inputProps is not
 * resolved as accessible name in JSDOM. Use index-based queries instead.
 *
 * DOM order: [0] = global orbitFullControl toggle, [1..7] = ALL_PANELS order.
 */
const getGlobalSwitch = () => screen.getAllByRole('switch')[0];
const getPanelSwitch = (panelId: string) =>
  screen.getAllByRole('switch')[ALL_PANELS.indexOf(panelId) + 1];

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('OrbitControlPanel — rendering', () => {
  beforeEach(() => { resetStore(); vi.clearAllMocks(); });

  it('renders with title "Controllo UI Orbit"', () => {
    wrap(<OrbitControlPanel {...defaultProps} />);
    expect(screen.getByText('Controllo UI Orbit')).toBeInTheDocument();
  });

  it('subtitle shows "tutti visibili" when no panels are inhibited', () => {
    wrap(<OrbitControlPanel {...defaultProps} />);
    expect(screen.getByText(/tutti visibili/i)).toBeInTheDocument();
  });

  it('subtitle shows full inhibited count when orbitFullControl=true', () => {
    useOrbitFeaturesStore.setState({ orbitFullControl: true, panelOverrides: {} });
    wrap(<OrbitControlPanel {...defaultProps} />);
    expect(screen.getByText(new RegExp(`${ALL_PANELS.length} nascosti`))).toBeInTheDocument();
  });

  it('subtitle shows correct count with 2 manual overrides (hidden)', () => {
    useOrbitFeaturesStore.setState({
      orbitFullControl: false,
      panelOverrides: { dashboard: true, planner: true },
    });
    wrap(<OrbitControlPanel {...defaultProps} />);
    expect(screen.getByText(/2 nascosti/)).toBeInTheDocument();
  });

  it('renders a switch for each panel plus the global toggle (7 + 1 = 8)', () => {
    wrap(<OrbitControlPanel {...defaultProps} />);
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(ALL_PANELS.length + 1);
  });

  it('shows Italian label "Dashboard"', () => {
    wrap(<OrbitControlPanel {...defaultProps} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('shows Italian label "Aula"', () => {
    wrap(<OrbitControlPanel {...defaultProps} />);
    expect(screen.getByText('Aula')).toBeInTheDocument();
  });

  it('shows Italian label "Copilota"', () => {
    wrap(<OrbitControlPanel {...defaultProps} />);
    expect(screen.getByText('Copilota')).toBeInTheDocument();
  });

  it('shows "Override per pannello" section label', () => {
    wrap(<OrbitControlPanel {...defaultProps} />);
    expect(screen.getByText(/override per pannello/i)).toBeInTheDocument();
  });
});

// ── Global toggle ─────────────────────────────────────────────────────────────

describe('OrbitControlPanel — global orbitFullControl toggle', () => {
  beforeEach(() => { resetStore(); vi.clearAllMocks(); });

  it('global switch is unchecked when orbitFullControl=false', () => {
    wrap(<OrbitControlPanel {...defaultProps} />);
    expect(getGlobalSwitch()).not.toBeChecked();
  });

  it('global switch is checked when orbitFullControl=true', () => {
    useOrbitFeaturesStore.setState({ orbitFullControl: true, panelOverrides: {} });
    wrap(<OrbitControlPanel {...defaultProps} />);
    expect(getGlobalSwitch()).toBeChecked();
  });

  it('toggling global switch ON calls enableOrbitFullControl', () => {
    const actions = useOrbitFeaturesStore.getState().actions;
    const spy = vi.spyOn(actions, 'enableOrbitFullControl');
    wrap(<OrbitControlPanel {...defaultProps} />);
    fireEvent.click(getGlobalSwitch());
    expect(spy).toHaveBeenCalledOnce();
  });

  it('toggling global switch OFF calls disableOrbitFullControl', () => {
    useOrbitFeaturesStore.setState({ orbitFullControl: true, panelOverrides: {} });
    const actions = useOrbitFeaturesStore.getState().actions;
    const spy = vi.spyOn(actions, 'disableOrbitFullControl');
    wrap(<OrbitControlPanel {...defaultProps} />);
    fireEvent.click(getGlobalSwitch());
    expect(spy).toHaveBeenCalledOnce();
  });

  it('coexistence mode caption visible when orbitFullControl=false', () => {
    wrap(<OrbitControlPanel {...defaultProps} />);
    expect(screen.getByText(/vecchi pannelli visibili per default/i)).toBeInTheDocument();
  });

  it('orbit control mode caption visible when orbitFullControl=true', () => {
    useOrbitFeaturesStore.setState({ orbitFullControl: true, panelOverrides: {} });
    wrap(<OrbitControlPanel {...defaultProps} />);
    expect(screen.getByText(/Orbit gestisce tutta la UI/i)).toBeInTheDocument();
  });
});

// ── Per-panel switch state ────────────────────────────────────────────────────

describe('OrbitControlPanel — per-panel switch state', () => {
  beforeEach(() => { resetStore(); vi.clearAllMocks(); });

  it('dashboard switch is checked by default (no override, no orbitFullControl)', () => {
    wrap(<OrbitControlPanel {...defaultProps} />);
    expect(getPanelSwitch('dashboard')).toBeChecked();
  });

  it('dashboard switch is unchecked when orbitFullControl=true', () => {
    useOrbitFeaturesStore.setState({ orbitFullControl: true, panelOverrides: {} });
    wrap(<OrbitControlPanel {...defaultProps} />);
    expect(getPanelSwitch('dashboard')).not.toBeChecked();
  });

  it('dashboard switch is unchecked when override=true (manually hidden)', () => {
    useOrbitFeaturesStore.setState({ orbitFullControl: false, panelOverrides: { dashboard: true } });
    wrap(<OrbitControlPanel {...defaultProps} />);
    expect(getPanelSwitch('dashboard')).not.toBeChecked();
  });

  it('dashboard switch is checked when override=false (force-visible) even if orbitFullControl=true', () => {
    useOrbitFeaturesStore.setState({ orbitFullControl: true, panelOverrides: { dashboard: false } });
    wrap(<OrbitControlPanel {...defaultProps} />);
    expect(getPanelSwitch('dashboard')).toBeChecked();
  });
});

// ── Reason chips ──────────────────────────────────────────────────────────────

describe('OrbitControlPanel — reason chips', () => {
  beforeEach(() => { resetStore(); vi.clearAllMocks(); });

  it('shows "predefinito" chip for all panels in default state', () => {
    wrap(<OrbitControlPanel {...defaultProps} />);
    const chips = screen.getAllByText('predefinito');
    expect(chips).toHaveLength(ALL_PANELS.length);
  });

  it('shows "nascosto da Orbit" chip for each panel when orbitFullControl=true', () => {
    useOrbitFeaturesStore.setState({ orbitFullControl: true, panelOverrides: {} });
    wrap(<OrbitControlPanel {...defaultProps} />);
    const chips = screen.getAllByText('nascosto da Orbit');
    expect(chips).toHaveLength(ALL_PANELS.length);
  });

  it('shows "nascosto manualmente" chip for manually hidden panel', () => {
    useOrbitFeaturesStore.setState({ orbitFullControl: false, panelOverrides: { classroom: true } });
    wrap(<OrbitControlPanel {...defaultProps} />);
    expect(screen.getByText('nascosto manualmente')).toBeInTheDocument();
  });

  it('shows "visibile manualmente" chip for force-visible panel (overrides orbitFullControl)', () => {
    useOrbitFeaturesStore.setState({ orbitFullControl: true, panelOverrides: { planner: false } });
    wrap(<OrbitControlPanel {...defaultProps} />);
    expect(screen.getByText('visibile manualmente')).toBeInTheDocument();
  });
});

// ── Per-panel override actions ────────────────────────────────────────────────

describe('OrbitControlPanel — per-panel override actions', () => {
  beforeEach(() => { resetStore(); vi.clearAllMocks(); });

  it('toggling panel switch OFF calls overridePanel(panelId, true)', () => {
    const actions = useOrbitFeaturesStore.getState().actions;
    const spy = vi.spyOn(actions, 'overridePanel');
    wrap(<OrbitControlPanel {...defaultProps} />);
    fireEvent.click(getPanelSwitch('dashboard'));
    expect(spy).toHaveBeenCalledWith('dashboard', true);
  });

  it('toggling panel switch ON when orbitFullControl calls overridePanel(panelId, false)', () => {
    useOrbitFeaturesStore.setState({ orbitFullControl: true, panelOverrides: {} });
    const actions = useOrbitFeaturesStore.getState().actions;
    const spy = vi.spyOn(actions, 'overridePanel');
    wrap(<OrbitControlPanel {...defaultProps} />);
    fireEvent.click(getPanelSwitch('dashboard'));
    expect(spy).toHaveBeenCalledWith('dashboard', false);
  });

  it('reset button is absent when no override is set for any panel', () => {
    wrap(<OrbitControlPanel {...defaultProps} />);
    expect(screen.queryAllByRole('button', { name: /Rimuovi override per/ })).toHaveLength(0);
  });

  it('reset button appears for a panel that has an override', () => {
    useOrbitFeaturesStore.setState({ orbitFullControl: false, panelOverrides: { dashboard: true } });
    wrap(<OrbitControlPanel {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Rimuovi override per Dashboard' })).toBeInTheDocument();
  });

  it('reset button does not appear for panels without overrides', () => {
    useOrbitFeaturesStore.setState({ orbitFullControl: false, panelOverrides: { dashboard: true } });
    wrap(<OrbitControlPanel {...defaultProps} />);
    // Only 1 reset button (for dashboard) — others have no override
    expect(screen.getAllByRole('button', { name: /Rimuovi override per/ })).toHaveLength(1);
  });

  it('clicking reset button calls resetOverride with correct panelId', () => {
    useOrbitFeaturesStore.setState({ orbitFullControl: false, panelOverrides: { dashboard: true } });
    const actions = useOrbitFeaturesStore.getState().actions;
    const spy = vi.spyOn(actions, 'resetOverride');
    wrap(<OrbitControlPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Rimuovi override per Dashboard' }));
    expect(spy).toHaveBeenCalledWith('dashboard');
  });
});

// ── Reset all overrides ───────────────────────────────────────────────────────

describe('OrbitControlPanel — reset all overrides button', () => {
  beforeEach(() => { resetStore(); vi.clearAllMocks(); });

  it('"Reset override" button is always visible', () => {
    wrap(<OrbitControlPanel {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Rimuovi tutti gli override per pannello' })).toBeInTheDocument();
  });

  it('clicking "Reset override" calls resetAllOverrides', () => {
    const actions = useOrbitFeaturesStore.getState().actions;
    const spy = vi.spyOn(actions, 'resetAllOverrides');
    wrap(<OrbitControlPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Rimuovi tutti gli override per pannello' }));
    expect(spy).toHaveBeenCalledOnce();
  });
});

// ── onToggle callback ─────────────────────────────────────────────────────────

describe('OrbitControlPanel — onToggle callback', () => {
  beforeEach(() => { resetStore(); vi.clearAllMocks(); });

  it('calls onToggle when the accordion header is clicked', () => {
    const onToggle = vi.fn();
    wrap(<OrbitControlPanel expanded={true} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button', { name: /Controllo UI Orbit/i }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('accordion content is visible when expanded=true', () => {
    wrap(<OrbitControlPanel expanded={true} onToggle={vi.fn()} />);
    expect(screen.getByText('Controllo completo Orbit')).toBeInTheDocument();
  });

  it('accordion title "Controllo UI Orbit" is always in the DOM regardless of expanded state', () => {
    wrap(<OrbitControlPanel expanded={false} onToggle={vi.fn()} />);
    expect(screen.getByText('Controllo UI Orbit')).toBeInTheDocument();
  });
});

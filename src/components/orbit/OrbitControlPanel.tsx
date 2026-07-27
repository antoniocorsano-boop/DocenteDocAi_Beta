// MD3 Gold Compliant — Orbit Control Panel
// All colors, spacing, and typography use MD3 tokens only.
// No hardcoded px/rem/hex values for semantic UI.

/**
 * components/orbit/OrbitControlPanel.tsx — Orbit UI Inhibition Control Panel
 *
 * Settings surface that lets the user (or admin) control which legacy panels
 * Orbit is allowed to soft-hide. Plugs directly into the `useOrbitFeaturesStore`.
 *
 * INVARIANT: all inhibition is soft — panels are hidden via data attributes only,
 * never unmounted. This UI changes flags; the wiring is in ViewManager.tsx.
 *
 * Usage (e.g. in SettingsAdvanced.tsx or a dedicated Orbit settings tab):
 *   <OrbitControlPanel expanded={expanded} onToggle={onToggle} />
 */

import React from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';

import SettingsGroup from '../settings/SettingsGroupAccordion';
import {
  useOrbitFeaturesStore,
  selectFlags,
  selectIsPanelOverridden,
} from '@/stores/useOrbitFeaturesStore';
import { ALL_PANELS } from '@/modules/orbit/featureFlagEngine';
import type { PanelId } from '@/types/features.types';

// ── Panel metadata ────────────────────────────────────────────────────────────

const PANEL_LABELS: Record<PanelId, string> = {
  classroom:  'Aula',
  copilot:    'Copilota',
  settings:   'Impostazioni',
  register:   'Registro',
  dashboard:  'Dashboard',
  planner:    'Pianificazione',
  evaluation: 'Valutazione',
};

const PANEL_ICONS: Record<PanelId, string> = {
  classroom:  'school',
  copilot:    'psychology',
  settings:   'settings',
  register:   'assignment',
  dashboard:  'home',
  planner:    'calendar_month',
  evaluation: 'grading',
};

// ── Sub-component: single panel row ──────────────────────────────────────────

interface PanelRowProps {
  panelId: PanelId;
  orbitFullControl: boolean;
}

const PanelRow: React.FC<PanelRowProps> = ({ panelId, orbitFullControl }) => {
  const override  = useOrbitFeaturesStore(selectIsPanelOverridden(panelId));
  const { overridePanel, resetOverride } = useOrbitFeaturesStore((s) => s.actions);

  // Effective inhibition: override takes precedence, then orbitFullControl
  const isEffectivelyInhibited =
    override !== undefined ? override : orbitFullControl;

  // Chip label for current resolution
  let reasonLabel = 'predefinito';
  let reasonColor: 'default' | 'warning' | 'success' | 'error' = 'default';
  if (override === true) {
    reasonLabel = 'nascosto manualmente';
    reasonColor = 'warning';
  } else if (override === false) {
    reasonLabel = 'visibile manualmente';
    reasonColor = 'success';
  } else if (orbitFullControl) {
    reasonLabel = 'nascosto da Orbit';
    reasonColor = 'warning';
  }

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Switch checked = visible (hidden = false); unchecked = inhibited (hidden = true)
    const wantsVisible = event.target.checked;
    if (!orbitFullControl && !override) {
      // In default mode, only set override if user is actively choosing
      if (!wantsVisible) overridePanel(panelId, true);
    } else {
      overridePanel(panelId, !wantsVisible);
    }
  };

  return (
    <Box
      sx={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        p:              'var(--md-sys-spacing-3)',
        borderRadius:   'var(--md-sys-shape-corner-medium)',
        bgcolor:        isEffectivelyInhibited
          ? 'var(--md-sys-color-error-container)'
          : 'var(--md-sys-color-surface-container)',
        border:         '1px solid',
        borderColor:    isEffectivelyInhibited
          ? 'var(--md-sys-color-error)'
          : 'var(--md-sys-color-outline-variant)',
        transition:     'background-color 200ms ease, border-color 200ms ease',
      }}
    >
      {/* Icon + label */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{
            fontSize:   'var(--md-sys-icon-size-md, 24px)',
            color:      isEffectivelyInhibited
              ? 'var(--md-sys-color-on-error-container)'
              : 'var(--md-sys-color-primary)',
          }}
        >
          {PANEL_ICONS[panelId]}
        </Box>

        <Stack spacing={0.25}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 'var(--md-sys-typescale-weight-medium)',
              color:      isEffectivelyInhibited
                ? 'var(--md-sys-color-on-error-container)'
                : 'var(--md-sys-color-on-surface)',
            }}
          >
            {PANEL_LABELS[panelId]}
          </Typography>
          <Chip
            label={reasonLabel}
            color={reasonColor}
            size="small"
            sx={{ height: 20, fontSize: 'var(--md-sys-typescale-label-small-size)' }}
          />
        </Stack>
      </Stack>

      {/* Override switch + reset */}
      <Stack direction="row" spacing={1} alignItems="center">
        {override !== undefined && (
          <Button
            size="small"
            variant="text"
            onClick={() => resetOverride(panelId)}
            aria-label={`Rimuovi override per ${PANEL_LABELS[panelId]}`}
            sx={{
              minWidth:   0,
              px:         'var(--md-sys-spacing-2)',
              color:      'var(--md-sys-color-on-surface-variant)',
              fontSize:   'var(--md-sys-typescale-label-small-size)',
            }}
          >
            reset
          </Button>
        )}
        <FormControlLabel
          control={
            <Switch
              checked={!isEffectivelyInhibited}
              onChange={handleToggle}
              size="small"
              inputProps={{ 'aria-label': `Panel ${PANEL_LABELS[panelId]} visibile` }}
            />
          }
          label=""
          sx={{ m: 0 }}
        />
      </Stack>
    </Box>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

interface OrbitControlPanelProps {
  expanded: boolean;
  onToggle: () => void;
}

export const OrbitControlPanel: React.FC<OrbitControlPanelProps> = ({
  expanded,
  onToggle,
}) => {
  const flags = useOrbitFeaturesStore(selectFlags);
  const { enableOrbitFullControl, disableOrbitFullControl, resetAllOverrides } =
    useOrbitFeaturesStore((s) => s.actions);

  const inhibitedCount = ALL_PANELS.filter((id) => {
    const override = flags.panelOverrides[id];
    if (override !== undefined) return override;
    return flags.orbitFullControl;
  }).length;

  return (
    <SettingsGroup
      id="orbit_control"
      title="Controllo UI Orbit"
      subtitle={`Gestisci quali pannelli legacy sono visibili — ${inhibitedCount === 0 ? 'tutti visibili' : `${inhibitedCount} nascosti`}`}
      icon="manage_accounts"
      variant="tertiary"
      expanded={expanded}
      onToggle={onToggle}
    >
      <Stack spacing={2}>

        {/* Global toggle */}
        <Box
          sx={{
            p:           'var(--md-sys-spacing-3)',
            bgcolor:     'var(--md-sys-color-tertiary-container)',
            borderRadius:'var(--md-sys-shape-corner-large)',
            border:      '1px solid',
            borderColor: 'var(--md-sys-color-tertiary)',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.5} sx={{ flex: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 'var(--md-sys-typescale-weight-medium)',
                  color:      'var(--md-sys-color-on-tertiary-container)',
                }}
              >
                Controllo completo Orbit
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'var(--md-sys-color-on-tertiary-container)', opacity: 0.8 }}
              >
                {flags.orbitFullControl
                  ? 'Orbit gestisce tutta la UI — pannelli legacy nascosti (soft)'
                  : 'Modalità coesistenza — vecchi pannelli visibili per default'}
              </Typography>
            </Stack>
            <Switch
              checked={flags.orbitFullControl}
              onChange={(e) =>
                e.target.checked ? enableOrbitFullControl() : disableOrbitFullControl()
              }
              inputProps={{ 'aria-label': 'Abilita controllo completo Orbit' }}
              color="secondary"
            />
          </Stack>
        </Box>

        <Divider sx={{ borderColor: 'var(--md-sys-color-outline-variant)' }} />

        {/* Per-panel rows */}
        <Stack spacing={1}>
          <Typography
            variant="overline"
            sx={{ color: 'var(--md-sys-color-on-surface-variant)', letterSpacing: '0.08em' }}
          >
            Override per pannello
          </Typography>
          {ALL_PANELS.map((panelId) => (
            <PanelRow
              key={panelId}
              panelId={panelId}
              orbitFullControl={flags.orbitFullControl}
            />
          ))}
        </Stack>

        <Divider sx={{ borderColor: 'var(--md-sys-color-outline-variant)' }} />

        {/* Actions */}
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            size="small"
            variant="outlined"
            onClick={resetAllOverrides}
            aria-label="Rimuovi tutti gli override per pannello"
            startIcon={
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-sm, 20px)' }}
              >
                refresh
              </Box>
            }
          >
            Reset override
          </Button>
        </Stack>

      </Stack>
    </SettingsGroup>
  );
};

export default OrbitControlPanel;

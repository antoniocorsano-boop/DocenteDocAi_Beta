/**
 * InteractionModeSelector.tsx — Selettore modalità di interazione AI
 *
 * ToggleButtonGroup MUI v7 con tre opzioni:
 *   - classica:       suggerimenti base, attività non predittive
 *   - semi-osmotica:  suggerimenti avanzati con trend parziali
 *   - osmotica:       tutto predittivo, AI guida il workflow
 *
 * Chiama store.actions.setInteractionMode() al cambio selezione.
 * MD3 Gold Compliant — solo token MD3.
 */
import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import type { InteractionMode } from '../../../types/aiMaturita.types';

// ── helpers ───────────────────────────────────────────────────────────────────

function tok(name: string) {
  return `var(--md-sys-color-${name})`;
}

// ── Mode metadata ─────────────────────────────────────────────────────────────

interface ModeDescriptor {
  value: InteractionMode;
  label: string;
  shortLabel: string;
  tooltip: string;
  icon: React.ReactElement;
}

const MODES: ModeDescriptor[] = [
  {
    value: 'classica',
    label: 'Classica',
    shortLabel: 'Classica',
    tooltip: 'Suggerimenti base — attività non predittive. Ideale per chi inizia con gli strumenti AI.',
    icon: <SchoolOutlinedIcon fontSize="small" aria-hidden />,
  },
  {
    value: 'semi-osmotica',
    label: 'Semi-osmotica',
    shortLabel: 'Semi',
    tooltip: 'Suggerimenti avanzati con analisi trend parziali. Attività predittive attivate su richiesta.',
    icon: <BoltOutlinedIcon fontSize="small" aria-hidden />,
  },
  {
    value: 'osmotica',
    label: 'Osmotica',
    shortLabel: 'Osmotica',
    tooltip: 'Tutto predittivo e proattivo — l\'AI guida il workflow operativo del docente in tempo reale.',
    icon: <AutoAwesomeOutlinedIcon fontSize="small" aria-hidden />,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export interface InteractionModeSelectorProps {
  value: InteractionMode;
  onChange: (mode: InteractionMode) => void;
  /** Layout compatto (nasconde descrizione) */
  compact?: boolean;
}

const InteractionModeSelector: React.FC<InteractionModeSelectorProps> = ({
  value,
  onChange,
  compact = false,
}) => {
  const handleChange = (_: React.MouseEvent<HTMLElement>, newMode: InteractionMode | null) => {
    if (newMode !== null) {
      onChange(newMode);
    }
  };

  const currentMode = MODES.find((m) => m.value === value);

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ sm: 'center' }}
      >
        <Box flex={1}>
          <Typography
            variant="labelMedium"
            component="p"
            sx={{ color: tok('on-surface-variant'), mb: 'var(--md-sys-spacing-1)' }}
          >
            Modalità di interazione
          </Typography>
          <ToggleButtonGroup
            value={value}
            exclusive
            onChange={handleChange}
            aria-label="Modalità di interazione AI"
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                borderColor: tok('outline-variant'),
                color: tok('on-surface-variant'),
                textTransform: 'none',
                fontSize: 'var(--md-sys-typescale-label-medium-font-size)',
                px: 'var(--md-sys-spacing-3)',
                py: 'var(--md-sys-spacing-1)',
                gap: 'var(--md-sys-spacing-1)',
              },
              '& .MuiToggleButton-root.Mui-selected': {
                backgroundColor: tok('primary-container'),
                color: tok('on-primary-container'),
                borderColor: tok('primary'),
                '&:hover': {
                  backgroundColor: tok('primary-container'),
                },
              },
            }}
          >
            {MODES.map((mode) => (
              <Tooltip key={mode.value} title={mode.tooltip} arrow placement="top">
                <ToggleButton
                  value={mode.value}
                  aria-label={`Modalità ${mode.label}: ${mode.tooltip}`}
                >
                  {mode.icon}
                  {compact ? mode.shortLabel : mode.label}
                </ToggleButton>
              </Tooltip>
            ))}
          </ToggleButtonGroup>
        </Box>

        {!compact && currentMode && (
          <Box
            sx={{
              p: 'var(--md-sys-spacing-2)',
              bgcolor: tok('surface-container-low'),
              borderRadius: 'var(--md-sys-shape-corner-small)',
              maxWidth: 280,
              display: { xs: 'none', md: 'block' },
            }}
          >
            <Typography
              variant="bodySmall"
              sx={{ color: tok('on-surface-variant') }}
            >
              {currentMode.tooltip}
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default InteractionModeSelector;

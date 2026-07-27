/**
 * TrustBadge.tsx — P40 Trust Layer
 *
 * Lightweight trust micro-signals shown in SmartLandingView and optionally
 * inline in the chat. Three independent signals:
 *   🔒 Dati protetti — sempre controllabili dall'utente
 *   💡 Perché vedi questo — ragione del suggerimento
 *   ⚙️ Modificabile — ogni risposta è personalizzabile
 *
 * MD3 Gold Compliant — solo primitivi MUI, nessun override di stile.
 */
import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import TuneIcon from '@mui/icons-material/Tune';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface TrustBadgeProps {
  /**
   * Context text for the "💡 Perché lo vedi" signal.
   * If omitted, the signal shows a generic message.
   */
  suggestionContext?: string;
  /**
   * compact — shows only the 🔒 data badge (1 chip)
   * full    — shows all 3 micro-signals (default)
   */
  variant?: 'compact' | 'full';
  /** sx-compatible justify-content for the row. Default: 'center'. */
  justify?: 'flex-start' | 'center' | 'flex-end';
}

// ── Sub-component: one signal chip ────────────────────────────────────────────

function SignalChip({
  icon,
  text,
  tooltip,
}: {
  icon:    React.ReactElement;
  text:    string;
  tooltip: string;
}) {
  return (
    <Tooltip title={tooltip} placement="top" arrow>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        sx={{
          px:              1.25,
          py:              0.4,
          borderRadius:    '999px',
          border:          '1px solid',
          borderColor:     'divider',
          backgroundColor: 'action.hover',
          cursor:          'default',
          userSelect:      'none',
          transition:      'background-color 0.15s',
          '&:hover': {
            backgroundColor: 'action.selected',
          },
        }}
      >
        <Box
          sx={{ color: 'text.secondary', display: 'flex', flexShrink: 0 }}
          aria-hidden="true"
        >
          {icon}
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
        >
          {text}
        </Typography>
      </Stack>
    </Tooltip>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TrustBadge({
  suggestionContext,
  variant  = 'full',
  justify  = 'center',
}: TrustBadgeProps): React.ReactElement {
  const dataBadge = {
    icon:    <LockOutlinedIcon sx={{ fontSize: 13 }} />,
    text:    'Dati protetti',
    tooltip: 'I tuoi dati restano sul dispositivo. Puoi azzerare la memoria AI o esportarli in qualsiasi momento dalle impostazioni.',
  };

  const contextBadge = {
    icon:    <TipsAndUpdatesOutlinedIcon sx={{ fontSize: 13 }} />,
    text:    suggestionContext ?? 'Suggeriti dal contesto',
    tooltip: 'Il sistema legge le tue UDA, valutazioni e conversazioni recenti per proporre azioni utili. Nessun dato esce dal tuo dispositivo.',
  };

  const modBadge = {
    icon:    <TuneIcon sx={{ fontSize: 13 }} />,
    text:    'Tutto modificabile',
    tooltip: 'Ogni risposta può essere rielaborata, approfondita o ignorata. Usa ⚙️ Impostazioni per personalizzare modalità e stile.',
  };

  const signals = variant === 'compact'
    ? [dataBadge]
    : [dataBadge, contextBadge, modBadge];

  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      gap={0.75}
      useFlexGap
      justifyContent={justify}
      aria-label="Indicatori di trasparenza"
    >
      {signals.map((s, i) => (
        <SignalChip key={i} icon={s.icon} text={s.text} tooltip={s.tooltip} />
      ))}
    </Stack>
  );
}

export default TrustBadge;

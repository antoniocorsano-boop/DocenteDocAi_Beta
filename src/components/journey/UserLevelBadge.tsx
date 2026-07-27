/**
 * UserLevelBadge — MD3 Chip showing the teacher's current JourneyLevel.
 *
 * - Color: esploratore=secondary, praticante=primary, maestro=tertiary
 * - shimmer animation when levelUpPending=true
 * - click scrolls to #journey-progress anchor
 */

import React from 'react';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import { useJourneyProgress } from '../../hooks/useJourneyProgress';
import type { JourneyLevel } from '../../types/teacherModel.types';

const LEVEL_LABELS: Record<JourneyLevel, string> = {
  esploratore: 'Esploratore',
  praticante: 'Praticante',
  maestro: 'Maestro',
};

const LEVEL_ICONS: Record<JourneyLevel, string> = {
  esploratore: 'explore',
  praticante: 'school',
  maestro: 'auto_awesome',
};

function levelColor(level: JourneyLevel): 'default' | 'primary' | 'secondary' {
  if (level === 'maestro') return 'primary'; // will use tertiary token via sx
  if (level === 'praticante') return 'primary';
  return 'secondary';
}

const shimmerStyle = {
  '@keyframes shimmer': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.6 },
    '100%': { opacity: 1 },
  },
  animation: 'shimmer 1.5s ease-in-out infinite',
};

const UserLevelBadge: React.FC = () => {
  const { level, levelUpPending } = useJourneyProgress();

  const handleClick = () => {
    const el = document.getElementById('journey-progress');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const isMaestro = level === 'maestro';

  return (
    <Chip
      aria-label={`Livello utente: ${LEVEL_LABELS[level]}`}
      label={LEVEL_LABELS[level]}
      color={levelColor(level)}
      size="small"
      onClick={handleClick}
      icon={
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{ fontSize: '1rem !important' }}
        >
          {LEVEL_ICONS[level]}
        </Box>
      }
      sx={{
        cursor: 'pointer',
        fontWeight: 'var(--md-sys-typescale-weight-bold)',
        ...(isMaestro && {
          bgcolor: 'var(--md-sys-color-tertiary-container)',
          color: 'var(--md-sys-color-on-tertiary-container)',
          '& .MuiChip-icon': { color: 'var(--md-sys-color-on-tertiary-container)' },
        }),
        ...(levelUpPending && shimmerStyle),
      }}
    />
  );
};

export default UserLevelBadge;

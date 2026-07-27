/**
 * FeatureHintChip — non-blocking dismissible hint chip.
 *
 * Shows a contextual hint for a feature gated behind a minimum JourneyLevel.
 * Does NOT gate the feature — only provides a proactive nudge.
 * Disappears when dismissed (persists via dismissedHints in store).
 */

import React from 'react';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import { useTeacherModelStore } from '../../stores/useTeacherModelStore';
import { useJourneyProgress } from '../../hooks/useJourneyProgress';
import type { JourneyLevel } from '../../types/teacherModel.types';

interface FeatureHintChipProps {
  hintId: string;
  requiredLevel: JourneyLevel;
  message: string;
}

const levelOrder: JourneyLevel[] = ['esploratore', 'praticante', 'maestro'];

const FeatureHintChip: React.FC<FeatureHintChipProps> = ({ hintId, requiredLevel, message }) => {
  const dismissHint = useTeacherModelStore((s) => s.dismissHint);
  const dismissedHints = useTeacherModelStore((s) => s.dismissedHints);
  const { level } = useJourneyProgress();

  // Show only when user has reached or surpassed the required level
  const userIdx = levelOrder.indexOf(level);
  const requiredIdx = levelOrder.indexOf(requiredLevel);
  if (userIdx < requiredIdx) return null;
  if (dismissedHints.includes(hintId)) return null;

  return (
    <Chip
      aria-label={message}
      label={message}
      size="small"
      variant="outlined"
      color="primary"
      onDelete={() => dismissHint(hintId)}
      deleteIcon={
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-label="Chiudi suggerimento"
          sx={{ fontSize: '1rem !important' }}
        >
          close
        </Box>
      }
      icon={
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{ fontSize: '1rem !important' }}
        >
          lightbulb
        </Box>
      }
      sx={{
        maxWidth: '100%',
        height: 'auto',
        whiteSpace: 'normal',
        '& .MuiChip-label': { whiteSpace: 'normal' },
        mb: 1,
      }}
    />
  );
};

export default FeatureHintChip;

/**
 * ActivityList.tsx — Lista presentazionale di Activity con chip Bloom.
 * Componente puro: nessuno stato, nessuna logica AI.
 * MD3 Gold Compliant.
 */
import React from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import type { Activity } from '../../ai/recommendation/activityGenerator';

function tok(name: string) {
  return `var(--md-sys-color-${name})`;
}

const ACTIVITY_TYPE_LABELS: Record<Activity['type'], string> = {
  quiz:       'Quiz',
  exercise:   'Esercizio',
  whatif:     'What-if',
  discussion: 'Discussione',
  lab:        'Laboratorio',
};

const BLOOM_LABELS: Record<string, string> = {
  remember:   'Ricorda',
  understand: 'Comprendi',
  apply:      'Applica',
  analyze:    'Analizza',
  evaluate:   'Valuta',
  create:     'Crea',
};

export interface ActivityListProps {
  activities: Activity[];
}

const ActivityList: React.FC<ActivityListProps> = ({ activities }) => (
  <Stack spacing={1.5} mt={1.5} role="list" aria-label="Attività generate">
    {activities.map((act) => (
      <Box
        key={act.id}
        role="listitem"
        aria-label={`Attività: ${act.title}`}
        sx={{
          p:            'var(--md-sys-spacing-3)',
          borderRadius: 'var(--md-sys-shape-corner-small)',
          bgcolor:      tok('surface-container-low'),
          border:       `1px solid ${tok('outline-variant')}`,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          mb={0.5}
          flexWrap="wrap"
          useFlexGap
        >
          <SchoolOutlinedIcon
            fontSize="small"
            sx={{ color: tok('tertiary'), flexShrink: 0 }}
            aria-hidden
          />
          <Typography
            variant="labelMedium"
            sx={{ color: tok('on-surface'), flex: 1, minWidth: 120 }}
          >
            {act.title}
          </Typography>
          <Chip
            label={ACTIVITY_TYPE_LABELS[act.type]}
            size="small"
            sx={{
              bgcolor:  tok('tertiary-container'),
              color:    tok('on-tertiary-container'),
              fontSize: 'var(--md-sys-typescale-label-small-font-size)',
            }}
          />
          <Chip
            label={`Bloom: ${BLOOM_LABELS[act.targetBloomLevel] ?? act.targetBloomLevel}`}
            size="small"
            sx={{
              bgcolor:  tok('secondary-container'),
              color:    tok('on-secondary-container'),
              fontSize: 'var(--md-sys-typescale-label-small-font-size)',
            }}
          />
          <Chip
            label={`${act.durationMinutes} min`}
            size="small"
            sx={{
              bgcolor:  tok('surface-container-high'),
              color:    tok('on-surface-variant'),
              fontSize: 'var(--md-sys-typescale-label-small-font-size)',
            }}
          />
        </Stack>
        <Typography
          variant="bodySmall"
          sx={{ color: tok('on-surface-variant'), mb: 0.5 }}
        >
          {act.description}
        </Typography>
        <Typography
          variant="bodySmall"
          sx={{ color: tok('on-surface-variant'), fontStyle: 'italic' }}
        >
          {act.instructions}
        </Typography>
      </Box>
    ))}
  </Stack>
);

export default ActivityList;

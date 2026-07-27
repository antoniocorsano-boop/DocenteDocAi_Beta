/**
 * RecommendationCard.tsx — Card estratta da CopilotRecommendationPanel.
 * Mostra una singola Recommendation con possibilità di generare Activity.
 * Importa generateActivity da activityGenerator.
 * MD3 Gold Compliant.
 */
import React, { useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import M3Surface from '../ui/M3Surface';
import ActivityList from './ActivityList';
import { generateActivity } from '../../ai/recommendation/activityGenerator';
import type { Activity } from '../../ai/recommendation/activityGenerator';
import type {
  Recommendation,
  RecommendationAction,
} from '../../ai/recommendation/lessonRecommender';

function tok(name: string) {
  return `var(--md-sys-color-${name})`;
}

const ACTION_LABELS: Record<RecommendationAction, string> = {
  adjustContent: 'Adatta contenuto',
  addExercise:   'Aggiungi esercizio',
  reschedule:    'Riorganizza',
  highlightRisk: 'Rischio rilevato',
};

const ACTION_COLORS: Record<RecommendationAction, { bg: string; fg: string }> = {
  adjustContent: { bg: tok('secondary-container'), fg: tok('on-secondary-container') },
  addExercise:   { bg: tok('primary-container'),   fg: tok('on-primary-container')   },
  reschedule:    { bg: tok('tertiary-container'),  fg: tok('on-tertiary-container')  },
  highlightRisk: { bg: tok('error-container'),     fg: tok('on-error-container')     },
};

const SOURCE_LABELS: Record<Recommendation['source'], string> = {
  pedagogy:   'Pedagogia',
  trust:      'Fiducia AI',
  simulation: 'Simulazione',
};

export interface RecommendationCardProps {
  rec: Recommendation;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ rec }) => {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [generating, setGenerating]  = useState(false);

  const handleGenerateActivity = useCallback(() => {
    setGenerating(true);
    // Defer off render cycle so the spinner paints first
    setTimeout(() => {
      setActivities(generateActivity(rec));
      setGenerating(false);
    }, 0);
  }, [rec]);

  const action = ACTION_COLORS[rec.suggestedAction];
  const pct    = Math.round(rec.impactScore * 100);

  return (
    <M3Surface
      elevation={3}
      sx={{
        p:            'var(--md-sys-spacing-3)',
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        border:       `1px solid ${tok('outline-variant')}`,
      }}
      role="article"
      aria-label={`Raccomandazione: ${rec.title}`}
    >
      {/* ── Title row ──────────────────────────────────────── */}
      <Stack direction="row" alignItems="flex-start" spacing={1} mb={1}>
        <BoltOutlinedIcon
          fontSize="small"
          sx={{ color: tok('primary'), mt: 0.2, flexShrink: 0 }}
          aria-hidden
        />
        <Typography
          variant="titleSmall"
          sx={{ color: tok('on-surface'), flex: 1 }}
        >
          {rec.title}
        </Typography>
        <Tooltip title={`Impatto: ${pct}%`} arrow>
          <Typography
            variant="labelSmall"
            sx={{
              color:              tok('primary'),
              fontVariantNumeric: 'tabular-nums',
              fontWeight:         'var(--md-sys-typescale-weight-semibold)',
              flexShrink:         0,
            }}
          >
            {pct}%
          </Typography>
        </Tooltip>
      </Stack>

      {/* ── Description ────────────────────────────────────── */}
      <Typography
        variant="bodySmall"
        sx={{ color: tok('on-surface-variant'), mb: 1.5, lineHeight: 1.55 }}
      >
        {rec.description}
      </Typography>

      {/* ── Impact bar ─────────────────────────────────────── */}
      <LinearProgress
        variant="determinate"
        value={pct}
        aria-label={`Impatto ${pct}%`}
        sx={{
          mb:           1.5,
          height:       4,
          borderRadius: 'var(--md-sys-shape-corner-full)',
          bgcolor:      tok('surface-container-high'),
          '& .MuiLinearProgress-bar': {
            bgcolor:      tok('primary'),
            borderRadius: 'var(--md-sys-shape-corner-full)',
          },
        }}
      />

      {/* ── Chip row ───────────────────────────────────────── */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={1}>
        <Chip
          label={ACTION_LABELS[rec.suggestedAction]}
          size="small"
          sx={{
            bgcolor:  action.bg,
            color:    action.fg,
            fontSize: 'var(--md-sys-typescale-label-small-font-size)',
          }}
        />
        <Chip
          label={SOURCE_LABELS[rec.source]}
          size="small"
          sx={{
            bgcolor:  tok('surface-container-high'),
            color:    tok('on-surface-variant'),
            fontSize: 'var(--md-sys-typescale-label-small-font-size)',
          }}
        />
        {rec.tags.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            size="small"
            sx={{
              bgcolor:  tok('surface-container'),
              color:    tok('on-surface-variant'),
              fontSize: 'var(--md-sys-typescale-label-small-font-size)',
            }}
          />
        ))}
      </Stack>

      {/* ── Generate button ────────────────────────────────── */}
      {!activities && (
        <Button
          variant="text"
          size="small"
          onClick={handleGenerateActivity}
          disabled={generating}
          aria-label="Genera attività didattiche per questa raccomandazione"
          startIcon={
            generating ? (
              <CircularProgress size={14} aria-hidden />
            ) : (
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden
                sx={{ fontSize: 16 }}
              >
                add_task
              </Box>
            )
          }
          sx={{
            color:      tok('primary'),
            fontWeight: 'var(--md-sys-typescale-weight-semibold)',
            px:         'var(--md-sys-spacing-2)',
          }}
        >
          {generating ? 'Generando…' : 'Genera attività'}
        </Button>
      )}

      {activities && <ActivityList activities={activities} />}
    </M3Surface>
  );
};

export default RecommendationCard;

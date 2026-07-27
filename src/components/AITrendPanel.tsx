/**
 * AITrendPanel.tsx
 *
 * Displays the last N daily health-score snapshots for the selected class
 * as a compact bar chart + metadata row.  No external chart dependencies
 * — pure MUI + CSS custom-properties.
 */
import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { InfoCard, SectionHeader } from './ui';
import type { AISnapshot } from '../stores/useAISnapshotStore';
import type { HealthGrade } from '../ai/classHealth/types';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_BARS = 7;

const GRADE_COLOR: Record<HealthGrade, string> = {
  ottimo:     'var(--md-sys-color-tertiary)',
  buono:      'var(--md-sys-color-primary)',
  sufficiente:'var(--md-sys-color-secondary)',
  critico:    'var(--md-sys-color-error)',
};

const GRADE_LABEL: Record<HealthGrade, string> = {
  ottimo: 'Ottimo',
  buono: 'Buono',
  sufficiente: 'Sufficiente',
  critico: 'Critico',
};

// ============================================================================
// TYPES
// ============================================================================

interface AITrendPanelProps {
  snapshots: AISnapshot[];
  className: string;
  onClearHistory?: () => void;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface BarProps {
  snapshot: AISnapshot;
}

const TrendBar: React.FC<BarProps> = ({ snapshot }) => {
  const color = GRADE_COLOR[snapshot.grade];
  // Convert YYYY-MM-DD to "DD/MM"
  const [, mm, dd] = snapshot.date.split('-');
  const label = `${dd}/${mm}`;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--md-sys-spacing-1)',
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Score label above bar */}
      <Typography
        variant="caption"
        sx={{
          color: 'var(--md-sys-color-on-surface-variant)',
          fontWeight: 'var(--md-sys-typescale-weight-medium)',
          lineHeight: 1,
        }}
      >
        {snapshot.score}
      </Typography>

      {/* Bar container with fixed height */}
      <Box
        sx={{
          width: '100%',
          height: 'var(--md-sys-spacing-20)',
          backgroundColor: 'var(--md-sys-color-surface-container)',
          borderRadius: 'var(--md-sys-shape-corner-extra-small)',
          position: 'relative',
          overflow: 'hidden',
        }}
        role="img"
        aria-label={`${GRADE_LABEL[snapshot.grade]} ${snapshot.score} del ${label}`}
      >
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${snapshot.score}%`,
            backgroundColor: color,
            borderRadius: 'var(--md-sys-shape-corner-extra-small)',
            opacity: 0.85,
            transition: 'height 0.4s ease',
          }}
        />
      </Box>

      {/* Date label below bar */}
      <Typography
        variant="caption"
        sx={{ color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1 }}
      >
        {label}
      </Typography>
    </Box>
  );
};

// ============================================================================
// LEGEND
// ============================================================================

const Legend: React.FC = () => (
  <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-4)', flexWrap: 'wrap', mt: 'var(--md-sys-spacing-2)' }}>
    {(Object.keys(GRADE_COLOR) as HealthGrade[]).map((g) => (
      <Box key={g} sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-1)' }}>
        <Box
          sx={{
            width: 'var(--md-sys-spacing-3)',
            height: 'var(--md-sys-spacing-3)',
            borderRadius: 'var(--md-sys-shape-corner-extra-small)',
            backgroundColor: GRADE_COLOR[g],
            opacity: 0.85,
          }}
        />
        <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          {GRADE_LABEL[g]}
        </Typography>
      </Box>
    ))}
  </Box>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AITrendPanel: React.FC<AITrendPanelProps> = ({ snapshots, className, onClearHistory }) => {
  const visible = useMemo(() => snapshots.slice(-MAX_BARS), [snapshots]);

  const trendMetrics = useMemo(() => {
    if (visible.length < 2) return null;
    const latest = visible[visible.length - 1];
    const prev = visible[visible.length - 2];
    const delta = latest.score - prev.score;
    return {
      delta,
      deltaStr: delta > 0 ? `+${delta}` : `${delta}`,
      deltaColor:
        delta > 0
          ? 'var(--md-sys-color-tertiary)'
          : delta < 0
          ? 'var(--md-sys-color-error)'
          : 'var(--md-sys-color-on-surface-variant)',
    };
  }, [visible]);

  if (!trendMetrics) {
    return null; // Hide until there are at least 2 data points
  }

  const { deltaStr, deltaColor } = trendMetrics;

  return (
    <InfoCard variant="outlined">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--md-sys-spacing-4)',
          flexWrap: 'wrap',
          mb: 'var(--md-sys-spacing-4)',
        }}
      >
        <SectionHeader
          title={`Storico Salute — ${className}`}
          subtitle={`Ultimi ${visible.length} rilevamenti giornalieri`}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)', flexShrink: 0 }}>
          <Typography
            variant="subtitle2"
            sx={{ color: deltaColor, fontWeight: 'var(--md-sys-typescale-weight-medium)' }}
          >
            {deltaStr} rispetto ieri
          </Typography>
          {onClearHistory && (
            <Button
              size="small"
              variant="text"
              onClick={onClearHistory}
              aria-label="Cancella storico AI per questa classe"
              sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              <Box component="span" className="material-symbols-outlined" aria-hidden="true">delete_sweep</Box>
            </Button>
          )}
        </Box>
      </Box>

      {/* Bar chart */}
      <Box
        sx={{
          display: 'flex',
          gap: 'var(--md-sys-spacing-2)',
          alignItems: 'flex-end',
          width: '100%',
          px: 'var(--md-sys-spacing-2)',
        }}
      >
        {visible.map((s) => (
          <TrendBar key={s.id} snapshot={s} />
        ))}
      </Box>

      <Legend />
    </InfoCard>
  );
};

export default AITrendPanel;

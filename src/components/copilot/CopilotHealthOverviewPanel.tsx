import React from 'react';
import InfoCard from '../ui/InfoCard';
import SectionHeader from '../ui/SectionHeader';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ClassHealthIndex } from '../../ai/classHealth/types';
import AITrendPanel from '../AITrendPanel';
import type { AISnapshot } from '../../stores/useAISnapshotStore';

interface CopilotHealthOverviewPanelProps {
  classHealth: ClassHealthIndex;
  snapshots: AISnapshot[];
  className: string;
}

const GRADE_LABEL: Record<string, string> = {
  ottimo: 'Ottimo',
  buono: 'Buono',
  sufficiente: 'Sufficiente',
  critico: 'Critico',
};

export default function CopilotHealthOverviewPanel({ classHealth, snapshots, className }: CopilotHealthOverviewPanelProps): JSX.Element {
  return (
    <InfoCard variant="outlined">
      <SectionHeader title="Stato generale classe" subtitle={`Classe ${className}`} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
        <Typography variant="h5" sx={{ color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>
          {Math.round(classHealth.score)}
        </Typography>
        <Typography variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          {GRADE_LABEL[classHealth.grade] || classHealth.grade}
        </Typography>
        <Box sx={{ ml: 2, px: 2, py: 0.5, borderRadius: 2, backgroundColor: 'var(--md-sys-color-surface-container-high)', color: 'var(--md-sys-color-on-surface-variant)', fontSize: 14 }}>
          {classHealth.summary}
        </Box>
      </Box>
      <AITrendPanel snapshots={snapshots} className={className} />
    </InfoCard>
  );
}

/**
 * AIInspectorPanel.tsx — AI Observability & Research Dashboard (Sprints 2-4)
 *
 * Sections:
 *   1. Cache Stats           — hit-rate, entry counts, clear button
 *   2. Span Timeline         — per-analyser duration bars for recent runs
 *   3. Audit Trail           — full recorded AI run history (memory + IDB)
 *   4. Simulation Lab        — synthetic classroom benchmarking (Sprint 3)
 *   5. Explainability Demo   — per-student risk factors + confidence (Sprint 4)
 *
 * Gated by `useAIBeta().isBeta` — renders a locked placeholder otherwise.
 *
 * MD3 compliant — MUI v7 only.
 */
import React, { memo, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LockIcon from '@mui/icons-material/Lock';
import ScienceIcon from '@mui/icons-material/Science';

import { useAIBeta } from '../../hooks/useAIBeta';
import { getAuditHistory } from '../audit/auditTrail';
import AICacheStats from './AICacheStats';
import AISpanTimeline from './AISpanTimeline';
import AIAuditViewer from './AIAuditViewer';
import SimulationLab from './SimulationLab';
import ExplainabilityDemo from './ExplainabilityDemo';
import BiasAuditPanel from './BiasAuditPanel';
import PedagogyInsightPanel from './PedagogyInsightPanel';
import TrustScorePanel from './TrustScorePanel';
import RecommendationPanel from './RecommendationPanel';
import type { AIAuditTrail } from '../audit/auditTypes';

// ── section wrapper ───────────────────────────────────────────────────────────

interface SectionCardProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

const SectionCard: React.FC<SectionCardProps> = ({ children, fullWidth = false }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 'var(--md-sys-spacing-4)',
      borderRadius: 'var(--md-sys-shape-corner-medium)',
      bgcolor: 'var(--md-sys-color-surface-container-low)',
      gridColumn: fullWidth ? '1 / -1' : undefined,
    }}
  >
    {children}
  </Paper>
);

// ── main component ────────────────────────────────────────────────────────────

/**
 * AIInspectorPanel — top-level AI DevTools dashboard.
 *
 * Gated by AI Experimental Mode.  When active, renders cache stats,
 * span timeline, audit trail view, and telemetry summary in a 2-column
 * responsive grid.
 */
const AIInspectorPanel: React.FC = memo(() => {
  const { isBeta } = useAIBeta();

  // Live history snapshot for the Span Timeline (refreshed every 5 s)
  const [history, setHistory] = useState<readonly AIAuditTrail[]>(() => getAuditHistory());

  useEffect(() => {
    if (!isBeta) return;
    const id = setInterval(() => setHistory(getAuditHistory()), 5000);
    return () => clearInterval(id);
  }, [isBeta]);

  if (!isBeta) {
    return (
      <Alert
        severity="info"
        icon={<LockIcon fontSize="small" />}
        sx={{ mt: 'var(--md-sys-spacing-4)' }}
      >
        L'AI Inspector è disponibile solo in modalità AI Sperimentale.
        Attivala in <strong>Impostazioni → Avanzate</strong>.
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 'var(--md-sys-spacing-6)',
        width: '100%',
      }}
      role="region"
      aria-label="AI Inspector Panel"
    >
      {/* Header badge */}
      <Box sx={{ gridColumn: '1 / -1' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip
            size="small"
            label="AI Experimental"
            color="warning"
            icon={<ScienceIcon sx={{ fontSize: '14px !important' }} aria-hidden />}
          />
          <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Dashboard di osservabilità AI — aggiornamento automatico ogni 5 s
          </Typography>
        </Stack>
      </Box>

      {/* ── Row 1: Cache + Span Timeline ── */}
      <SectionCard>
        <AICacheStats />
      </SectionCard>

      <SectionCard>
        <AISpanTimeline history={history} />
      </SectionCard>

      <Divider sx={{ gridColumn: '1 / -1' }} />

      {/* ── Row 2: Audit Trail (full width) ── */}
      <SectionCard fullWidth>
        <AIAuditViewer />
      </SectionCard>

      <Divider sx={{ gridColumn: '1 / -1' }} />

      {/* ── Row 3: Simulation Lab (full width) ── */}
      <SectionCard fullWidth>
        <SimulationLab />
      </SectionCard>

      <Divider sx={{ gridColumn: '1 / -1' }} />

      {/* ── Row 4: Explainability Demo (full width) ── */}
      <SectionCard fullWidth>
        <ExplainabilityDemo />
      </SectionCard>

      <Divider sx={{ gridColumn: '1 / -1' }} />

      {/* ── Row 5: Fairness / Bias Audit (full width) ── */}
      <SectionCard fullWidth>
        <BiasAuditPanel />
      </SectionCard>

      <Divider sx={{ gridColumn: '1 / -1' }} />

      {/* ── Row 6: Pedagogical Alignment (full width) ── */}
      <SectionCard fullWidth>
        <PedagogyInsightPanel />
      </SectionCard>

      <Divider sx={{ gridColumn: '1 / -1' }} />

      {/* ── Row 7: AI Trust Score (full width) ── */}
      <SectionCard fullWidth>
        <TrustScorePanel />
      </SectionCard>

      <Divider sx={{ gridColumn: '1 / -1' }} />

      {/* ── Row 8: Decision Support — AI Recommendations (full width) ── */}
      <SectionCard fullWidth>
        <RecommendationPanel />
      </SectionCard>

      {/* Footer */}
      <Box sx={{ gridColumn: '1 / -1' }}>
        <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Cache e telemetria sono in-memory e si azzerano al refresh.
          L'Audit Trail è persistito in IndexedDB.
        </Typography>
      </Box>
    </Box>
  );
});

AIInspectorPanel.displayName = 'AIInspectorPanel';
export default AIInspectorPanel;

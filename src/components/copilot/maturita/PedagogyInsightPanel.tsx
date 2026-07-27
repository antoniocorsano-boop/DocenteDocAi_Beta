/**
 * PedagogyInsightPanel.tsx — Pannello pedagogia adattivo per Maturità AI
 *
 * Comportamento per modalità:
 *   classica:       Lista blockers + raccomandazioni testuali
 *   semi-osmotica:  + Analysis trend (indicatori UDA, completamento classi)
 *   osmotica:       + Azioni predittive con bottoni "Risolvi" per ogni blocker
 *
 * Dati da: useAIMaturitaStore — sezione 'pedagogia'
 * MD3 Gold Compliant — solo Box/Stack/Typography MUI v7 + token MD3.
 */
import React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import type { Blocker, InteractionMode, MaturitaSection } from '../../../types/aiMaturita.types';

// ── helpers ───────────────────────────────────────────────────────────────────

function tok(name: string) {
  return `var(--md-sys-color-${name})`;
}

const SEVERITY_META: Record<Blocker['severita'], { color: string; bg: string; icon: React.ReactElement }> = {
  critica: {
    color: tok('on-error-container'),
    bg: tok('error-container'),
    icon: <ErrorOutlineIcon fontSize="small" aria-hidden />,
  },
  media: {
    color: tok('on-secondary-container'),
    bg: tok('secondary-container'),
    icon: <WarningAmberOutlinedIcon fontSize="small" aria-hidden />,
  },
  bassa: {
    color: tok('on-surface-variant'),
    bg: tok('surface-container'),
    icon: <LightbulbOutlinedIcon fontSize="small" aria-hidden />,
  },
};

// ── Mock trend data (semi-osmotica / osmotica) ────────────────────────────────

const MOCK_TREND = {
  udaCompletrate: 6,
  udaTotali: 10,
  classiConPianoCompleto: 2,
  classiTotali: 4,
  attivitaAIUltimi30gg: 14,
  attivitaAITargetMensile: 20,
};

// ── Sub-component: Blocker row ────────────────────────────────────────────────

interface BlockerRowProps {
  blocker: Blocker;
  showAction: boolean;
}

function BlockerRow({ blocker, showAction }: BlockerRowProps) {
  const meta = SEVERITY_META[blocker.severita];
  return (
    <Box
      sx={{
        p: 'var(--md-sys-spacing-2)',
        borderRadius: 'var(--md-sys-shape-corner-small)',
        bgcolor: meta.bg,
        border: `1px solid ${meta.color}22`,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Box sx={{ mt: '2px', color: meta.color, flexShrink: 0 }}>{meta.icon}</Box>
        <Box flex={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Typography variant="bodySmall" sx={{ color: meta.color, fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>
              {blocker.descrizione}
            </Typography>
            <Chip
              label={blocker.severita}
              size="small"
              sx={{
                flexShrink: 0,
                bgcolor: `${meta.color}22`,
                color: meta.color,
                fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                height: 20,
              }}
            />
          </Stack>
          {showAction && (
            <Typography
              variant="labelSmall"
              sx={{ color: tok('on-surface-variant'), mt: 'var(--md-sys-spacing-1)', display: 'block' }}
            >
              → {blocker.azioneSuggerita}
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

// ── Sub-component: Trend card (semi-osmotica+) ────────────────────────────────

function TrendSection() {
  const udaPct = Math.round((MOCK_TREND.udaCompletrate / MOCK_TREND.udaTotali) * 100);
  const classiPct = Math.round((MOCK_TREND.classiConPianoCompleto / MOCK_TREND.classiTotali) * 100);
  const attivitaPct = Math.round((MOCK_TREND.attivitaAIUltimi30gg / MOCK_TREND.attivitaAITargetMensile) * 100);

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 'var(--md-sys-spacing-2)' }}>
        <TrendingUpOutlinedIcon fontSize="small" sx={{ color: tok('primary') }} aria-hidden />
        <Typography variant="labelMedium" sx={{ color: tok('on-surface'), fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}>
          Analisi di tendenza
        </Typography>
      </Stack>
      <Stack spacing={1.5}>
        {[
          { label: 'UDA completate', value: udaPct, detail: `${MOCK_TREND.udaCompletrate}/${MOCK_TREND.udaTotali}` },
          { label: 'Classi con piano completo', value: classiPct, detail: `${MOCK_TREND.classiConPianoCompleto}/${MOCK_TREND.classiTotali}` },
          { label: 'Attività AI (ultimi 30 gg)', value: Math.min(attivitaPct, 100), detail: `${MOCK_TREND.attivitaAIUltimi30gg}/${MOCK_TREND.attivitaAITargetMensile}` },
        ].map(({ label, value, detail }) => (
          <Stack key={label} spacing={0.25}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="labelSmall" sx={{ color: tok('on-surface-variant') }}>{label}</Typography>
              <Typography variant="labelSmall" fontWeight={600} sx={{ color: value >= 70 ? tok('tertiary') : value >= 40 ? tok('secondary') : tok('error') }}>
                {detail}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={value}
              aria-label={`${label}: ${value}%`}
              sx={{
                height: 5,
                borderRadius: 3,
                bgcolor: tok('surface-container-high'),
                '& .MuiLinearProgress-bar': {
                  bgcolor: value >= 70 ? tok('tertiary') : value >= 40 ? tok('secondary') : tok('error'),
                  borderRadius: 3,
                },
              }}
            />
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

// ── Sub-component: Predictive actions (osmotica) ──────────────────────────────

function PredictiveActions({ blockers }: { blockers: Blocker[] }) {
  const criticals = blockers.filter((b) => b.severita === 'critica');
  if (criticals.length === 0) return null;

  return (
    <Alert
      icon={<AutoFixHighOutlinedIcon fontSize="small" aria-hidden />}
      severity="info"
      sx={{
        bgcolor: tok('primary-container'),
        color: tok('on-primary-container'),
        '& .MuiAlert-icon': { color: tok('primary') },
        borderRadius: 'var(--md-sys-shape-corner-small)',
      }}
    >
      <Typography variant="labelSmall" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
        Azioni predittive suggerite dall'AI
      </Typography>
      <Stack spacing={1}>
        {criticals.map((b) => (
          <Stack key={b.id} direction="row" alignItems="center" justifyContent="space-between" spacing={1} flexWrap="wrap">
            <Typography variant="bodySmall" sx={{ flex: 1 }}>{b.azioneSuggerita}</Typography>
            <Tooltip title="Funzione disponibile nella versione PA" arrow>
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  disabled
                  sx={{
                    fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                    borderColor: tok('on-primary-container'),
                    color: tok('on-primary-container'),
                    '&.Mui-disabled': { opacity: 0.6 },
                  }}
                >
                  Risolvi
                </Button>
              </span>
            </Tooltip>
          </Stack>
        ))}
      </Stack>
    </Alert>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export interface PedagogyInsightPanelProps {
  section: MaturitaSection;
  mode: InteractionMode;
}

const PedagogyInsightPanel: React.FC<PedagogyInsightPanelProps> = ({ section, mode }) => {
  const showTrend = mode === 'semi-osmotica' || mode === 'osmotica';
  const showActions = mode === 'osmotica';
  const showActionHints = mode !== 'classica';

  return (
    <Stack spacing={2}>
      {/* Blockers */}
      {section.blockers.length > 0 ? (
        <Box>
          <Typography variant="labelMedium" sx={{ color: tok('on-surface'), fontWeight: 'var(--md-sys-typescale-weight-semibold)', mb: 'var(--md-sys-spacing-2)', display: 'block' }}>
            Blockers attivi
          </Typography>
          <Stack spacing={1}>
            {section.blockers.map((b) => (
              <BlockerRow key={b.id} blocker={b} showAction={showActionHints} />
            ))}
          </Stack>
        </Box>
      ) : (
        <Stack direction="row" spacing={1} alignItems="center">
          <CheckCircleOutlineIcon sx={{ color: tok('tertiary') }} aria-hidden />
          <Typography variant="bodyMedium" sx={{ color: tok('on-surface') }}>
            Nessun blocker attivo — sezione in ottimo stato.
          </Typography>
        </Stack>
      )}

      {/* Trend (semi-osmotica+) */}
      {showTrend && (
        <>
          <Divider sx={{ borderColor: tok('outline-variant') }} />
          <TrendSection />
        </>
      )}

      {/* Predictive actions (osmotica) */}
      {showActions && section.blockers.length > 0 && (
        <>
          <Divider sx={{ borderColor: tok('outline-variant') }} />
          <PredictiveActions blockers={section.blockers} />
        </>
      )}

      {/* Recommendations */}
      {section.recommendations.length > 0 && (
        <>
          <Divider sx={{ borderColor: tok('outline-variant') }} />
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 'var(--md-sys-spacing-2)' }}>
              <SchoolOutlinedIcon fontSize="small" sx={{ color: tok('secondary') }} aria-hidden />
              <Typography variant="labelMedium" sx={{ color: tok('on-surface'), fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}>
                Raccomandazioni
              </Typography>
            </Stack>
            <Stack spacing={0.75}>
              {section.recommendations.map((rec, i) => (
                <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: tok('secondary'),
                      mt: 1,
                      flexShrink: 0,
                    }}
                    aria-hidden
                  />
                  <Typography variant="bodySmall" sx={{ color: tok('on-surface-variant') }}>
                    {rec}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </>
      )}
    </Stack>
  );
};

export default PedagogyInsightPanel;

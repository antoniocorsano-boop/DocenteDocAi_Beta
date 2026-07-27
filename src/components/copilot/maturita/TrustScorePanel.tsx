/**
 * TrustScorePanel.tsx — Pannello Trust Score adattivo per Maturità AI
 *
 * Comportamento per modalità:
 *   classica:      Score statico + blockers
 *   semi-osmotica: + Storico trust + avvisi di regressione
 *   osmotica:      + Guida attiva real-time con next steps prioritizzati
 *
 * Dati da: useAIMaturitaStore — sezione 'trust'
 * MD3 Gold Compliant — solo MUI v7 + token MD3.
 */
import React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import type { InteractionMode, MaturitaSection } from '../../../types/aiMaturita.types';

// ── helpers ───────────────────────────────────────────────────────────────────

function tok(name: string) {
  return `var(--md-sys-color-${name})`;
}

// ── Mock storico trust (semi-osmotica+) ───────────────────────────────────────

const MOCK_HISTORY = [
  { label: 'Sett. 1 Mar', score: 58 },
  { label: 'Sett. 2 Mar', score: 61 },
  { label: 'Sett. 3 Mar', score: 63 },
  { label: 'Oggi', score: 65 },
];

const MOCK_NEXT_STEPS = [
  { priority: 1, azione: 'Genera il report bias per la classe 3B', categoria: 'Equità AI', urgenza: 'alta' },
  { priority: 2, azione: 'Completa 3 valutazioni AF per Rossi M. e Ferrari L.', categoria: 'Completezza dati', urgenza: 'media' },
  { priority: 3, azione: 'Attiva spiegabilità AI per le predizioni pubblicabili', categoria: 'Trasparenza', urgenza: 'bassa' },
];

// ── Score gauge (usato in modo classica) ─────────────────────────────────────

interface TrustGaugeProps {
  score: number;
}

function TrustGauge({ score }: TrustGaugeProps) {
  const color = score >= 70 ? tok('tertiary') : score >= 40 ? tok('secondary') : tok('error');
  return (
    <Stack spacing={1} alignItems="center" sx={{ py: 'var(--md-sys-spacing-2)' }}>
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          border: `6px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        aria-label={`Trust score: ${score}%`}
      >
        <Typography
          component="span"
          sx={{ fontSize: 22, fontWeight: 'var(--md-sys-typescale-weight-bold)', color, lineHeight: 1 }}
        >
          {score}
        </Typography>
      </Box>
      <Typography variant="labelMedium" sx={{ color: tok('on-surface-variant') }}>
        Trust Score
      </Typography>
    </Stack>
  );
}

// ── Storico sparkline semplificato (semi-osmotica+) ───────────────────────────

function TrustHistorySection() {
  const maxScore = Math.max(...MOCK_HISTORY.map((h) => h.score), 100);

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 'var(--md-sys-spacing-2)' }}>
        <HistoryOutlinedIcon fontSize="small" sx={{ color: tok('primary') }} aria-hidden />
        <Typography variant="labelMedium" sx={{ color: tok('on-surface'), fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}>
          Storico 4 settimane
        </Typography>
        <Chip
          label="+7 punti"
          size="small"
          icon={<CheckCircleOutlineIcon fontSize="small" aria-hidden />}
          sx={{
            bgcolor: tok('tertiary-container'),
            color: tok('on-tertiary-container'),
            fontSize: 'var(--md-sys-typescale-label-small-font-size)',
          }}
        />
      </Stack>
      <Stack direction="row" spacing={1} alignItems="flex-end">
        {MOCK_HISTORY.map(({ label, score }) => {
          const heightPct = Math.round((score / maxScore) * 100);
          const isLast = label === 'Oggi';
          return (
            <Tooltip key={label} title={`${label}: ${score}%`} arrow>
              <Stack alignItems="center" flex={1} spacing={0.5}>
                <Box
                  sx={{
                    width: '100%',
                    height: `${Math.max(heightPct * 0.6, 8)}px`,
                    bgcolor: isLast ? tok('primary') : tok('surface-container-high'),
                    borderRadius: 'var(--md-sys-shape-corner-extra-small)',
                    transition: 'background-color 0.3s',
                  }}
                  aria-hidden
                />
                <Typography variant="labelSmall" sx={{ color: isLast ? tok('primary') : tok('on-surface-variant'), fontSize: 10 }}>
                  {score}
                </Typography>
                <Typography variant="labelSmall" sx={{ color: tok('on-surface-variant'), fontSize: 9 }}>
                  {label}
                </Typography>
              </Stack>
            </Tooltip>
          );
        })}
      </Stack>
    </Box>
  );
}

// ── Next steps guidati (osmotica) ─────────────────────────────────────────────

function GuidedNextSteps() {
  return (
    <Alert
      icon={<VerifiedUserOutlinedIcon fontSize="small" aria-hidden />}
      sx={{
        bgcolor: tok('primary-container'),
        color: tok('on-primary-container'),
        '& .MuiAlert-icon': { color: tok('primary') },
        borderRadius: 'var(--md-sys-shape-corner-small)',
      }}
    >
      <Typography variant="labelSmall" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
        Guida AI — prossimi passi per aumentare il Trust Score
      </Typography>
      <Stack spacing={1}>
        {MOCK_NEXT_STEPS.map(({ priority, azione, categoria, urgenza }) => (
          <Stack key={priority} direction="row" spacing={1} alignItems="flex-start">
            <Box
              sx={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                bgcolor: tok('primary'),
                color: tok('on-primary'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: 11,
                fontWeight: 'var(--md-sys-typescale-weight-bold)',
              }}
              aria-hidden
            >
              {priority}
            </Box>
            <Box flex={1}>
              <Typography variant="bodySmall">{azione}</Typography>
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                <Chip label={categoria} size="small" sx={{ height: 18, fontSize: 10, bgcolor: `${tok('on-primary-container')}22`, color: tok('on-primary-container') }} />
                <Chip
                  label={urgenza}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: 10,
                    bgcolor: urgenza === 'alta' ? tok('error-container') : urgenza === 'media' ? tok('secondary-container') : tok('surface-container'),
                    color: urgenza === 'alta' ? tok('on-error-container') : urgenza === 'media' ? tok('on-secondary-container') : tok('on-surface-variant'),
                  }}
                />
              </Stack>
            </Box>
            <NavigateNextIcon fontSize="small" sx={{ color: tok('on-primary-container'), flexShrink: 0, mt: '2px' }} aria-hidden />
          </Stack>
        ))}
      </Stack>
    </Alert>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export interface TrustScorePanelProps {
  section: MaturitaSection;
  mode: InteractionMode;
}

const TrustScorePanel: React.FC<TrustScorePanelProps> = ({ section, mode }) => {
  const showHistory = mode === 'semi-osmotica' || mode === 'osmotica';
  const showGuide = mode === 'osmotica';

  return (
    <Stack spacing={2}>
      {/* Gauge sempre visibile */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }}>
        <TrustGauge score={section.score} />

        <Box flex={1}>
          {/* Componenti trust */}
          <Stack spacing={1}>
            {[
              { label: 'Completezza dati', value: 70, icon: <GroupsOutlinedIcon fontSize="small" aria-hidden /> },
              { label: 'Equità AI (bias)', value: 55, icon: <VerifiedUserOutlinedIcon fontSize="small" aria-hidden /> },
              { label: 'Trasparenza predizioni', value: 65, icon: <LightbulbOutlinedIcon fontSize="small" aria-hidden /> },
            ].map(({ label, value, icon }) => (
              <Stack key={label} spacing={0.25}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Box sx={{ color: tok('on-surface-variant') }}>{icon}</Box>
                    <Typography variant="labelSmall" sx={{ color: tok('on-surface-variant') }}>{label}</Typography>
                  </Stack>
                  <Typography variant="labelSmall" fontWeight={600} sx={{ color: value >= 70 ? tok('tertiary') : value >= 40 ? tok('secondary') : tok('error') }}>
                    {value}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={value}
                  aria-label={`${label}: ${value}%`}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: tok('surface-container-high'),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: value >= 70 ? tok('tertiary') : value >= 40 ? tok('secondary') : tok('error'),
                      borderRadius: 2,
                    },
                  }}
                />
              </Stack>
            ))}
          </Stack>
        </Box>
      </Stack>

      {/* Blockers */}
      {section.blockers.length > 0 && (
        <>
          <Divider sx={{ borderColor: tok('outline-variant') }} />
          <Box>
            <Typography variant="labelMedium" sx={{ color: tok('on-surface'), fontWeight: 'var(--md-sys-typescale-weight-semibold)', mb: 'var(--md-sys-spacing-1)', display: 'block' }}>
              Blockers attivi
            </Typography>
            <Stack spacing={1}>
              {section.blockers.map((b) => (
                <Stack key={b.id} direction="row" spacing={1} alignItems="flex-start"
                  sx={{
                    p: 'var(--md-sys-spacing-2)',
                    bgcolor: b.severita === 'critica' ? tok('error-container') : tok('surface-container-low'),
                    borderRadius: 'var(--md-sys-shape-corner-small)',
                  }}
                >
                  {b.severita === 'critica'
                    ? <ErrorOutlineIcon fontSize="small" sx={{ color: tok('on-error-container'), mt: '2px', flexShrink: 0 }} aria-hidden />
                    : <WarningAmberOutlinedIcon fontSize="small" sx={{ color: tok('on-surface-variant'), mt: '2px', flexShrink: 0 }} aria-hidden />
                  }
                  <Box>
                    <Typography variant="bodySmall" sx={{ color: b.severita === 'critica' ? tok('on-error-container') : tok('on-surface') }}>
                      {b.descrizione}
                    </Typography>
                    {mode !== 'classica' && (
                      <Typography variant="labelSmall" sx={{ color: tok('on-surface-variant'), mt: 0.25, display: 'block' }}>
                        → {b.azioneSuggerita}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Box>
        </>
      )}

      {/* Storico (semi-osmotica+) */}
      {showHistory && (
        <>
          <Divider sx={{ borderColor: tok('outline-variant') }} />
          <TrustHistorySection />
        </>
      )}

      {/* Guida (osmotica) */}
      {showGuide && (
        <>
          <Divider sx={{ borderColor: tok('outline-variant') }} />
          <GuidedNextSteps />
        </>
      )}

      {/* Raccomandazioni */}
      {section.recommendations.length > 0 && (
        <>
          <Divider sx={{ borderColor: tok('outline-variant') }} />
          <Stack spacing={0.75}>
            {section.recommendations.map((rec, i) => (
              <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: tok('primary'), mt: 1, flexShrink: 0 }} aria-hidden />
                <Typography variant="bodySmall" sx={{ color: tok('on-surface-variant') }}>{rec}</Typography>
              </Stack>
            ))}
          </Stack>
        </>
      )}
    </Stack>
  );
};

export default TrustScorePanel;

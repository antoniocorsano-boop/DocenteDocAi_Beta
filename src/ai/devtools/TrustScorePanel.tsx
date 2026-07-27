/**
 * TrustScorePanel.tsx — Sprint 7: AI Trust Score
 *
 * DevTools panel showing the composite AI Trust Score for the current
 * simulated class. Runs the full Sprint 1–6 pipeline to produce a score.
 *
 * Layout:
 *   Header: trust level badge + overall % + "Ricalcola" button
 *   Row 1: trust summary text
 *   Row 2: 4 dimension score cards
 *   Row 3: student trust distribution (sorted bar)
 *   Row 4: recommendations list (only if any)
 */

import React, { useCallback, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { generateScenario } from '../simulation/scenarioGenerator';
import { simulateClassroom } from '../simulation/classroomSimulator';
import { predictStudentRisk } from '../prediction/predictStudentRisk';
import { explainClass } from '../explainability/decisionExplainer';
import { generateBiasReport } from '../fairness/biasReport';
import { generateTrustReport, type TrustReport } from '../trust/trustReport';
import type { TrustDimension, TrustLevel } from '../trust/trustScoreEngine';

// ── token helper ──────────────────────────────────────────────────────────────

function tok(name: string) {
  return `var(--md-sys-color-${name})`;
}

// ── dimension labels ──────────────────────────────────────────────────────────

const DIMENSION_LABELS: Record<TrustDimension, string> = {
  dataQuality:       'Qualità dati',
  fairnessScore:     'Equità predizioni',
  coverageScore:     'Copertura studenti',
  pedagogyAlignment: 'Allineamento pedagogico',
};

const DIMENSION_TOOLTIPS: Record<TrustDimension, string> = {
  dataQuality:       'Media della confidenza AI per ogni studente (volume, recenza, consistenza valutazioni)',
  fairnessScore:     'Inversamente proporzionale al livello di bias rilevato dall\'audit di equità',
  coverageScore:     'Percentuale di studenti con dati sufficienti per una predizione attendibile (≥ 0.40)',
  pedagogyAlignment: 'Punteggio di allineamento pedagogico dal registro lezioni e dalle UDA',
};

// ── trust level UI meta ───────────────────────────────────────────────────────

type TrustMeta = {
  icon: React.ReactElement;
  chipBg: string;
  chipColor: string;
};

const TRUST_META: Record<TrustLevel, TrustMeta> = {
  high:         { icon: <CheckCircleOutlineIcon fontSize="small" aria-hidden />, chipBg: tok('primary-container'),   chipColor: tok('on-primary-container')   },
  moderate:     { icon: <InfoOutlinedIcon       fontSize="small" aria-hidden />, chipBg: tok('secondary-container'), chipColor: tok('on-secondary-container') },
  low:          { icon: <WarningAmberIcon       fontSize="small" aria-hidden />, chipBg: tok('tertiary-container'),  chipColor: tok('on-tertiary-container')  },
  insufficient: { icon: <ErrorOutlineIcon       fontSize="small" aria-hidden />, chipBg: tok('error-container'),     chipColor: tok('on-error-container')     },
};

const LEVEL_LABELS_IT: Record<TrustLevel, string> = {
  high:         'Alta fiducia',
  moderate:     'Fiducia moderata',
  low:          'Fiducia bassa',
  insufficient: 'Fiducia insufficiente',
};

// ── sub-components ────────────────────────────────────────────────────────────

const DimCard: React.FC<{ dim: TrustDimension; score: number }> = ({ dim, score }) => {
  const good = score >= 0.60;
  return (
    <Tooltip title={DIMENSION_TOOLTIPS[dim]} arrow>
      <Box
        sx={{
          p: 'var(--md-sys-spacing-3)',
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          bgcolor: tok('surface-container'),
          border: `1px solid ${good ? tok('outline-variant') : tok('error')}`,
          flex: '1 1 140px',
          minWidth: 130,
          cursor: 'default',
        }}
        role="region"
        aria-label={`${DIMENSION_LABELS[dim]}: ${Math.round(score * 100)}%`}
      >
        <Typography variant="labelSmall" sx={{ color: tok('on-surface-variant'), display: 'block', mb: 0.5 }}>
          {DIMENSION_LABELS[dim]}
        </Typography>
        <Typography
          variant="titleLarge"
          sx={{
            color: good ? tok('primary') : tok('error'),
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 'var(--md-sys-typescale-weight-semibold)',
          }}
        >
          {Math.round(score * 100)}%
        </Typography>
        <LinearProgress
          variant="determinate"
          value={score * 100}
          sx={{
            mt: 1,
            height: 4,
            borderRadius: 2,
            bgcolor: tok('surface-container-high'),
            '& .MuiLinearProgress-bar': { bgcolor: good ? tok('primary') : tok('error') },
          }}
        />
      </Box>
    </Tooltip>
  );
};

// ── pipeline ──────────────────────────────────────────────────────────────────

function buildTrustReport(): TrustReport {
  const seed    = Date.now() % 100_000;
  const scenario = generateScenario(seed);
  const sim      = simulateClassroom(scenario);
  const students = sim.students;
  const evals    = sim.evaluations;

  const riskPreds   = students.map(s => predictStudentRisk(s.id, evals));
  const explanations = explainClass(students, evals, riskPreds);
  const biasReport  = generateBiasReport(students, explanations);

  // Affected student IDs: cross-reference significant groups with profiles
  const significantGroupIds = new Set(
    biasReport.metrics.filter(m => m.significant).map(m => m.groupId),
  );
  const affectedIds = new Set<string>(
    biasReport.profiles
      .filter(p => significantGroupIds.has(p.id))
      .flatMap(p => p.studentIds),
  );

  return generateTrustReport(
    [...explanations.values()],
    biasReport.overallBiasLevel,
    0,          // pedagogy not wired in devtools — teacher can check PedagogyPanel
    affectedIds,
  );
}

// ── main component ────────────────────────────────────────────────────────────

const TrustScorePanel: React.FC = () => {
  const [report, setReport] = useState<TrustReport | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      try {
        setReport(buildTrustReport());
      } finally {
        setLoading(false);
      }
    }, 0);
  }, []);

  const meta    = report ? TRUST_META[report.classScore.trustLevel] : null;
  const label   = report ? LEVEL_LABELS_IT[report.classScore.trustLevel] : null;
  const dims    = report?.classScore.dimensions;

  // Top 10 students sorted by trust score (ascending = most at-risk of trusting)
  const topStudents = report
    ? [...report.classScore.studentScores]
        .sort((a, b) => a.overallScore - b.overallScore)
        .slice(0, 10)
    : [];

  return (
    <Box sx={{ p: 'var(--md-sys-spacing-4)' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <VerifiedUserOutlinedIcon sx={{ color: tok('primary') }} aria-hidden />
        <Typography variant="titleMedium" sx={{ color: tok('on-surface'), flex: 1 }}>
          Punteggio di Fiducia AI
        </Typography>

        {report && meta && (
          <Chip
            size="small"
            icon={meta.icon}
            label={label}
            sx={{
              bgcolor: meta.chipBg,
              color: meta.chipColor,
              fontWeight: 'var(--md-sys-typescale-weight-semibold)',
              fontSize: 'var(--md-sys-typescale-label-small-font-size)',
              '& .MuiChip-icon': { color: 'inherit' },
            }}
          />
        )}
        {report && (
          <Tooltip title="Punteggio composito di fiducia nell'AI (0–100%)" arrow>
            <Typography
              variant="titleLarge"
              sx={{
                color: tok('primary'),
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                minWidth: 52,
                textAlign: 'right',
              }}
            >
              {Math.round(report.classScore.overallScore * 100)}%
            </Typography>
          </Tooltip>
        )}
        <Button
          variant="outlined"
          size="small"
          onClick={run}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} aria-hidden /> : <RefreshIcon fontSize="small" aria-hidden />}
          aria-label="Ricalcola punteggio di fiducia AI"
          sx={{
            borderColor: tok('outline'),
            color: tok('primary'),
            textTransform: 'none',
            '&:hover': { borderColor: tok('primary'), bgcolor: tok('primary-container') },
          }}
        >
          {loading ? 'Calcolo…' : 'Ricalcola'}
        </Button>
      </Stack>

      {/* ── Start prompt ────────────────────────────────────────────────────── */}
      {!report && !loading && (
        <Alert
          severity="info"
          icon={<VerifiedUserOutlinedIcon fontSize="inherit" />}
          sx={{ bgcolor: tok('secondary-container'), color: tok('on-secondary-container') }}
        >
          Premi <strong>Ricalcola</strong> per calcolare quanto fidarti delle predizioni AI sulla tua classe.
        </Alert>
      )}

      {loading && (
        <Stack alignItems="center" py={4}>
          <CircularProgress size={32} aria-label="Calcolo punteggio di fiducia in corso" />
          <Typography variant="bodySmall" sx={{ mt: 1.5, color: tok('on-surface-variant') }}>
            Analisi pipeline completa…
          </Typography>
        </Stack>
      )}

      {report && !loading && (
        <Stack spacing={3}>
          {/* ── Summary ──────────────────────────────────────────────────────── */}
          <Box
            sx={{
              p: 'var(--md-sys-spacing-3)',
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              bgcolor: tok('surface-container-low'),
            }}
          >
            <Typography variant="bodyMedium" sx={{ color: tok('on-surface'), lineHeight: 1.6 }}>
              {report.trustSummary}
            </Typography>
            <Stack direction="row" spacing={2} mt={1.5}>
              <Typography variant="bodySmall" sx={{ color: tok('on-surface-variant') }}>
                Studenti analizzati: <strong>{report.classScore.studentCount}</strong>
              </Typography>
              <Typography variant="bodySmall" sx={{ color: tok('on-surface-variant') }}>
                Con dati sufficienti: <strong>{report.classScore.sufficientDataCount}</strong>
              </Typography>
            </Stack>
          </Box>

          <Divider />

          {/* ── Dimension cards ───────────────────────────────────────────────── */}
          {dims && (
            <>
              <Box>
                <Typography variant="titleSmall" sx={{ color: tok('on-surface-variant'), mb: 1.5, display: 'block' }}>
                  Dimensioni di fiducia
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1.5}>
                  {(Object.keys(dims) as TrustDimension[]).map(d => (
                    <DimCard key={d} dim={d} score={dims[d]} />
                  ))}
                </Stack>
              </Box>
              <Divider />
            </>
          )}

          {/* ── Student distribution ─────────────────────────────────────────── */}
          {topStudents.length > 0 && (
            <>
              <Box>
                <Typography variant="titleSmall" sx={{ color: tok('on-surface-variant'), mb: 1.5, display: 'block' }}>
                  Studenti a minor fiducia (top 10)
                </Typography>
                <Stack spacing={0.75}>
                  {topStudents.map((s, i) => {
                    const color = s.trustLevel === 'insufficient' || s.trustLevel === 'low'
                      ? tok('error')
                      : s.trustLevel === 'moderate' ? tok('tertiary') : tok('primary');
                    return (
                      <Stack key={s.studentId} direction="row" alignItems="center" spacing={1.5}>
                        <Typography
                          variant="bodySmall"
                          sx={{ minWidth: 20, color: tok('on-surface-variant'), fontVariantNumeric: 'tabular-nums' }}
                        >
                          {i + 1}.
                        </Typography>
                        <Box sx={{ flex: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={s.overallScore * 100}
                            aria-label={`Studente ${s.studentId}: fiducia ${Math.round(s.overallScore * 100)}%`}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: tok('surface-container-high'),
                              '& .MuiLinearProgress-bar': { bgcolor: color },
                            }}
                          />
                        </Box>
                        <Typography
                          variant="labelSmall"
                          sx={{ minWidth: 36, textAlign: 'right', color, fontVariantNumeric: 'tabular-nums' }}
                        >
                          {Math.round(s.overallScore * 100)}%
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </Box>
              <Divider />
            </>
          )}

          {/* ── Warning flags ─────────────────────────────────────────────────── */}
          {report.classScore.warningFlags.length > 0 && (
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <WarningAmberIcon fontSize="small" sx={{ color: tok('tertiary') }} aria-hidden />
                <Typography variant="titleSmall" sx={{ color: tok('on-surface') }}>
                  Segnali di attenzione
                </Typography>
              </Stack>
              <Stack spacing={0.75}>
                {report.classScore.warningFlags.map((w, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                    <WarningAmberIcon fontSize="small" sx={{ color: tok('tertiary'), mt: 0.1, flexShrink: 0 }} aria-hidden />
                    <Typography variant="bodySmall" sx={{ color: tok('on-surface'), lineHeight: 1.6 }}>
                      {w}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}

          {/* ── Recommendations ───────────────────────────────────────────────── */}
          {report.recommendations.length > 0 && (
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <InfoOutlinedIcon fontSize="small" sx={{ color: tok('secondary') }} aria-hidden />
                <Typography variant="titleSmall" sx={{ color: tok('on-surface') }}>
                  Come migliorare la fiducia
                </Typography>
              </Stack>
              <Stack spacing={0.75}>
                {report.recommendations.map((r, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                    <Typography variant="bodySmall" sx={{ color: tok('secondary'), lineHeight: 1.6, mt: 0.1 }}>•</Typography>
                    <Typography variant="bodySmall" sx={{ color: tok('on-surface'), lineHeight: 1.6 }}>
                      {r}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}

          {/* ── All good ────────────────────────────────────────────────────── */}
          {report.recommendations.length === 0 && report.classScore.warningFlags.length === 0 && (
            <Alert
              severity="success"
              icon={<CheckCircleOutlineIcon fontSize="inherit" />}
              sx={{ bgcolor: tok('primary-container'), color: tok('on-primary-container') }}
            >
              Nessuna criticità rilevata. Il sistema AI è pienamente affidabile per supportare le decisioni didattiche.
            </Alert>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default TrustScorePanel;

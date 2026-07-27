/**
 * BiasAuditPanel.tsx — Sprint 5: Bias Detection
 *
 * DevTools component that displays the fairness / bias audit report for
 * a simulated classroom. Uses the same simulation pipeline as ExplainabilityDemo.
 *
 * Layout:
 *   Top bar: overall bias level badge + summary + "Ricalcola" button
 *   Row: group profiles table (avg risk, avg grade, at-risk %)
 *   Row: disparity metrics — one card per significant group
 *   Row: recommendations list (only when bias level > none)
 */

import React, { useCallback, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import BalanceIcon from '@mui/icons-material/Balance';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { generateScenario } from '../simulation/scenarioGenerator';
import { simulateClassroom } from '../simulation/classroomSimulator';
import { predictStudentRisk } from '../prediction/predictStudentRisk';
import { explainClass } from '../explainability/decisionExplainer';
import { generateBiasReport, type BiasReport, type BiasLevel } from '../fairness/biasReport';
import type { DisparityMetric } from '../fairness/disparateImpactDetector';

// ── helpers ───────────────────────────────────────────────────────────────────

function tok(name: string) {
  return `var(--md-sys-color-${name})`;
}

const BIAS_META: Record<BiasLevel, {
  label: string;
  icon: React.ReactNode;
  chipBg: string;
  chipColor: string;
}> = {
  none:     { label: 'Nessun bias', icon: <CheckCircleOutlineIcon fontSize="small" aria-hidden />, chipBg: tok('primary-container'),   chipColor: tok('on-primary-container') },
  low:      { label: 'Bias basso',  icon: <InfoOutlinedIcon     fontSize="small" aria-hidden />, chipBg: tok('secondary-container'), chipColor: tok('on-secondary-container') },
  moderate: { label: 'Bias moderato', icon: <WarningAmberIcon   fontSize="small" aria-hidden />, chipBg: tok('tertiary-container'),  chipColor: tok('on-tertiary-container') },
  high:     { label: 'Bias elevato',  icon: <ErrorOutlineIcon   fontSize="small" aria-hidden />, chipBg: tok('error-container'),     chipColor: tok('on-error-container') },
};

function pct(v: number) {
  return `${Math.round(v * 100)} %`;
}

function riskColor(score: number): string {
  if (score >= 0.70) return tok('error');
  if (score >= 0.50) return tok('tertiary');
  if (score >= 0.30) return tok('secondary');
  return tok('primary');
}

// ── sub-components ────────────────────────────────────────────────────────────

const MetricCard: React.FC<{ metric: DisparityMetric }> = ({ metric }) => {
  const dirLabel = metric.disparateImpactRatio !== null
    ? metric.disparateImpactRatio.toFixed(2)
    : 'N/A';
  const dirColor = metric.disparateImpactRatio !== null && (
    metric.disparateImpactRatio < 0.80 || metric.disparateImpactRatio > 1.25
  ) ? tok('error') : tok('on-surface-variant');

  return (
    <Box
      sx={{
        p: 'var(--md-sys-spacing-3)',
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        bgcolor: tok('surface-container'),
        border: metric.significant
          ? `1px solid ${tok('error')}`
          : `1px solid ${tok('outline-variant')}`,
        minWidth: 220,
        flex: '1 1 220px',
      }}
      role="region"
      aria-label={`Metriche bias per ${metric.label}`}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <Typography variant="titleSmall" sx={{ color: tok('on-surface'), flex: 1 }}>
          {metric.label}
        </Typography>
        {!metric.sufficientSample && (
          <Tooltip title={`Campione ridotto (${metric.sampleSize} studenti): metriche indicative`} arrow>
            <InfoOutlinedIcon fontSize="small" sx={{ color: tok('on-surface-variant') }} aria-label="Campione ridotto" />
          </Tooltip>
        )}
      </Stack>

      <Stack spacing={0.5}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="bodySmall" sx={{ color: tok('on-surface-variant') }}>DIR</Typography>
          <Typography variant="bodySmall" sx={{ color: dirColor, fontVariantNumeric: 'tabular-nums', fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}>
            {dirLabel}
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="bodySmall" sx={{ color: tok('on-surface-variant') }}>Δ rischio medio</Typography>
          <Typography
            variant="bodySmall"
            sx={{
              color: Math.abs(metric.meanRiskDifference) > 0.12 ? tok('error') : tok('on-surface'),
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {metric.meanRiskDifference >= 0 ? '+' : ''}{pct(metric.meanRiskDifference)}
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="bodySmall" sx={{ color: tok('on-surface-variant') }}>GAP aggiustato</Typography>
          <Typography
            variant="bodySmall"
            sx={{
              color: Math.abs(metric.gradeAdjustedGap) > 0.12 ? tok('error') : tok('on-surface'),
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {metric.gradeAdjustedGap >= 0 ? '+' : ''}{pct(metric.gradeAdjustedGap)}
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="bodySmall" sx={{ color: tok('on-surface-variant') }}>Falsi allarmi</Typography>
          <Typography
            variant="bodySmall"
            sx={{
              color: metric.falseAlarmGap > 0.10 ? tok('error') : tok('on-surface'),
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {metric.falseAlarmGap >= 0 ? '+' : ''}{pct(metric.falseAlarmGap)}
          </Typography>
        </Stack>
      </Stack>

      {metric.significant && (
        <Box sx={{ mt: 1.5 }}>
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {metric.flags.map(f => (
              <Chip
                key={f}
                size="small"
                label={f.replace(/_/g, ' ')}
                sx={{ bgcolor: tok('error-container'), color: tok('on-error-container'), fontSize: 'var(--md-sys-typescale-label-small-font-size)' }}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

// ── main component ────────────────────────────────────────────────────────────

function buildReport(): BiasReport {
  const seed = Date.now() % 100_000;
  const scenario = generateScenario(seed);
  const simResult = simulateClassroom(scenario);
  const students  = simResult.students;   // already have hasBES/hasDSA/has104
  const evals     = simResult.evaluations;

  const riskPreds = students.map(s => predictStudentRisk(s.id, evals));
  const explanations = explainClass(students, evals, riskPreds);

  return generateBiasReport(students, explanations);
}

const BiasAuditPanel: React.FC = () => {
  const [report, setReport] = useState<BiasReport | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(() => {
    setLoading(true);
    // defer to next tick so React can render the spinner
    setTimeout(() => {
      try {
        setReport(buildReport());
      } finally {
        setLoading(false);
      }
    }, 0);
  }, []);

  const meta = report ? BIAS_META[report.overallBiasLevel] : null;

  return (
    <Box>
      {/* Header row */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2} flexWrap="wrap" gap={1}>
        <BalanceIcon sx={{ color: tok('tertiary') }} aria-hidden />
        <Typography variant="titleMedium" sx={{ color: tok('on-surface'), flex: 1 }}>
          Fairness Audit
        </Typography>
        {meta && (
          <Chip
            size="small"
            icon={meta.icon as React.ReactElement}
            label={meta.label}
            sx={{ bgcolor: meta.chipBg, color: meta.chipColor, fontWeight: 'var(--md-sys-typescale-weight-semibold)', '& .MuiChip-icon': { color: 'inherit' } }}
          />
        )}
        <Button
          size="small"
          variant="outlined"
          startIcon={loading ? <CircularProgress size={14} /> : <RefreshIcon />}
          onClick={run}
          disabled={loading}
          aria-label="Lancia analisi fairness"
        >
          {report ? 'Ricalcola' : 'Avvia analisi'}
        </Button>
      </Stack>

      {!report && !loading && (
        <Alert severity="info" sx={{ borderRadius: 'var(--md-sys-shape-corner-medium)' }}>
          Clicca <strong>Avvia analisi</strong> per calcolare il bias report su una classe simulata.
        </Alert>
      )}

      {loading && (
        <Stack alignItems="center" py={4}>
          <CircularProgress size={32} />
          <Typography variant="bodySmall" sx={{ color: tok('on-surface-variant'), mt: 1 }}>
            Calcolo in corso…
          </Typography>
        </Stack>
      )}

      {report && !loading && (
        <Stack spacing={3}>
          {/* Summary */}
          <Alert
            severity={report.overallBiasLevel === 'none' ? 'success' : report.overallBiasLevel === 'high' ? 'error' : 'warning'}
            sx={{ borderRadius: 'var(--md-sys-shape-corner-medium)' }}
          >
            {report.summary}
          </Alert>

          {/* Group profiles table */}
          <Box>
            <Typography variant="titleSmall" sx={{ color: tok('on-surface'), mb: 1 }}>
              Profili dei gruppi ({report.profiles.length})
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" aria-label="Tabella profili gruppi">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: tok('on-surface-variant') }}>Gruppo</TableCell>
                    <TableCell align="right" sx={{ color: tok('on-surface-variant') }}>N</TableCell>
                    <TableCell align="right" sx={{ color: tok('on-surface-variant') }}>Rischio medio</TableCell>
                    <TableCell align="right" sx={{ color: tok('on-surface-variant') }}>Voto medio</TableCell>
                    <TableCell align="right" sx={{ color: tok('on-surface-variant') }}>A rischio %</TableCell>
                    <TableCell align="right" sx={{ color: tok('on-surface-variant') }}>Critico %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.profiles.map(p => (
                    <TableRow key={p.id} sx={{ '&:hover': { bgcolor: tok('surface-container-low') } }}>
                      <TableCell sx={{ color: p.id === 'general' ? tok('primary') : tok('on-surface'), fontWeight: p.id === 'general' ? 700 : 400 }}>
                        {p.label}
                      </TableCell>
                      <TableCell align="right" sx={{ color: tok('on-surface'), fontVariantNumeric: 'tabular-nums' }}>
                        {p.size}
                      </TableCell>
                      <TableCell align="right" sx={{ color: riskColor(p.avgRiskScore), fontVariantNumeric: 'tabular-nums', fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}>
                        {pct(p.avgRiskScore)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: tok('on-surface'), fontVariantNumeric: 'tabular-nums' }}>
                        {p.avgGradeAverage.toFixed(1)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: tok('on-surface'), fontVariantNumeric: 'tabular-nums' }}>
                        {pct(p.atRiskRate)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: p.criticalRate > 0.3 ? tok('error') : tok('on-surface'), fontVariantNumeric: 'tabular-nums' }}>
                        {pct(p.criticalRate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>

          {/* Disparity metric cards */}
          {report.metrics.length > 0 && (
            <Box>
              <Typography variant="titleSmall" sx={{ color: tok('on-surface'), mb: 1 }}>
                Metriche di disparità
                {report.significantCount > 0 && (
                  <Chip
                    size="small"
                    label={`${report.significantCount} critico/i`}
                    sx={{ ml: 1, bgcolor: tok('error-container'), color: tok('on-error-container') }}
                  />
                )}
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1.5}>
                {report.metrics.map(m => (
                  <MetricCard key={m.groupId} metric={m} />
                ))}
              </Stack>
            </Box>
          )}

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="titleSmall" sx={{ color: tok('on-surface'), mb: 1 }}>
                Raccomandazioni
              </Typography>
              <Stack spacing={1}>
                {report.recommendations.map((r, i) => (
                  <Stack
                    key={i}
                    direction="row"
                    spacing={1}
                    sx={{
                      p: 'var(--md-sys-spacing-2)',
                      borderRadius: 'var(--md-sys-shape-corner-small)',
                      bgcolor: tok('surface-container-low'),
                    }}
                  >
                    <WarningAmberIcon fontSize="small" sx={{ color: tok('tertiary'), flexShrink: 0, mt: 0.1 }} aria-hidden />
                    <Typography variant="bodySmall" sx={{ color: tok('on-surface') }}>
                      {r}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}

          <Typography variant="labelSmall" sx={{ color: tok('on-surface-variant') }}>
            Calcolato: {new Date(report.computedAt).toLocaleString('it-IT')}
            {' · '}{report.groupsAnalysed} gruppi analizzati
            {' · '}{report.profiles.find(p => p.id === 'general')?.size ?? 0} studenti
          </Typography>
        </Stack>
      )}
    </Box>
  );
};

export default BiasAuditPanel;

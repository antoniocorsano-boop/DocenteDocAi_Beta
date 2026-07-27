/**
 * SimulationLab.tsx — AI Simulation Engine & Benchmark Lab (Sprint 3)
 *
 * UI panel embedded inside AIInspectorPanel.  Exposes:
 *   - "Run Scenario" button → single deterministic run
 *   - "Run Batch (10)" button → async batch with progress bar
 *   - Results table (latest 50 rows, newest first)
 *   - Aggregate metrics summary card
 *
 * MD3 compliant — MUI v7 only.  No hardcoded colours, sizes or shadows.
 */
import React, { memo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ScienceIcon from '@mui/icons-material/Science';
import SpeedIcon from '@mui/icons-material/Speed';

import { useSimulationStore } from '../simulation/simulationStore';
import type { SimulationResult } from '../simulation/simulationRunner';

// ── colour helpers ────────────────────────────────────────────────────────────

function riskColor(rate: number): string {
  if (rate >= 0.8) return 'var(--md-sys-color-primary)';
  if (rate >= 0.5) return 'var(--md-sys-color-secondary)';
  return 'var(--md-sys-color-error)';
}

function healthColor(score: number): string {
  if (score >= 70) return 'var(--md-sys-color-primary)';
  if (score >= 45) return 'var(--md-sys-color-tertiary)';
  return 'var(--md-sys-color-error)';
}

function fmtPct(n: number): string {
  return `${Math.round(n * 100)} %`;
}

function fmtMs(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`;
}

function mean(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// ── sub-components ────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, color }) => (
  <Box
    sx={{
      px: 'var(--md-sys-spacing-4)',
      py: 'var(--md-sys-spacing-3)',
      borderRadius: 'var(--md-sys-shape-corner-small)',
      bgcolor: 'var(--md-sys-color-surface-container)',
      flex: '1 1 120px',
      minWidth: 120,
    }}
  >
    <Typography
      variant="labelSmall"
      sx={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'block', mb: 0.5 }}
    >
      {label}
    </Typography>
    <Typography
      variant="titleMedium"
      sx={{ color: color ?? 'var(--md-sys-color-on-surface)', fontVariantNumeric: 'tabular-nums' }}
    >
      {value}
    </Typography>
  </Box>
);

const RiskBadge: React.FC<{ dist: string }> = ({ dist }) => {
  const colorMap: Record<string, 'success' | 'warning' | 'error'> = {
    low: 'success',
    medium: 'warning',
    high: 'error',
  };
  return (
    <Chip
      label={dist}
      size="small"
      color={colorMap[dist] ?? 'default'}
      sx={{ textTransform: 'capitalize', fontSize: 'var(--md-sys-typescale-label-small-font-size)' }}
    />
  );
};

const TrendBadge: React.FC<{ trend: string }> = ({ trend }) => {
  const labels: Record<string, string> = {
    improving: '↑ improving',
    stable:    '→ stable',
    declining: '↓ declining',
  };
  return (
    <Typography
      variant="labelSmall"
      sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
    >
      {labels[trend] ?? trend}
    </Typography>
  );
};

// ── results table ─────────────────────────────────────────────────────────────

const MAX_ROWS = 50;

const ResultsTable: React.FC<{ runs: SimulationResult[] }> = memo(({ runs }) => {
  const visible = runs.slice(0, MAX_ROWS);

  if (!visible.length) {
    return (
      <Typography
        variant="bodySmall"
        sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic', mt: 1 }}
      >
        Nessun risultato.  Clicca "Run Scenario" per iniziare.
      </Typography>
    );
  }

  return (
    <TableContainer sx={{ maxHeight: 360, overflowY: 'auto' }}>
      <Table size="small" stickyHeader aria-label="Simulation results table">
        <TableHead>
          <TableRow>
            <TableCell>Scenario ID</TableCell>
            <TableCell>Risk dist.</TableCell>
            <TableCell>Trend</TableCell>
            <TableCell align="right">Students</TableCell>
            <TableCell align="right">Detection rate</TableCell>
            <TableCell align="right">FP rate</TableCell>
            <TableCell align="right">F1</TableCell>
            <TableCell align="right">Health</TableCell>
            <TableCell align="right">AI time</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visible.map(r => (
            <TableRow key={r.runId} hover>
              <TableCell sx={{ fontFamily: 'monospace', fontSize: 'var(--md-sys-typescale-label-small-font-size)' }}>
                {r.scenarioId}
              </TableCell>
              <TableCell>
                <RiskBadge dist={r.scenario.riskDistribution} />
              </TableCell>
              <TableCell>
                <TrendBadge trend={r.scenario.trend} />
              </TableCell>
              <TableCell align="right">{r.scenario.students}</TableCell>
              <TableCell align="right">
                <Typography
                  variant="labelSmall"
                  sx={{ color: riskColor(r.metrics.riskDetectionRate), fontVariantNumeric: 'tabular-nums' }}
                >
                  {fmtPct(r.metrics.riskDetectionRate)}
                </Typography>
              </TableCell>
              <TableCell align="right">{fmtPct(r.metrics.falsePositiveRate)}</TableCell>
              <TableCell align="right">
                {r.metrics.f1Score != null ? fmtPct(r.metrics.f1Score) : '—'}
              </TableCell>
              <TableCell align="right">
                <Typography
                  variant="labelSmall"
                  sx={{ color: healthColor(r.metrics.classHealthScore), fontVariantNumeric: 'tabular-nums' }}
                >
                  {r.metrics.classHealthScore}
                </Typography>
              </TableCell>
              <TableCell align="right">{fmtMs(r.metrics.executionTimeMs)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});
ResultsTable.displayName = 'ResultsTable';

// ── aggregate summary ─────────────────────────────────────────────────────────

const AggregateMetrics: React.FC<{ runs: SimulationResult[] }> = memo(({ runs }) => {
  if (!runs.length) return null;

  const detectionRates = runs.map(r => r.metrics.riskDetectionRate);
  const fpRates        = runs.map(r => r.metrics.falsePositiveRate);
  const f1Scores       = runs.map(r => r.metrics.f1Score ?? 0);
  const timings        = runs.map(r => r.metrics.executionTimeMs);
  const health         = runs.map(r => r.metrics.classHealthScore);

  return (
    <Box>
      <Typography
        variant="labelLarge"
        sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 'var(--md-sys-spacing-3)', display: 'block' }}
      >
        Aggregate ({runs.length} run{runs.length !== 1 ? 's' : ''})
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap="var(--md-sys-spacing-3)">
        <MetricCard
          label="Mean detection rate"
          value={fmtPct(mean(detectionRates))}
          color={riskColor(mean(detectionRates))}
        />
        <MetricCard label="Mean FP rate" value={fmtPct(mean(fpRates))} />
        <MetricCard label="Mean F1" value={fmtPct(mean(f1Scores))} />
        <MetricCard
          label="Mean AI time"
          value={fmtMs(mean(timings))}
          color="var(--md-sys-color-tertiary)"
        />
        <MetricCard
          label="Mean class health"
          value={String(Math.round(mean(health)))}
          color={healthColor(mean(health))}
        />
      </Stack>
    </Box>
  );
});
AggregateMetrics.displayName = 'AggregateMetrics';

// ── main component ────────────────────────────────────────────────────────────

const SimulationLab: React.FC = memo(() => {
  const runs     = useSimulationStore(s => s.runs);
  const running  = useSimulationStore(s => s.running);
  const progress = useSimulationStore(s => s.progress);
  const error    = useSimulationStore(s => s.error);
  const { runScenario, runBatch, clearResults } = useSimulationStore(s => s.actions);

  const handleRunScenario = useCallback(() => runScenario(), [runScenario]);
  const handleRunBatch    = useCallback(() => runBatch(10), [runBatch]);
  const handleClear       = useCallback(() => clearResults(), [clearResults]);

  return (
    <Box>
      {/* ── Header ── */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap="var(--md-sys-spacing-3)"
        mb="var(--md-sys-spacing-4)"
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <ScienceIcon
            fontSize="small"
            sx={{ color: 'var(--md-sys-color-tertiary)' }}
            aria-hidden
          />
          <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
            Simulation Lab
          </Typography>
          <Chip
            size="small"
            label="Beta"
            sx={{
              bgcolor: 'var(--md-sys-color-tertiary-container)',
              color: 'var(--md-sys-color-on-tertiary-container)',
              fontSize: 'var(--md-sys-typescale-label-small-font-size)',
            }}
          />
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          {/* Run single scenario */}
          <Button
            size="small"
            variant="outlined"
            startIcon={running ? <CircularProgress size={14} color="inherit" aria-hidden /> : <PlayArrowIcon aria-hidden />}
            onClick={handleRunScenario}
            disabled={running}
            aria-label="Run one simulation scenario"
          >
            Run Scenario
          </Button>

          {/* Run batch */}
          <Button
            size="small"
            variant="contained"
            startIcon={
              running
                ? <SpeedIcon aria-hidden sx={{ opacity: 0.6 }} />
                : <SpeedIcon aria-hidden />
            }
            onClick={handleRunBatch}
            disabled={running}
            aria-label="Run 10 simulation scenarios as a batch"
          >
            Run Batch (10)
          </Button>

          {/* Clear */}
          {runs.length > 0 && !running && (
            <Tooltip title="Clear all results">
              <IconButton
                size="small"
                onClick={handleClear}
                aria-label="Clear all simulation results"
                sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                <ClearAllIcon fontSize="small" aria-hidden />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      {/* ── Progress bar (batch only) ── */}
      {running && (
        <Box mb="var(--md-sys-spacing-4)">
          <LinearProgress
            variant="determinate"
            value={progress}
            aria-label={`Batch simulation progress: ${progress}%`}
            sx={{
              height: 6,
              borderRadius: 'var(--md-sys-shape-corner-full)',
              bgcolor: 'var(--md-sys-color-surface-container-highest)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'var(--md-sys-color-tertiary)',
              },
            }}
          />
          <Typography
            variant="labelSmall"
            sx={{ color: 'var(--md-sys-color-on-surface-variant)', mt: 0.5, display: 'block' }}
            aria-live="polite"
          >
            {progress}% completato…
          </Typography>
        </Box>
      )}

      {/* ── Error banner ── */}
      {error && (
        <Typography
          variant="bodySmall"
          role="alert"
          sx={{
            color: 'var(--md-sys-color-error)',
            mb: 'var(--md-sys-spacing-3)',
            p: 'var(--md-sys-spacing-3)',
            borderRadius: 'var(--md-sys-shape-corner-small)',
            bgcolor: 'var(--md-sys-color-error-container)',
          }}
        >
          {error}
        </Typography>
      )}

      {/* ── Results table ── */}
      <ResultsTable runs={runs} />

      {/* ── Aggregate metrics ── */}
      {runs.length > 1 && (
        <>
          <Divider sx={{ my: 'var(--md-sys-spacing-4)' }} />
          <AggregateMetrics runs={runs} />
        </>
      )}
    </Box>
  );
});

SimulationLab.displayName = 'SimulationLab';
export default SimulationLab;

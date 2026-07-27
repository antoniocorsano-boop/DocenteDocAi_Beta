/**
 * AISpanTimeline.tsx — Per-analyser span duration timeline (Sprint 2)
 *
 * Visualises the `steps` from in-memory audit trails as horizontal bars,
 * analogous to an OpenTelemetry waterfall trace.  Data is sourced from
 * `getAuditHistory()` (circular in-memory buffer) — no async IDB required.
 *
 * Each bar width = stepDurationMs / runTotalMs × 100%.
 * Bars are colour-coded: ≤20ms primary, ≤50ms warning, >50ms error.
 *
 * MD3 compliant — MUI v7 only.
 */
import React, { memo, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

import { getAuditHistory } from '../audit/auditTrail';
import type { AIAuditTrail, AuditStep } from '../audit/auditTypes';

// ── constants ─────────────────────────────────────────────────────────────────

const FAST_MS = 20;
const SLOW_MS = 50;
const MAX_RUNS_SHOWN = 5;

// ── helpers ───────────────────────────────────────────────────────────────────

function spanColor(ms: number): string {
  if (ms <= FAST_MS) return 'var(--md-sys-color-primary)';
  if (ms <= SLOW_MS) return 'var(--md-sys-color-tertiary)';
  return 'var(--md-sys-color-error)';
}

function formatRunLabel(trail: AIAuditTrail): string {
  const time = new Date(trail.startedAt).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return `${time} — ${trail.totalMs} ms${trail.cacheHit ? ' (cache)' : ''}`;
}

// ── sub-components ────────────────────────────────────────────────────────────

interface SpanBarProps {
  step: AuditStep;
  totalMs: number;
}

const SpanBar: React.FC<SpanBarProps> = memo(({ step, totalMs }) => {
  const pct = totalMs > 0 ? Math.max(2, (step.durationMs / totalMs) * 100) : 2;
  const color = spanColor(step.durationMs);

  const tooltipContent = [
    step.inputSummary && `Input: ${step.inputSummary}`,
    step.outputSummary && `Output: ${step.outputSummary}`,
  ]
    .filter(Boolean)
    .join('\n') || step.name;

  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minHeight: 28 }}>
      {/* Step name */}
      <Typography
        variant="caption"
        sx={{
          color: 'var(--md-sys-color-on-surface-variant)',
          minWidth: 160,
          maxWidth: 160,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
        title={step.name}
      >
        {step.name}
      </Typography>

      {/* Bar track */}
      <Box sx={{ flex: 1, position: 'relative', height: 16, bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-full)' }}>
        <Tooltip title={tooltipContent} arrow placement="top">
          <Box
            role="img"
            aria-label={`${step.name}: ${step.durationMs} ms`}
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${pct}%`,
              bgcolor: color,
              borderRadius: 'var(--md-sys-shape-corner-full)',
              transition: 'width 0.3s ease',
            }}
          />
        </Tooltip>
      </Box>

      {/* Duration label */}
      <Typography
        variant="caption"
        sx={{
          color,
          minWidth: 44,
          textAlign: 'right',
          flexShrink: 0,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {step.durationMs} ms
      </Typography>
    </Stack>
  );
});
SpanBar.displayName = 'SpanBar';

// ── main component ────────────────────────────────────────────────────────────

export interface AISpanTimelineProps {
  /** Snapshot of the audit history — pass a new array to trigger re-render. */
  history?: readonly AIAuditTrail[];
}

/**
 * AISpanTimeline — renders an OTel-style waterfall for the selected AI run.
 *
 * If no `history` prop is given it reads directly from the in-memory
 * `getAuditHistory()` buffer (synchronous).
 */
const AISpanTimeline: React.FC<AISpanTimelineProps> = memo(({ history }) => {
  const runs = useMemo(() => {
    const source = history ?? getAuditHistory();
    // Show only non-cache-hit runs (they have meaningful steps), newest first
    return [...source]
      .reverse()
      .filter((r) => !r.cacheHit && r.steps.length > 0)
      .slice(0, MAX_RUNS_SHOWN);
  }, [history]);

  const [selectedRunId, setSelectedRunId] = useState<string>(() => runs[0]?.id ?? '');

  // Keep selection valid when `runs` updates
  const validId = runs.some((r) => r.id === selectedRunId) ? selectedRunId : (runs[0]?.id ?? '');

  const selectedRun = useMemo(
    () => runs.find((r) => r.id === validId) ?? null,
    [runs, validId],
  );

  if (runs.length === 0) {
    return (
      <Box>
        <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)', mb: 2 }}>
          Span Timeline
        </Typography>
        <Alert severity="info">
          Nessun run completato — la timeline apparirà dopo la prima analisi AI.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
        <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
          Span Timeline
        </Typography>

        {runs.length > 1 && (
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="span-run-select-label">Run</InputLabel>
            <Select
              labelId="span-run-select-label"
              value={validId}
              label="Run"
              onChange={(e) => setSelectedRunId(e.target.value)}
              aria-label="Seleziona run AI"
            >
              {runs.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {formatRunLabel(r)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>

      {selectedRun && (
        <Box>
          {/* Legend */}
          <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
            {[
              { label: `≤${FAST_MS} ms`, color: 'var(--md-sys-color-primary)' },
              { label: `≤${SLOW_MS} ms`, color: 'var(--md-sys-color-tertiary)' },
              { label: `>${SLOW_MS} ms`, color: 'var(--md-sys-color-error)' },
            ].map(({ label, color }) => (
              <Stack key={label} direction="row" alignItems="center" spacing={0.5}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} aria-hidden />
                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {label}
                </Typography>
              </Stack>
            ))}
            <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', ml: 'auto !important' }}>
              Totale: {selectedRun.totalMs} ms
            </Typography>
          </Stack>

          {/* Bars */}
          <Stack spacing={0.75}>
            {selectedRun.steps.map((step, i) => (
              <SpanBar key={`${step.name}-${i}`} step={step} totalMs={selectedRun.totalMs} />
            ))}
          </Stack>

          <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mt: 1.5, display: 'block' }}>
            Run ID: <code>{selectedRun.id}</code>
          </Typography>
        </Box>
      )}
    </Box>
  );
});

AISpanTimeline.displayName = 'AISpanTimeline';
export default AISpanTimeline;

/**
 * AIDevToolsPanel.tsx — AI Debug & Observability Panel (Sprint 4)
 *
 * Displays real-time diagnostics for the AI subsystem:
 *   • Cache stats (hits, misses, hit-rate, entries)
 *   • Last analysis run timing + per-analyser breakdown
 *   • Recent telemetry events from the circular buffer
 *
 * Only meaningful when AI Beta Mode is active. Shows a placeholder otherwise.
 * MD3 compliant — all layout via Box sx tokens, typography via MUI variants.
 */
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import LinearProgress from '@mui/material/LinearProgress';

import { getCacheStats, clearCache, type CacheStats } from '../../ai/cache/aiCache';
import {
  getTelemetryBuffer,
  clearTelemetryBuffer,
  type AITelemetryEvent,
} from '../../ai/telemetry/aiTelemetry';
import { getLastRunStats, type AIRunStats } from '../../ai/engine/aiEngine';
import { useAIBeta } from '../../hooks/useAIBeta';
import AIInspectorPanel from '../../ai/devtools/AIInspectorPanel';
import AISoakMetricsPanel from '../../ai/devtools/AISoakMetricsPanel';

// ── constants ─────────────────────────────────────────────────────────────────

/** ms threshold above which an analyser is flagged as slow */
const SLOW_THRESHOLD_MS = 50;

/** How many telemetry events to show in the table */
const MAX_TELEMETRY_ROWS = 20;

// ── sub-components ────────────────────────────────────────────────────────────

interface StatBoxProps {
  label: string;
  value: string | number;
  accent?: boolean;
  warn?: boolean;
}

const StatBox: React.FC<StatBoxProps> = ({ label, value, accent, warn }) => (
  <Box
    sx={{
      p: 'var(--md-sys-spacing-3)',
      borderRadius: 'var(--md-sys-shape-corner-medium)',
      bgcolor: warn
        ? 'var(--md-sys-color-error-container)'
        : accent
        ? 'var(--md-sys-color-secondary-container)'
        : 'var(--md-sys-color-surface-container)',
      border: '1px solid var(--md-sys-color-outline-variant)',
      minWidth: 80,
      textAlign: 'center',
    }}
  >
    <Typography
      variant="h5"
      sx={{
        fontWeight: 'var(--md-sys-typescale-weight-bold)',
        color: warn
          ? 'var(--md-sys-color-on-error-container)'
          : accent
          ? 'var(--md-sys-color-on-secondary-container)'
          : 'var(--md-sys-color-on-surface)',
        lineHeight: 1.1,
      }}
    >
      {value}
    </Typography>
    <Typography
      variant="labelSmall"
      sx={{ color: 'var(--md-sys-color-on-surface-variant)', mt: '2px', display: 'block' }}
    >
      {label}
    </Typography>
  </Box>
);

// ── cache section ─────────────────────────────────────────────────────────────

interface CacheSectionProps {
  stats: CacheStats;
  onClear: () => void;
}

const CacheSection: React.FC<CacheSectionProps> = ({ stats, onClear }) => (
  <Box>
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 'var(--md-sys-spacing-3)' }}>
      <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
        Cache
      </Typography>
      <Button
        size="small"
        variant="text"
        onClick={onClear}
        aria-label="Svuota cache AI"
        sx={{ color: 'var(--md-sys-color-error)' }}
        startIcon={
          <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: '16px !important' }}>
            delete_sweep
          </Box>
        }
      >
        Svuota
      </Button>
    </Stack>
    <Stack direction="row" gap="var(--md-sys-spacing-3)" flexWrap="wrap">
      <StatBox label="Voci" value={stats.size} />
      <StatBox label="Hit" value={stats.hits} accent />
      <StatBox label="Miss" value={stats.misses} />
      <StatBox
        label="Hit-rate"
        value={`${(stats.hitRate * 100).toFixed(1)}%`}
        accent={stats.hitRate >= 0.5}
        warn={stats.hits + stats.misses > 0 && stats.hitRate < 0.2}
      />
    </Stack>
    {stats.hits + stats.misses > 0 && (
      <Box sx={{ mt: 'var(--md-sys-spacing-3)' }}>
        <LinearProgress
          variant="determinate"
          value={stats.hitRate * 100}
          aria-label={`Hit rate ${(stats.hitRate * 100).toFixed(1)}%`}
          sx={{
            height: 6,
            borderRadius: 'var(--md-sys-shape-corner-full)',
            bgcolor: 'var(--md-sys-color-surface-container)',
            '& .MuiLinearProgress-bar': {
              bgcolor: stats.hitRate >= 0.5
                ? 'var(--md-sys-color-secondary)'
                : 'var(--md-sys-color-error)',
              borderRadius: 'var(--md-sys-shape-corner-full)',
            },
          }}
        />
      </Box>
    )}
  </Box>
);

// ── timing section ────────────────────────────────────────────────────────────

interface TimingSectionProps {
  stats: AIRunStats;
}

const TimingSection: React.FC<TimingSectionProps> = ({ stats }) => {
  const rows = useMemo(
    () => [
      { label: 'Salute classe', ms: stats.breakdown.classHealth },
      { label: 'Analisi rischio', ms: stats.breakdown.risk },
      { label: 'Analisi eccellenza', ms: stats.breakdown.excellence },
      { label: 'Previsioni trend', ms: stats.breakdown.forecasts },
    ],
    [stats],
  );

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 'var(--md-sys-spacing-3)' }}>
        <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
          Tempi ultima analisi
        </Typography>
        <Chip
          size="small"
          label={`${stats.totalMs} ms totali`}
          color={stats.totalMs > 200 ? 'warning' : 'default'}
          aria-label={`Durata totale: ${stats.totalMs} ms`}
        />
      </Stack>
      <Stack spacing="var(--md-sys-spacing-2)">
        {rows.map(({ label, ms }) => {
          const isSlow = ms > SLOW_THRESHOLD_MS;
          const pct = stats.totalMs > 0 ? (ms / stats.totalMs) * 100 : 0;
          return (
            <Box key={label}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: '2px' }}>
                <Typography
                  variant="labelSmall"
                  sx={{ color: isSlow ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-on-surface-variant)' }}
                >
                  {label}
                  {isSlow && (
                    <Box
                      component="span"
                      className="material-symbols-outlined"
                      aria-label="Lento"
                      sx={{ fontSize: 12, ml: '4px', verticalAlign: 'middle', color: 'var(--md-sys-color-error)' }}
                    >
                      warning
                    </Box>
                  )}
                </Typography>
                <Typography
                  variant="labelSmall"
                  sx={{ color: isSlow ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-on-surface-variant)' }}
                >
                  {ms} ms
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, pct)}
                aria-label={`${label}: ${ms}ms`}
                sx={{
                  height: 4,
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  bgcolor: 'var(--md-sys-color-surface-container)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: isSlow ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)',
                    borderRadius: 'var(--md-sys-shape-corner-full)',
                  },
                }}
              />
            </Box>
          );
        })}
      </Stack>
      <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mt: 'var(--md-sys-spacing-2)' }}>
        Ultima analisi: {new Date(stats.lastRun).toLocaleTimeString('it-IT')}
      </Typography>
    </Box>
  );
};

// ── telemetry section ─────────────────────────────────────────────────────────

const EVENT_ICON: Record<string, string> = {
  ai_suggestion_viewed: 'visibility',
  ai_action_triggered: 'bolt',
  ai_explanation_opened: 'psychology',
  ai_lesson_generated: 'auto_stories',
};

const EVENT_COLOR: Record<string, string> = {
  ai_suggestion_viewed: 'var(--md-sys-color-secondary)',
  ai_action_triggered: 'var(--md-sys-color-error)',
  ai_explanation_opened: 'var(--md-sys-color-tertiary)',
  ai_lesson_generated: 'var(--md-sys-color-primary)',
};

interface TelemetrySectionProps {
  events: readonly AITelemetryEvent[];
  onClear: () => void;
}

const TelemetrySection: React.FC<TelemetrySectionProps> = ({ events, onClear }) => {
  const visible = useMemo(() => [...events].reverse().slice(0, MAX_TELEMETRY_ROWS), [events]);

  if (visible.length === 0) {
    return (
      <Box>
        <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)', mb: 'var(--md-sys-spacing-3)' }}>
          Telemetria
        </Typography>
        <Alert severity="info">
          Nessun evento registrato ancora — interagisci con i suggerimenti AI.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 'var(--md-sys-spacing-3)' }}>
        <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
          Telemetria ({events.length} eventi)
        </Typography>
        <Button
          size="small"
          variant="text"
          onClick={onClear}
          aria-label="Cancella log telemetria"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          Cancella log
        </Button>
      </Stack>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small" aria-label="Telemetria AI">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'var(--md-sys-color-on-surface-variant)', py: 0.5 }}>Evento</TableCell>
              <TableCell sx={{ color: 'var(--md-sys-color-on-surface-variant)', py: 0.5 }}>ID / Dettaglio</TableCell>
              <TableCell sx={{ color: 'var(--md-sys-color-on-surface-variant)', py: 0.5 }}>Ora</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((ev, i) => {
              const detail =
                (ev['suggestionId'] as string | undefined) ??
                (ev['studentId'] as string | undefined) ??
                (ev['context'] as string | undefined) ??
                '—';
              const time = new Date(ev.ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const icon = EVENT_ICON[ev.event] ?? 'info';
              const color = EVENT_COLOR[ev.event] ?? 'var(--md-sys-color-on-surface-variant)';
              return (
                <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ py: 0.5 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Box
                        component="span"
                        className="material-symbols-outlined"
                        aria-hidden="true"
                        sx={{ fontSize: 14, color }}
                      >
                        {icon}
                      </Box>
                      <Typography variant="labelSmall" sx={{ color, whiteSpace: 'nowrap' }}>
                        {ev.event}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <Typography
                      variant="bodySmall"
                      sx={{ color: 'var(--md-sys-color-on-surface-variant)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {detail}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', whiteSpace: 'nowrap' }}>
                      {time}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
};

// ── main component ────────────────────────────────────────────────────────────

/**
 * AIDevToolsPanel — AI diagnostics panel for beta/debug mode.
 *
 * Reads live from the in-process cache, telemetry buffer, and engine stats.
 * Auto-refreshes every 3 s while mounted in beta mode.
 */
export default function AIDevToolsPanel(): JSX.Element {
  const { isBeta } = useAIBeta();

  const [cacheStats, setCacheStats] = useState<CacheStats>(() => getCacheStats());
  const [runStats, setRunStats] = useState<AIRunStats | null>(() => getLastRunStats());
  const [events, setEvents] = useState<readonly AITelemetryEvent[]>(() => getTelemetryBuffer());
  const [tick, setTick] = useState(0);

  // Auto-refresh state every 3 seconds
  useEffect(() => {
    if (!isBeta) return;
    const id = setInterval(() => setTick((n) => n + 1), 3000);
    return () => clearInterval(id);
  }, [isBeta]);

  // Refresh derived state on tick
  useEffect(() => {
    setCacheStats(getCacheStats());
    setRunStats(getLastRunStats());
    setEvents(getTelemetryBuffer());
  }, [tick]);

  const handleClearCache = useCallback(() => {
    clearCache();
    setCacheStats(getCacheStats());
  }, []);

  const handleClearTelemetry = useCallback(() => {
    clearTelemetryBuffer();
    setEvents(getTelemetryBuffer());
  }, []);

  if (!isBeta) {
    return (
      <Alert
        severity="info"
        icon={
          <Box component="span" className="material-symbols-outlined" aria-hidden="true">
            lock
          </Box>
        }
        sx={{ mt: 'var(--md-sys-spacing-4)' }}
      >
        Il pannello Dev Tools è disponibile solo in modalità AI Sperimentale. Attivala in Impostazioni → Avanzate.
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
      aria-label="AI Dev Tools Panel"
    >
      {/* Top strip: beta badge + refresh indicator */}
      <Box sx={{ gridColumn: '1 / -1' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip
            size="small"
            label="AI Experimental"
            color="warning"
            icon={
              <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: '14px !important' }}>
                science
              </Box>
            }
          />
          <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Aggiornamento automatico ogni 3 s
          </Typography>
        </Stack>
      </Box>

      {/* Cache stats */}
      <Box
        sx={{
          p: 'var(--md-sys-spacing-4)',
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          bgcolor: 'var(--md-sys-color-surface-container-low)',
        }}
      >
        <CacheSection stats={cacheStats} onClear={handleClearCache} />
      </Box>

      {/* Run timing */}
      <Box
        sx={{
          p: 'var(--md-sys-spacing-4)',
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          bgcolor: 'var(--md-sys-color-surface-container-low)',
        }}
      >
        {runStats ? (
          <TimingSection stats={runStats} />
        ) : (
          <Alert severity="info">
            Nessun run completato — i dati di timing compariranno dopo la prima analisi.
          </Alert>
        )}
      </Box>

      {/* Telemetry events — full width */}
      <Box
        sx={{
          gridColumn: '1 / -1',
          p: 'var(--md-sys-spacing-4)',
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          bgcolor: 'var(--md-sys-color-surface-container-low)',
        }}
      >
        <TelemetrySection events={events} onClear={handleClearTelemetry} />
      </Box>

      <Divider sx={{ gridColumn: '1 / -1' }} />

      {/* Footer info */}
      <Box sx={{ gridColumn: '1 / -1' }}>
        <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          I dati sono in-memory e si azzerano al refresh. Per il buffer completo usa <code>window.__aiTelemetry</code> in DevTools.
        </Typography>
      </Box>

      {/* ── Sprint 2: AI Inspector (Audit Trail + Span Timeline + Cache) ── */}
      <Box sx={{ gridColumn: '1 / -1' }}>
        <Divider sx={{ mb: 'var(--md-sys-spacing-6)' }} />
        <Typography
          variant="titleMedium"
          sx={{ color: 'var(--md-sys-color-on-surface)', mb: 'var(--md-sys-spacing-4)' }}
        >
          AI Inspector
        </Typography>
        <AIInspectorPanel />
      </Box>

      {/* ── Post-Fase 4 Soak Metrics (NEW for soak monitoring) ── */}
      <Box sx={{ gridColumn: '1 / -1' }}>
        <Divider sx={{ mb: 'var(--md-sys-spacing-6)' }} />
        <Typography
          variant="titleMedium"
          sx={{ color: 'var(--md-sys-color-on-surface)', mb: 'var(--md-sys-spacing-4)' }}
        >
          Post-Fase 4 Soak Metrics
        </Typography>
        <AISoakMetricsPanel />
      </Box>
    </Box>
  );
}

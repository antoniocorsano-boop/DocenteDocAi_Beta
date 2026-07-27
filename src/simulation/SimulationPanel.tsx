/**
 * simulation/SimulationPanel.tsx — Pannello demo del Simulation Engine.
 *
 * Componente self-contained che:
 * - Mostra un FAB in basso a sinistra per aprire/chiudere il pannello
 * - Renderizza una timeline della giornata demo
 * - Offre controlli Start / Pausa / Stop e selettore velocità
 * - Mostra metriche live: skill attivate, response time medio, landing rate
 * - Monta UIController come overlay fullscreen quando activeLanding è impostato
 *
 * MD3 compliant: usa M3Surface, var(--md-sys-color-*), niente <div> per
 * container visivi, niente box-shadow custom, niente spacing hardcoded.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Chip,
  Divider,
  Fab,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import PlayCircleIcon    from '@mui/icons-material/PlayCircle';
import PauseCircleIcon   from '@mui/icons-material/PauseCircle';
import StopCircleIcon    from '@mui/icons-material/StopCircle';
import DownloadIcon      from '@mui/icons-material/Download';
import CloseIcon         from '@mui/icons-material/Close';
import CircleIcon        from '@mui/icons-material/Circle';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

import M3Surface             from '../components/ui/M3Surface';
import { DayPlanner, DEFAULT_DAY } from './DayPlanner';
import { JarvisSimulator }   from './JarvisSimulator';
import { SimulationEngine }  from './SimulationEngine';
import { useSimulationStore } from './simulationStore';
import { useSimulation }     from './hooks/useSimulation';
import UIController          from './UIController';
import type { LessonEvent }  from './types';

// ─── Constants ────────────────────────────────────────────────────────────────

const SPEED_OPTIONS = [
  { label: '1×',   value: 1   },
  { label: '5×',   value: 5   },
  { label: '30×',  value: 30  },
  { label: '60×',  value: 60  },
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface SimulationPanelProps {
  tenantId: string;
}

// ─── TimelineRow ──────────────────────────────────────────────────────────────

interface TimelineRowProps {
  event:     LessonEvent;
  isCurrent: boolean;
  isDone:    boolean;
  isLast:    boolean;
}

function TimelineRow({ event, isCurrent, isDone, isLast }: TimelineRowProps): React.JSX.Element {
  return (
    <Stack direction="row" alignItems="flex-start" spacing={1}>
      {/* Dot + connector */}
      <Stack alignItems="center" spacing={0} sx={{ width: 20, flexShrink: 0 }}>
        {isDone ? (
          <CheckCircleIcon
            sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: 'var(--md-sys-color-primary)' }}
          />
        ) : isCurrent ? (
          <CircleIcon
            sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: 'var(--md-sys-color-tertiary)', animation: 'pulse 1s ease-in-out infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }}
          />
        ) : (
          <RadioButtonUncheckedIcon
            sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: 'var(--md-sys-color-outline)' }}
          />
        )}
        {!isLast && (
          <Box sx={{ width: 2, flexGrow: 1, minHeight: 20, bgcolor: 'var(--md-sys-color-outline-variant)', mx: 'auto' }} />
        )}
      </Stack>

      {/* Event info */}
      <Box sx={{ pb: isLast ? 0 : 1.5 }}>
        <Typography
          variant="labelSmall"
          component="span"
          sx={{
            color:      isCurrent ? 'var(--md-sys-color-tertiary)' : isDone ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
            fontWeight: isCurrent ? 'var(--md-sys-typescale-weight-semibold)' : undefined,
            display:    'block',
          }}
        >
          {event.time} · {event.classeId}
        </Typography>
        <Typography
          variant="bodySmall"
          component="span"
          sx={{
            color:   isCurrent ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-on-surface-variant)',
            display: 'block',
          }}
        >
          {event.label ?? event.skillHint}
        </Typography>
      </Box>
    </Stack>
  );
}

// ─── SimulationPanel ──────────────────────────────────────────────────────────

export default function SimulationPanel({ tenantId }: SimulationPanelProps): React.JSX.Element {
  const [panelOpen,     setPanelOpen]     = useState(false);
  const [engineEnabled, setEngineEnabled] = useState(false);
  const [speed,         setSpeed]         = useState(60);

  // ── Build engine instances (stable across renders) ─────────────────────────
  const { engine } = useMemo(() => {
    const dayPlanner = new DayPlanner();
    const jarvis     = new JarvisSimulator(tenantId);
    const eng        = new SimulationEngine(dayPlanner, jarvis, { device: 'desktop', speedMultiplier: speed });
    return { engine: eng };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  // ── Sync speed into store ──────────────────────────────────────────────────
  const setSpeedStore = useSimulationStore(s => s._actions.setSpeed);

  const handleSpeedChange = useCallback((v: number): void => {
    setSpeed(v);
    setSpeedStore(v);
  }, [setSpeedStore]);

  // ── useSimulation hook ────────────────────────────────────────────────────
  useSimulation(engine, engineEnabled);

  // ── Store selectors ────────────────────────────────────────────────────────
  const status        = useSimulationStore(s => s.status);
  const currentEvent  = useSimulationStore(s => s.currentEvent);
  const elapsedEvents = useSimulationStore(s => s.elapsedEvents);
  const totalEvents   = useSimulationStore(s => s.totalEvents);
  const metrics       = useSimulationStore(s => s.metrics);

  // ── Derived metrics ────────────────────────────────────────────────────────
  const skillCount   = metrics.length;
  const avgMs        = metrics.length
    ? Math.round(metrics.reduce((a, m) => a + m.responseTimeMs, 0) / metrics.length)
    : 0;
  const landingRate  = metrics.length
    ? Math.round((metrics.filter(m => m.landingShown).length / metrics.length) * 100)
    : 0;

  // ── Controls ───────────────────────────────────────────────────────────────
  const handleStart = useCallback((): void => {
    if (status === 'paused') {
      engine.resume();
    } else {
      setEngineEnabled(true);
    }
  }, [engine, status]);

  const handlePause = useCallback((): void => {
    engine.pause();
  }, [engine]);

  const handleStop = useCallback((): void => {
    setEngineEnabled(false);
    engine.abort();
  }, [engine]);

  const handleExport = useCallback((): void => {
    if (!metrics.length) return;
    const collector = engine.getCollector();
    const csv       = collector.exportCSV();
    const blob      = new Blob([csv], { type: 'text/csv' });
    const url       = URL.createObjectURL(blob);
    const a         = document.createElement('a');
    a.href          = url;
    a.download      = 'simulation-metrics.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [engine, metrics]);

  const progress = totalEvents > 0 ? (elapsedEvents / totalEvents) * 100 : 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── UIController overlay (fullscreen landing) ─────────────────── */}
      <UIController />

      {/* ── FAB trigger ───────────────────────────────────────────────── */}
      {!panelOpen && (
        <Tooltip title="Simulation Engine — demo Jarvis" placement="right">
          <Fab
            size="medium"
            color="secondary"
            aria-label="Apri pannello simulazione Jarvis"
            onClick={() => setPanelOpen(true)}
            sx={{
              position: 'fixed',
              bottom:   76,
              left:     24,
              zIndex:   1200,
              bgcolor:  'var(--md-sys-color-secondary-container)',
              color:    'var(--md-sys-color-on-secondary-container)',
              '&:hover': { bgcolor: 'var(--md-sys-color-secondary)' },
            }}
          >
            <PlayCircleIcon />
          </Fab>
        </Tooltip>
      )}

      {/* ── Slide-in panel ────────────────────────────────────────────── */}
      {panelOpen && (
        <M3Surface
          component="aside"
          aria-label="Pannello Simulation Engine"
          sx={{
            position:    'fixed',
            bottom:      0,
            left:        0,
            width:       320,
            maxHeight:   '90dvh',
            overflowY:   'auto',
            zIndex:      1200,
            borderRadius: '0 var(--md-sys-shape-corner-extra-large) 0 0',
            borderRight: '1px solid var(--md-sys-color-outline-variant)',
            borderTop:   '1px solid var(--md-sys-color-outline-variant)',
            p:           2,
            animation:   'slideUp 200ms ease-out',
            '@keyframes slideUp': {
              from: { transform: 'translateY(30px)', opacity: 0 },
              to:   { transform: 'translateY(0)',    opacity: 1 },
            },
          }}
        >
          {/* Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Typography variant="titleMedium" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
              Simulation Engine
            </Typography>
            <IconButton
              size="small"
              aria-label="Chiudi pannello simulazione"
              onClick={() => setPanelOpen(false)}
              sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Divider sx={{ borderColor: 'var(--md-sys-color-outline-variant)', mb: 1.5 }} />

          {/* Status chip */}
          <Chip
            size="small"
            label={STATUS_LABELS[status]}
            sx={{
              mb: 2,
              bgcolor: STATUS_COLORS[status],
              color:   'var(--md-sys-color-on-primary)',
              fontWeight: 'var(--md-sys-typescale-weight-semibold)',
            }}
          />

          {/* Progress bar */}
          {status !== 'idle' && (
            <Box mb={2}>
              <LinearProgress
                variant="determinate"
                value={progress}
                aria-label={`Simulazione: ${elapsedEvents} di ${totalEvents} eventi`}
                sx={{
                  borderRadius: 4,
                  height: 6,
                  bgcolor: 'var(--md-sys-color-surface-variant)',
                  '& .MuiLinearProgress-bar': { bgcolor: 'var(--md-sys-color-primary)' },
                }}
              />
              <Typography variant="bodySmall" sx={{ mt: 0.5, color: 'var(--md-sys-color-on-surface-variant)' }}>
                {elapsedEvents}/{totalEvents} eventi
              </Typography>
            </Box>
          )}

          {/* Speed selector */}
          <Stack direction="row" spacing={0.5} mb={2} flexWrap="wrap" useFlexGap>
            {SPEED_OPTIONS.map(opt => (
              <Chip
                key={opt.value}
                label={opt.label}
                size="small"
                clickable
                aria-label={`Velocità simulazione ${opt.label}`}
                aria-pressed={speed === opt.value}
                onClick={() => handleSpeedChange(opt.value)}
                sx={{
                  bgcolor:    speed === opt.value ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-variant)',
                  color:      speed === opt.value ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
                  fontWeight: speed === opt.value ? 'var(--md-sys-typescale-weight-bold)' : undefined,
                  border:     speed === opt.value ? '1.5px solid var(--md-sys-color-primary)' : 'none',
                }}
              />
            ))}
          </Stack>

          {/* Controls */}
          <Stack direction="row" spacing={1} mb={2}>
            <IconButton
              size="small"
              aria-label="Avvia simulazione"
              onClick={handleStart}
              disabled={status === 'running' || status === 'done'}
              sx={{ color: 'var(--md-sys-color-primary)' }}
            >
              <PlayCircleIcon />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Pausa simulazione"
              onClick={handlePause}
              disabled={status !== 'running'}
              sx={{ color: 'var(--md-sys-color-secondary)' }}
            >
              <PauseCircleIcon />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Ferma simulazione"
              onClick={handleStop}
              disabled={status === 'idle'}
              sx={{ color: 'var(--md-sys-color-error)' }}
            >
              <StopCircleIcon />
            </IconButton>
            <Tooltip title="Esporta metriche CSV">
              <span>
                <IconButton
                  size="small"
                  aria-label="Esporta metriche CSV"
                  onClick={handleExport}
                  disabled={!metrics.length}
                  sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                >
                  <DownloadIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          <Divider sx={{ borderColor: 'var(--md-sys-color-outline-variant)', mb: 2 }} />

          {/* Metrics */}
          <Stack direction="row" justifyContent="space-between" mb={2}>
            <MetricBox label="Skill" value={String(skillCount)} />
            <MetricBox label="Avg ms" value={String(avgMs)} />
            <MetricBox label="Landing" value={`${landingRate}%`} />
          </Stack>

          <Divider sx={{ borderColor: 'var(--md-sys-color-outline-variant)', mb: 2 }} />

          {/* Timeline */}
          <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 1, display: 'block' }}>
            TIMELINE
          </Typography>
          <Box>
            {DEFAULT_DAY.map((event, i) => {
              const isDone    = i < elapsedEvents;
              const isCurrent = currentEvent?.skillHint === event.skillHint && currentEvent?.time === event.time;
              return (
                <TimelineRow
                  key={`${event.time}-${event.skillHint}`}
                  event={event}
                  isCurrent={isCurrent}
                  isDone={isDone}
                  isLast={i === DEFAULT_DAY.length - 1}
                />
              );
            })}
          </Box>
        </M3Surface>
      )}
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function MetricBox({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <Box sx={{ textAlign: 'center', minWidth: 64 }}>
      <Typography variant="titleLarge" component="p" sx={{ color: 'var(--md-sys-color-primary)' }}>
        {value}
      </Typography>
      <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
        {label}
      </Typography>
    </Box>
  );
}

const STATUS_LABELS: Record<string, string> = {
  idle:    '● Idle',
  running: '▶ Running',
  paused:  '⏸ Paused',
  done:    '✓ Done',
};

const STATUS_COLORS: Record<string, string> = {
  idle:    'var(--md-sys-color-surface-variant)',
  running: 'var(--md-sys-color-primary)',
  paused:  'var(--md-sys-color-secondary)',
  done:    'var(--md-sys-color-tertiary)',
};

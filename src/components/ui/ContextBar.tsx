/**
 * ContextBar.tsx — Barra contestuale live (desktop header).
 *
 * Mostra il contesto orario corrente: data, classe, minuti alla lezione.
 * Si aggiorna ogni minuto e al cambio di ScheduleContext.
 * Cliccabile → apre ScheduleLanding fullscreen.
 *
 * MD3 Gold Compliant:
 *   - nessun <div> visivo → usa M3Surface
 *   - token var(--md-sys-color-*) per colori
 *   - aria-label esplicito
 */

import React, { useCallback, useEffect, useState } from 'react';
import Box      from '@mui/material/Box';
import Button   from '@mui/material/Button';
import Chip     from '@mui/material/Chip';
import Stack    from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AccessTimeIcon    from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ChevronRightIcon  from '@mui/icons-material/ChevronRight';

import M3Surface from './M3Surface';
import { useAcademicStore }  from '../../stores/useAcademicStore';
import { useSettingsStore }  from '../../stores/useSettingsStore';
import type { ScheduleContext } from '../../modules/orchestration/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildLiveCtx(): ScheduleContext & { lessonLabel: string } {
  const { lessons } = useAcademicStore.getState();
  const { settings } = useSettingsStore.getState();
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLessons = Object.values(lessons).filter(
    l => l.data === todayStr && !l.svolta,
  );
  if (todayLessons.length === 0) return { lessonLabel: '' };
  const next = todayLessons[0];
  const [h, m] = (settings.orarioInizio ?? '08:00').split(':').map(Number);
  const now = Date.now();
  const d   = new Date(now);
  const startMs   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m).getTime();
  const minsToLesson = Math.floor((startMs - now) / 60_000);
  return {
    currentLessonId: next.id,
    activeClassId:   next.classe,
    nextLessonAt:    startMs,
    lessonType:      next.tipoLezione,
    minsToLesson,
    lessonLabel: `${next.classe} — ${next.materia ?? 'Lezione'}`,
  };
}

function formatDate(now: Date): string {
  return now.toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function formatCountdown(mins: number): { text: string; urgent: boolean } {
  if (mins < 0 && mins > -90)  return { text: 'In corso', urgent: false };
  if (mins < 0)                return { text: '', urgent: false };
  if (mins === 0)              return { text: 'Adesso', urgent: true };
  if (mins < 5)                return { text: `tra ${mins} min`, urgent: true };
  if (mins < 60)               return { text: `tra ${mins} min`, urgent: false };
  const h = Math.floor(mins / 60);
  return { text: `tra ${h}h`, urgent: false };
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ContextBarProps {
  onOpenSchedule: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ContextBar({ onOpenSchedule }: ContextBarProps): React.JSX.Element {
  const [now,   setNow]   = useState(() => new Date());
  const [liveCtx, setLive] = useState(() => buildLiveCtx());

  // Tick every 60s
  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
      setLive(buildLiveCtx());
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const countdown = liveCtx.minsToLesson !== undefined
    ? formatCountdown(liveCtx.minsToLesson)
    : null;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenSchedule(); }
  }, [onOpenSchedule]);

  return (
    <M3Surface
      elevation={0}
      component="header"
      role="banner"
      aria-label="Barra contesto orario"
      sx={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        px:              3,
        py:              1,
        borderBottom:    '1px solid var(--md-sys-color-outline-variant)',
        bgcolor:         'var(--md-sys-color-surface)',
        minHeight:       48,
        flexShrink:      0,
      }}
    >
      {/* Left: date */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <CalendarTodayIcon
          sx={{ fontSize: 'var(--md-sys-icon-size-sm, 16px)', color: 'var(--md-sys-color-on-surface-variant)' }}
          aria-hidden
        />
        <Typography
          variant="labelMedium"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'capitalize' }}
        >
          {formatDate(now)}
        </Typography>
      </Stack>

      {/* Center: lesson context (clickable) */}
      {liveCtx.lessonLabel ? (
        <Button
          variant="text"
          onClick={onOpenSchedule}
          onKeyDown={handleKeyDown}
          aria-label={`Orario: ${liveCtx.lessonLabel}${countdown ? ' — ' + countdown.text : ''} — apri vista orario`}
          sx={{
            borderRadius: 8,
            px:           1.5,
            py:           0.25,
            textTransform: 'none',
            color:         'var(--md-sys-color-on-surface)',
            gap:           1,
            '&:hover': { bgcolor: 'var(--md-sys-color-surface-container-low)' },
          }}
        >
          <AccessTimeIcon
            sx={{
              fontSize: 'var(--md-sys-icon-size-sm, 16px)',
              color:    countdown?.urgent
                ? 'var(--md-sys-color-error)'
                : 'var(--md-sys-color-primary)',
            }}
            aria-hidden
          />
          <Typography
            variant="labelMedium"
            component="span"
            sx={{
              color:      'var(--md-sys-color-on-surface)',
              fontWeight: 'var(--md-sys-typescale-weight-semibold)',
            }}
          >
            {liveCtx.lessonLabel}
          </Typography>
          {countdown?.text && (
            <Chip
              label={countdown.text}
              size="small"
              sx={{
                height:  20,
                fontSize: 11,
                bgcolor: countdown.urgent
                  ? 'var(--md-sys-color-error-container)'
                  : 'var(--md-sys-color-primary-container)',
                color: countdown.urgent
                  ? 'var(--md-sys-color-on-error-container)'
                  : 'var(--md-sys-color-on-primary-container)',
              }}
            />
          )}
          <ChevronRightIcon
            sx={{ fontSize: 'var(--md-sys-icon-size-sm, 16px)', color: 'var(--md-sys-color-on-surface-variant)', ml: -0.5 }}
            aria-hidden
          />
        </Button>
      ) : (
        <Box aria-hidden />
      )}

      {/* Right: keyboard hint */}
      <Typography
        variant="labelSmall"
        sx={{ color: 'var(--md-sys-color-outline)', letterSpacing: '0.04em' }}
        aria-hidden
      >
        ⌘K comandi
      </Typography>
    </M3Surface>
  );
}

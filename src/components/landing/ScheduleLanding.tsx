/**
 * ScheduleLanding.tsx — Fullscreen orario del giorno per Orbit Jarvis.
 *
 * Mostra la timeline verticale delle lezioni di oggi con highlight della
 * lezione corrente. Tap su un slot → naviga a ClassLanding per quel contesto.
 *
 * MD3 Gold Compliant:
 *   - M3Surface come unico container visivo
 *   - M3Typography per ogni testo semantico
 *   - var(--md-sys-color-*) per colori
 *   - nessun <div> per layout/shell
 */

import React, { useMemo } from 'react';
import Box          from '@mui/material/Box';
import IconButton   from '@mui/material/IconButton';
import Stack        from '@mui/material/Stack';
import Typography   from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import M3Surface  from '../ui/M3Surface';

import { useAcademicStore }  from '../../stores/useAcademicStore';
import { useSettingsStore }  from '../../stores/useSettingsStore';
import type { ScheduleContext } from '../../modules/orchestration/types';
import type { Lezione }         from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScheduleLandingProps {
  /** Chiudi la landing */
  onClose:      () => void;
  /** Naviga a un'altra landing */
  onNavigate:   (type: 'class' | 'lesson', ctx: ScheduleContext) => void;
  /** Contesto orario opzionale (passato da UserWorkspace) */
  ctx?:         ScheduleContext | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calcola l'ora di fine della lezione in base all'orario di inizio globale
 * e alla posizione della lezione nell'array di oggi.
 * (Ogni lezione dura 60 minuti per default — approssimazione scolastica.)
 */
function estimateTime(index: number, orarioInizio: string): { start: string; end: string } {
  const [h, m] = orarioInizio.split(':').map(Number);
  const startMin = h * 60 + m + index * 60;
  const endMin   = startMin + 60;
  const fmt = (mins: number) => {
    const hh = Math.floor(mins / 60) % 24;
    const mm = mins % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };
  return { start: fmt(startMin), end: fmt(endMin) };
}

function isCurrentLesson(index: number, orarioInizio: string): boolean {
  const [h, m] = orarioInizio.split(':').map(Number);
  const startMin = h * 60 + m + index * 60;
  const endMin   = startMin + 60;
  const now      = new Date();
  const nowMin   = now.getHours() * 60 + now.getMinutes();
  return nowMin >= startMin && nowMin < endMin;
}

const TIPO_COLOR: Record<string, string> = {
  Teoria:       'var(--md-sys-color-primary)',
  Laboratorio:  'var(--md-sys-color-tertiary)',
  Test:         'var(--md-sys-color-error)',
  Verifica:     'var(--md-sys-color-error)',
  Disegno:      'var(--md-sys-color-secondary)',
  Disposizione: 'var(--md-sys-color-outline)',
  Ricevimento:  'var(--md-sys-color-secondary)',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScheduleLanding({
  onClose,
  onNavigate,
  ctx,
}: ScheduleLandingProps): React.JSX.Element {
  const { lessons }  = useAcademicStore();
  const { settings } = useSettingsStore();

  const todayStr      = new Date().toISOString().slice(0, 10);
  const orarioInizio  = settings.orarioInizio ?? '08:00';

  const todayLessons: Lezione[] = useMemo(
    () =>
      Object.values(lessons)
        .filter(l => l.data === todayStr)
        .sort((a, b) => {
          // ordinamento stabile per id se non esiste campo ora
          return a.id.localeCompare(b.id);
        }),
    [lessons, todayStr],
  );

  const handleSlot = (lesson: Lezione, index: number) => {
    const time = estimateTime(index, orarioInizio);
    onNavigate('class', {
      currentLessonId: lesson.id,
      activeClassId:   lesson.classe,
      lessonType:      lesson.tipoLezione,
      nextLessonAt:    ctx?.nextLessonAt,
    });
    void time; // usato per il display ma non nel contesto
  };

  return (
    <M3Surface
      elevation={0}
      sx={{
        position:        'fixed',
        inset:           0,
        zIndex:          1300,
        display:         'flex',
        flexDirection:   'column',
        bgcolor:         'var(--md-sys-color-background)',
        overflow:        'hidden',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Orario di oggi"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          flexShrink: 0,
        }}
      >
        <IconButton
          onClick={onClose}
          aria-label="Chiudi orario"
          size="small"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          <ArrowBackIcon sx={{ fontSize: 'var(--md-sys-icon-size-md, 20px)' }} />
        </IconButton>
        <EventNoteIcon
          sx={{ fontSize: 'var(--md-sys-icon-size-md, 20px)', color: 'var(--md-sys-color-primary)' }}
          aria-hidden
        />
        <Typography variant="titleMedium" sx={{ fontWeight: 'var(--md-sys-typescale-weight-semibold)', flex: 1 }}>
          Orario di oggi
        </Typography>
        <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Typography>
      </Stack>

      {/* ── Timeline ───────────────────────────────────────────────────── */}
      <Box
        component="ul"
        sx={{
          flex:      1,
          overflowY: 'auto',
          m:         0,
          p:         0,
          listStyle: 'none',
        }}
        aria-label="Lista lezioni di oggi"
      >
        {todayLessons.length === 0 ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 6, gap: 1 }}>
            <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Nessuna lezione programmata per oggi.
            </Typography>
          </Stack>
        ) : (
          todayLessons.map((lesson, i) => {
            const time    = estimateTime(i, orarioInizio);
            const current = isCurrentLesson(i, orarioInizio);
            const tipoBg  = TIPO_COLOR[lesson.tipoLezione ?? ''] ?? 'var(--md-sys-color-outline)';

            return (
              <Box
                key={lesson.id}
                component="li"
                onClick={() => handleSlot(lesson, i)}
                role="button"
                aria-label={`Lezione ${lesson.materia} classe ${lesson.classe} alle ${time.start}`}
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleSlot(lesson, i); }}
                sx={{
                  display:    'flex',
                  alignItems: 'stretch',
                  borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                  bgcolor: current
                    ? 'color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent)'
                    : 'transparent',
                  cursor:      'pointer',
                  transition:  'background 120ms ease-out',
                  '&:hover':   { bgcolor: 'color-mix(in srgb, var(--md-sys-color-on-surface) 6%, transparent)' },
                  '&:focus-visible': { outline: '2px solid var(--md-sys-color-primary)', outlineOffset: -2 },
                }}
              >
                {/* Ora */}
                <Box sx={{ width: 64, px: 2, py: 1.5, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="labelSmall" sx={{ color: current ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
                    {time.start}
                  </Typography>
                  <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-outline)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
                    {time.end}
                  </Typography>
                </Box>

                {/* Indicatore colore */}
                <Box sx={{ width: 3, bgcolor: current ? 'var(--md-sys-color-primary)' : tipoBg, flexShrink: 0, borderRadius: '2px', my: 0.5 }} aria-hidden />

                {/* Contenuto */}
                <Box sx={{ flex: 1, px: 2, py: 1.5, minWidth: 0 }}>
                  <Typography variant="labelMedium" sx={{ fontWeight: 'var(--md-sys-typescale-weight-semibold)', color: current ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface)', mb: 0.25 }}>
                    {lesson.materia}
                  </Typography>
                  <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                    {lesson.classe}{lesson.tipoLezione ? ` · ${lesson.tipoLezione}` : ''}{lesson.svolta ? ' · Svolta' : ''}
                  </Typography>
                </Box>

                {/* Chevron */}
                <Box sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
                  <ChevronRightIcon sx={{ fontSize: 'var(--md-sys-icon-size-sm, 16px)', color: 'var(--md-sys-color-outline)' }} aria-hidden />
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </M3Surface>
  );
}

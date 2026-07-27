/**
 * LessonLanding.tsx — Focus mode lezione per Orbit Jarvis.
 *
 * Visualizza i materiali della lezione, un campo note rapido e i suggerimenti
 * contestuali di Jarvis per il docente.
 *
 * MD3 Gold Compliant:
 *   - M3Surface come unico container visivo
 *   - M3Typography per ogni testo semantico
 *   - nessun <div> per layout/shell/card
 *   - spacing e colori via token MD3
 */

import React, { useState } from 'react';
import Box           from '@mui/material/Box';
import Chip          from '@mui/material/Chip';
import Divider       from '@mui/material/Divider';
import IconButton    from '@mui/material/IconButton';
import Stack         from '@mui/material/Stack';
import TextField     from '@mui/material/TextField';
import Typography    from '@mui/material/Typography';
import ArrowBackIcon    from '@mui/icons-material/ArrowBack';
import BoltIcon         from '@mui/icons-material/Bolt';
import AttachFileIcon   from '@mui/icons-material/AttachFile';
import EditNoteIcon     from '@mui/icons-material/EditNote';
import LinkIcon         from '@mui/icons-material/Link';

import M3Surface from '../ui/M3Surface';

import { useAcademicStore }  from '../../stores/useAcademicStore';
import type { ScheduleContext }      from '../../modules/orchestration/types';
import type { OrchestrationContext } from '../../modules/orchestration/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LessonLandingProps {
  onClose:   () => void;
  ctx?:      ScheduleContext | null;
  /** Contesto di orchestrazione con suggerimenti Jarvis */
  context?:  OrchestrationContext | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LessonLanding({
  onClose,
  ctx,
  context,
}: LessonLandingProps): React.JSX.Element {
  const { lessons } = useAcademicStore();

  const [note, setNote] = useState('');

  const activeLesson = ctx?.currentLessonId ? lessons[ctx.currentLessonId] : null;
  const className    = activeLesson?.classe ?? ctx?.activeClassId ?? '—';
  const materia      = activeLesson?.materia ?? '—';
  const tipoLezione  = activeLesson?.tipoLezione ?? ctx?.lessonType;
  const materiali    = activeLesson?.materialiDidattici ?? [];
  const externalLink = activeLesson?.externalLink;

  // Suggerimenti Jarvis (azioni immediate filtrate per focus mode)
  const suggestions  = context?.suggestions.slice(0, 3) ?? [];

  return (
    <M3Surface
      elevation={0}
      sx={{
        position:      'fixed',
        inset:         0,
        zIndex:        1300,
        display:       'flex',
        flexDirection: 'column',
        bgcolor:       'var(--md-sys-color-background)',
        overflow:      'hidden',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Focus mode — ${materia} ${className}`}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
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
          aria-label="Chiudi focus mode lezione"
          size="small"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          <ArrowBackIcon sx={{ fontSize: 'var(--md-sys-icon-size-md, 20px)' }} />
        </IconButton>
        <BoltIcon
          sx={{ fontSize: 'var(--md-sys-icon-size-md, 20px)', color: 'var(--md-sys-color-tertiary)' }}
          aria-hidden
        />
        <Typography variant="titleMedium" sx={{ fontWeight: 'var(--md-sys-typescale-weight-semibold)', flex: 1 }}>
          Focus Mode
        </Typography>
        <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          {`${className} · ${tipoLezione ?? materia}`}
        </Typography>
      </Stack>

      {/* ── Scrollable content ──────────────────────────────────────────── */}
      <Box
        component="section"
        sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}
        aria-label="Contenuto lezione"
      >
        {/* Titolo lezione */}
        <Box sx={{ px: 3, pt: 2.5, pb: 2 }}>
          <Typography variant="headlineSmall" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', color: 'var(--md-sys-color-on-surface)', lineHeight: 1.25 }}>
            {materia}
          </Typography>
          {activeLesson?.contenuto && (
            <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mt: 0.5 }}>
              {activeLesson.contenuto}
            </Typography>
          )}
        </Box>

        {/* Materiali didattici */}
        {(materiali.length > 0 || externalLink) && (
          <>
            <Divider sx={{ borderColor: 'var(--md-sys-color-outline-variant)' }} />
            <Box
              component="section"
              aria-label="Materiali didattici"
              sx={{ px: 3, py: 2 }}
            >
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1.5 }}>
                <AttachFileIcon sx={{ fontSize: 'var(--md-sys-icon-size-sm, 16px)', color: 'var(--md-sys-color-on-surface-variant)' }} aria-hidden />
                <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Materiali
                </Typography>
              </Stack>
              <Stack gap={0.75}>
                {materiali.map(m => (
                  <Stack
                    key={m.id}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    component="a"
                    href={m.url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Materiale: ${m.label ?? m.fileName ?? 'Materiale'}`}
                    sx={{
                      textDecoration: 'none',
                      color: 'var(--md-sys-color-primary)',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    <LinkIcon sx={{ fontSize: 'var(--md-sys-icon-size-xs, 14px)' }} aria-hidden />
                    <Typography variant="labelMedium">{m.label ?? m.fileName ?? 'Materiale'}</Typography>
                  </Stack>
                ))}
                {externalLink && (
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    component="a"
                    href={externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Collegamento esterno"
                    sx={{
                      textDecoration: 'none',
                      color: 'var(--md-sys-color-primary)',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    <LinkIcon sx={{ fontSize: 'var(--md-sys-icon-size-xs, 14px)' }} aria-hidden />
                    <Typography variant="labelMedium">Collegamento esterno</Typography>
                  </Stack>
                )}
              </Stack>
            </Box>
          </>
        )}

        {/* Suggerimenti Jarvis */}
        {suggestions.length > 0 && (
          <>
            <Divider sx={{ borderColor: 'var(--md-sys-color-outline-variant)' }} />
            <Box
              component="section"
              aria-label="Suggerimenti Jarvis"
              sx={{ px: 3, py: 2 }}
            >
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1.5 }}>
                <BoltIcon sx={{ fontSize: 'var(--md-sys-icon-size-sm, 16px)', color: 'var(--md-sys-color-tertiary)' }} aria-hidden />
                <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Jarvis suggerisce
                </Typography>
              </Stack>
              <Stack gap={0.75}>
                {suggestions.map((s, i) => (
                  <Chip
                    key={s.id ?? i}
                    label={s.title}
                    size="small"
                    variant="outlined"
                    aria-label={`Suggerimento: ${s.title}`}
                    sx={{
                      alignSelf:   'flex-start',
                      borderColor: 'var(--md-sys-color-tertiary)',
                      color:       'var(--md-sys-color-on-surface)',
                      maxWidth:    '100%',
                      height:      'auto',
                      '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 },
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </>
        )}

        {/* Note rapide */}
        <Divider sx={{ borderColor: 'var(--md-sys-color-outline-variant)' }} />
        <Box
          component="section"
          aria-label="Note rapide"
          sx={{ px: 3, py: 2, pb: 4 }}
        >
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1.5 }}>
            <EditNoteIcon sx={{ fontSize: 'var(--md-sys-icon-size-sm, 16px)', color: 'var(--md-sys-color-on-surface-variant)' }} aria-hidden />
            <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Note rapide
            </Typography>
          </Stack>
          <TextField
            multiline
            minRows={3}
            maxRows={8}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Scrivi una nota sulla lezione…"
            variant="outlined"
            fullWidth
            inputProps={{ 'aria-label': 'Note rapide sulla lezione' }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 'var(--md-sys-shape-corner-medium, 12px)',
              },
            }}
          />
        </Box>
      </Box>
    </M3Surface>
  );
}

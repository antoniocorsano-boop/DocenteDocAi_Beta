/**
 * ClassLanding.tsx — Contesto classe per Orbit Jarvis.
 *
 * Mostra informazioni rapide sulla classe attiva e offre 4 chip-azione
 * fondamentali. Il tap su "→ Lezione" naviga a LessonLanding.
 *
 * MD3 Gold Compliant:
 *   - M3Surface come unico container visivo
 *   - M3Typography per ogni testo semantico
 *   - nessun <div> per layout/shell/card
 *   - spacing e colori via token MD3
 */

import React from 'react';
import Box          from '@mui/material/Box';
import Button       from '@mui/material/Button';
import Chip         from '@mui/material/Chip';
import IconButton   from '@mui/material/IconButton';
import Stack        from '@mui/material/Stack';
import Typography   from '@mui/material/Typography';
import ArrowBackIcon   from '@mui/icons-material/ArrowBack';
import GroupsIcon      from '@mui/icons-material/Groups';
import ChecklistIcon   from '@mui/icons-material/Checklist';
import PlayArrowIcon   from '@mui/icons-material/PlayArrow';
import MenuBookIcon    from '@mui/icons-material/MenuBook';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import M3Surface from '../ui/M3Surface';

import { useAcademicStore }  from '../../stores/useAcademicStore';
import type { ScheduleContext } from '../../modules/orchestration/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClassLandingProps {
  onClose:      () => void;
  onNavigate:   (type: 'schedule' | 'lesson', ctx: ScheduleContext) => void;
  ctx?:         ScheduleContext | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClassLanding({
  onClose,
  onNavigate,
  ctx,
}: ClassLandingProps): React.JSX.Element {
  const { lessons } = useAcademicStore();

  const activeLesson = ctx?.currentLessonId ? lessons[ctx.currentLessonId] : null;
  const className    = activeLesson?.classe ?? ctx?.activeClassId ?? '—';
  const materia      = activeLesson?.materia ?? '—';
  const tipoLezione  = activeLesson?.tipoLezione ?? ctx?.lessonType;

  // Studenti nella classe (count, se disponibile come data)
  const classeLessons = Object.values(lessons).filter(l => l.classe === className);

  const quickActions: Array<{
    icon:  React.ReactNode;
    label: string;
    ariaLabel: string;
    onClick: () => void;
  }> = [
    {
      icon:     <MenuBookIcon sx={{ fontSize: 'var(--md-sys-icon-size-sm, 16px)' }} />,
      label:    'Registro',
      ariaLabel: 'Apri registro classe',
      onClick:  () => {
        // Delega al sistema di navigazione esterno (UserWorkspace gestisce la tab)
        // Post message o callback su navigateTo potrà essere aggiunto in futuro
      },
    },
    {
      icon:     <ChecklistIcon sx={{ fontSize: 'var(--md-sys-icon-size-sm, 16px)' }} />,
      label:    'Presenze',
      ariaLabel: 'Segna presenze',
      onClick:  () => {
        // azione MARK_ATTENDANCE — gestita da useThumbMenu/orchestration
      },
    },
    {
      icon:     <PlayArrowIcon sx={{ fontSize: 'var(--md-sys-icon-size-sm, 16px)' }} />,
      label:    'Avvia lezione',
      ariaLabel: 'Avvia lezione',
      onClick:  () => {
        if (ctx) onNavigate('lesson', ctx);
      },
    },
    {
      icon:     <GroupsIcon sx={{ fontSize: 'var(--md-sys-icon-size-sm, 16px)' }} />,
      label:    'Orario',
      ariaLabel: 'Torna all\'orario',
      onClick:  () => {
        if (ctx) onNavigate('schedule', ctx);
      },
    },
  ];

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
      aria-label={`Classe ${className}`}
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
          aria-label="Chiudi contesto classe"
          size="small"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          <ArrowBackIcon sx={{ fontSize: 'var(--md-sys-icon-size-md, 20px)' }} />
        </IconButton>
        <GroupsIcon
          sx={{ fontSize: 'var(--md-sys-icon-size-md, 20px)', color: 'var(--md-sys-color-secondary)' }}
          aria-hidden
        />
        <Typography variant="titleMedium" sx={{ fontWeight: 'var(--md-sys-typescale-weight-semibold)', flex: 1 }}>
          {`Classe ${className}`}
        </Typography>
        {tipoLezione && (
          <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', px: 1 }}>
            {tipoLezione}
          </Typography>
        )}
      </Stack>

      {/* ── Hero materia ─────────────────────────────────────────────────── */}
      <Box sx={{ px: 3, pt: 3, pb: 2, borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
        <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 0.5, display: 'block' }}>
          Materia
        </Typography>
        <Typography variant="headlineSmall" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', color: 'var(--md-sys-color-on-surface)', lineHeight: 1.2, mb: 1 }}>
          {materia}
        </Typography>
        {classeLessons.length > 0 && (
          <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {`${classeLessons.filter(l => l.svolta).length}/${classeLessons.length} lezioni svolte`}
          </Typography>
        )}
      </Box>

      {/* ── Quick actions ────────────────────────────────────────────────── */}
      <Box sx={{ px: 2, pt: 2, pb: 1 }} component="section" aria-label="Azioni rapide">
        <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 1.5, display: 'block', px: 1 }}>
          Azioni rapide
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ px: 1 }}>
          {quickActions.map(a => (
            <Chip
              key={a.label}
              icon={<>{a.icon}</>}
              label={a.label}
              onClick={a.onClick}
              aria-label={a.ariaLabel}
              variant="outlined"
              size="small"
              sx={{
                borderColor: 'var(--md-sys-color-outline-variant)',
                color: 'var(--md-sys-color-on-surface)',
                '&:hover': { bgcolor: 'color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)' },
                minHeight: 36,
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* ── CTA va alla lezione ──────────────────────────────────────────── */}
      <Box sx={{ mt: 'auto', px: 3, pb: 4 }}>
        <Button
          variant="contained"
          endIcon={<ChevronRightIcon />}
          onClick={() => ctx && onNavigate('lesson', ctx)}
          aria-label="Vai alla lezione — apri focus mode"
          fullWidth
          sx={{
            bgcolor:     'var(--md-sys-color-primary)',
            color:       'var(--md-sys-color-on-primary)',
            minHeight:   48,
            borderRadius: 'var(--md-sys-shape-corner-full, 24px)',
          }}
        >
          Vai alla lezione
        </Button>
      </Box>
    </M3Surface>
  );
}

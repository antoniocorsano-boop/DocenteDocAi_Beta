/**
 * LessonCard.tsx — Card presentazionale per Lezione.
 * Props: lesson: Lezione, onClick? — mostra materia, tipo, data, contenuto preview.
 * MD3 Gold Compliant.
 */
import React from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import M3Surface from '../ui/M3Surface';
import type { Lezione } from '../../types';

function tok(name: string) {
  return `var(--md-sys-color-${name})`;
}

const TIPO_ICON: Record<NonNullable<Lezione['tipoLezione']>, string> = {
  Teoria:       'auto_stories',
  Disegno:      'brush',
  Laboratorio:  'science',
  Test:         'quiz',
  Verifica:     'task_alt',
  Disposizione: 'manage_accounts',
  Ricevimento:  'support_agent',
};

const TIPO_COLOR: Record<
  NonNullable<Lezione['tipoLezione']>,
  { bg: string; fg: string }
> = {
  Teoria:       { bg: tok('primary-container'),      fg: tok('on-primary-container')      },
  Disegno:      { bg: tok('secondary-container'),    fg: tok('on-secondary-container')    },
  Laboratorio:  { bg: tok('tertiary-container'),     fg: tok('on-tertiary-container')     },
  Test:         { bg: tok('error-container'),        fg: tok('on-error-container')        },
  Verifica:     { bg: tok('error-container'),        fg: tok('on-error-container')        },
  Disposizione: { bg: tok('surface-container-high'), fg: tok('on-surface-variant')        },
  Ricevimento:  { bg: tok('surface-container-high'), fg: tok('on-surface-variant')        },
};

export interface LessonCardProps {
  lesson: Lezione;
  onClick?: () => void;
}

const LessonCard: React.FC<LessonCardProps> = ({ lesson, onClick }) => {
  const tipo = lesson.tipoLezione ?? 'Teoria';
  const col  = TIPO_COLOR[tipo];
  const icon = TIPO_ICON[tipo];

  const formattedDate = lesson.data
    ? new Date(lesson.data).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
      })
    : null;

  return (
    <M3Surface
      elevation={2}
      sx={{
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        overflow: 'hidden',
        border: `1px solid ${tok('outline-variant')}`,
      }}
    >
      <ButtonBase
        onClick={onClick}
        disabled={!onClick}
        focusRipple
        aria-label={`Lezione: ${lesson.contenuto}, materia ${lesson.materia}, classe ${lesson.classe}`}
        sx={{
          width:     '100%',
          textAlign: 'left',
          display:   'block',
          p:         'var(--md-sys-spacing-3)',
          '&:focus-visible': {
            outline:       `2px solid ${tok('primary')}`,
            outlineOffset: 2,
          },
        }}
      >
        {/* ── Header row ──────────────────────────────────────── */}
        <Box
          sx={{
            display:    'flex',
            alignItems: 'center',
            gap:        'var(--md-sys-spacing-2)',
            mb:         'var(--md-sys-spacing-2)',
          }}
        >
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{
              fontSize:             18,
              color:                tok('primary'),
              fontVariationSettings: '"FILL" 1',
              flexShrink:           0,
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="labelMedium"
            sx={{
              color:      tok('on-surface'),
              fontWeight: 'var(--md-sys-typescale-weight-semibold)',
              flex:       1,
            }}
          >
            {lesson.materia}
          </Typography>
          {formattedDate && (
            <Typography
              variant="labelSmall"
              sx={{ color: tok('on-surface-variant'), flexShrink: 0 }}
            >
              {formattedDate}
            </Typography>
          )}
        </Box>

        {/* ── Contenuto preview ───────────────────────────────── */}
        <Typography
          variant="bodySmall"
          sx={{
            color:              tok('on-surface-variant'),
            mb:                 'var(--md-sys-spacing-2)',
            display:            '-webkit-box',
            WebkitLineClamp:    2,
            WebkitBoxOrient:    'vertical',
            overflow:           'hidden',
          }}
        >
          {lesson.contenuto}
        </Typography>

        {/* ── Footer ──────────────────────────────────────────── */}
        <Box
          sx={{
            display:    'flex',
            alignItems: 'center',
            gap:        'var(--md-sys-spacing-2)',
            flexWrap:   'wrap',
          }}
        >
          <Chip
            label={tipo}
            size="small"
            sx={{
              bgcolor:  col.bg,
              color:    col.fg,
              fontSize: 'var(--md-sys-typescale-label-small-font-size)',
            }}
          />
          <Typography variant="labelSmall" sx={{ color: tok('on-surface-variant') }}>
            {lesson.classe}
          </Typography>
          {lesson.svolta && (
            <Box
              component="span"
              className="material-symbols-outlined"
              aria-label="Lezione svolta"
              sx={{
                fontSize:             14,
                color:                tok('primary'),
                ml:                   'auto',
                fontVariationSettings: '"FILL" 1',
              }}
            >
              check_circle
            </Box>
          )}
        </Box>
      </ButtonBase>
    </M3Surface>
  );
};

export default LessonCard;

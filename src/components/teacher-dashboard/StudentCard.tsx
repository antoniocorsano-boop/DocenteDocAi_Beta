/**
 * StudentCard.tsx — Card presentazionale per Studente.
 * Props: student, evaluations, showRisk? — nome/classe, performance badge, risk chip.
 * MD3 Gold Compliant.
 */
import React from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import M3Surface from '../ui/M3Surface';
import type { Studente, Valutazione } from '../../types';

function tok(name: string) {
  return `var(--md-sys-color-${name})`;
}

function computeAverage(evals: Valutazione[]): number | null {
  const voti = evals.map((v) => parseFloat(v.voto)).filter((n) => !isNaN(n));
  if (voti.length === 0) return null;
  return voti.reduce((a, b) => a + b, 0) / voti.length;
}

function performanceBadge(avg: number | null): {
  label: string;
  bg: string;
  fg: string;
} {
  if (avg === null)
    return {
      label: 'N/D',
      bg:    tok('surface-container-high'),
      fg:    tok('on-surface-variant'),
    };
  if (avg >= 8) return { label: 'Ottimo',      bg: tok('primary-container'),   fg: tok('on-primary-container')   };
  if (avg >= 7) return { label: 'Buono',       bg: tok('secondary-container'), fg: tok('on-secondary-container') };
  if (avg >= 6) return { label: 'Sufficiente', bg: tok('tertiary-container'),  fg: tok('on-tertiary-container')  };
  return            { label: 'A rischio',   bg: tok('error-container'),     fg: tok('on-error-container')     };
}

export interface StudentCardProps {
  student:     Studente;
  evaluations: Valutazione[];
  showRisk?:   boolean;
  onClick?:    () => void;
}

const StudentCard: React.FC<StudentCardProps> = ({
  student,
  evaluations,
  showRisk = false,
  onClick,
}) => {
  const studentEvals = evaluations.filter((e) => e.studenteId === student.id);
  const avg          = computeAverage(studentEvals);
  const badge        = performanceBadge(avg);
  const isAtRisk     = avg !== null && avg < 6;
  const initials     = `${student.nome[0] ?? '?'}${student.cognome[0] ?? '?'}`.toUpperCase();

  return (
    <M3Surface
      elevation={2}
      sx={{
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        overflow:     'hidden',
        border:       `1px solid ${
          isAtRisk && showRisk ? tok('error') : tok('outline-variant')
        }`,
      }}
    >
      <ButtonBase
        onClick={onClick}
        disabled={!onClick}
        focusRipple
        aria-label={`Studente: ${student.nome} ${student.cognome}, classe ${student.classe}`}
        sx={{
          width:     '100%',
          display:   'block',
          p:         'var(--md-sys-spacing-3)',
          textAlign: 'left',
          '&:focus-visible': {
            outline:       `2px solid ${tok('primary')}`,
            outlineOffset: 2,
          },
        }}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <Box
          sx={{
            display:    'flex',
            alignItems: 'center',
            gap:        'var(--md-sys-spacing-3)',
            mb:         'var(--md-sys-spacing-2)',
          }}
        >
          <Avatar
            aria-hidden
            sx={{
              bgcolor:    tok('primary-container'),
              color:      tok('on-primary-container'),
              width:      36,
              height:     36,
              fontSize:   'var(--md-sys-typescale-label-medium-font-size)',
              fontWeight: 'var(--md-sys-typescale-weight-semibold)',
              flexShrink: 0,
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="labelLarge"
              sx={{
                color:      tok('on-surface'),
                display:    'block',
                fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                overflow:   'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {student.cognome} {student.nome}
            </Typography>
            <Typography
              variant="labelSmall"
              sx={{ color: tok('on-surface-variant') }}
            >
              {student.classe}
            </Typography>
          </Box>
        </Box>

        {/* ── Chip row ────────────────────────────────────── */}
        <Box
          sx={{
            display:    'flex',
            gap:        'var(--md-sys-spacing-2)',
            flexWrap:   'wrap',
            alignItems: 'center',
          }}
        >
          {avg !== null && (
            <Chip
              label={`Media: ${avg.toFixed(1)}`}
              size="small"
              sx={{
                bgcolor:  badge.bg,
                color:    badge.fg,
                fontSize: 'var(--md-sys-typescale-label-small-font-size)',
              }}
            />
          )}
          <Chip
            label={badge.label}
            size="small"
            sx={{
              bgcolor:  badge.bg,
              color:    badge.fg,
              fontSize: 'var(--md-sys-typescale-label-small-font-size)',
            }}
          />
          {showRisk && isAtRisk && (
            <Chip
              label="Rischio"
              size="small"
              icon={
                <Box
                  component="span"
                  className="material-symbols-outlined"
                  aria-hidden
                  sx={{ fontSize: '14px !important' }}
                >
                  warning
                </Box>
              }
              sx={{
                bgcolor:  tok('error-container'),
                color:    tok('on-error-container'),
                fontSize: 'var(--md-sys-typescale-label-small-font-size)',
              }}
            />
          )}
          {student.hasBES && (
            <Chip
              label="BES"
              size="small"
              sx={{
                bgcolor:  tok('tertiary-container'),
                color:    tok('on-tertiary-container'),
                fontSize: 'var(--md-sys-typescale-label-small-font-size)',
              }}
            />
          )}
          {student.hasDSA && (
            <Chip
              label="DSA"
              size="small"
              sx={{
                bgcolor:  tok('secondary-container'),
                color:    tok('on-secondary-container'),
                fontSize: 'var(--md-sys-typescale-label-small-font-size)',
              }}
            />
          )}
          {student.has104 && (
            <Chip
              label="L.104"
              size="small"
              sx={{
                bgcolor:  tok('primary-container'),
                color:    tok('on-primary-container'),
                fontSize: 'var(--md-sys-typescale-label-small-font-size)',
              }}
            />
          )}
        </Box>
      </ButtonBase>
    </M3Surface>
  );
};

export default StudentCard;

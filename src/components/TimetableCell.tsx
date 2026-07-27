// MD3 GOLD COMPLIANT – Audit 2026-01-25
import React from 'react';
import { Lezione, Slot } from '../types';
import { LESSON_TYPE_ICONS } from '../constants';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';

interface TimetableCellProps {
    slot: Slot;
    lesson?: Lezione;
    onClick?: () => void;
}

const TimetableCell: React.FC<TimetableCellProps> = ({ slot, lesson, onClick }) => {
  const { classe, materia } = slot;

  const isDisposition = lesson?.tipoLezione === 'Disposizione' || materia === 'Disposizione';
  const isRicevimento = lesson?.tipoLezione === 'Ricevimento' || materia === 'Ricevimento';
  const hasContent = !!classe || isDisposition || isRicevimento;

  const isDone = lesson?.svolta;
  const hasAi = !!lesson?.externalLink;
  const typeIcon = lesson?.tipoLezione ? LESSON_TYPE_ICONS[lesson.tipoLezione] : (hasContent ? 'school' : null);

  const cellBase = {
    borderRadius: 'var(--md-sys-shape-corner-small)',
    p: 1,
    minHeight: 'var(--md-sys-layout-timetable-cell-min-height)',
    cursor: 'pointer',
    position: 'relative' as const,
    overflow: 'hidden',
    '&:focus-visible': { outline: '2px solid var(--md-sys-color-primary)', outlineOffset: 2 },
    '&:hover::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      backgroundColor: 'var(--md-sys-color-on-surface)',
      opacity: 0.08,
      pointerEvents: 'none',
    },
  } as const;

  if (!hasContent) {
    return (
      <ButtonBase
        onClick={onClick}
        aria-label={`Aggiungi lezione a ${slot.giorno} ${slot.ora}`}
        focusRipple
        sx={{
          ...cellBase,
          bgcolor: 'var(--md-sys-color-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <span
          className="material-symbols-outlined"
          aria-hidden="true"
          style={{ fontSize: 18, color: 'var(--md-sys-color-outline)', opacity: 0.5 }}
        >add_circle</span>
      </ButtonBase>
    );
  }

  const displayLabel = isDisposition ? 'DISP.' : (isRicevimento ? 'RICEV.' : classe);
  const displaySub   = isDisposition ? 'Sostituzione' : (isRicevimento ? 'Genitori' : materia);
  const bgColor = isDisposition
    ? 'var(--md-sys-color-tertiary-container)'
    : isRicevimento
      ? 'var(--md-sys-color-secondary-container)'
      : isDone
        ? 'var(--md-sys-color-surface-container)'
        : 'var(--md-sys-color-primary-container)';
  const onBgColor = isDisposition
    ? 'var(--md-sys-color-on-tertiary-container)'
    : isRicevimento
      ? 'var(--md-sys-color-on-secondary-container)'
      : isDone
        ? 'var(--md-sys-color-on-surface-variant)'
        : 'var(--md-sys-color-on-primary-container)';

  return (
    <ButtonBase
      onClick={onClick}
      aria-label={`${slot.giorno} ${slot.ora}${classe ? `, ${classe}` : ''}${materia ? ` — ${materia}` : ''}`}
      focusRipple
      sx={{
        ...cellBase,
        bgcolor: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 0.5,
        opacity: isDone ? 0.7 : 1,
        width: '100%',
      }}
    >
      {/* Top row: type icon + badges */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
        {typeIcon && (
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
            style={{ fontSize: 14, color: onBgColor, flexShrink: 0 }}
          >{typeIcon}</span>
        )}
        <Box sx={{ flex: 1 }} />
        {isDone && (
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
            title="Svolta"
            style={{ fontSize: 14, color: onBgColor }}
          >check_circle</span>
        )}
        {hasAi && (
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
            title="Materiale AI"
            style={{ fontSize: 14, color: onBgColor }}
          >auto_awesome</span>
        )}
      </Box>

      {/* Class label */}
      {displayLabel && (
        <Typography
          variant="caption"
          sx={{
            fontWeight: 'var(--md-sys-typescale-weight-bold)',
            color: onBgColor,
            lineHeight: 1.2,
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {displayLabel}
        </Typography>
      )}

      {/* Subject label */}
      {displaySub && (
        <Typography
          variant="caption"
          sx={{
            color: onBgColor,
            opacity: 0.8,
            lineHeight: 1.2,
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            // eslint-disable-next-line no-restricted-syntax -- sub-MD3-scale: 0.65rem intentional for compact timetable cell (no token below label-small)
            fontSize: '0.65rem',
          }}
        >
          {displaySub}
        </Typography>
      )}
    </ButtonBase>
  );
};

export default React.memo(TimetableCell);


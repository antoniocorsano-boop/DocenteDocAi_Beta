// MD3 Gold Compliant
// Card per eventi calendario con contrasto migliorato
// Audit: febbraio 2026

import React, { useState } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

interface CalendarEventCardProps {
  title: string;
  time?: string;
  type?: 'urgente' | 'scadenza' | 'riunione' | 'impegno' | 'altro';
  onClick?: (e: React.MouseEvent) => void;
  compact?: boolean;
}

export const CalendarEventCard: React.FC<CalendarEventCardProps> = ({
  title,
  time,
  type = 'altro',
  onClick,
  compact = false
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e as unknown as React.MouseEvent);
    }
  };

  const typeConfig = {
    urgente: {
      bg: 'var(--md-sys-color-error-container)',
      color: 'var(--md-sys-color-on-error-container)',
      icon: 'priority_high',
      borderColor: 'var(--md-sys-color-error)'
    },
    scadenza: {
      bg: 'var(--md-sys-color-tertiary-container)',
      color: 'var(--md-sys-color-on-tertiary-container)',
      icon: 'event',
      borderColor: 'var(--md-sys-color-tertiary)'
    },
    riunione: {
      bg: 'var(--md-sys-color-primary-container)',
      color: 'var(--md-sys-color-on-primary-container)',
      icon: 'groups',
      borderColor: 'var(--md-sys-color-primary)'
    },
    impegno: {
      bg: 'var(--md-sys-color-secondary-container)',
      color: 'var(--md-sys-color-on-secondary-container)',
      icon: 'task',
      borderColor: 'var(--md-sys-color-secondary)'
    },
    altro: {
      bg: 'var(--md-sys-color-surface-variant)',
      color: 'var(--md-sys-color-on-surface-variant)',
      icon: 'circle',
      borderColor: 'var(--md-sys-color-outline)'
    }
  };

  const config = typeConfig[type];

  // Accessibility: human-readable type label for screen readers
  const typeLabels: Record<string, string> = {
    urgente: 'Urgente',
    scadenza: 'Scadenza',
    riunione: 'Riunione',
    impegno: 'Impegno',
    altro: 'Evento',
  };
  const ariaLabel = `${typeLabels[type]}: ${title}${time ? `, ${time}` : ''}`;

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
        onKeyDown={handleKeyDown as React.KeyboardEventHandler<HTMLButtonElement>}
        aria-label={ariaLabel}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          padding: 'var(--md-sys-spacing-1) var(--md-sys-spacing-2)',
          background: config.bg,
          color: config.color,
          borderRadius: 'var(--md-sys-spacing-1)',
          border: `var(--md-sys-border-width-thick) solid transparent`,
          borderLeft: `var(--md-sys-border-width-thick) solid ${config.borderColor}`,
          fontSize: 'var(--md-sys-typescale-label-small-font-size)',
          fontWeight: 'var(--md-sys-typescale-weight-semibold)',
          cursor: 'pointer',
          transition: `all var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)`,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginBottom: 'var(--md-sys-spacing-1)',
          width: 'var(--md-sys-percent-100)',
          textAlign: 'left',
          outline: isFocused ? `var(--md-sys-border-width-thick) solid ${config.borderColor}` : 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateX(var(--md-sys-spacing-0-5))';
          e.currentTarget.style.boxShadow = 'var(--md-sys-elevation-level1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateX(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {title}
      </button>
    );
  }

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      sx={{
        padding: 'var(--md-sys-spacing-3)',
        bgcolor: config.bg,
        borderRadius: 'var(--md-sys-spacing-2)',
        borderLeft: `var(--md-sys-border-width-thick) solid ${config.borderColor}`,
        cursor: 'pointer',
        transition: 'all var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--md-sys-spacing-2)',
        outline: isFocused ? `var(--md-sys-border-width-thick) solid ${config.borderColor}` : 'none'
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
        e.currentTarget.style.transform = 'translateY(calc(-1 * var(--md-sys-spacing-0-5)))';
        e.currentTarget.style.boxShadow = 'var(--md-sys-elevation-level2)';
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {/* Icona tipo */}
      <span
        className="material-symbols-outlined"
        aria-hidden="true"
        style={{
          fontSize: 'var(--md-sys-typescale-title-small-font-size)',
          color: config.borderColor,
          fontVariationSettings: '"FILL" 1, "wght" 600' /* approved exception: Material Symbols axis, no MD3 token equivalent */
        }}
      >
        {config.icon}
      </span>

      {/* Contenuto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {time && (
          <Typography
            variant="caption"
            sx={{
              color: config.color,
              fontWeight: 'var(--md-sys-typescale-weight-semibold)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--md-sys-typescale-label-small-tracking)',
              marginBottom: 'var(--md-sys-spacing-1)'
            }}
          >
            {time}
          </Typography>
        )}
        <Typography
          variant="body2"
          sx={{
            color: config.color,
            fontWeight: 'var(--md-sys-typescale-weight-semibold)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {title}
        </Typography>
      </div>

      {/* Freccia indicatore */}
      <span
        className="material-symbols-outlined"
        aria-hidden="true"
        style={{
          fontSize: 'var(--md-sys-typescale-body-large-font-size)',
          color: config.color,
          opacity: 'var(--md-sys-state-opacity-icon-muted)' as unknown as number
        }}
      >
        arrow_forward_ios
      </span>
    </Paper>
  );
};

export default CalendarEventCard;

// MD3 Gold Compliant
// Component per stati vuoti con call-to-action
// Audit: febbraio 2026

import React from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  illustration
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--md-sys-spacing-8)',
        gap: 'var(--md-sys-spacing-4)',
        minHeight: 'var(--md-sys-spacing-14)',
        textAlign: 'center',
        borderRadius: 'var(--md-sys-shape-corner-large)',
        bgcolor: 'var(--md-sys-color-surface-container)',
        color: 'var(--md-sys-color-on-surface)',
      }}
    >
      {/* Icona grande o illustrazione custom */}
      {illustration || (
        <span
          className="material-symbols-outlined"
          aria-hidden="true"
          style={{
            fontSize: 'var(--icon-size-hero)',
            color: 'var(--md-sys-color-primary)',
            opacity: 'var(--md-sys-state-opacity-secondary)'
          }}
        >
          {icon}
        </span>
      )}
      
      {/* Titolo principale */}
      <Typography
        variant="h6"
        component="h3"
        sx={{
          color: 'var(--md-sys-color-on-surface)',
          fontWeight: 'var(--md-sys-typescale-weight-semibold)'
        }}
      >
        {title}
      </Typography>

      {/* Descrizione */}
      <Typography
        variant="body1"
        sx={{
          color: 'var(--md-sys-color-on-surface-variant)',
          maxWidth: '480px'
        }}
      >
        {description}
      </Typography>

      {/* Call to Action */}
      {actionLabel && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{ marginTop: 'var(--md-sys-spacing-2)' }}
        >
          {actionLabel}
        </Button>
      )}
    </Paper>
  );
};

export default EmptyState;

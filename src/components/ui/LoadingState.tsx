// MD3 Gold Compliant
// Component per stati di caricamento
// Audit: febbraio 2026

import React from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Caricamento...',
  size = 'medium'
}) => {
  const spinnerSize = {
    small: 'var(--md-sys-spacing-6)',
    medium: 'var(--md-sys-spacing-8)',
    large: 'var(--md-sys-spacing-10)'
  }[size];

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--md-sys-spacing-4)',
        padding: 'var(--md-sys-spacing-8)',
        bgcolor: 'var(--md-sys-color-surface)',
        color: 'var(--md-sys-color-on-surface)',
      }}
    >
      {/* Spinner MD3 compliant */}
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: 'var(--md-sys-border-width-thick) solid var(--md-sys-color-primary-container)',
          borderTopColor: 'var(--md-sys-color-primary)',
          borderRadius: 'var(--md-sys-shape-corner-full)',
          animation: 'spin 1s linear infinite'
        }}
        role="status"
        aria-label="Caricamento in corso"
      />
      
      {message && (
        <Typography
          variant="body2"
          sx={{
            color: 'var(--md-sys-color-on-surface-variant)',
            fontWeight: 'var(--md-sys-typescale-weight-medium)'
          }}
        >
          {message}
        </Typography>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Paper>
  );
};

export default LoadingState;

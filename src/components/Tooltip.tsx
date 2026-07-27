// MD3 Compliant — thin MUI Tooltip wrapper
// @mui-migrated Fase 2C
import React from 'react';
import MuiTooltip from '@mui/material/Tooltip';

interface TooltipProps {
  label: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ label, children, position = 'top' }) => (
  <MuiTooltip
    title={label}
    placement={position}
    arrow
    enterDelay={350}
    slotProps={{
      tooltip: {
        sx: {
          bgcolor: 'var(--md-sys-color-inverse-surface)',
          color: 'var(--md-sys-color-inverse-on-surface)',
          borderRadius: 'var(--md-sys-shape-corner-small)',
          px: 'var(--md-sys-spacing-4)',
          py: 'var(--md-sys-spacing-2)',
          boxShadow: 'var(--md-sys-elevation-level1)',
          fontSize: 'var(--md-sys-typescale-body-small-font-size)',
          fontWeight: 'var(--md-sys-typescale-weight-medium)',
          maxWidth: 'var(--md-sys-spacing-16)',
          wordWrap: 'break-word',
        },
      },
      arrow: {
        sx: { color: 'var(--md-sys-color-inverse-surface)' },
      },
    }}
  >
    {children}
  </MuiTooltip>
);

export default Tooltip;


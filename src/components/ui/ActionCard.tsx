// MD3 Gold Compliant
// Card per azioni rapide con icona e descrizione
// Audit: febbraio 2026

import React from 'react';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface ActionCardProps {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary';
  disabled?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  title,
  description,
  onClick,
  variant = 'primary',
  disabled = false
}) => {
  const variantConfig = {
    primary: {
      iconColor: 'var(--md-sys-color-primary)',
      hoverBg: 'var(--md-sys-color-primary-container)'
    },
    secondary: {
      iconColor: 'var(--md-sys-color-secondary)',
      hoverBg: 'var(--md-sys-color-secondary-container)'
    },
    tertiary: {
      iconColor: 'var(--md-sys-color-tertiary)',
      hoverBg: 'var(--md-sys-color-tertiary-container)'
    }
  };

  const config = variantConfig[variant];

  return (
    <Card
      onClick={disabled ? undefined : onClick}
      elevation={1}
      sx={{
        padding: 'var(--md-sys-spacing-4)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard)',
        opacity: disabled ? 'var(--md-sys-state-opacity-placeholder)' : undefined,
        border: `var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)`,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--md-sys-spacing-3)',
        minHeight: 'var(--md-sys-spacing-14)',
        bgcolor: 'var(--md-sys-color-surface-container-low)',
        borderRadius: 'var(--md-sys-shape-corner-large)',
        '&:hover': !disabled ? {
          backgroundColor: config.hoverBg,
          transform: 'translateY(calc(-1 * var(--md-sys-spacing-1)))',
          boxShadow: 'var(--md-sys-elevation-level3)',
        } : undefined,
      }}
    >
      {/* Icona */}
      <Box
        sx={{
          width: 'var(--md-sys-spacing-8)',
          height: 'var(--md-sys-spacing-8)',
          borderRadius: 'var(--md-sys-spacing-3)',
          background: `${config.iconColor}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{
            fontSize: 'var(--md-sys-spacing-6)',
            color: config.iconColor,
            fontVariationSettings: '"FILL" 0, "wght" 500',
          }}
        >
          {icon}
        </Box>
      </Box>

      {/* Testo */}
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{
            color: 'var(--md-sys-color-on-surface)',
            fontWeight: 'var(--md-sys-typescale-weight-semibold)',
            marginBottom: 'var(--md-sys-spacing-1)'
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'var(--md-sys-color-on-surface-variant)',
            lineHeight: '1.4'
          }}
        >
          {description}
        </Typography>
      </Box>

      {/* Indicatore freccia */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{
            fontSize: 'var(--md-sys-typescale-title-small-font-size)',
            color: config.iconColor,
            opacity: 'var(--md-sys-state-opacity-secondary)',
          }}
        >
          arrow_forward
        </Box>
      </Box>
    </Card>
  );
};

export default ActionCard;

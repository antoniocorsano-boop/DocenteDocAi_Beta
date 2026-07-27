// MD3 Gold Compliant
// Card per visualizzazione metriche con numeri grandi
// Audit: febbraio 2026

import React from 'react';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface MetricCardProps {
  value: number | string;
  label: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  value,
  label,
  icon,
  trend,
  trendValue,
  color = 'primary',
  onClick
}) => {
  const colorMap = {
    primary: 'var(--md-sys-color-primary)',
    secondary: 'var(--md-sys-color-secondary)',
    tertiary: 'var(--md-sys-color-tertiary)',
    success: 'var(--md-sys-color-tertiary)',
    warning: 'var(--md-sys-color-secondary)',
    error: 'var(--md-sys-color-error)'
  };

  const containerColorMap = {
    primary: 'var(--md-sys-color-primary-container)',
    secondary: 'var(--md-sys-color-secondary-container)',
    tertiary: 'var(--md-sys-color-tertiary-container)',
    success: 'var(--md-sys-color-tertiary-container)',
    warning: 'var(--md-sys-color-secondary-container)',
    error: 'var(--md-sys-color-error-container)'
  };

  return (
    <Card
      onClick={onClick}
      elevation={1}
      sx={{
        padding: 'var(--md-sys-spacing-4)',
        flex: '1',
        minWidth: 'var(--md-sys-spacing-14)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform var(--md-sys-motion-duration-short4), box-shadow var(--md-sys-motion-duration-short4)',
        border: `var(--md-sys-border-width-thin) solid ${containerColorMap[color]}`,
        bgcolor: 'var(--md-sys-color-surface-container-low)',
        borderRadius: 'var(--md-sys-shape-corner-large)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--md-sys-spacing-2)',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        {/* Icona opzionale */}
        {icon && (
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
            style={{
              fontSize: 'var(--icon-size-medium)',
              color: colorMap[color],
              marginBottom: 'var(--md-sys-spacing-1)'
            }}
          >
            {icon}
          </span>
        )}
        
        {/* Valore principale */}
        <Typography
          variant="h3"
          sx={{
            color: colorMap[color],
            fontWeight: 'var(--md-sys-typescale-weight-bold)',
            fontSize: 'var(--md-sys-typescale-display-medium-font-size)',
            lineHeight: 'var(--md-sys-typescale-display-medium-line-height)'
          }}
        >
          {value}
        </Typography>
        
        {/* Label */}
        <Typography
          variant="button"
          sx={{
            color: 'var(--md-sys-color-on-surface)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--md-sys-typescale-metric-label-tracking)',
            fontWeight: 'var(--md-sys-typescale-weight-semibold)'
          }}
        >
          {label}
        </Typography>
        
        {/* Trend opzionale */}
        {trend && trendValue && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--md-sys-spacing-1)',
              padding: 'var(--md-sys-spacing-1) var(--md-sys-spacing-2)',
              borderRadius: 'var(--md-sys-spacing-4)',
              background: trend === 'up' 
                ? 'color-mix(in srgb, var(--md-sys-color-tertiary) 12%, transparent)' 
                : trend === 'down' 
                ? 'color-mix(in srgb, var(--md-sys-color-error) 12%, transparent)' 
                : 'var(--md-sys-color-surface-variant)',
              marginTop: 'var(--md-sys-spacing-1)'
            }}
          >
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
              style={{
                fontSize: 'var(--md-sys-spacing-3)',
                color: trend === 'up' ? 'var(--md-sys-color-tertiary)' : trend === 'down' ? 'var(--md-sys-color-error)' : 'inherit'
              }}
            >
              {trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'remove'}
            </span>
            <Typography
              variant="caption"
              sx={{
                color: trend === 'up' ? 'var(--md-sys-color-tertiary)' : trend === 'down' ? 'var(--md-sys-color-error)' : 'inherit',
                fontWeight: 'var(--md-sys-typescale-weight-semibold)'
              }}
            >
              {trendValue}
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default MetricCard;

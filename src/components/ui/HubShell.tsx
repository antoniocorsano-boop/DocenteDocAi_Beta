// MD3 Gold Compliant
// Reusable shell for Hub/Dashboard views (Phase 4 consolidation)
// Provides consistent header + contextual AI teaser + content area

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ContextualAskAI from './ContextualAskAI';
import { View, NavigationParams } from '../../types';

interface HubShellProps {
  title: string;
  subtitle?: string;
  icon?: string;
  onNavigate: (view: View, context?: NavigationParams) => void;
  aiContext?: NavigationParams;
  children: React.ReactNode;
  /** Optional max width override */
  maxWidth?: string;
}

const HubShell: React.FC<HubShellProps> = ({
  title,
  subtitle,
  icon = 'dashboard',
  onNavigate,
  aiContext,
  children,
  maxWidth = 'var(--md-sys-layout-content-max-width)',
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--md-sys-spacing-4)',
        px: 'var(--md-sys-spacing-4)',
        pb: 'var(--md-sys-spacing-10)',
        boxSizing: 'border-box',
        maxWidth,
        mx: 'auto',
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 'var(--md-sys-spacing-2)' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--md-sys-spacing-2)',
            mb: 'var(--md-sys-spacing-1)',
          }}
        >
          {icon && (
            <Box
              component="span"
              className="material-symbols-outlined"
              sx={{ fontSize: 28, color: 'var(--md-sys-color-primary)' }}
            >
              {icon}
            </Box>
          )}
          <Typography variant="h5" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
            {title}
          </Typography>
        </Box>
        {subtitle && (
          <Typography
            variant="body1"
            sx={{ color: 'var(--md-sys-color-on-surface-variant)', maxWidth: 640, mx: 'auto' }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Contextual AI Teaser (standardized Phase 4 pattern) */}
      <ContextualAskAI
        onNavigate={onNavigate}
        context={aiContext}
        fullWidth
      />

      {/* Main content */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-5)' }}>
        {children}
      </Box>
    </Box>
  );
};

export default HubShell;
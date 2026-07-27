import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { TypographyProps } from '@mui/material/Typography';
import { M3ThemeProvider } from './theme/theme';

function mapM3Variant(variant: string): TypographyProps['variant'] {
  const map: Record<string, TypographyProps['variant']> = {
    'display-large': 'h1', 'display-medium': 'h2', 'display-small': 'h3',
    'headline-large': 'h4', 'headline-medium': 'h5', 'headline-small': 'h6',
    'title-large': 'subtitle1', 'title-medium': 'subtitle2', 'title-small': 'subtitle2',
    'body-large': 'body1', 'body-medium': 'body2', 'body-small': 'body2',
    'label-large': 'button', 'label-medium': 'caption', 'label-small': 'caption',
  };
  return map[variant] ?? 'body2';
}

// Helper per renderizzare componenti con M3ThemeProvider
const renderWithM3Theme = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>): ReturnType<typeof render> =>
  render(ui, { wrapper: M3ThemeProvider, ...options });

// Wrapper per test con surface MD3
const TestSurfaceWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <M3ThemeProvider>
    <Paper 
      elevation={0}
      role="region"
      aria-label="Test container"
    >
      {children}
    </Paper>
  </M3ThemeProvider>
);

// Helper per renderizzare con surface MD3 completa
const renderWithM3Surface = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>): ReturnType<typeof render> =>
  render(ui, { wrapper: TestSurfaceWrapper, ...options });

// Helper per test con tipografia MD3
const renderWithM3Typography = (text: string, variant: string = 'body-medium'): ReturnType<typeof render> =>
  renderWithM3Theme(
    <Typography 
      variant={mapM3Variant(variant)}
      role="text"
      aria-label={`Test text: ${text}`}
    >
      {text}
    </Typography>
  );

// Mock per stati di loading durante i test
const TestLoadingSkeleton: React.FC = () => (
  <Paper elevation={0} aria-label="Loading content">
    <Typography variant="body2" aria-live="polite">
      Loading test content...
    </Typography>
  </Paper>
);

// Mock per stati di errore durante i test
const TestErrorState: React.FC<{ message?: string }> = ({ message = 'Test error occurred' }) => (
  <Paper 
    elevation={0}
    role="alert"
    aria-label="Test error state"
  >
    <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-error-container)' }}>
      {message}
    </Typography>
  </Paper>
);

// Mock per stati vuoti durante i test
const TestEmptyState: React.FC<{ message?: string }> = ({ message = 'No test data available' }) => (
  <Paper 
    elevation={0}
    role="status"
    aria-label="Empty test state"
  >
    <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
      {message}
    </Typography>
  </Paper>
);

export { 
  render,
  renderWithM3Theme,
  renderWithM3Surface,
  renderWithM3Typography,
  TestLoadingSkeleton,
  TestErrorState,
  TestEmptyState
};

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { tokenLayers, TokenLayers } from './tokens';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { logger } from '../utils/logger';

// Type for preset overrides (partial token layers)
export type PresetOverrides = Partial<TokenLayers>;

// Type for the theme context
export interface Theme {
  layers: TokenLayers;
  overrides: PresetOverrides;
  updateOverrides: (newOverrides: PresetOverrides) => void;
  resetOverrides: () => void;
  verifyOverridesApplied: () => boolean;
  verifyResetState: () => boolean;
}

// Create the context
const ThemeContext = createContext<Theme | undefined>(undefined);

// Hook to use the theme
export const useM3Theme = (): Theme => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useM3Theme must be used within a M3ThemeProvider');
  }
  return context;
};

// M3ThemeProvider component
interface M3ThemeProviderProps {
  children: ReactNode;
}

// Loading skeleton component
const ThemeSkeleton: React.FC = () => (
  <Paper
    role="progressbar"
    aria-label="Loading theme configuration"
    sx={{
      width: '100%',
      height: 'var(--md-sys-viewport-height-full)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Typography variant="body1" aria-live="polite">
      Loading theme...
    </Typography>
  </Paper>
);

// Error state component
const ThemeError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <Paper
    role="alert"
    aria-labelledby="theme-error-title"
    sx={{
      width: '100%',
      height: 'var(--md-sys-viewport-height-full)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    }}
  >
    <Typography
      variant="h6"
      id="theme-error-title"
      color="error"
    >
      Theme Loading Error
    </Typography>
    <Typography
      variant="body2"
      color="error"
      sx={{ textAlign: 'center' }}
    >
      Failed to load theme configuration. Please try again.
    </Typography>
    <Button
      onClick={onRetry}
      variant="contained"
      aria-label="Retry loading theme configuration"
      sx={{ borderRadius: 'var(--md-sys-shape-corner-small)' }}
    >
      Retry
    </Button>
  </Paper>
);

const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

export const M3ThemeProvider: React.FC<M3ThemeProviderProps> = ({ children }) => {
  const [overrides, setOverrides] = useState<PresetOverrides>({});
  const [isLoading, setIsLoading] = useState(!isTest);
  const [hasError, setHasError] = useState(false);

  // Load overrides from localStorage on mount
  useEffect(() => {
    if (isTest) return; // skip async loading in test environment
    const loadTheme = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        const savedOverrides = localStorage.getItem('m3-theme-overrides');
        if (savedOverrides) {
          const parsed = JSON.parse(savedOverrides);
          setOverrides(parsed);
        }
        
      } catch (error) {
        logger.warn('Failed to parse theme overrides from localStorage', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Save overrides to localStorage
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('m3-theme-overrides', JSON.stringify(overrides));
      } catch (error) {
        logger.error('Failed to save theme overrides to localStorage', error);
      }
    }
  }, [overrides, isLoading]);

  // Function to update overrides safely using token layers
  const updateOverrides = (newOverrides: PresetOverrides) => {
    setOverrides(prev => ({ ...prev, ...newOverrides }));
  };

  // Function to reset overrides, returning to default sys layer
  const resetOverrides = () => {
    setOverrides({});
  };

  // Function to merge token layers with overrides
  const mergeLayers = <T extends Record<string, unknown>>(base: T, override?: Partial<T>): T => {
    if (!override) return base;
    const merged = { ...base } as T;
    Object.keys(override).forEach(key => {
      if (override[key] !== undefined) {
        if (typeof override[key] === 'object' && override[key] !== null && typeof merged[key] === 'object' && merged[key] !== null) {
          (merged as Record<string, unknown>)[key] = { ...(merged as Record<string, unknown>)[key] as Record<string, unknown>, ...(override as Record<string, unknown>)[key] as Record<string, unknown> };
        } else {
          (merged as Record<string, unknown>)[key] = override[key];
        }
      }
    });
    return merged;
  };

  // Merged layers with overrides applied
  const layers: TokenLayers = {
    sys: mergeLayers(tokenLayers.sys, overrides.sys),
    ref: mergeLayers(tokenLayers.ref, overrides.ref),
    comp: mergeLayers(tokenLayers.comp, overrides.comp),
    motion: mergeLayers(tokenLayers.motion, overrides.motion),
    elevation: mergeLayers(tokenLayers.elevation, overrides.elevation),
  };

  // Verification function: Confirms all applied overrides exist in tokens.ts layers
  const verifyOverridesApplied = (): boolean => {
    const checkLayer = <T extends Record<string, unknown>>(base: T, override?: Partial<T>): boolean => {
      if (!override) return true;
      return Object.keys(override).every(key => key in base);
    };

    return (
      checkLayer(tokenLayers.sys, overrides.sys) &&
      checkLayer(tokenLayers.ref, overrides.ref) &&
      checkLayer(tokenLayers.comp, overrides.comp) &&
      checkLayer(tokenLayers.motion, overrides.motion) &&
      checkLayer(tokenLayers.elevation, overrides.elevation)
    );
  };

  // Verification function: Confirms resetOverrides restores default token values
  const verifyResetState = (): boolean => {
    const defaultLayers: TokenLayers = {
      sys: tokenLayers.sys,
      ref: tokenLayers.ref,
      comp: tokenLayers.comp,
      motion: tokenLayers.motion,
      elevation: tokenLayers.elevation,
    };

    const isEqual = (a: unknown, b: unknown): boolean => {
      if (typeof a !== typeof b) return false;
      if (typeof a === 'object' && a !== null && b !== null) {
        const keysA = Object.keys(a as Record<string, unknown>);
        const keysB = Object.keys(b as Record<string, unknown>);
        if (keysA.length !== keysB.length) return false;
          return keysA.every(key => isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
      }
      return a === b;
    };

    return isEqual(layers, defaultLayers);
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    // Trigger reload
    window.location.reload();
  };

  if (isLoading) {
    return <ThemeSkeleton />;
  }

  if (hasError) {
    return <ThemeError onRetry={handleRetry} />;
  }

  const theme: Theme = {
    layers,
    overrides,
    updateOverrides,
    resetOverrides,
    verifyOverridesApplied,
    verifyResetState,
  };

  return (
    <ThemeContext.Provider value={theme}>
      <Paper
        role="main"
        aria-label="DocenteDoc AI application theme provider"
        sx={{ minHeight: 'var(--md-sys-viewport-height-full)', width: '100%' }}
      >
        {children}
      </Paper>
    </ThemeContext.Provider>
  );
};

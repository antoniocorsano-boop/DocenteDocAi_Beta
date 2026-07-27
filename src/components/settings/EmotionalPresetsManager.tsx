// MD3 Compliant

// MD3 Migration: Partially migrated - replaced border with --md-sys-border-width-thick token
// Still uses legacy useTheme system - requires full migration to inline MD3 tokens
// Functional exception: grid minmax(calc(var(--md-sys-spacing-20) * 3.125), 1fr) for responsive card layout
import React, { useState, useEffect } from 'react';
import { useM3Theme, PresetOverrides } from '../../theme/theme';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { EmotionalPreset } from '../../types';

interface EmotionalPresetsManagerProps {
  selectedPreset: EmotionalPreset | null;
  onPresetChange: (preset: EmotionalPreset) => void;
}

const presets: Record<EmotionalPreset, { name: string; description: string; overrides: PresetOverrides } | undefined> = {
  calm: {
    name: 'Calm',
    description: 'Soft colors, generous spacing, slow motion, gentle typography for relaxation.',
    overrides: {
      sys: {
        colors: {
          primary: 'var(--md-sys-color-primary)',
          onPrimary: 'var(--md-sys-color-on-primary)',
          secondary: 'var(--md-sys-color-secondary)',
          onSecondary: 'var(--md-sys-color-on-secondary)',
          tertiary: 'var(--md-sys-color-tertiary)',
          onTertiary: 'var(--md-sys-color-on-tertiary)',
          surface: 'var(--md-sys-color-surface)',
          onSurface: 'var(--md-sys-color-on-surface)',
          background: 'var(--md-sys-color-background)',
          onBackground: 'var(--md-sys-color-on-background)',
          secondaryContainer: 'var(--md-sys-color-secondary-container)',
          onSecondaryContainer: 'var(--md-sys-color-on-secondary-container)',
          outline: 'var(--md-sys-color-outline)',
          surfaceContainerLow: 'var(--md-sys-color-surface-container-low)',
          surfaceContainerHigh: 'var(--md-sys-color-surface-container-high)',
          outlineVariant: 'var(--md-sys-color-outline-variant)',
          error: 'var(--md-sys-color-error)',
          onError: 'var(--md-sys-color-on-error)',
          errorContainer: 'var(--md-sys-color-error-container)',
          onErrorContainer: 'var(--md-sys-color-on-error-container)',
          primaryContainer: 'var(--md-sys-color-primary-container)',
          onPrimaryContainer: 'var(--md-sys-color-on-primary-container)',
          primaryHover: 'var(--md-sys-color-primary)',
          scrim: 'var(--md-sys-color-scrim)',
          surfaceVariant: 'var(--md-sys-color-surface-variant)',
          onSurfaceVariant: 'var(--md-sys-color-on-surface-variant)'
        },
      }
    },
  },
  energetic: {
    name: 'Energetic',
    description: 'Vibrant colors, tight spacing, fast motion, bold typography for an exciting vibe.',
    overrides: {
      sys: {
        colors: {
          primary: 'ff5722',
          onPrimary: 'ffffff',
          secondary: '03dac6',
          onSecondary: '000000',
          tertiary: '3700b3',
          onTertiary: 'ffffff',
          surface: 'ffffff',
          onSurface: '000000',
          background: 'f5f5f5',
          onBackground: '000000',
          secondaryContainer: 'e0f7fa',
          onSecondaryContainer: '000000',
          outline: 'bdbdbd',
          surfaceContainerLow: 'f5f5f5',
          surfaceContainerHigh: 'var(--md-sys-color-surface-container-high)',
          outlineVariant: 'var(--md-sys-color-outline-variant)',
          error: 'var(--md-sys-color-error)',
          onError: 'var(--md-sys-color-on-error)',
          errorContainer: 'var(--md-sys-color-error-container)',
          onErrorContainer: 'var(--md-sys-color-on-error-container)',
          primaryContainer: 'var(--md-sys-color-primary-container)',
          onPrimaryContainer: 'var(--md-sys-color-on-primary-container)',
          primaryHover: 'var(--md-sys-color-primary)',
          scrim: 'var(--md-sys-color-scrim)',
          surfaceVariant: 'var(--md-sys-color-surface-variant)',
          onSurfaceVariant: 'var(--md-sys-color-on-surface-variant)'
        },
      }
    },
  },
  creative: {
    name: 'Creative',
    description: 'Colorful and spacious for creativity.',
    overrides: {
      sys: {
        colors: {
          primary: 'var(--md-sys-color-tertiary)',
          onPrimary: 'var(--md-sys-color-on-tertiary)',
          secondary: 'var(--md-sys-color-secondary)',
          onSecondary: 'var(--md-sys-color-on-secondary)',
          tertiary: 'var(--md-sys-color-primary)',
          onTertiary: 'var(--md-sys-color-on-primary)',
          surface: 'var(--md-sys-color-surface)',
          onSurface: 'var(--md-sys-color-on-surface)',
          background: 'var(--md-sys-color-background)',
          onBackground: 'var(--md-sys-color-on-background)',
          secondaryContainer: 'var(--md-sys-color-secondary-container)',
          onSecondaryContainer: 'var(--md-sys-color-on-secondary-container)',
          outline: 'var(--md-sys-color-outline)',
          surfaceContainerLow: 'var(--md-sys-color-surface-container-low)',
          surfaceContainerHigh: 'var(--md-sys-color-surface-container-high)',
          outlineVariant: 'var(--md-sys-color-outline-variant)',
          error: 'var(--md-sys-color-error)',
          onError: 'var(--md-sys-color-on-error)',
          errorContainer: 'var(--md-sys-color-error-container)',
          onErrorContainer: 'var(--md-sys-color-on-error-container)',
          primaryContainer: 'var(--md-sys-color-tertiary-container)',
          onPrimaryContainer: 'var(--md-sys-color-on-tertiary-container)',
          primaryHover: 'var(--md-sys-color-tertiary)',
          scrim: 'var(--md-sys-color-scrim)',
          surfaceVariant: 'var(--md-sys-color-surface-variant)',
          onSurfaceVariant: 'var(--md-sys-color-on-surface-variant)'
        },
      }
    },
  },
  focused: {
    name: 'Focused',
    description: 'Neutral colors, standard spacing, clear typography for concentration.',
    overrides: {
      sys: {
        colors: {
          primary: 'var(--md-sys-color-primary)',
          onPrimary: 'var(--md-sys-color-on-primary)',
          secondary: 'var(--md-sys-color-secondary)',
          onSecondary: 'var(--md-sys-color-on-secondary)',
          tertiary: 'var(--md-sys-color-tertiary)',
          onTertiary: 'var(--md-sys-color-on-tertiary)',
          surface: 'var(--md-sys-color-surface)',
          onSurface: 'var(--md-sys-color-on-surface)',
          background: 'var(--md-sys-color-background)',
          onBackground: 'var(--md-sys-color-on-background)',
          secondaryContainer: 'var(--md-sys-color-secondary-container)',
          onSecondaryContainer: 'var(--md-sys-color-on-secondary-container)',
          outline: 'var(--md-sys-color-outline)',
          surfaceContainerLow: 'var(--md-sys-color-surface-container-low)',
          surfaceContainerHigh: 'var(--md-sys-color-surface-container-high)',
          outlineVariant: 'var(--md-sys-color-outline-variant)',
          error: 'var(--md-sys-color-error)',
          onError: 'var(--md-sys-color-on-error)',
          errorContainer: 'var(--md-sys-color-error-container)',
          onErrorContainer: 'var(--md-sys-color-on-error-container)',
          primaryContainer: 'var(--md-sys-color-primary-container)',
          onPrimaryContainer: 'var(--md-sys-color-on-primary-container)',
          primaryHover: 'var(--md-sys-color-primary)',
          scrim: 'var(--md-sys-color-scrim)',
          surfaceVariant: 'var(--md-sys-color-surface-variant)',
          onSurfaceVariant: 'var(--md-sys-color-on-surface-variant)'
        },
      }
    },
  },
  relaxed: {
    name: 'Relaxed',
    description: 'Soft colors, generous spacing, light typography for calm.',
    overrides: {
      sys: {
        colors: {
          primary: '#8bc34a',
          onPrimary: '#000000',
          secondary: '#009688',
          onSecondary: '#ffffff',
          tertiary: '#795548',
          onTertiary: '#ffffff',
          surface: '#ffffff',
          onSurface: '#000000',
          background: '#e8f5e8',
          onBackground: '#000000',
          secondaryContainer: '#e0f2f1',
          onSecondaryContainer: '#000000',
          outline: '#c8e6c9',
          surfaceContainerLow: '#e8f5e8',
          surfaceContainerHigh: '#c8e6c9',
          outlineVariant: '#a5d6a7',
          error: '#d32f2f',
          onError: '#ffffff',
          errorContainer: '#ffcdd2',
          onErrorContainer: '#000000',
          primaryContainer: '#e8f5e8',
          onPrimaryContainer: '#000000',
          primaryHover: '#689f38',
          scrim: '#000000',
          surfaceVariant: '#e8f5e8',
          onSurfaceVariant: '#000000'
        },
      }
    },
  },
  professional: {
    name: 'Professional',
    description: 'Conservative colors, balanced spacing, formal typography for business.',
    overrides: {
      sys: {
        colors: {
          primary: '#212121',
          onPrimary: '#ffffff',
          secondary: '#757575',
          onSecondary: '#ffffff',
          tertiary: '#424242',
          onTertiary: '#ffffff',
          surface: '#ffffff',
          onSurface: '#000000',
          background: '#fafafa',
          onBackground: '#000000',
          secondaryContainer: '#f5f5f5',
          onSecondaryContainer: '#000000',
          outline: '#bdbdbd',
          surfaceContainerLow: '#fafafa',
          surfaceContainerHigh: '#f0f0f0',
          outlineVariant: '#9e9e9e',
          error: '#d32f2f',
          onError: '#ffffff',
          errorContainer: '#ffcdd2',
          onErrorContainer: '#000000',
          primaryContainer: '#e0e0e0',
          onPrimaryContainer: '#000000',
          primaryHover: '#000000',
          scrim: '#000000',
          surfaceVariant: '#f5f5f5',
          onSurfaceVariant: '#000000'
        },
      }
    },
  },
  playful: {
    name: 'Playful',
    description: 'Bright colors, varied spacing, fun typography for enjoyment.',
    overrides: {
      sys: {
        colors: {
          primary: '#ff4081',
          onPrimary: '#ffffff',
          secondary: '#ffeb3b',
          onSecondary: '#000000',
          tertiary: '#e91e63',
          onTertiary: '#ffffff',
          surface: '#ffffff',
          onSurface: '#000000',
          background: '#fce4ec',
          onBackground: '#000000',
          secondaryContainer: '#fffde7',
          onSecondaryContainer: '#000000',
          outline: '#f8bbd9',
          surfaceContainerLow: '#fce4ec',
          surfaceContainerHigh: '#f8bbd9',
          outlineVariant: '#f06292',
          error: '#d32f2f',
          onError: '#ffffff',
          errorContainer: '#ffcdd2',
          onErrorContainer: '#000000',
          primaryContainer: '#fce4ec',
          onPrimaryContainer: '#000000',
          primaryHover: '#e91e63',
          scrim: '#000000',
          surfaceVariant: '#fce4ec',
          onSurfaceVariant: '#000000'
        },
      }
    },
  },
  minimal: {
    name: 'Minimal',
    description: 'Monochrome colors, minimal spacing, simple typography for clarity.',
    overrides: {
      sys: {
        colors: {
          primary: '#000000',
          onPrimary: '#ffffff',
          secondary: '#ffffff',
          onSecondary: '#000000',
          tertiary: '#f5f5f5',
          onTertiary: '#000000',
          surface: '#ffffff',
          onSurface: '#000000',
          background: '#ffffff',
          onBackground: '#000000',
          secondaryContainer: '#f5f5f5',
          onSecondaryContainer: '#000000',
          outline: '#e0e0e0',
          surfaceContainerLow: '#ffffff',
          surfaceContainerHigh: '#f5f5f5',
          outlineVariant: '#bdbdbd',
          error: '#d32f2f',
          onError: '#ffffff',
          errorContainer: '#ffcdd2',
          onErrorContainer: '#000000',
          primaryContainer: '#f5f5f5',
          onPrimaryContainer: '#000000',
          primaryHover: '#333333',
          scrim: '#000000',
          surfaceVariant: '#f5f5f5',
          onSurfaceVariant: '#000000'
        },
      }
    },
  }
};

const EmotionalPresetsManager: React.FC<EmotionalPresetsManagerProps> = ({ selectedPreset, onPresetChange }) => {
  const { updateOverrides, resetOverrides } = useM3Theme();
  const [hoveredPreset, setHoveredPreset] = useState<EmotionalPreset | null>(null);

  useEffect(() => {
    const activePreset = hoveredPreset || selectedPreset;
    if (activePreset && presets[activePreset]) {
      updateOverrides(presets[activePreset]!.overrides);
    } else {
      resetOverrides();
    }
  }, [hoveredPreset, selectedPreset, updateOverrides, resetOverrides]);

  const handleSelect = (preset: EmotionalPreset) => {
    onPresetChange(preset);
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--md-sys-color-surface)',
        padding: 'var(--md-sys-spacing-4)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(calc(var(--md-sys-spacing-20) * 3.125), var(--md-sys-grid-fr-1)))',
        gap: 'var(--md-sys-spacing-4)'
      }}
    >
      {(Object.keys(presets) as EmotionalPreset[]).map((presetKey) => {
        const preset = presets[presetKey];
        if (!preset) return null;
        const isSelected = selectedPreset === presetKey;
        const isHovered = hoveredPreset === presetKey;
        return (
          <Card
            key={presetKey}
            sx={{
              padding: 'var(--md-sys-spacing-4)',
              cursor: 'pointer',
              border: isSelected ? `var(--md-sys-border-width-thick) solid var(--md-sys-color-primary)` : 'none',
              opacity: isHovered ? 0.8 : 1,
              backgroundColor: 'var(--md-sys-color-surface-container-low)',
              boxShadow: isSelected ? 'var(--md-sys-elevation-level2)' : 'var(--md-sys-elevation-level1)'
            }}
            onMouseEnter={() => setHoveredPreset(presetKey)}
            onMouseLeave={() => setHoveredPreset(null)}
            onClick={() => handleSelect(presetKey)}
            aria-selected={isSelected}
          >
            <Typography variant="subtitle1" sx={{ marginBottom: 'var(--md-sys-spacing-2)', color: 'var(--md-sys-color-on-surface)' }}>
              {preset.name}
            </Typography>
            <Typography variant="body2" sx={{ marginBottom: 'var(--md-sys-spacing-3)', color: 'var(--md-sys-color-on-surface)' }}>
              {preset.description}
            </Typography>
            {isSelected ? (
              <Typography variant="body1" sx={{ color: 'var(--md-sys-color-primary)' }}>
                Selected
              </Typography>
            ) : (
              <Button variant="outlined" sx={{ color: 'var(--md-sys-color-primary)' }}>
                Select
              </Button>
            )}
          </Card>
        );
      })}
    </div>
  );
}

export default EmotionalPresetsManager;


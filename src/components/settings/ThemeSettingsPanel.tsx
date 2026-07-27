// MD3 Gold Compliant
import React from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

interface ThemeSettingsPanelProps {
  onClose?: () => void;
}

export const ThemeSettingsPanel: React.FC<ThemeSettingsPanelProps> = ({ onClose }) => {
  return (
    <Paper
      elevation={2}
      sx={{
        padding: 'var(--md-sys-spacing-4)',
        maxWidth: 'var(--md-sys-layout-panel-max-width)',
        margin: `0 var(--md-sys-margin-auto)`,
      }}
    >
      <Typography variant="h6" sx={{ marginBottom: 'var(--md-sys-spacing-4)', color: 'var(--md-sys-color-on-surface)' }}>
        Theme Settings
      </Typography>

      {/* Dark Mode note */}
      <Paper
        elevation={1}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--md-sys-spacing-3)',
          padding: 'var(--md-sys-spacing-4)',
          marginBottom: 'var(--md-sys-spacing-6)',
        }}
      >
        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'var(--md-sys-typescale-body-large-font-size)' }}>brightness_auto</Box>
        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', margin: 0 }}>
          Dark Mode — tema gestito dal sistema operativo (MD3 Compliant)
        </Typography>
      </Paper>

      {/* Color Overrides */}
      <Typography variant="h6" sx={{ marginBottom: 'var(--md-sys-spacing-2)', color: 'var(--md-sys-color-on-surface)' }}>
        Color Overrides (MD3 System Colors)
      </Typography>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(var(--md-sys-layout-grid-min-wide), var(--md-sys-grid-fr-1)))',
        gap: 'var(--md-sys-spacing-2)',
        marginBottom: 'var(--md-sys-spacing-6)',
      }}>
        {[
          { key: 'primary',    label: 'Primary',    value: 'var(--md-sys-color-primary)' },
          { key: 'secondary',  label: 'Secondary',  value: 'var(--md-sys-color-secondary)' },
          { key: 'tertiary',   label: 'Tertiary',   value: 'var(--md-sys-color-tertiary)' },
          { key: 'error',      label: 'Error',      value: 'var(--md-sys-color-error)' },
          { key: 'surface',    label: 'Surface',    value: 'var(--md-sys-color-surface)' },
          { key: 'background', label: 'Background', value: 'var(--md-sys-color-background)' },
        ].map(({ key, label, value }) => (
          <Paper key={key} elevation={1} sx={{ padding: 'var(--md-sys-spacing-2)' }}>
            <Typography variant="overline" component="span" sx={{ display: 'block', marginBottom: 'var(--md-sys-spacing-1)', color: 'var(--md-sys-color-on-surface)' }}>{label}</Typography>
            <div style={{
              width: 'var(--md-sys-percent-100)',
              height: 'var(--md-sys-spacing-6)',
              backgroundColor: value,
              border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
              borderRadius: 'var(--md-sys-shape-corner-small)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface)' }}>{value}</Typography>
            </div>
          </Paper>
        ))}
      </div>

      {/* Typography Scale */}
      <Typography variant="h6" sx={{ marginBottom: 'var(--md-sys-spacing-2)', color: 'var(--md-sys-color-on-surface)' }}>
        Typography Scale (MD3 System)
      </Typography>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(var(--md-sys-layout-grid-min-wide), var(--md-sys-grid-fr-1)))',
        gap: 'var(--md-sys-spacing-2)',
        marginBottom: 'var(--md-sys-spacing-6)',
      }}>
        {(['display-large', 'headline-large', 'title-large', 'body-large'] as const).map(variant => (
          <Paper key={variant} elevation={1} sx={{ padding: 'var(--md-sys-spacing-2)' }}>
            <Typography variant="overline" component="span" sx={{ display: 'block', marginBottom: 'var(--md-sys-spacing-1)', color: 'var(--md-sys-color-on-surface-variant)' }}>{variant}</Typography>
            <Typography variant="body1" sx={{ color: 'var(--md-sys-color-on-surface)' }}>Aa</Typography>
          </Paper>
        ))}
      </div>

      {/* Spacing Scale */}
      <Typography variant="h6" sx={{ marginBottom: 'var(--md-sys-spacing-2)', color: 'var(--md-sys-color-on-surface)' }}>
        Spacing Scale (MD3 System)
      </Typography>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(var(--md-sys-layout-grid-min), var(--md-sys-grid-fr-1)))',
        gap: 'var(--md-sys-spacing-2)',
        marginBottom: 'var(--md-sys-spacing-6)',
      }}>
        {[1, 2, 3, 4, 5, 6].map(n => (
          <Paper key={n} elevation={1} sx={{ padding: 'var(--md-sys-spacing-2)' }}>
            <Typography variant="overline" component="span" sx={{ display: 'block', marginBottom: 'var(--md-sys-spacing-1)', color: 'var(--md-sys-color-on-surface-variant)' }}>spacing-{n}</Typography>
            <div style={{
              width: 'var(--md-sys-percent-100)',
              height: `var(--md-sys-spacing-${n})`,
              backgroundColor: 'var(--md-sys-color-primary)',
              borderRadius: 'var(--md-sys-shape-corner-small)',
              minHeight: 'var(--md-sys-spacing-2)',
            }} />
          </Paper>
        ))}
      </div>

      {/* Motion Scale */}
      <Typography variant="h6" sx={{ marginBottom: 'var(--md-sys-spacing-2)', color: 'var(--md-sys-color-on-surface)' }}>
        Motion &amp; Easing (MD3 System)
      </Typography>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(var(--md-sys-layout-grid-min), var(--md-sys-grid-fr-1)))',
        gap: 'var(--md-sys-spacing-2)',
        marginBottom: 'var(--md-sys-spacing-6)',
      }}>
        {[
          { label: 'Standard',        value: 'var(--md-sys-motion-easing-standard)' },
          { label: 'Emphasized',      value: 'var(--md-sys-motion-easing-emphasized)' },
          { label: 'Short Duration',  value: 'var(--md-sys-motion-duration-short2)' },
          { label: 'Medium Duration', value: 'var(--md-sys-motion-duration-medium2)' },
        ].map(({ label, value }) => (
          <Paper key={label} elevation={1} sx={{ padding: 'var(--md-sys-spacing-2)' }}>
            <Typography variant="overline" component="span" sx={{ display: 'block', marginBottom: 'var(--md-sys-spacing-1)', color: 'var(--md-sys-color-on-surface-variant)' }}>{label}</Typography>
            <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)', wordBreak: 'break-all' }}>{value}</Typography>
          </Paper>
        ))}
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: 'var(--md-sys-spacing-2)',
        justifyContent: 'flex-end',
        paddingTop: 'var(--md-sys-spacing-4)',
        borderTop: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
      }}>
        <Button variant="outlined" disabled>
          Reset to MD3 Defaults
        </Button>
        <Button variant="contained" disabled>
          Apply Changes
        </Button>
        {onClose && (
          <Button onClick={onClose} variant="outlined">
            Chiudi
          </Button>
        )}
      </div>
    </Paper>
  );
};



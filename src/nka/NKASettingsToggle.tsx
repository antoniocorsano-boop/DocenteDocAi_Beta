import React from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useNKAStore } from './useNKAStore';

const NKASettingsToggle: React.FC = () => {
  const enabled = useNKAStore((s) => s.enabled);
  const setEnabled = useNKAStore((s) => s.setEnabled);
  const settings = useNKAStore((s) => s.settings);
  const setSettings = useNKAStore((s) => s.setSettings);

  return (
    <Paper
      elevation={0}
      sx={{
        padding: 'var(--md-sys-spacing-4)',
        maxWidth: 420,
        borderRadius: 'var(--md-sys-shape-corner-medium)',
      }}
      role="region"
      aria-labelledby="nka-settings-title"
    >
      <Stack spacing={2}>
        <Typography
          id="nka-settings-title"
          variant="subtitle2"
          sx={{ marginBottom: 'var(--md-sys-spacing-2)' }}
        >
          Impostazioni Neural Knowledge Aura
        </Typography>

        <Stack spacing={1.5}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--md-sys-spacing-3)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              aria-label="Abilita Neural Knowledge Aura"
              aria-describedby="nka-toggle-desc"
            />
            <div>
              <Typography variant="body1">
                Neural Knowledge Aura
              </Typography>
              <Typography
                id="nka-toggle-desc"
                variant="body2"
                sx={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginTop: 'var(--md-sys-spacing-1)' }}
              >
                Attiva l'aura neurale nell'header
              </Typography>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--md-sys-spacing-3)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.sound}
              onChange={(e) => setSettings({ ...settings, sound: e.target.checked })}
              aria-label="Abilita feedback sonori"
              aria-describedby="nka-sound-desc"
            />
            <div>
              <Typography variant="body1">
                Suoni NKA
              </Typography>
              <Typography
                id="nka-sound-desc"
                variant="body2"
                sx={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginTop: 'var(--md-sys-spacing-1)' }}
              >
                Abilita feedback sonori
              </Typography>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--md-sys-spacing-3)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => setSettings({ ...settings, reducedMotion: e.target.checked })}
              aria-label="Riduci animazioni per accessibilità"
              aria-describedby="nka-motion-desc"
            />
            <div>
              <Typography variant="body1">
                Motion ridotto
              </Typography>
              <Typography
                id="nka-motion-desc"
                variant="body2"
                sx={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginTop: 'var(--md-sys-spacing-1)' }}
              >
                Riduci animazioni per accessibilità
              </Typography>
            </div>
          </label>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default NKASettingsToggle;

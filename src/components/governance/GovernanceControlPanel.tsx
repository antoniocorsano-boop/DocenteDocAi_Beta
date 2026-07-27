/**
 * GovernanceControlPanel.tsx — "Controllo AI e Dati" section for GovernancePanel.
 *
 * 3 blocks:
 *   1. Stato sistema — active mode chip, AI on/off toggle, last consent date
 *   2. Dati          — active data-sharing flags, GDPR export / delete buttons
 *   3. AI            — operational explanation, "Rivedi configurazione" button
 *
 * MD3 Gold Compliant: M3Surface, MD3 spacing/color tokens, aria-labels on all
 * interactive elements, no box-shadow or hardcoded font properties.
 */

import React, { useState } from 'react';
import Box            from '@mui/material/Box';
import Button         from '@mui/material/Button';
import Chip           from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack          from '@mui/material/Stack';
import Switch         from '@mui/material/Switch';
import Typography     from '@mui/material/Typography';
import M3Surface      from '../ui/M3Surface';
import { useSovereigntyStore } from '../../stores/useSovereigntyStore';
import SovereigntyOnboarding from '../onboarding/SovereigntyOnboarding';

// ─── Label maps ───────────────────────────────────────────────────────────────

const MODE_LABELS: Record<string, string> = {
  offline_only:  'Solo locale',
  assistive_ai:  'AI assistiva',
  autonomous_ai: 'AI autonoma',
};

const SHARING_LABELS: Record<string, string> = {
  telemetry: 'Telemetria utilizzo',
  audit:     'Log audit compliance',
  openData:  'Open data anonimizzato',
};

// ─── Component ────────────────────────────────────────────────────────────────

const GovernanceControlPanel: React.FC = () => {
  const { config, setAiEnabled } = useSovereigntyStore();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const modeColors =
    config.mode === 'offline_only'
      ? { bg: 'var(--md-sys-color-secondary-container)', fg: 'var(--md-sys-color-on-secondary-container)' }
      : config.mode === 'assistive_ai'
        ? { bg: 'var(--md-sys-color-primary-container)',   fg: 'var(--md-sys-color-on-primary-container)'   }
        : { bg: 'var(--md-sys-color-tertiary-container)',  fg: 'var(--md-sys-color-on-tertiary-container)'  };

  const activeSharingKeys = (
    Object.keys(config.dataSharing) as Array<keyof typeof config.dataSharing>
  ).filter((k) => config.dataSharing[k]);

  return (
    <Stack gap="var(--md-sys-spacing-3)">
      {showOnboarding && (
        <SovereigntyOnboarding onCompleted={() => setShowOnboarding(false)} />
      )}

      {/* ── 1. Stato sistema ── */}
      <M3Surface
        elevation={0}
        sx={{
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          p: 'var(--md-sys-spacing-3)',
          bgcolor: 'var(--md-sys-color-surface-variant)',
        }}
      >
        <Stack gap="var(--md-sys-spacing-2)">
          <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-1)">
            <Box
              component="span"
              className="material-symbols-outlined"
              aria-hidden="true"
              sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: 'var(--md-sys-color-primary)' }}
            >
              monitor_heart
            </Box>
            <Typography variant="labelMedium">Stato sistema</Typography>
          </Stack>

          <Stack direction="row" gap="var(--md-sys-spacing-2)" alignItems="center" flexWrap="wrap">
            <Chip
              label={MODE_LABELS[config.mode] ?? config.mode}
              size="small"
              sx={{ bgcolor: modeColors.bg, color: modeColors.fg }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                  size="small"
                  aria-label={config.aiEnabled ? 'Disabilita funzionalità AI' : 'Abilita funzionalità AI'}
                />
              }
              label={
                <Typography variant="bodySmall">
                  {config.aiEnabled ? 'AI abilitata' : 'AI disabilitata'}
                </Typography>
              }
            />
          </Stack>

          {config.lastConsentUpdate ? (
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Configurata il:{' '}
              {new Date(config.lastConsentUpdate).toLocaleDateString('it-IT', { dateStyle: 'long' })}
            </Typography>
          ) : (
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-error)' }}>
              Configurazione sovranità non ancora completata.
            </Typography>
          )}
        </Stack>
      </M3Surface>

      {/* ── 2. Dati ── */}
      <M3Surface
        elevation={0}
        sx={{
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          p: 'var(--md-sys-spacing-3)',
          bgcolor: 'var(--md-sys-color-surface-variant)',
        }}
      >
        <Stack gap="var(--md-sys-spacing-2)">
          <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-1)">
            <Box
              component="span"
              className="material-symbols-outlined"
              aria-hidden="true"
              sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: 'var(--md-sys-color-primary)' }}
            >
              storage
            </Box>
            <Typography variant="labelMedium">Dati</Typography>
          </Stack>

          {activeSharingKeys.length === 0 ? (
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Nessuna condivisione dati attiva.
            </Typography>
          ) : (
            <Stack direction="row" gap="var(--md-sys-spacing-1)" flexWrap="wrap">
              {activeSharingKeys.map((k) => (
                <Chip
                  key={k}
                  label={SHARING_LABELS[k] ?? k}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: 'var(--md-sys-typescale-label-small-font-size)' }}
                />
              ))}
            </Stack>
          )}

          <Stack direction="row" gap="var(--md-sys-spacing-2)" flexWrap="wrap">
            <Button
              variant="outlined"
              size="small"
              aria-label="Esporta tutti i tuoi dati in formato JSON (portabilità GDPR Art. 20)"
              sx={{
                textTransform: 'none',
                borderRadius:  'var(--md-sys-shape-corner-full)',
              }}
              startIcon={
                <Box
                  component="span"
                  className="material-symbols-outlined"
                  aria-hidden="true"
                  sx={{ fontSize: 'var(--md-sys-icon-size-xs)' }}
                >
                  download
                </Box>
              }
            >
              Esporta dati (GDPR)
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              aria-label="Elimina tutti i dati personali — diritto alla cancellazione GDPR Art. 17"
              sx={{
                textTransform: 'none',
                borderRadius:  'var(--md-sys-shape-corner-full)',
              }}
              startIcon={
                <Box
                  component="span"
                  className="material-symbols-outlined"
                  aria-hidden="true"
                  sx={{ fontSize: 'var(--md-sys-icon-size-xs)' }}
                >
                  delete_forever
                </Box>
              }
            >
              Elimina i miei dati
            </Button>
          </Stack>
        </Stack>
      </M3Surface>

      {/* ── 3. AI ── */}
      <M3Surface
        elevation={0}
        sx={{
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          p: 'var(--md-sys-spacing-3)',
          bgcolor: 'var(--md-sys-color-surface-variant)',
        }}
      >
        <Stack gap="var(--md-sys-spacing-2)">
          <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-1)">
            <Box
              component="span"
              className="material-symbols-outlined"
              aria-hidden="true"
              sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: 'var(--md-sys-color-primary)' }}
            >
              psychology
            </Box>
            <Typography variant="labelMedium">AI</Typography>
          </Stack>

          <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Ogni azione AI è registrata nel log di audit. In modalità assistiva,
            ogni azione richiede la tua approvazione prima di essere eseguita.
            Il pannello Spiegabilità AI mostra il dettaglio di ogni decisione.
          </Typography>

          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowOnboarding(true)}
            aria-label="Rivedi e modifica la configurazione AI e sovranità operativa"
            sx={{
              textTransform: 'none',
              borderRadius:  'var(--md-sys-shape-corner-full)',
              alignSelf:     'flex-start',
            }}
            startIcon={
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-xs)' }}
              >
                tune
              </Box>
            }
          >
            Rivedi configurazione
          </Button>
        </Stack>
      </M3Surface>
    </Stack>
  );
};

export default GovernanceControlPanel;

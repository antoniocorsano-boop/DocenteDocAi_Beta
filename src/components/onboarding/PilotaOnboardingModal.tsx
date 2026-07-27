/**
 * PilotaOnboardingModal.tsx — Welcoming onboarding shown exactly once,
 * after PrivacyConsentModal + SovereigntyOnboarding, to pilots/first-time users.
 *
 * Explains in 3 concise steps how the adaptive cognitive system works,
 * building trust and transparency before the first chat.
 *
 * Key: `pilot_onboarding_v1` (localStorage) — written on close.
 *
 * MD3 Gold Compliant: M3Surface, MD3 spacing tokens, no inline font values,
 * every interactive element has aria-label.
 */

import React from 'react';
import Box           from '@mui/material/Box';
import Button        from '@mui/material/Button';
import Dialog        from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle   from '@mui/material/DialogTitle';
import Stack         from '@mui/material/Stack';
import Typography    from '@mui/material/Typography';
import M3Surface     from '../ui/M3Surface';

// ── LocalStorage key ─────────────────────────────────────────────────────────

const PILOT_KEY = 'pilot_onboarding_v1';

export function hasPilotOnboarding(): boolean {
  try {
    return localStorage.getItem(PILOT_KEY) === 'done';
  } catch {
    return false;
  }
}

function recordPilotOnboarding(): void {
  try {
    localStorage.setItem(PILOT_KEY, 'done');
  } catch {
    // localStorage may be unavailable in some environments — ignore silently
  }
}

// ── Feature cards ─────────────────────────────────────────────────────────────

const FEATURES: Array<{ icon: string; title: string; desc: string }> = [
  {
    icon:  '🧠',
    title: 'Sistema emotivo adattivo',
    desc:  'Ad ogni messaggio rileva il tuo stato cognitivo (focus, carico, esplorazione) e modula in tempo reale tono, struttura e profondità delle risposte.',
  },
  {
    icon:  '📈',
    title: 'Stile di lavoro personalizzato',
    desc:  'Con il tempo impara le tue preferenze: quanto dettaglio vuoi, quanto esplorazione, quanto controllo. Il sistema si affina a ogni interazione.',
  },
  {
    icon:  '🔒',
    title: 'Tutto resta sul tuo dispositivo',
    desc:  'Il tuo profilo cognitivo e lo stile adattivo vengono salvati solo in locale (localStorage). Nessun dato di preferenza viene inviato a server esterni. Puoi resettare in qualsiasi momento.',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface PilotaOnboardingModalProps {
  /** Whether the modal is visible. */
  open: boolean;
  /** Called after the user clicks "Inizia" — caller should hide the modal. */
  onDone: () => void;
}

export default function PilotaOnboardingModal({ open, onDone }: PilotaOnboardingModalProps): React.ReactElement {
  function handleStart() {
    recordPilotOnboarding();
    onDone();
  }

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      aria-labelledby="pilot-onboarding-title"
      aria-describedby="pilot-onboarding-desc"
    >
      <DialogTitle id="pilot-onboarding-title">
        <Typography variant="headlineSmall" component="span">
          Benvenuto in DocenteDoc AI
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing="var(--md-sys-spacing-4)" id="pilot-onboarding-desc">
          <Typography variant="bodyMedium" color="text.secondary">
            Questo sistema si adatta al tuo stile di lavoro nel tempo. Ecco come funziona:
          </Typography>

          {FEATURES.map(({ icon, title, desc }) => (
            <M3Surface key={title} elevation={1}>
              <Box sx={{ p: 'var(--md-sys-spacing-4)', display: 'flex', gap: 'var(--md-sys-spacing-3)', alignItems: 'flex-start' }}>
                <Typography
                  component="span"
                  aria-hidden="true"
                  sx={{ fontSize: 'var(--md-sys-icon-size-xl)', lineHeight: 1, flexShrink: 0 }}
                >
                  {icon}
                </Typography>
                <Stack spacing="var(--md-sys-spacing-1)">
                  <Typography variant="titleSmall">{title}</Typography>
                  <Typography variant="bodySmall" color="text.secondary">{desc}</Typography>
                </Stack>
              </Box>
            </M3Surface>
          ))}

          <Typography variant="bodySmall" color="text.secondary" sx={{ pt: 'var(--md-sys-spacing-2)' }}>
            Puoi modificare o resettare il tuo stile cognitivo in qualsiasi momento dalle impostazioni della chat.
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          color="primary"
          onClick={handleStart}
          aria-label="Inizia a usare DocenteDoc AI"
        >
          Inizia
        </Button>
      </DialogActions>
    </Dialog>
  );
}

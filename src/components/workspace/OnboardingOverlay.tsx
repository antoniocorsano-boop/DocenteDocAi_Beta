/**
 * OnboardingOverlay.tsx — Guida al primo avvio.
 *
 * Mostra un Dialog modale con 4 step informativi solo al primo accesso.
 * La visita viene persistita in localStorage sotto la chiave `docente_onboarding_v1`.
 *
 * MD3 Gold Compliant:
 *   - M3Surface per overlay body, Dialog MUI v7
 *   - token var(--md-sys-color-*) per tutti i colori
 *   - fontWeight via var(--md-sys-typescale-weight-semibold)
 *   - aria-labelledby / aria-describedby su Dialog
 */

import React, { useState } from 'react';
import Box            from '@mui/material/Box';
import Button         from '@mui/material/Button';
import Dialog         from '@mui/material/Dialog';
import DialogActions  from '@mui/material/DialogActions';
import DialogContent  from '@mui/material/DialogContent';
import DialogTitle    from '@mui/material/DialogTitle';
import Stack          from '@mui/material/Stack';
import Typography     from '@mui/material/Typography';
import AddCircleOutlineIcon      from '@mui/icons-material/AddCircleOutline';
import TouchAppOutlinedIcon      from '@mui/icons-material/TouchAppOutlined';
import VerifiedUserOutlinedIcon  from '@mui/icons-material/VerifiedUserOutlined';
import WavingHandOutlinedIcon    from '@mui/icons-material/WavingHandOutlined';

// ─── Constants ────────────────────────────────────────────────────────────────

const ONBOARDING_KEY = 'docente_onboarding_v1';

interface OnboardingStep {
  icon:  React.ReactNode;
  title: string;
  body:  string;
}

const STEPS: OnboardingStep[] = [
  {
    icon: (
      <WavingHandOutlinedIcon
        sx={{ fontSize: 'var(--md-sys-icon-size-lg, 24px)', color: 'var(--md-sys-color-primary)' }}
        aria-hidden
      />
    ),
    title: 'Benvenuto',
    body:  'Il sistema ti aiuta ad agire e rispettare le normative.',
  },
  {
    icon: (
      <AddCircleOutlineIcon
        sx={{ fontSize: 'var(--md-sys-icon-size-lg, 24px)', color: 'var(--md-sys-color-secondary)' }}
        aria-hidden
      />
    ),
    title: 'Aggiungi contenuti',
    body:  'Aggiungi contenuto per iniziare.',
  },
  {
    icon: (
      <TouchAppOutlinedIcon
        sx={{ fontSize: 'var(--md-sys-icon-size-lg, 24px)', color: 'var(--md-sys-color-tertiary)' }}
        aria-hidden
      />
    ),
    title: 'Azioni intelligenti',
    body:  'Clicca sul contenuto per vedere le azioni.',
  },
  {
    icon: (
      <VerifiedUserOutlinedIcon
        sx={{ fontSize: 'var(--md-sys-icon-size-lg, 24px)', color: 'var(--md-sys-color-primary)' }}
        aria-hidden
      />
    ),
    title: 'Tracciabilità',
    body:  'Tutto viene registrato automaticamente.',
  },
];

// ─── Utility exports ──────────────────────────────────────────────────────────

/** Restituisce true se l'utente ha già completato (o saltato) l'onboarding. */
export function hasCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'done';
  } catch {
    return true; // fail-safe: se localStorage non è disponibile, non bloccare l'UI
  }
}

function markOnboardingDone(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, 'done');
  } catch {
    // non-critical, ignora
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface OnboardingOverlayProps {
  /** Chiamato al completamento o skip dell'onboarding */
  onComplete: () => void;
}

export default function OnboardingOverlay({ onComplete }: OnboardingOverlayProps): React.JSX.Element {
  const [step, setStep] = useState(0);
  const isLast   = step === STEPS.length - 1;
  const current  = STEPS[step];

  const handleNext = () => {
    if (isLast) {
      markOnboardingDone();
      onComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => {
    markOnboardingDone();
    onComplete();
  };

  return (
    <Dialog
      open
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-body"
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundColor: 'var(--md-sys-color-surface-container)',
        },
      }}
    >
      <DialogTitle
        id="onboarding-title"
        sx={{ textAlign: 'center', pt: 3, pb: 1 }}
      >
        <Stack alignItems="center" spacing={1.5}>
          {current.icon}
          {current.title && (
            <Typography
              variant="titleMedium"
              component="span"
              sx={{
                color:      'var(--md-sys-color-on-surface)',
                fontWeight: 'var(--md-sys-typescale-weight-semibold)',
              }}
            >
              {current.title}
            </Typography>
          )}
        </Stack>
      </DialogTitle>

      <DialogContent id="onboarding-body" sx={{ textAlign: 'center', px: 3 }}>
        <Typography
          variant="body2"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          {current.body}
        </Typography>

        {/* Step indicator dots */}
        <Stack
          direction="row"
          justifyContent="center"
          spacing={1}
          sx={{ mt: 3 }}
          role="tablist"
          aria-label={`Passo ${step + 1} di ${STEPS.length}`}
        >
          {STEPS.map((_, i) => (
            <Box
              key={i}
              role="tab"
              aria-selected={i === step}
              aria-label={`Passo ${i + 1}`}
              sx={{
                width:           i === step ? 20 : 8,
                height:          8,
                borderRadius:    4,
                backgroundColor: i === step
                  ? 'var(--md-sys-color-primary)'
                  : 'var(--md-sys-color-outline-variant)',
                transition:      'width 0.25s ease',
              }}
            />
          ))}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Button
          onClick={handleSkip}
          color="inherit"
          aria-label="Salta guida introduttiva"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          Salta
        </Button>
        <Button
          onClick={handleNext}
          variant="contained"
          aria-label={isLast ? 'Inizia a usare il sistema' : 'Passo successivo'}
          sx={{ borderRadius: 8 }}
        >
          {isLast ? 'Inizia' : 'Avanti'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * OrbitTeaser.tsx — Walkthrough iniziale di Orbit.
 *
 * Mostra un overlay fullscreen con 3 slide che introducono le funzionalità
 * principali di Orbit Jarvis. Viene mostrato una sola volta dopo il completamento
 * dell'onboarding (localStorage key `orbit_teaser_v1`).
 *
 * MD3 Gold Compliant:
 *   - M3Surface per ogni container visivo
 *   - M3Typography per ogni testo significativo
 *   - Token var(--md-sys-*) + var(--orbit-*) per stili
 *   - aria-label su ogni elemento interattivo
 */

import React, { useState, useCallback } from 'react';
import Box          from '@mui/material/Box';
import Stack        from '@mui/material/Stack';
import Typography   from '@mui/material/Typography';
import Button       from '@mui/material/Button';
import IconButton   from '@mui/material/IconButton';
import CloseIcon    from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LightbulbIcon   from '@mui/icons-material/Lightbulb';
import SchoolIcon      from '@mui/icons-material/School';

import M3Surface    from './M3Surface';
import OrbitLogo    from './OrbitLogo';

// ─── Constants ────────────────────────────────────────────────────────────────

export const ORBIT_TEASER_KEY = 'orbit_teaser_v1';

export function hasSeenTeaser(): boolean {
  try { return localStorage.getItem(ORBIT_TEASER_KEY) === 'true'; }
  catch { return false; }
}

export function markTeaserSeen(): void {
  try { localStorage.setItem(ORBIT_TEASER_KEY, 'true'); }
  catch { /* ignore */ }
}

// ─── Slide data ───────────────────────────────────────────────────────────────

interface TeaserSlide {
  icon:     React.ReactNode;
  title:    string;
  subtitle: string;
}

const SLIDES: TeaserSlide[] = [
  {
    icon:     <OrbitLogo size={64} variant="mark" state="active" aria-label="Logo Orbit Jarvis" />,
    title:    'Benvenuto in Orbit',
    subtitle: 'Il tuo assistente cognitivo per la didattica. Orbit impara come lavori e ti propone azioni al momento giusto — senza interrompere il tuo flusso.',
  },
  {
    icon:     <AutoAwesomeIcon sx={{ fontSize: 'var(--md-sys-icon-size-2xl, 48px)', color: 'var(--orbit-step-current, var(--md-sys-color-primary))' }} aria-hidden />,
    title:    'Piano intelligente',
    subtitle: 'Ogni risposta complessa viene trasformata in un piano con step cliccabili. Segui i passi o salta direttamente a quello che ti serve.',
  },
  {
    icon:     <LightbulbIcon sx={{ fontSize: 'var(--md-sys-icon-size-2xl, 48px)', color: 'var(--md-sys-color-tertiary)' }} aria-hidden />,
    title:    'Suggerimenti soft',
    subtitle: 'Orbit ti propone idee in forma di domanda — "Vuoi creare una verifica?" — senza mai imporsi. Tu decidi sempre cosa fare e quando.',
  },
  {
    icon:     <SchoolIcon sx={{ fontSize: 'var(--md-sys-icon-size-2xl, 48px)', color: 'var(--md-sys-color-secondary)' }} aria-hidden />,
    title:    'Il tuo spazio di lavoro',
    subtitle: 'Carica documenti, avvia lezioni, segna presenze. Orbit riconosce il contesto e porta in primo piano ciò che serve adesso.',
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface OrbitTeaserProps {
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrbitTeaser({ onClose }: OrbitTeaserProps): React.JSX.Element {
  const [slide, setSlide] = useState(0);
  const isLast            = slide === SLIDES.length - 1;
  const current           = SLIDES[slide];

  const handleClose = useCallback(() => {
    markTeaserSeen();
    onClose();
  }, [onClose]);

  const handleNext = useCallback(() => {
    if (isLast) { handleClose(); return; }
    setSlide(s => s + 1);
  }, [isLast, handleClose]);

  const handleDot = useCallback((idx: number) => setSlide(idx), []);

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="Presentazione Orbit"
      sx={{
        position: 'fixed',
        inset:    0,
        zIndex:   1500,
        display:  'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--orbit-bg-teaser, var(--md-sys-color-surface-container-lowest))',
        animation: 'orbitTeaserIn 300ms cubic-bezier(0.2,0,0,1)',
        '@keyframes orbitTeaserIn': {
          from: { opacity: 0, transform: 'scale(0.96)' },
          to:   { opacity: 1, transform: 'scale(1)' },
        },
      }}
    >
      {/* Close button */}
      <IconButton
        aria-label="Chiudi presentazione Orbit"
        onClick={handleClose}
        sx={{
          position: 'absolute',
          top:   'var(--md-sys-spacing-4, 16px)',
          right: 'var(--md-sys-spacing-4, 16px)',
          color: 'var(--md-sys-color-on-surface-variant)',
        }}
      >
        <CloseIcon />
      </IconButton>

      {/* Slide card */}
      <M3Surface
        elevation={2}
        sx={{
          maxWidth:  500,
          width:     '90vw',
          mx:        'auto',
          px:        'var(--md-sys-spacing-6, 24px)',
          py:        'var(--md-sys-spacing-8, 32px)',
          borderRadius: 'var(--md-sys-shape-corner-extra-large, 28px)',
          textAlign: 'center',
          display:   'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap:       'var(--md-sys-spacing-6, 24px)',
        }}
      >
        {/* Icon / logo */}
        <Box
          aria-hidden
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width:  80,
            height: 80,
            borderRadius: '50%',
            background: 'var(--md-sys-color-primary-container)',
          }}
        >
          {current.icon}
        </Box>

        {/* Text */}
        <Stack spacing="var(--md-sys-spacing-2, 8px)" alignItems="center">
          <Typography
            variant="headlineSmall"
            component="h2"
            sx={{
              fontWeight: 'var(--md-sys-typescale-weight-semibold, 600)',
              color: 'var(--md-sys-color-on-surface)',
            }}
          >
            {current.title}
          </Typography>
          <Typography
            variant="bodyLarge"
            sx={{ color: 'var(--orbit-teaser-muted, var(--md-sys-color-on-surface-variant))', maxWidth: 380 }}
          >
            {current.subtitle}
          </Typography>
        </Stack>

        {/* Dot indicators */}
        <Stack direction="row" spacing="var(--md-sys-spacing-2, 8px)" aria-label="Avanzamento presentazione">
          {SLIDES.map((_, i) => (
            <Box
              key={i}
              component="button"
              onClick={() => handleDot(i)}
              aria-label={`Vai alla slide ${i + 1}`}
              aria-current={i === slide ? 'step' : undefined}
              sx={{
                width:  i === slide ? 24 : 8,
                height: 8,
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                p:      0,
                transition: 'width 200ms ease, background 200ms ease',
                background: i === slide
                  ? 'var(--orbit-teaser-dot-active, var(--md-sys-color-primary))'
                  : 'var(--orbit-teaser-dot-inactive, var(--md-sys-color-outline-variant))',
              }}
            />
          ))}
        </Stack>

        {/* CTA */}
        <Button
          variant="contained"
          onClick={handleNext}
          aria-label={isLast ? 'Inizia a usare Orbit' : `Prossima slide (${slide + 2} di ${SLIDES.length})`}
          sx={{
            borderRadius: 'var(--md-sys-shape-corner-full, 50px)',
            px: 'var(--md-sys-spacing-6, 24px)',
            py: 'var(--md-sys-spacing-2, 8px)',
            textTransform: 'none',
            fontWeight: 'var(--md-sys-typescale-weight-semibold, 600)',
          }}
        >
          {isLast ? 'Inizia' : 'Avanti'}
        </Button>
      </M3Surface>
    </Box>
  );
}

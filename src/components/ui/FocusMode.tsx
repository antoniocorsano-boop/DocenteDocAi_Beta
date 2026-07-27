/**
 * FocusMode.tsx — Modalità immersiva "distrazioni off".
 *
 * Avvolge i contenuti in una superficie full-screen che nasconde
 * tutto l'UI circostante (ContextBar, JarvisDock) e riduce il Dock
 * a forma collassata (40 × 40).
 *
 * Props:
 *   active   — true → avvia FocusMode
 *   children — contenuto da mostrare in full-screen
 *   onExit   — callback usato sia da ESC sia dal pulsante
 *
 * MD3 Gold Compliant:
 *   - solo token MD3 per colori
 *   - nessun box-shadow custom
 *   - aria-live per annunci accessibili
 */

import React, { useEffect } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FocusModeProps {
  active:   boolean;
  children: React.ReactNode;
  onExit?:  () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FocusMode({
  active,
  children,
  onExit,
}: FocusModeProps): React.JSX.Element {
  // ESC exits focus mode
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onExit?.(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [active, onExit]);

  // Announce to screen readers
  return (
    <>
      <Box
        aria-live="polite"
        aria-atomic="true"
        sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden',
              clip: 'rect(0 0 0 0)', clipPath: 'inset(50%)' }}
      >
        {active ? 'Modalità focus attivata. Premi Esc per uscire.' : ''}
      </Box>

      <Box
        role="main"
        aria-label={active ? 'Modalità focus — premi Esc per uscire' : undefined}
        sx={{
          position:      active ? 'fixed' : 'relative',
          inset:         active ? 0 : 'auto',
          zIndex:        active ? 1400 : 'auto',
          bgcolor:       'var(--md-sys-color-background)',
          display:       'flex',
          flexDirection: 'column',
          overflow:      'hidden',
          animation:     active ? 'focusIn 180ms ease-out' : 'none',
          '@keyframes focusIn': {
            from: { opacity: 0.7, transform: 'scale(0.99)' },
            to:   { opacity: 1,   transform: 'scale(1)' },
          },
        }}
      >
        {children}

        {/* Exit button — bottom-right corner */}
        {active && (
          <Box
            sx={{
              position: 'fixed',
              bottom:   24,
              right:    24,
              zIndex:   1500,
              animation: 'focusBtnIn 260ms ease-out',
              '@keyframes focusBtnIn': {
                from: { opacity: 0, transform: 'translateY(8px)' },
                to:   { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            <Tooltip title="Esci dalla modalità focus (Esc)" placement="left">
              <IconButton
                onClick={onExit}
                aria-label="Esci dalla modalità focus"
                size="medium"
                sx={{
                  bgcolor:  'var(--md-sys-color-surface-container-highest)',
                  color:    'var(--md-sys-color-on-surface)',
                  '&:hover': {
                    bgcolor: 'var(--md-sys-color-surface-container)',
                  },
                }}
              >
                <FullscreenExitIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </>
  );
}

/**
 * JarvisIndicator.tsx — Micro-indicatore background di Orbit Jarvis.
 *
 * Floating badge minimalista (fixed bottom-right) che segnala all'utente
 * che Jarvis ha suggerimenti disponibili. Appare quando ci sono entries
 * non elaborate, scompare quando il ThumbMenu è aperto.
 *
 * Architettura:
 *   entries > 0 → indicator compare con animazione jarvisPulse
 *   click       → chiama onActivate(latestEntryId, fabElement)
 *                  → useThumbMenu.openMenu() → ThumbMenu si apre
 *   ThumbMenu aperto → hidden=true → indicator sparisce
 *
 * MD3 Gold Compliant:
 *   - Fab piccolo (MUI v7, nessun div visivo)
 *   - Badge per contatore entrate
 *   - aria-label esplicito e unico
 *   - colori solo via token var(--md-sys-color-*)
 *   - animazione via @keyframes iniettato una volta
 */

import React, { useEffect, useRef } from 'react';
import Badge   from '@mui/material/Badge';
import Fab     from '@mui/material/Fab';
import Tooltip from '@mui/material/Tooltip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

// ─── CSS keyframes (inject once) ─────────────────────────────────────────────

let _kfInjected = false;

function injectKeyframes(): void {
  if (_kfInjected || typeof document === 'undefined') return;
  _kfInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes jarvisPulse {
      0%   { box-shadow: 0 0 0 0px var(--md-sys-color-primary); opacity: .9; }
      70%  { box-shadow: 0 0 0 7px transparent; opacity: 1; }
      100% { box-shadow: 0 0 0 0px transparent; opacity: .9; }
    }
    @keyframes jarvisGlow {
      0%   { box-shadow: 0 0 0 0px var(--md-sys-color-primary); opacity: 1; }
      50%  { box-shadow: 0 0 12px 4px var(--md-sys-color-primary); opacity: 1; }
      100% { box-shadow: 0 0 0 0px var(--md-sys-color-primary); opacity: 1; }
    }
    @keyframes jarvisProcessing {
      0%, 100% { box-shadow: 0 0 0 0px var(--md-sys-color-tertiary); opacity: .8; }
      50%       { box-shadow: 0 0 0 5px transparent; opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface JarvisIndicatorProps {
  /** Numero di entries con suggerimenti disponibili */
  count: number;
  /** ID dell'entry più recente (passato a onActivate) */
  latestEntryId: string | null;
  /** Se true nasconde l'indicatore (es. ThumbMenu già aperto) */
  hidden: boolean;
  /** Callback al click — apre ThumbMenu per latestEntryId */
  onActivate: (entryId: string, anchor: HTMLElement) => void;
  /** Stato visivo Jarvis: suggestion (default) | active | processing */
  state?: 'idle' | 'suggestion' | 'active' | 'processing';
  /**
   * Distanza dal bordo inferiore in px (default 76).
   * Usare quando altri elementi fissi (es. FAB governance) occupano l’area.
   */
  bottomOffset?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ANIM_MAP: Record<string, string> = {
  suggestion: 'jarvisPulse 2.6s ease-out infinite',
  active:     'jarvisGlow 1.2s ease-out infinite',
  processing: 'jarvisProcessing 0.7s ease-in-out infinite',
  idle:       'none',
};

export default function JarvisIndicator({
  count,
  latestEntryId,
  hidden,
  onActivate,
  state = 'suggestion',
  bottomOffset,
}: JarvisIndicatorProps): React.JSX.Element | null {
  const fabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { injectKeyframes(); }, []);

  if (hidden || count === 0 || !latestEntryId) return null;

  const label = count === 1
    ? 'Jarvis ha 1 suggerimento — clicca per vedere le azioni'
    : `Jarvis ha ${count} suggerimenti — clicca per vedere le azioni`;

  const hint = count === 1 ? '1 suggerimento' : `${count > 9 ? '9+' : count} suggerimenti`;

  return (
    <Tooltip title={hint} placement="left" arrow>
      {/* Badge wraps Fab, non un div generico */}
      <Badge
        badgeContent={count > 9 ? '9+' : count}
        color="error"
        overlap="circular"
        sx={{
          position: 'fixed',
          bottom:   bottomOffset ?? 76,
          right:    24,
          zIndex:   1200,
        }}
      >
        <Fab
          ref={fabRef}
          size="small"
          onClick={() => {
            if (latestEntryId && fabRef.current) {
              onActivate(latestEntryId, fabRef.current);
            }
          }}
          aria-label={label}
          sx={{
            width:           36,
            height:          36,
            minHeight:       36,
            backgroundColor: 'var(--md-sys-color-primary-container)',
            color:           'var(--md-sys-color-on-primary-container)',
            boxShadow:       '0 2px 10px rgba(0,0,0,.20)',
            animation:       ANIM_MAP[state] ?? ANIM_MAP.suggestion,
            transition:      'background-color 160ms ease, color 160ms ease',
            '&:hover': {
              backgroundColor: 'var(--md-sys-color-primary)',
              color:           'var(--md-sys-color-on-primary)',
              animation:       'none',
              boxShadow:       '0 4px 14px rgba(0,0,0,.26)',
            },
            '&:active': {
              transform: 'scale(0.90)',
            },
          }}
        >
          <AutoAwesomeIcon
            aria-hidden
            sx={{ fontSize: 'var(--md-sys-icon-size-sm, 18px)' }}
          />
        </Fab>
      </Badge>
    </Tooltip>
  );
}

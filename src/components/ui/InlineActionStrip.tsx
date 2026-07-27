/**
 * InlineActionStrip.tsx — Striscia azioni assistite per Orbit Jarvis.
 *
 * Mostra in orizzontale le azioni con livello di automazione 'assisted'
 * (azioni che il docente esegue spesso ma che richiedono conferma).
 * Posizionata sticky nella parte bassa dello schermo sopra il JarvisIndicator.
 *
 * Visibile solo quando ci sono almeno 1 azione 'assisted' e il menu non è aperto.
 *
 * MD3 Gold Compliant:
 *   - M3Surface come unico container visivo
 *   - M3Typography per ogni testo semantico
 *   - nessun <div> per layout/shell
 *   - token MD3 per spacing e colori
 */

import React from 'react';
import Chip       from '@mui/material/Chip';
import Stack      from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import BoltIcon   from '@mui/icons-material/Bolt';

import M3Surface from './M3Surface';

import { getAutomationLevel } from '../../modules/orchestration/orchestrationService';
import type { OrchestrationContext } from '../../modules/orchestration/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InlineActionStripProps {
  /** Contesto di orchestrazione corrente (null se nessun menu aperto) */
  context:    OrchestrationContext | null;
  /** Chiamato quando l'utente clicca un chip */
  onSelect:   (ctaType: string) => void;
  /** Nasconde la strip se true (es. ThumbMenu è aperto) */
  hidden?:    boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InlineActionStrip({
  context,
  onSelect,
  hidden,
}: InlineActionStripProps): React.JSX.Element | null {
  if (hidden || !context) return null;

  // Filtra solo le azioni 'assisted' (preferite, non-auto)
  const assistedActions = context.actions.filter(
    a => getAutomationLevel(a.ctaType) === 'assisted',
  );

  if (assistedActions.length === 0) return null;

  return (
    <M3Surface
      elevation={2}
      aria-label="Azioni assistite Jarvis"
      sx={{
        position:    'sticky',
        bottom:      80, // 8px sopra JarvisIndicator (bottom:72 + margin)
        left:        0,
        right:       0,
        zIndex:      1200,
        px:          2,
        py:          1,
        borderRadius: 'var(--md-sys-shape-corner-large, 16px)',
        bgcolor:     'var(--md-sys-color-surface-container)',
        display:     'flex',
        alignItems:  'center',
        gap:         1,
        mx:          2,
      }}
    >
      <BoltIcon
        sx={{ fontSize: 'var(--md-sys-icon-size-xs, 14px)', color: 'var(--md-sys-color-tertiary)', flexShrink: 0 }}
        aria-hidden
      />
      <Typography
        variant="labelSmall"
        sx={{ color: 'var(--md-sys-color-on-surface-variant)', flexShrink: 0 }}
      >
        Veloci
      </Typography>
      <Stack
        component="ul"
        direction="row"
        flexWrap="nowrap"
        gap={0.75}
        sx={{ listStyle: 'none', m: 0, p: 0, overflowX: 'auto', flex: 1 }}
        aria-label="Azioni rapide assistite"
      >
        {assistedActions.slice(0, 4).map(a => (
          <Chip
            key={a.id}
            component="li"
            label={a.label}
            size="small"
            onClick={() => onSelect(a.ctaType)}
            aria-label={`Azione rapida: ${a.label}`}
            clickable
            sx={{
              bgcolor:     'var(--md-sys-color-secondary-container)',
              color:       'var(--md-sys-color-on-secondary-container)',
              minHeight:   32,
              flexShrink:  0,
              '&:hover': {
                bgcolor: 'color-mix(in srgb, var(--md-sys-color-secondary) 20%, var(--md-sys-color-secondary-container))',
              },
            }}
          />
        ))}
      </Stack>
    </M3Surface>
  );
}

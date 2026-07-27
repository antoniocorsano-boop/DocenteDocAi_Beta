/**
 * JarvisDock.tsx — Dock persistente di Jarvis per desktop.
 *
 * Pannello laterale destro fisso che sostituisce/affianca il JarvisIndicator
 * in modalità desktop. Espande i propri stati in modo visivamente ricco:
 *
 *   idle        → punto minimo, nessun testo
 *   suggestion  → titolo + prima suggestion + CTA
 *   active      → espanso, lista azioni contestuali
 *   processing  → animazione pulse + label
 *
 * MD3 Gold Compliant:
 *   - M3Surface per ogni container
 *   - token var(--md-sys-color-*) per colori
 *   - fontWeight via var(--md-sys-typescale-weight-*)
 *   - aria-label su ogni elemento interattivo
 */

import React, { useEffect } from 'react';
import Box        from '@mui/material/Box';
import Button     from '@mui/material/Button';
import Chip       from '@mui/material/Chip';
import Divider    from '@mui/material/Divider';
import Stack      from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AutoAwesomeIcon   from '@mui/icons-material/AutoAwesome';
import ChevronRightIcon  from '@mui/icons-material/ChevronRight';
import RadioButtonCheckedIcon   from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

import M3Surface from './M3Surface';
import type { OrchestrationContext, OrchestrationAction } from '../../modules/orchestration/types';

// ─── CSS injection (once) ─────────────────────────────────────────────────────

let _kfInjectedDock = false;
function injectDockKeyframes(): void {
  if (_kfInjectedDock || typeof document === 'undefined') return;
  _kfInjectedDock = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes dockGlow {
      0%   { box-shadow: 0 0 0 0px var(--md-sys-color-primary); }
      50%  { box-shadow: 0 0 14px 4px color-mix(in srgb, var(--md-sys-color-primary) 30%, transparent); }
      100% { box-shadow: 0 0 0 0px var(--md-sys-color-primary); }
    }
    @keyframes dockPulse {
      0%, 100% { opacity: .6; transform: scale(1);   }
      50%       { opacity: 1;  transform: scale(1.08); }
    }
  `;
  document.head.appendChild(style);
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface JarvisDockProps {
  state:    'idle' | 'suggestion' | 'active' | 'processing';
  context:  OrchestrationContext | null;
  /** Suggestion text (first entry's proactive reason) */
  hint?:    string;
  onAction: (action: OrchestrationAction) => void;
  /** Se true il dock è ridotto al solo icona (FocusMode) */
  collapsed?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function JarvisDock({
  state,
  context,
  hint,
  onAction,
  collapsed = false,
}: JarvisDockProps): React.JSX.Element {
  useEffect(() => { injectDockKeyframes(); }, []);

  // ── Collapsed (FocusMode / always-visible micro-dot) ──────────────────────
  if (collapsed) {
    return (
      <Box
        sx={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          width:           40,
          height:          40,
          borderRadius:    '50%',
          bgcolor:         'var(--md-sys-color-primary-container)',
          animation:       state === 'processing' ? 'dockPulse 1s ease-in-out infinite' : 'none',
        }}
        aria-label="Jarvis — modalità focus"
        role="status"
      >
        <AutoAwesomeIcon
          sx={{
            fontSize: 'var(--md-sys-icon-size-sm, 18px)',
            color:    'var(--md-sys-color-primary)',
            animation: state === 'suggestion' ? 'dockGlow 2.4s ease-out infinite' : 'none',
          }}
          aria-hidden
        />
      </Box>
    );
  }

  const topActions = context?.actions.slice(0, 3) ?? [];
  const stateLabel = {
    idle:       'In attesa',
    suggestion: 'Suggerimento',
    active:     'Attivo',
    processing: 'Elaborazione…',
  }[state];

  return (
    <M3Surface
      elevation={1}
      aria-label="Jarvis Dock — pannello assistente"
      sx={{
        width:         260,
        flexShrink:    0,
        display:       'flex',
        flexDirection: 'column',
        gap:           0,
        borderLeft:    '1px solid var(--md-sys-color-outline-variant)',
        bgcolor:       'var(--md-sys-color-surface-container-low)',
        overflow:      'hidden',
        animation:     state === 'suggestion'
          ? 'dockGlow 3s ease-out infinite'
          : 'none',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ px: 2, py: 1.5, borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}
      >
        {state === 'idle' || state === 'active' ? (
          <RadioButtonUncheckedIcon
            sx={{ fontSize: 'var(--md-sys-icon-size-sm, 16px)', color: 'var(--md-sys-color-outline)' }}
            aria-hidden
          />
        ) : state === 'processing' ? (
          <Box
            sx={{
              width: 8, height: 8, borderRadius: '50%',
              bgcolor: 'var(--md-sys-color-primary)',
              animation: 'dockPulse 0.8s ease-in-out infinite',
            }}
            aria-hidden
          />
        ) : (
          <RadioButtonCheckedIcon
            sx={{ fontSize: 'var(--md-sys-icon-size-sm, 16px)', color: 'var(--md-sys-color-primary)' }}
            aria-hidden
          />
        )}
        <Typography
          variant="labelMedium"
          sx={{
            color:      'var(--md-sys-color-on-surface)',
            fontWeight: 'var(--md-sys-typescale-weight-semibold)',
            flexGrow:   1,
          }}
        >
          Jarvis
        </Typography>
        <Typography
          variant="labelSmall"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          {stateLabel}
        </Typography>
      </Stack>

      {/* ── Hint / suggestion ─────────────────────────────────────────── */}
      {hint && state !== 'idle' && (
        <Box sx={{ px: 2, pt: 1.5, pb: 0 }}>
          <Typography
            variant="body2"
            sx={{ color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.4 }}
          >
            {hint}
          </Typography>
        </Box>
      )}

      {/* ── Actions ───────────────────────────────────────────────────── */}
      {topActions.length > 0 && (
        <>
          {hint && <Divider sx={{ mt: 1.5, opacity: 0.5 }} />}
          <Stack spacing={0.25} sx={{ px: 1.5, py: 1 }}>
            {topActions.map(action => (
              <Button
                key={action.id}
                variant="text"
                fullWidth
                onClick={() => onAction(action)}
                aria-label={`Jarvis: esegui ${action.label}`}
                endIcon={<ChevronRightIcon sx={{ fontSize: 'var(--md-sys-icon-size-sm, 16px)' }} />}
                sx={{
                  justifyContent: 'space-between',
                  px:             1.5,
                  py:             0.625,
                  borderRadius:   2,
                  textTransform:  'none',
                  color:          'var(--md-sys-color-on-surface)',
                  '&:hover': {
                    bgcolor: 'var(--md-sys-color-surface-container)',
                  },
                }}
              >
                <Typography variant="labelMedium" component="span">
                  {action.label}
                </Typography>
              </Button>
            ))}
          </Stack>
        </>
      )}

      {/* ── Processing indicator ───────────────────────────────────────── */}
      {state === 'processing' && (
        <Box sx={{ px: 2, pb: 1.5 }}>
          <Typography
            variant="labelSmall"
            sx={{
              color:     'var(--md-sys-color-primary)',
              animation: 'dockPulse 1s ease-in-out infinite',
            }}
          >
            Elaborazione in corso…
          </Typography>
        </Box>
      )}

      {/* ── Keyboard hint ─────────────────────────────────────────────── */}
      <Box sx={{ mt: 'auto', px: 2, pb: 1.5, pt: 1 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip
            label="⌘K"
            size="small"
            variant="outlined"
            aria-label="Scorciatoia comandi: Ctrl+K"
            sx={{
              height:    20,
              fontSize:  10,
              borderColor: 'var(--md-sys-color-outline)',
              color:     'var(--md-sys-color-on-surface-variant)',
            }}
          />
          <Chip
            label="⌘J"
            size="small"
            variant="outlined"
            aria-label="Scorciatoia Jarvis: Ctrl+J"
            sx={{
              height:    20,
              fontSize:  10,
              borderColor: 'var(--md-sys-color-outline)',
              color:     'var(--md-sys-color-on-surface-variant)',
            }}
          />
        </Stack>
      </Box>
    </M3Surface>
  );
}

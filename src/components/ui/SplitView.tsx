/**
 * SplitView.tsx — Layout a due pannelli per desktop.
 *
 * Mostra due pannelli affiancati con un divisore drag-resizable.
 * Il pannello secondario può essere chiuso con ESC.
 *
 * Uso:
 *   <SplitView
 *     primary={<ScheduleLanding />}
 *     secondary={<ClassPreview />}
 *     onCloseSecondary={() => ...}
 *   />
 *
 * Regole:
 *   - max 2 pannelli
 *   - drag sul separator per resize (defaultSize 50%)
 *   - ESC → onCloseSecondary
 *   - Senza secondary → fullwidth primary
 *
 * MD3 Gold Compliant:
 *   - nessun <div> visivo → Box semantici
 *   - token MD3 per colori/spacing
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Box from '@mui/material/Box';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SplitViewProps {
  /** Contenuto del pannello principale (sempre visibile) */
  primary:            React.ReactNode;
  /** Contenuto del pannello secondario (opzionale) */
  secondary?:         React.ReactNode;
  /** Callback quando utente chiude pannello secondario (ESC o drag a <20%) */
  onCloseSecondary?:  () => void;
  /** Larghezza iniziale del pannello primario in % (default 55) */
  defaultSplitPct?:   number;
}

// ─── Component ────────────────────────────────────────────────────────────────

const MIN_PCT    = 30;  // % minima pannello primario
const CLOSE_PCT  = 20;  // % sotto la quale il secondary si chiude

export default function SplitView({
  primary,
  secondary,
  onCloseSecondary,
  defaultSplitPct = 55,
}: SplitViewProps): React.JSX.Element {
  const [splitPct, setSplitPct] = useState(defaultSplitPct);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ESC closes secondary panel
  useEffect(() => {
    if (!secondary) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onCloseSecondary?.(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [secondary, onCloseSecondary]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;

    const onMove = (me: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect  = containerRef.current.getBoundingClientRect();
      const pct   = ((me.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(Math.max(pct, MIN_PCT), 100 - MIN_PCT);
      setSplitPct(clamped);
      // Close secondary if dragged far right
      if (100 - clamped < CLOSE_PCT) onCloseSecondary?.();
    };

    const onUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [onCloseSecondary]);

  return (
    <Box
      ref={containerRef}
      sx={{
        display:    'flex',
        flexGrow:   1,
        overflow:   'hidden',
        position:   'relative',
        userSelect: isDragging.current ? 'none' : 'auto',
      }}
      aria-label="Vista divisa"
      role="region"
    >
      {/* Primary panel */}
      <Box
        role="region"
        aria-label="Pannello principale"
        sx={{
          width:    secondary ? `${splitPct}%` : '100%',
          flexShrink: 0,
          overflow:   'auto',
          transition: isDragging.current ? 'none' : 'width 150ms ease',
        }}
      >
        {primary}
      </Box>

      {/* Drag separator */}
      {secondary && (
        <Box
          onMouseDown={handleMouseDown}
          role="separator"
          aria-label="Trascina per ridimensionare pannelli"
          aria-orientation="vertical"
          tabIndex={0}
          sx={{
            width:      6,
            flexShrink: 0,
            cursor:     'col-resize',
            position:   'relative',
            bgcolor:    'transparent',
            zIndex:     1,
            transition: 'background-color 120ms',
            '&:hover, &:focus': {
              bgcolor: 'var(--md-sys-color-primary)',
              outline: 'none',
            },
            '&::after': {
              content:  '""',
              display:  'block',
              position: 'absolute',
              top:      '50%',
              left:     '50%',
              transform: 'translate(-50%, -50%)',
              width:    2,
              height:   48,
              borderRadius: 2,
              bgcolor:  'var(--md-sys-color-outline-variant)',
            },
          }}
        />
      )}

      {/* Secondary panel */}
      {secondary && (
        <Box
          role="region"
          aria-label="Pannello secondario — premi Esc per chiudere"
          sx={{
            flexGrow:   1,
            overflow:   'auto',
            borderLeft: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          {secondary}
        </Box>
      )}
    </Box>
  );
}

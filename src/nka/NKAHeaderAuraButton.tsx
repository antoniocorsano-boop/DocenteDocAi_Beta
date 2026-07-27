import * as React from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { playNkaSound } from './sound';

const NKA_COACHMARK_KEY = 'nka_coachmark_seen_v1';

interface NKAHeaderAuraButtonProps {
  hasNewNode: boolean;
  onClick: () => void;
  onLongPress: () => void;
}

const NKAHeaderAuraButton: React.FC<NKAHeaderAuraButtonProps> = ({ hasNewNode, onClick, onLongPress }) => {
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const [showCoachmark, setShowCoachmark] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  React.useEffect(() => {
    if (!localStorage.getItem(NKA_COACHMARK_KEY)) {
      const show = setTimeout(() => setShowCoachmark(true), 1200);
      return () => clearTimeout(show);
    }
  }, []);

  React.useEffect(() => {
    if (!showCoachmark) return;
    localStorage.setItem(NKA_COACHMARK_KEY, '1');
    const hide = setTimeout(() => setShowCoachmark(false), 6000);
    return () => clearTimeout(hide);
  }, [showCoachmark]);

  const handlePointerDown = () => {
    setIsPressed(true);
    timerRef.current = setTimeout(() => {
      playNkaSound('badge');
      onLongPress();
      if (window.navigator.vibrate) window.navigator.vibrate(30);
    }, 500);
  };

  const handlePointerUp = () => {
    setIsPressed(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = () => {
    playNkaSound('action');
    setShowCoachmark(false);
    onClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
      e.preventDefault();
    }
    if (e.key === 'ArrowRight') {
      (e.currentTarget.nextElementSibling as HTMLElement)?.focus();
    }
    if (e.key === 'ArrowLeft') {
      (e.currentTarget.previousElementSibling as HTMLElement)?.focus();
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        display: 'inline-flex',
      }}
    >
      <button
        aria-label="Apri mappa neurale Aura — tieni premuto per opzioni avanzate"
        aria-haspopup="dialog"
        aria-expanded="false"
        tabIndex={0}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onKeyDown={handleKeyDown}
        style={{
          backgroundColor: 'var(--md-sys-color-primary)',
          color: 'var(--md-sys-color-on-primary)',
          borderRadius: 'var(--md-sys-shape-corner-full)',
          width: 'var(--md-sys-spacing-12)',
          height: 'var(--md-sys-spacing-12)',
          minWidth: 'var(--md-sys-spacing-11)',
          minHeight: 'var(--md-sys-spacing-11)',
          boxShadow: isPressed
            ? '0 0 0 var(--md-sys-spacing-2) var(--md-sys-color-primary-container)'
            : '0 0 0 var(--md-sys-spacing-1) var(--md-sys-color-primary-container)',
          transition: 'box-shadow var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard)',
          position: 'relative',
          cursor: 'pointer',
          border: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          aria-hidden="true"
          className="material-symbols-outlined"
          style={{
            fontSize: 'calc(var(--md-sys-spacing-7))',
            filter: 'drop-shadow(0 0 var(--md-sys-spacing-2) var(--md-sys-color-primary))',
            userSelect: 'none',
          }}
        >
          auto_awesome
        </span>
        
        {hasNewNode && (
          <Paper
            elevation={1}
            role="status"
            aria-label="Nuovo nodo disponibile"
            sx={{
              position: 'absolute',
              top: 'var(--md-sys-spacing-1)',
              right: 'var(--md-sys-spacing-1)',
              width: 'var(--md-sys-spacing-3)',
              height: 'var(--md-sys-spacing-3)',
              borderRadius: 'var(--md-sys-percent-50)',
              bgcolor: 'var(--md-sys-color-tertiary)',
              border: 'var(--md-sys-border-width-thick) solid var(--md-sys-color-surface)',
            }}
          />
        )}
      </button>

      {showCoachmark && (
        <Paper
          elevation={3}
          role="tooltip"
          sx={{
            position: 'absolute',
            top: 'calc(var(--md-sys-spacing-12) + var(--md-sys-spacing-3))',
            right: 0,
            zIndex: 'var(--md-sys-z-tooltip)',
            bgcolor: 'var(--md-sys-color-inverse-surface)',
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            p: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'var(--md-sys-color-inverse-on-surface)',
              fontWeight: 'var(--md-sys-typescale-weight-medium)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--md-sys-spacing-2)',
            }}
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined"
              style={{
                fontSize: 'var(--md-sys-typescale-body-medium-font-size)',
              }}
            >
              auto_awesome
            </span>
            Mappa Neurale: esplora la tua conoscenza
          </Typography>
        </Paper>
      )}
    </Paper>
  );
};

export default NKAHeaderAuraButton;

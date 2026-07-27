/**
 * ThumbMenu.tsx — Menu contestuale radiale (Thumb UI).
 *
 * Mostra le azioni contestuali dell'OrchestrationContext in un layout radiale
 * che si apre attorno all'elemento di ancoraggio (o al centro del viewport).
 *
 * Design:
 *   - FAB centrale come punto di ancoraggio visivo
 *   - N chip in orbita radiale (angolo equidistribuito)
 *   - Chip disabled se la capability non è attiva
 *   - Animazione orbit-in/out via CSS keyframes — nessuna lib esterna
 *   - Backdrop semi-trasparente per chiusura on-click
 *
 * MD3 Gold Compliant:
 *   - Fab, Chip, Tooltip MUI v7
 *   - token var(--md-sys-color-*) per colori semantici
 *   - aria-label su ogni azione, aria-expanded su Fab, role="menu"
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Backdrop  from '@mui/material/Backdrop';
import Box       from '@mui/material/Box';
import Chip      from '@mui/material/Chip';
import Fab       from '@mui/material/Fab';
import Portal    from '@mui/material/Portal';
import Tooltip   from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import TouchAppOutlinedIcon from '@mui/icons-material/TouchAppOutlined';

import { isCapabilityEnabled } from '../../modules/capabilitySystem/capabilityService';
import type { OrchestrationAction, OrchestrationContext } from '../../modules/orchestration/types';
import { useUIStore } from '../../stores/useUIStore';

// ─── Constants ────────────────────────────────────────────────────────────────

const ORBIT_RADIUS    = 82;   // px
const FAB_SIZE        = 40;   // px
const ANIM_DURATION   = 160;  // ms

// ─── Types ────────────────────────────────────────────────────────────────────

interface ThumbMenuProps {
  /** Menu aperto/chiuso */
  open:       boolean;
  /** Elemento HTML di ancoraggio (determina la posizione del menu) */
  anchorEl?:  HTMLElement | null;
  /** Contesto calcolato da orchestrationService */
  context:    OrchestrationContext | null;
  /** Tenant corrente per il capability check */
  tenantId:   string;
  /** Callback quando l'utente seleziona un'azione */
  onSelect:   (action: OrchestrationAction) => void;
  /** Callback di chiusura */
  onClose:    () => void;
}

// ─── CSS keyframes (injected once) ───────────────────────────────────────────

const KEYFRAMES_ID = 'thumb-menu-keyframes';

function injectKeyframes(): void {
  if (typeof document === 'undefined' || document.getElementById(KEYFRAMES_ID)) return;
  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes thumbOrbitIn {
      from { transform: translate(-50%, -50%) scale(0.82); opacity: 0; }
      to   { transform: translate(-50%, -50%) scale(1);    opacity: 1; }
    }
    @keyframes thumbOrbitOut {
      from { transform: translate(-50%, -50%) scale(1);    opacity: 1; }
      to   { transform: translate(-50%, -50%) scale(0.82); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// ─── Anchor position helper ───────────────────────────────────────────────────

interface AnchorPosition {
  left: number;
  top:  number;
}

function getAnchorCenter(el: HTMLElement | null | undefined): AnchorPosition {
  if (!el) {
    return {
      left: typeof window !== 'undefined' ? window.innerWidth  / 2 : 400,
      top:  typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
    };
  }
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left + rect.width  / 2,
    top:  rect.top  + rect.height / 2,
  };
}

// ─── Action chip ──────────────────────────────────────────────────────────────

interface ActionChipProps {
  action:        OrchestrationAction;
  index:         number;
  total:         number;
  center:        AnchorPosition;
  visible:       boolean;
  tenantId:      string;
  selected:      boolean;
  onSelect:      (action: OrchestrationAction) => void;
}

const ACTION_CHIP_COLORS: Record<number, string> = {
  1: 'var(--md-sys-color-error)',          // critical
  2: 'var(--md-sys-color-tertiary)',       // high
  3: 'var(--md-sys-color-primary)',        // medium
  4: 'var(--md-sys-color-on-surface-variant)', // low
};

function ActionChip({
  action, index, total, center, visible, tenantId, selected, onSelect,
}: ActionChipProps): React.JSX.Element {
  const angle  = ((360 / total) * index - 90) * (Math.PI / 180);
  const rawX   = center.left + Math.cos(angle) * ORBIT_RADIUS;
  const rawY   = center.top  + Math.sin(angle) * ORBIT_RADIUS;
  const safeX  = Math.max(40, Math.min(rawX, window.innerWidth  - 40));
  const safeY  = Math.max(40, Math.min(rawY, window.innerHeight - 40));

  const enabled     = !action.capabilityId || isCapabilityEnabled(tenantId, action.capabilityId);
  const accentColor = ACTION_CHIP_COLORS[action.priority] ?? ACTION_CHIP_COLORS[4];

  const chip = (
    <Chip
      label={action.label}
      size="small"
      clickable={enabled}
      disabled={!enabled}
      onClick={enabled ? () => { onSelect(action); } : undefined}
      aria-label={enabled ? action.label : `${action.label} (non disponibile)`}
      role="menuitem"
      sx={{
        position:  'fixed',
        left:      safeX,
        top:       safeY,
        transform: 'translate(-50%, -50%)',
        zIndex:    1400,
        cursor:    enabled ? 'pointer' : 'default',
        fontSize:  'var(--md-sys-typescale-label-medium-size, 0.75rem)',
        bgcolor:   enabled ? accentColor : 'var(--md-sys-color-surface)',
        color:     enabled
          ? 'var(--md-sys-color-on-primary)'
          : 'var(--md-sys-color-on-surface-variant)',
        border:    'none',
        boxShadow: enabled ? '0 1px 3px rgba(0,0,0,.12)' : 'none',
        opacity:   enabled ? 1 : 0.4,
        transition: 'opacity 120ms ease, box-shadow 120ms ease',
        outline:   selected && enabled ? '2px solid var(--md-sys-color-on-primary)' : 'none',
        outlineOffset: 2,
        '&:hover': enabled ? {
          filter:    'brightness(1.06)',
          boxShadow: '0 2px 8px rgba(0,0,0,.16)',
        } : {},
        // Animate in/out
        animation: visible
          ? `thumbOrbitIn ${ANIM_DURATION}ms ease-out both`
          : `thumbOrbitOut ${ANIM_DURATION}ms ease-in both`,
        animationDelay: visible ? `${index * 25}ms` : '0ms',
      }}
    />
  );

  if (!enabled) {
    return (
      <Tooltip
        title="Non disponibile"
        placement="top"
        key={action.id}
      >
        <span>{chip}</span>
      </Tooltip>
    );
  }

  return chip;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ThumbMenu({
  open, anchorEl, context, tenantId, onSelect, onClose,
}: ThumbMenuProps): React.JSX.Element | null {
  useEffect(() => { injectKeyframes(); }, []);

  // Mantieni la posizione costante mentre il menu è aperto
  const [frozenCenter, setFrozenCenter] = useState<AnchorPosition | null>(null);

  useEffect(() => {
    if (open) {
      setFrozenCenter(getAnchorCenter(anchorEl));
    }
  }, [open, anchorEl]);

  // C1: Reset frozenCenter after close animation — prevents ghost FAB
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setFrozenCenter(null), ANIM_DURATION + 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  const center = frozenCenter ?? getAnchorCenter(anchorEl);

  const actions = useMemo(
    () => context?.actions ?? [],
    [context],
  );

  // ── Keyboard navigation ──────────────────────────────────────────────────
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Reset selection when menu opens/closes — no auto-select (M3)
  useEffect(() => {
    setSelectedIndex(-1);
  }, [open, actions.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open || actions.length === 0) return;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % actions.length);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + actions.length) % actions.length);
        break;
      case 'Enter': {
        e.preventDefault();
        const action = actions[selectedIndex];
        if (!action) break;
        if (!action.capabilityId || isCapabilityEnabled(tenantId, action.capabilityId)) {
          onSelect(action);
          onClose();
        } else {
          useUIStore.getState().actions.showToast('Non disponibile', 'info');
        }
        break;
      }
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      default:
        break;
    }
  }, [open, actions, selectedIndex, tenantId, onSelect, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // OL: Position of selected chip for label display
  const selectedChipPos = useMemo(() => {
    if (selectedIndex < 0 || selectedIndex >= actions.length) return null;
    const angle = ((360 / actions.length) * selectedIndex - 90) * (Math.PI / 180);
    const rawX  = center.left + Math.cos(angle) * ORBIT_RADIUS;
    const rawY  = center.top  + Math.sin(angle) * ORBIT_RADIUS;
    return {
      x: Math.max(40, Math.min(rawX, window.innerWidth  - 40)),
      y: Math.max(40, Math.min(rawY, window.innerHeight - 40)),
    };
  }, [selectedIndex, actions.length, center]);

  if (!open && !frozenCenter) return null;

  return (
    <Portal>
      {/* Backdrop */}
      <Backdrop
        open={open}
        onClick={onClose}
        sx={{ zIndex: 1398, bgcolor: 'rgba(0,0,0,.10)' }}
      />

      {/* Action chips */}
      {actions.length > 0 && actions.map((action, index) => (
        <ActionChip
          key={action.id}
          action={action}
          index={index}
          total={actions.length}
          center={center}
          visible={open}
          tenantId={tenantId}
          selected={selectedIndex === index}
          onSelect={(a) => { onSelect(a); onClose(); }}
        />
      ))}

      {/* OL: Label micro sotto chip selezionato */}
      {selectedChipPos && open && (
        <Typography
          variant="labelSmall"
          sx={{
            position:      'fixed',
            left:          selectedChipPos.x,
            top:           selectedChipPos.y + 30,
            transform:     'translateX(-50%)',
            opacity:       0.75,
            zIndex:        1400,
            pointerEvents: 'none',
            whiteSpace:    'nowrap',
            color:         'var(--md-sys-color-on-surface)',
          }}
        >
          {actions[selectedIndex]?.label}
        </Typography>
      )}

      {/* Nessuna azione disponibile */}
      {actions.length === 0 && open && (
        <Box
          role="status"
          sx={{
            position:  'fixed',
            left:      center.left,
            top:       center.top - ORBIT_RADIUS / 2,
            transform: 'translate(-50%, -50%)',
            zIndex:    1400,
            bgcolor:   'var(--md-sys-color-surface)',
            border:    '1px solid var(--md-sys-color-outline-variant)',
            borderRadius: 2,
            px: 2, py: 1,
            animation: `thumbOrbitIn ${ANIM_DURATION}ms cubic-bezier(.34,1.56,.64,1) both`,
          }}
        >
          <Typography
            variant="labelSmall"
            sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            Nessuna azione
          </Typography>
        </Box>
      )}

      {/* FAB centrale — anchor visivo + close */}
      <Fab
        size="small"
        color="primary"
        aria-label={open ? 'Chiudi menu azioni' : 'Apri menu azioni'}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={onClose}
        sx={{
          position:  'fixed',
          left:      center.left,
          top:       center.top,
          transform: 'translate(-50%, -50%)',
          zIndex:    1401,
          width:     FAB_SIZE,
          height:    FAB_SIZE,
          minHeight: 'unset',
          bgcolor:   open
            ? 'var(--md-sys-color-error)'
            : 'var(--md-sys-color-primary)',
          color:     'var(--md-sys-color-on-primary)',
          boxShadow: '0 2px 8px rgba(0,0,0,.18)',
          transition: 'background-color 160ms ease, transform 120ms ease',
          '&:hover': {
            transform: 'translate(-50%, -50%) scale(1.04)',
            filter:    'brightness(1.08)',
          },
        }}
      >
        {open
          ? <CloseIcon sx={{ fontSize: 'var(--md-sys-icon-size-md, 24px)' }} />
          : <TouchAppOutlinedIcon sx={{ fontSize: 'var(--md-sys-icon-size-md, 24px)' }} />
        }
      </Fab>
    </Portal>
  );
}

/**
 * OrbitNudgeCard — non-intrusive floating suggestion card.
 *
 * Appears above the OrbitDock FAB when OrbitNudgeEngine fires a nudge.
 * Single primary action: run the top suggestion and open the chat.
 * Always dismissable without triggering any action.
 *
 * Placement: fixed, bottom-right, stacked above the Orbit FAB.
 * MD3 Gold Compliant — no hardcoded colours, spacing, or z-index values.
 */

import React from 'react';
import Box       from '@mui/material/Box';
import Button    from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Collapse  from '@mui/material/Collapse';

import CloseIcon          from '@mui/icons-material/Close';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';

import type { OrbitSuggestion } from '@/modules/orbit/OrbitSuggestionEngine';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface OrbitNudgeCardProps {
  /** Whether the card is currently visible. */
  visible:    boolean;
  /** Human-readable nudge reason (from NudgeEngine). */
  reason:     string;
  /** The top suggestion to feature. */
  suggestion: OrbitSuggestion | undefined;
  /** Called when the user clicks the primary action button. */
  onAccept:   () => void;
  /** Called when the user dismisses the nudge. */
  onDismiss:  () => void;
}

// ── Positioning ────────────────────────────────────────────────────────────────

/**
 * Card sits directly above the OrbitDock FAB.
 * FAB stack = 24 (base) + 56 (sat) + 8 + 56 (chat) + 8 + 56 (dock) + 8 = 216px from bottom.
 */
const CARD_BOTTOM = 'calc(var(--md-sys-spacing-6, 24px) + 56px + 8px + 56px + 8px + 56px + 12px)';
const CARD_RIGHT  = 'var(--md-sys-spacing-6, 24px)';

// ── Component ──────────────────────────────────────────────────────────────────

export function OrbitNudgeCard({
  visible,
  reason,
  suggestion,
  onAccept,
  onDismiss,
}: OrbitNudgeCardProps): React.ReactElement {
  if (!suggestion) return <></>;

  return (
    <Collapse in={visible} unmountOnExit timeout={200}>
      <Box
        role="status"
        aria-live="polite"
        aria-atomic="true"
        sx={{
          position:    'fixed',
          bottom:      CARD_BOTTOM,
          right:       CARD_RIGHT,
          zIndex:      'var(--md-sys-z-index-fab, 1050)',
          width:       'min(280px, calc(100vw - var(--md-sys-spacing-8, 32px)))',
          bgcolor:     'var(--md-sys-color-surface-container-high)',
          color:       'var(--md-sys-color-on-surface)',
          borderRadius: 'var(--md-sys-shape-corner-large, 16px)',
          boxShadow:   'none',
          border:       '1px solid',
          borderColor:  'var(--md-sys-color-outline-variant)',
          overflow:    'hidden',
          // Subtle entrance animation via transform
          animation:   'orbitNudgeSlideIn 0.22s ease-out both',
          '@keyframes orbitNudgeSlideIn': {
            from: { opacity: 0, transform: 'translateY(12px) scale(0.97)' },
            to:   { opacity: 1, transform: 'translateY(0) scale(1)' },
          },
        }}
      >
        {/* ── Header ── */}
        <Box
          sx={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            px:             'var(--md-sys-spacing-3, 12px)',
            pt:             'var(--md-sys-spacing-2, 8px)',
            pb:             'var(--md-sys-spacing-1, 4px)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-1, 4px)' }}>
            <TipsAndUpdatesIcon
              aria-hidden="true"
              sx={{
                fontSize: 'var(--md-sys-icon-size-sm, 20px)',
                color:    'var(--md-sys-color-primary)',
              }}
            />
            <Typography
              variant="labelSmall"
              component="span"
              sx={{
                color:      'var(--md-sys-color-primary)',
                fontWeight: 'var(--md-sys-typescale-weight-semibold)',
              }}
            >
              Orbit
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={onDismiss}
            aria-label="Ignora suggerimento Orbit"
            sx={{ color: 'var(--md-sys-color-on-surface-variant)', p: '2px' }}
          >
            <CloseIcon sx={{ fontSize: 'var(--md-sys-icon-size-xs, 16px)' }} aria-hidden="true" />
          </IconButton>
        </Box>

        {/* ── Reason text ── */}
        <Typography
          variant="bodySmall"
          component="p"
          sx={{
            px:         'var(--md-sys-spacing-3, 12px)',
            pb:         'var(--md-sys-spacing-2, 8px)',
            color:      'var(--md-sys-color-on-surface-variant)',
            lineHeight: 1.4,
          }}
        >
          💡 {reason}
        </Typography>

        {/* ── Action button ── */}
        <Box
          sx={{
            px: 'var(--md-sys-spacing-3, 12px)',
            pb: 'var(--md-sys-spacing-3, 12px)',
          }}
        >
          <Button
            variant="contained"
            fullWidth
            onClick={onAccept}
            aria-label={suggestion.label}
            disableElevation
            sx={{
              textTransform: 'none',
              borderRadius:  'var(--md-sys-shape-corner-medium, 12px)',
              fontWeight:    'var(--md-sys-typescale-weight-medium)',
              fontSize:      'var(--md-sys-typescale-label-medium-font-size, 0.75rem)',
              justifyContent: 'flex-start',
              bgcolor:       'var(--md-sys-color-secondary-container)',
              color:         'var(--md-sys-color-on-secondary-container)',
              '&:hover': {
                bgcolor: 'var(--md-sys-color-secondary)',
                color:   'var(--md-sys-color-on-secondary)',
              },
              '&:focus-visible': {
                outline:       '2px solid',
                outlineColor:  'var(--md-sys-color-primary)',
                outlineOffset: 2,
              },
            }}
          >
            {suggestion.label}
          </Button>
        </Box>
      </Box>
    </Collapse>
  );
}

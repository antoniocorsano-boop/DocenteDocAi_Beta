/**
 * SuggestionBanner — MD3 Gold compliant inline contextual suggestion.
 *
 * Shown at the top of the viewport when the system has an actionable
 * suggestion for the teacher (e.g., "Add students", "Plan first UDA").
 * Driven by analyzeSystemState() → activeSuggestion in useSystemStore.
 *
 * Roadmap: #16 — Intelligenza interna contestuale
 */
import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Slide from '@mui/material/Slide';
import type { SystemSuggestion } from '../types';

interface SuggestionBannerProps {
  suggestion: SystemSuggestion;
  /** Called when the primary action button is tapped. */
  onAction: () => void;
  /** Called when the dismiss (×) button is tapped. */
  onDismiss: () => void;
}

/**
 * Full-width, accessible banner rendered above the main layout.
 * Uses secondary-container colour pair from MD3 token palette.
 */
const SuggestionBanner: React.FC<SuggestionBannerProps> = ({
  suggestion,
  onAction,
  onDismiss,
}) => (
  <Slide in direction="down" mountOnEnter unmountOnExit>
    <Box
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 'var(--md-sys-spacing-6)',
        py: 'var(--md-sys-spacing-3)',
        bgcolor: 'var(--md-sys-color-secondary-container)',
        color: 'var(--md-sys-color-on-secondary-container)',
        gap: 'var(--md-sys-spacing-4)',
        flexWrap: 'wrap',
        // Elevate slightly above layout without custom box-shadow
        position: 'relative',
        zIndex: 'var(--md-sys-z-index-banner, 800)',
      }}
    >
      {/* Icon + Message */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--md-sys-spacing-3)',
          flex: 1,
          minWidth: 0,
        }}
      >
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{ fontSize: 20, flexShrink: 0 }}
        >
          lightbulb
        </Box>
        <Typography
          variant="body2"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 'var(--md-sys-typescale-weight-medium)',
          }}
        >
          {suggestion.message}
        </Typography>
      </Box>

      {/* Actions */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--md-sys-spacing-2)',
          flexShrink: 0,
        }}
      >
        <Button
          size="small"
          variant="contained"
          disableElevation
          aria-label={suggestion.actionLabel}
          onClick={onAction}
          sx={{
            bgcolor: 'var(--md-sys-color-secondary)',
            color: 'var(--md-sys-color-on-secondary)',
            borderRadius: 'var(--md-sys-shape-corner-full)',
            textTransform: 'none',
            '&:hover': { bgcolor: 'var(--md-sys-color-secondary)' },
          }}
        >
          {suggestion.actionLabel}
        </Button>
        <IconButton
          size="small"
          aria-label="Chiudi suggerimento"
          onClick={onDismiss}
          sx={{ color: 'var(--md-sys-color-on-secondary-container)' }}
        >
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ fontSize: 18 }}
          >
            close
          </Box>
        </IconButton>
      </Box>
    </Box>
  </Slide>
);

export default SuggestionBanner;

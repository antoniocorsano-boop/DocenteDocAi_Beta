/**
 * MaturitaSectionWrapper.tsx — Wrapper collassabile per sezione Maturità AI
 *
 * Header con:
 *   - Icona + titolo sezione
 *   - SectionBadge (score + stato)
 *   - IconButton expand/collapse
 *
 * Body: `Collapse` MUI che racchiude il contenuto della sezione.
 * Chiama store.actions.toggleSection(id) per persistere lo stato collapsed.
 *
 * MD3 Gold Compliant — M3Surface + solo token MD3.
 */
import React from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import M3Surface from '../../ui/M3Surface';
import SectionBadge from './SectionBadge';
import type { MaturitaSection, SectionId } from '../../../types/aiMaturita.types';

// ── helpers ───────────────────────────────────────────────────────────────────

function tok(name: string) {
  return `var(--md-sys-color-${name})`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface MaturitaSectionWrapperProps {
  section: MaturitaSection;
  onToggle: (id: SectionId) => void;
  children: React.ReactNode;
  /** Icona MUI come elemento React già costruito */
  icon?: React.ReactNode;
}

const MaturitaSectionWrapper: React.FC<MaturitaSectionWrapperProps> = ({
  section,
  onToggle,
  children,
  icon,
}) => {
  const isExpanded = !section.collapsed;
  const criticalBlockers = section.blockers.filter((b) => b.severita === 'critica').length;

  return (
    <M3Surface
      elevation={2}
      sx={{
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        border: criticalBlockers > 0
          ? `1px solid ${tok('error-container')}`
          : `1px solid ${tok('outline-variant')}`,
        overflow: 'hidden',
      }}
    >
      {/* Header sezione */}
      <Box
        component="button"
        onClick={() => onToggle(section.id)}
        aria-expanded={isExpanded}
        aria-controls={`maturita-section-${section.id}-content`}
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--md-sys-spacing-3)',
          p: 'var(--md-sys-spacing-3)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          '&:hover': {
            backgroundColor: tok('surface-container-low'),
          },
          '&:focus-visible': {
            outline: `2px solid ${tok('primary')}`,
            outlineOffset: -2,
          },
        }}
      >
        {/* Icon */}
        {icon && (
          <Box
            sx={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: tok('primary'),
            }}
            aria-hidden
          >
            {icon}
          </Box>
        )}

        {/* Title + badge */}
        <Stack flex={1} spacing={0.5}>
          <Typography
            variant="titleSmall"
            component="span"
            sx={{ color: tok('on-surface'), fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}
          >
            {section.label}
          </Typography>
          {section.blockers.length > 0 && (
            <Typography
              variant="labelSmall"
              component="span"
              sx={{ color: criticalBlockers > 0 ? tok('error') : tok('on-surface-variant') }}
            >
              {section.blockers.length} blocker{section.blockers.length > 1 ? 's' : ''}
              {criticalBlockers > 0 ? ` (${criticalBlockers} critico${criticalBlockers > 1 ? 'i' : ''})` : ''}
            </Typography>
          )}
        </Stack>

        <SectionBadge section={section} showScore />

        <IconButton
          size="small"
          component="span"
          tabIndex={-1}
          aria-hidden
          sx={{ color: tok('on-surface-variant'), ml: 'var(--md-sys-spacing-1)' }}
        >
          {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>

      {/* Collapsible content */}
      <Collapse
        in={isExpanded}
        timeout="auto"
        unmountOnExit
        id={`maturita-section-${section.id}-content`}
      >
        <Box
          sx={{
            px: 'var(--md-sys-spacing-3)',
            pb: 'var(--md-sys-spacing-3)',
            borderTop: `1px solid ${tok('outline-variant')}`,
            pt: 'var(--md-sys-spacing-3)',
          }}
        >
          {children}
        </Box>
      </Collapse>
    </M3Surface>
  );
};

export default MaturitaSectionWrapper;

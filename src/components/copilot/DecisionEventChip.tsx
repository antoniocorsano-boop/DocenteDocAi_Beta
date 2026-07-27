/**
 * DecisionEventChip.tsx — Sprint 12: Status badge for DecisionEvent.
 *
 * Renders a compact MD3 chip communicating:
 *   - result status:  ✅ eseguito | ⏳ in attesa | ⚠️ bloccato
 *   - compliance:     red border when complianceImpact === 'high'
 *   - anomaly:        pulsing outline when isAnomaly === true
 *   - source:         icon indicating user / copilot / system origin
 *
 * @example
 * <DecisionEventChip result="executed" complianceImpact="high" source="copilot" />
 */

import React from 'react';
import Box   from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { DecisionResult, DecisionSource }
  from '../../cognition/decisionTimeline';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  result:              DecisionResult;
  source:              DecisionSource;
  complianceImpact?:   'none' | 'low' | 'high';
  isAnomaly?:          boolean;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const RESULT_BG: Record<DecisionResult, string> = {
  executed:         'var(--md-sys-color-primary-container)',
  blocked:          'var(--md-sys-color-error-container)',
  pending_approval: 'var(--md-sys-color-tertiary-container)',
};

const RESULT_FG: Record<DecisionResult, string> = {
  executed:         'var(--md-sys-color-on-primary-container)',
  blocked:          'var(--md-sys-color-on-error-container)',
  pending_approval: 'var(--md-sys-color-on-tertiary-container)',
};

const RESULT_ICON: Record<DecisionResult, string> = {
  executed:         'check_circle',
  blocked:          'cancel',
  pending_approval: 'hourglass_top',
};

const RESULT_LABEL: Record<DecisionResult, string> = {
  executed:         'Eseguito',
  blocked:          'Bloccato',
  pending_approval: 'In attesa',
};

const SOURCE_ICON: Record<DecisionSource, string> = {
  user:    'person',
  copilot: 'psychology',
  system:  'settings_suggest',
};

const SOURCE_LABEL: Record<DecisionSource, string> = {
  user:    'Utente',
  copilot: 'Copilot',
  system:  'Sistema',
};

// ─── Component ────────────────────────────────────────────────────────────────

const DecisionEventChip: React.FC<Props> = ({
  result,
  source,
  complianceImpact = 'none',
  isAnomaly        = false,
}) => {
  const bg   = RESULT_BG[result];
  const fg   = RESULT_FG[result];
  const icon = RESULT_ICON[result];

  const borderColor = isAnomaly
    ? 'var(--md-sys-color-error)'
    : complianceImpact === 'high'
      ? 'var(--md-sys-color-tertiary)'
      : 'transparent';

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap="var(--md-sys-spacing-1)"
      role="status"
      aria-label={`${RESULT_LABEL[result]} da ${SOURCE_LABEL[source]}${isAnomaly ? ' — anomalia rilevata' : ''}`}
    >
      {/* Result chip */}
      <Box
        sx={{
          display:         'inline-flex',
          alignItems:      'center',
          gap:             'var(--md-sys-spacing-05)',
          px:              'var(--md-sys-spacing-2)',
          py:              'var(--md-sys-spacing-05)',
          borderRadius:    'var(--md-sys-shape-corner-full)',
          backgroundColor: bg,
          border:          `1.5px solid ${borderColor}`,
          animation:       isAnomaly ? 'pulse-border 1.6s ease-in-out infinite' : 'none',
          '@keyframes pulse-border': {
            '0%, 100%': { borderColor: 'var(--md-sys-color-error)' },
            '50%':      { borderColor: 'transparent' },
          },
        }}
      >
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{ fontSize: 'var(--md-sys-icon-size-xs)', color: fg }}
        >
          {icon}
        </Box>
        <Typography
          component="span"
          variant="labelSmall"
          sx={{ color: fg, fontWeight: 'var(--md-sys-typescale-weight-medium)', lineHeight: 1 }}
        >
          {RESULT_LABEL[result]}
        </Typography>
      </Box>

      {/* Source chip */}
      <Box
        sx={{
          display:         'inline-flex',
          alignItems:      'center',
          gap:             'var(--md-sys-spacing-05)',
          px:              'var(--md-sys-spacing-2)',
          py:              'var(--md-sys-spacing-05)',
          borderRadius:    'var(--md-sys-shape-corner-full)',
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
        }}
      >
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{
            fontSize: 'var(--md-sys-icon-size-xs)',
            color:    'var(--md-sys-color-on-surface-variant)',
          }}
        >
          {SOURCE_ICON[source]}
        </Box>
        <Typography
          component="span"
          variant="labelSmall"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1 }}
        >
          {SOURCE_LABEL[source]}
        </Typography>
      </Box>

      {/* High compliance tag */}
      {complianceImpact === 'high' && (
        <Box
          sx={{
            display:         'inline-flex',
            alignItems:      'center',
            gap:             'var(--md-sys-spacing-05)',
            px:              'var(--md-sys-spacing-2)',
            py:              'var(--md-sys-spacing-05)',
            borderRadius:    'var(--md-sys-shape-corner-full)',
            backgroundColor: 'var(--md-sys-color-tertiary-container)',
          }}
        >
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{
              fontSize: 'var(--md-sys-icon-size-xs)',
              color:    'var(--md-sys-color-on-tertiary-container)',
            }}
          >
            gavel
          </Box>
          <Typography
            component="span"
            variant="labelSmall"
            sx={{
              color:      'var(--md-sys-color-on-tertiary-container)',
              fontWeight: 'var(--md-sys-typescale-weight-medium)',
              lineHeight: 1,
            }}
          >
            Normativa
          </Typography>
        </Box>
      )}
    </Stack>
  );
};

export default DecisionEventChip;

/**
 * ExplainabilityPanel.tsx — Sprint 15: AI Transparency UI.
 *
 * Renders a full "perché questo suggerimento?" transparency card for a
 * CopilotBrain recommendation. Conforms to MD3 Gold compliance.
 *
 * Props:
 *   explanation  — ActionExplanation from explainAction(rankedAction).
 *                  If null, renders nothing.
 *   onClose?     — optional callback to dismiss/collapse the panel.
 *
 * Sections rendered:
 *   1. Headline + confidence bar
 *   2. Reasons list (ordered, most influential first)
 *   3. Data sources (chip row)
 *   4. Optional normativeRef badge
 */

import React from 'react';
import Box        from '@mui/material/Box';
import Stack      from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip       from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import Divider    from '@mui/material/Divider';
import M3Surface  from '../ui/M3Surface';
import type { ActionExplanation } from '../../cognition/explainAction';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  explanation: ActionExplanation | null;
  onClose?:    () => void;
}

// ─── Confidence label helper ──────────────────────────────────────────────────

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return 'Alta';
  if (confidence >= 0.5) return 'Media';
  return 'Bassa';
}

function confidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'var(--md-sys-color-primary)';
  if (confidence >= 0.5) return 'var(--md-sys-color-tertiary)';
  return 'var(--md-sys-color-secondary)';
}

// ─── Component ────────────────────────────────────────────────────────────────

const ExplainabilityPanel: React.FC<Props> = ({ explanation, onClose }) => {
  if (!explanation) return null;

  const pct        = Math.round(explanation.confidence * 100);
  const confLabel  = confidenceLabel(explanation.confidence);
  const confColor  = confidenceColor(explanation.confidence);

  return (
    <M3Surface
      elevation={1}
      sx={{
        borderRadius: 'var(--md-sys-shape-corner-large)',
        p: 'var(--md-sys-spacing-4)',
        borderLeft: `3px solid ${confColor}`,
      }}
    >
      <Stack gap="var(--md-sys-spacing-3)">

        {/* ── Header ── */}
        <Stack direction="row" alignItems="flex-start" gap="var(--md-sys-spacing-2)">
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{
              fontSize: 'var(--md-sys-icon-size-md)',
              color: 'var(--md-sys-color-secondary)',
              flexShrink: 0,
              mt: '1px',
            }}
          >
            psychology
          </Box>

          <Stack gap="var(--md-sys-spacing-1)" flexGrow={1} minWidth={0}>
            <Typography
              variant="labelMedium"
              sx={{ color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              Trasparenza AI
            </Typography>
            <Typography
              variant="bodyMedium"
              sx={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              {explanation.headline}
            </Typography>
          </Stack>

          {onClose && (
            <IconButton
              size="small"
              onClick={onClose}
              aria-label="Chiudi spiegazione"
              sx={{ flexShrink: 0 }}
            >
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}
              >
                close
              </Box>
            </IconButton>
          )}
        </Stack>

        {/* ── Confidence bar ── */}
        <Stack gap="var(--md-sys-spacing-1)">
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Confidenza del suggerimento
            </Typography>
            <Typography
              variant="labelSmall"
              sx={{ color: confColor, fontWeight: 'var(--md-sys-typescale-label-small-weight)' }}
            >
              {confLabel} · {pct}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={pct}
            aria-label={`Confidenza ${pct}%`}
            sx={{
              height: 6,
              borderRadius: 'var(--md-sys-shape-corner-full)',
              bgcolor: 'var(--md-sys-color-surface-container-high)',
              '& .MuiLinearProgress-bar': {
                bgcolor: confColor,
                borderRadius: 'var(--md-sys-shape-corner-full)',
              },
            }}
          />
        </Stack>

        <Divider sx={{ borderColor: 'var(--md-sys-color-outline-variant)' }} />

        {/* ── Reasons list ── */}
        <Stack gap="var(--md-sys-spacing-2)">
          <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Fattori determinanti
          </Typography>
          <Stack component="ul" gap="var(--md-sys-spacing-2)" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {explanation.reasons.map((reason, idx) => (
              <Box
                key={idx}
                component="li"
                sx={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--md-sys-spacing-2)' }}
              >
                <Box
                  component="span"
                  className="material-symbols-outlined"
                  aria-hidden="true"
                  sx={{
                    fontSize: 'var(--md-sys-icon-size-xs)',
                    color: idx === 0 ? confColor : 'var(--md-sys-color-on-surface-variant)',
                    mt: '2px',
                    flexShrink: 0,
                  }}
                >
                  {idx === 0 ? 'priority_high' : 'check_circle'}
                </Box>
                <Typography
                  variant="bodySmall"
                  sx={{
                    color: idx === 0
                      ? 'var(--md-sys-color-on-surface)'
                      : 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  {reason}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Stack>

        {/* ── Data sources ── */}
        <Stack gap="var(--md-sys-spacing-2)">
          <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Dati consultati
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--md-sys-spacing-2)' }}>
            {explanation.dataUsed.map((source) => (
              <Chip
                key={source}
                label={source}
                size="small"
                sx={{
                  bgcolor: 'var(--md-sys-color-surface-container)',
                  color:   'var(--md-sys-color-on-surface-variant)',
                  fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                  height:  'auto',
                  py:      'var(--md-sys-spacing-1)',
                  '& .MuiChip-label': { px: 'var(--md-sys-spacing-2)' },
                }}
              />
            ))}
          </Box>
        </Stack>

        {/* ── Normative reference (conditional) ── */}
        {explanation.normativeRef && (
          <Box
            sx={{
              p: 'var(--md-sys-spacing-2) var(--md-sys-spacing-3)',
              borderRadius: 'var(--md-sys-shape-corner-small)',
              bgcolor: 'var(--md-sys-color-tertiary-container)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--md-sys-spacing-2)',
            }}
          >
            <Box
              component="span"
              className="material-symbols-outlined"
              aria-hidden="true"
              sx={{ fontSize: 'var(--md-sys-icon-size-xs)', color: 'var(--md-sys-color-on-tertiary-container)', mt: '2px', flexShrink: 0 }}
            >
              gavel
            </Box>
            <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-tertiary-container)' }}>
              {explanation.normativeRef}
            </Typography>
          </Box>
        )}

      </Stack>
    </M3Surface>
  );
};

export default ExplainabilityPanel;

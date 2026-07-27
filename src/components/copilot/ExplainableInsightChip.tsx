/**
 * ExplainableInsightChip.tsx — "Perché?" explainability button (FASE 3)
 *
 * A small MD3 chip/popover that shows the AI reasoning behind any suggestion.
 * Drop it next to any AISuggestion label for instant explainability.
 *
 * @example
 * <ExplainableInsightChip explanation={suggestion.explanation} />
 */
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import type { AIExplanation } from '../../ai/contextEngine/types';
import { logAIExplanationOpened } from '../../ai/telemetry/aiTelemetry';

interface ExplainableInsightChipProps {
  explanation: AIExplanation | undefined;
  /** Suggestion ID for telemetry (optional — falls back to explanation reason hash) */
  suggestionId?: string;
  /** Optional label override (default: "Perché?") */
  label?: string;
}

export default function ExplainableInsightChip({
  explanation,
  suggestionId,
  label = 'Perché?',
}: ExplainableInsightChipProps): JSX.Element | null {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  if (!explanation) return null;

  function handleOpen(e: React.MouseEvent<HTMLElement>): void {
    logAIExplanationOpened(suggestionId ?? explanation!.reason.slice(0, 40));
    setAnchor(e.currentTarget);
  }

  return (
    <>
      <Chip
        size="small"
        variant="outlined"
        label={label}
        aria-label="Mostra la spiegazione AI"
        onClick={handleOpen}
        icon={
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ fontSize: '14px !important' }}
          >
            help_outline
          </Box>
        }
        sx={{
          cursor: 'pointer',
          borderColor: 'var(--md-sys-color-tertiary)',
          color: 'var(--md-sys-color-tertiary)',
          '& .MuiChip-icon': { color: 'var(--md-sys-color-tertiary)' },
        }}
      />
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              maxWidth: 320,
              p: 2,
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              bgcolor: 'var(--md-sys-color-surface-container-high)',
            },
          },
        }}
      >
        <Stack spacing={1.5}>
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              component="span"
              className="material-symbols-outlined"
              aria-hidden="true"
              sx={{ fontSize: 18, color: 'var(--md-sys-color-tertiary)' }}
            >
              psychology
            </Box>
            <Typography
              variant="labelMedium"
              sx={{ color: 'var(--md-sys-color-tertiary)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}
            >
              Motivazione AI
            </Typography>
          </Stack>

          <Divider />

          {/* Reason */}
          <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
            {explanation.reason}
          </Typography>

          {/* Bullet evidence */}
          {explanation.bulletPoints.length > 0 && (
            <Stack spacing={0.5}>
              {explanation.bulletPoints.map((point, i) => (
                <Typography
                  key={i}
                  variant="body2"
                  sx={{ display: 'flex', gap: 0.5, color: 'var(--md-sys-color-on-surface-variant)' }}
                >
                  <Box
                    component="span"
                    className="material-symbols-outlined"
                    aria-hidden="true"
                    sx={{ fontSize: 14, mt: '2px', color: 'var(--md-sys-color-secondary)' }}
                  >
                    arrow_right
                  </Box>
                  {point}
                </Typography>
              ))}
            </Stack>
          )}

          {/* Source data summary */}
          {explanation.sourceData && (
            <>
              <Divider />
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {explanation.sourceData.average !== undefined && (
                  <Chip
                    size="small"
                    label={`Media: ${explanation.sourceData.average.toFixed(1)}`}
                    variant="filled"
                    sx={{ bgcolor: 'var(--md-sys-color-surface-container)' }}
                  />
                )}
                {explanation.sourceData.sampleCount !== undefined && (
                  <Chip
                    size="small"
                    label={`${explanation.sourceData.sampleCount} valutazioni`}
                    variant="filled"
                    sx={{ bgcolor: 'var(--md-sys-color-surface-container)' }}
                  />
                )}
                {explanation.sourceData.trend && (
                  <Chip
                    size="small"
                    label={
                      explanation.sourceData.trend === 'declining'
                        ? 'Trend ↓'
                        : explanation.sourceData.trend === 'improving'
                          ? 'Trend ↑'
                          : 'Trend stabile'
                    }
                    variant="filled"
                    color={
                      explanation.sourceData.trend === 'declining'
                        ? 'error'
                        : explanation.sourceData.trend === 'improving'
                          ? 'success'
                          : 'default'
                    }
                  />
                )}
              </Box>
            </>
          )}
        </Stack>
      </Popover>
    </>
  );
}

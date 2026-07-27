/**
 * AIExplainabilityPanel.tsx — Per-suggestion explainability view (Sprint 4)
 *
 * Displays a structured breakdown of each AI suggestion:
 *   • Confidence gauge bar
 *   • Reasoning (one-sentence summary)
 *   • Supporting evidence bullet points
 *   • Source data metrics (average, trend, counts, subjects)
 *   • Trend direction chip
 *
 * Supports two display modes controlled by the `compact` prop:
 *   - normal: expandable accordion rows (default)
 *   - compact: inline chips + popover (same as ExplainableInsightChip)
 *
 * Fires `logAIExplanationOpened` on each row expansion for telemetry.
 * Fully type-safe; no `any`.
 */
import React, { useMemo, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Collapse from '@mui/material/Collapse';
import Alert from '@mui/material/Alert';
import ButtonBase from '@mui/material/ButtonBase';

import type { AISuggestion, AIExplanation, SuggestionType } from '../../ai/contextEngine/types';
import { logAIExplanationOpened } from '../../ai/telemetry/aiTelemetry';

// ── type helpers ──────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<SuggestionType, string> = {
  student_at_risk: 'A rischio',
  student_excellence: 'Eccellenza',
  missing_assessment: 'Valutazione mancante',
  learning_gap: 'Difficoltà apprendimento',
};

const TYPE_COLOR: Record<SuggestionType, string> = {
  student_at_risk: 'var(--md-sys-color-error)',
  student_excellence: 'var(--md-sys-color-tertiary)',
  missing_assessment: 'var(--md-sys-color-secondary)',
  learning_gap: 'var(--md-sys-color-primary)',
};

const TYPE_ICON: Record<SuggestionType, string> = {
  student_at_risk: 'person_alert',
  student_excellence: 'star',
  missing_assessment: 'assignment_late',
  learning_gap: 'menu_book',
};

const TREND_LABEL: Record<string, string> = {
  declining: 'In calo',
  stable: 'Stabile',
  improving: 'In miglioramento',
};

const TREND_ICON: Record<string, string> = {
  declining: 'trending_down',
  stable: 'trending_flat',
  improving: 'trending_up',
};

const TREND_COLOR: Record<string, string> = {
  declining: 'var(--md-sys-color-error)',
  stable: 'var(--md-sys-color-secondary)',
  improving: 'var(--md-sys-color-tertiary)',
};

// ── confidence gauge ──────────────────────────────────────────────────────────

interface ConfidenceGaugeProps {
  confidence: number;
}

const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ confidence }) => {
  const pct = Math.round(confidence * 100);
  const color =
    pct >= 80
      ? 'var(--md-sys-color-error)'
      : pct >= 50
      ? 'var(--md-sys-color-secondary)'
      : 'var(--md-sys-color-on-surface-variant)';

  return (
    <Stack spacing={0.5} sx={{ minWidth: 80 }}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Confidenza
        </Typography>
        <Typography variant="labelSmall" sx={{ color, fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>
          {pct}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        aria-label={`Confidenza: ${pct}%`}
        sx={{
          height: 5,
          borderRadius: 'var(--md-sys-shape-corner-full)',
          bgcolor: 'var(--md-sys-color-surface-container)',
          '& .MuiLinearProgress-bar': {
            bgcolor: color,
            borderRadius: 'var(--md-sys-shape-corner-full)',
          },
        }}
      />
    </Stack>
  );
};

// ── source data table ─────────────────────────────────────────────────────────

interface SourceDataProps {
  sourceData: AIExplanation['sourceData'];
}

const SourceDataView: React.FC<SourceDataProps> = ({ sourceData }) => {
  const rows: Array<{ label: string; value: string }> = useMemo(() => {
    const out: Array<{ label: string; value: string }> = [];
    if (sourceData.average !== undefined) {
      out.push({ label: 'Media voti', value: sourceData.average.toFixed(1) });
    }
    if (sourceData.sampleCount !== undefined) {
      out.push({ label: 'Valutazioni analizzate', value: String(sourceData.sampleCount) });
    }
    if (sourceData.lowGradeCount !== undefined) {
      out.push({ label: 'Voti sotto 6', value: String(sourceData.lowGradeCount) });
    }
    if (sourceData.subjects && sourceData.subjects.length > 0) {
      out.push({ label: 'Materie coinvolte', value: sourceData.subjects.join(', ') });
    }
    return out;
  }, [sourceData]);

  if (rows.length === 0) return null;

  return (
    <Box
      sx={{
        p: 'var(--md-sys-spacing-3)',
        borderRadius: 'var(--md-sys-shape-corner-small)',
        bgcolor: 'var(--md-sys-color-surface-container)',
        border: '1px solid var(--md-sys-color-outline-variant)',
      }}
    >
      <Typography
        variant="labelSmall"
        sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 'var(--md-sys-spacing-2)', display: 'block' }}
      >
        Dati fonte
      </Typography>
      <Stack spacing={0.5}>
        {rows.map(({ label, value }) => (
          <Stack key={label} direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {label}
            </Typography>
            <Typography
              variant="labelSmall"
              sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}
            >
              {value}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

// ── expandable suggestion row ─────────────────────────────────────────────────

interface SuggestionRowProps {
  suggestion: AISuggestion;
  defaultExpanded?: boolean;
}

const SuggestionRow: React.FC<SuggestionRowProps> = ({ suggestion, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = useCallback(() => {
    if (!expanded) {
      logAIExplanationOpened(suggestion.id);
    }
    setExpanded((v) => !v);
  }, [expanded, suggestion.id]);

  const typeColor = TYPE_COLOR[suggestion.type];
  const typeIcon = TYPE_ICON[suggestion.type];
  const typeLabel = TYPE_LABEL[suggestion.type];
  const trendDir = suggestion.explanation?.sourceData?.trend;

  return (
    <Box
      sx={{
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        border: '1px solid var(--md-sys-color-outline-variant)',
        overflow: 'hidden',
      }}
    >
      {/* Header row — always visible */}
      <ButtonBase
        onClick={handleToggle}
        sx={{
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--md-sys-spacing-3)',
          p: 'var(--md-sys-spacing-3)',
          bgcolor: expanded ? 'var(--md-sys-color-surface-container)' : 'var(--md-sys-color-surface)',
          '&:hover': { bgcolor: 'var(--md-sys-color-surface-container-low)' },
          transition: 'background-color 0.15s',
        }}
        aria-expanded={expanded}
        aria-controls={`explanation-${suggestion.id}`}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ fontSize: 18, color: typeColor, flexShrink: 0 }}
          >
            {typeIcon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="labelMedium"
              sx={{ color: typeColor, fontWeight: 'var(--md-sys-typescale-weight-medium)', display: 'block' }}
            >
              {typeLabel}
              {suggestion.studentId && (
                <Typography component="span" variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', ml: 1 }}>
                  · {suggestion.studentId}
                </Typography>
              )}
            </Typography>
            <Typography
              variant="bodySmall"
              sx={{
                color: 'var(--md-sys-color-on-surface)',
                mt: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: expanded ? 'normal' : 'nowrap',
                maxWidth: '100%',
                display: 'block',
              }}
            >
              {suggestion.message}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
          {trendDir && (
            <Chip
              size="small"
              label={TREND_LABEL[trendDir] ?? trendDir}
              icon={
                <Box
                  component="span"
                  className="material-symbols-outlined"
                  aria-hidden="true"
                  sx={{ fontSize: '14px !important' }}
                >
                  {TREND_ICON[trendDir] ?? 'trending_flat'}
                </Box>
              }
              sx={{
                bgcolor: 'transparent',
                borderColor: TREND_COLOR[trendDir] ?? 'var(--md-sys-color-outline)',
                color: TREND_COLOR[trendDir] ?? 'var(--md-sys-color-on-surface-variant)',
                border: '1px solid',
              }}
            />
          )}
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{
              fontSize: 20,
              color: 'var(--md-sys-color-on-surface-variant)',
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}
          >
            expand_more
          </Box>
        </Stack>
      </ButtonBase>

      {/* Expandable detail panel */}
      <Collapse in={expanded} id={`explanation-${suggestion.id}`}>
        <Box
          sx={{
            p: 'var(--md-sys-spacing-4)',
            bgcolor: 'var(--md-sys-color-surface-container-low)',
            borderTop: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          <Stack spacing="var(--md-sys-spacing-4)">
            {/* Confidence */}
            <ConfidenceGauge confidence={suggestion.confidence} />

            {/* Explanation */}
            {suggestion.explanation ? (
              <>
                <Divider />
                <Box>
                  <Typography
                    variant="labelSmall"
                    sx={{ color: 'var(--md-sys-color-tertiary)', fontWeight: 'var(--md-sys-typescale-weight-bold)', mb: 'var(--md-sys-spacing-2)', display: 'block' }}
                  >
                    Motivazione AI
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)', lineHeight: 1.5 }}>
                    {suggestion.explanation.reason}
                  </Typography>
                </Box>

                {suggestion.explanation.bulletPoints.length > 0 && (
                  <Box>
                    <Typography
                      variant="labelSmall"
                      sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 'var(--md-sys-spacing-2)', display: 'block' }}
                    >
                      Evidenze
                    </Typography>
                    <Stack spacing={0.5}>
                      {suggestion.explanation.bulletPoints.map((point, i) => (
                        <Stack key={i} direction="row" spacing={0.5} alignItems="flex-start">
                          <Box
                            component="span"
                            className="material-symbols-outlined"
                            aria-hidden="true"
                            sx={{ fontSize: 14, color: 'var(--md-sys-color-secondary)', mt: '2px', flexShrink: 0 }}
                          >
                            arrow_right
                          </Box>
                          <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            {point}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                )}

                {Object.keys(suggestion.explanation.sourceData).length > 0 && (
                  <SourceDataView sourceData={suggestion.explanation.sourceData} />
                )}
              </>
            ) : (
              <Alert severity="info">
                Nessuna spiegazione dettagliata disponibile per questo suggerimento.
              </Alert>
            )}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
};

// ── main component ────────────────────────────────────────────────────────────

interface AIExplainabilityPanelProps {
  /** All AI suggestions to display */
  suggestions: AISuggestion[];
  /**
   * Filter by type — omit to show all.
   * @example filterTypes={['student_at_risk']}
   */
  filterTypes?: SuggestionType[];
  /**
   * Max suggestions to show before truncation.
   * @default 20
   */
  maxVisible?: number;
  /**
   * Whether to expand the first row by default.
   * @default false
   */
  defaultFirstExpanded?: boolean;
}

/**
 * AIExplainabilityPanel — renders every AI suggestion as an expandable row
 * with full explainability detail: confidence, reasoning, evidence, and
 * source metrics.
 *
 * @example
 * <AIExplainabilityPanel suggestions={aiPipeline.suggestions} filterTypes={['student_at_risk']} />
 */
export default function AIExplainabilityPanel({
  suggestions,
  filterTypes,
  maxVisible = 20,
  defaultFirstExpanded = false,
}: AIExplainabilityPanelProps): JSX.Element {
  const visible = useMemo(() => {
    let filtered = filterTypes
      ? suggestions.filter((s) => filterTypes.includes(s.type))
      : suggestions;
    // Sort by confidence descending
    filtered = [...filtered].sort((a, b) => b.confidence - a.confidence);
    return filtered.slice(0, maxVisible);
  }, [suggestions, filterTypes, maxVisible]);

  if (visible.length === 0) {
    return (
      <Alert
        severity="success"
        icon={
          <Box component="span" className="material-symbols-outlined" aria-hidden="true">
            verified
          </Box>
        }
      >
        Nessun suggerimento AI attivo per i filtri correnti.
      </Alert>
    );
  }

  return (
    <Stack spacing="var(--md-sys-spacing-3)" role="list" aria-label="Suggerimenti AI con spiegazione">
      {visible.map((s, i) => (
        <Box key={s.id} role="listitem">
          <SuggestionRow
            suggestion={s}
            defaultExpanded={defaultFirstExpanded && i === 0}
          />
        </Box>
      ))}
      {suggestions.length > maxVisible && (
        <Typography
          variant="bodySmall"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center', pt: 'var(--md-sys-spacing-2)' }}
        >
          Mostrando {maxVisible} di {suggestions.length} suggerimenti totali.
        </Typography>
      )}
    </Stack>
  );
}

/**
 * StudentInsightPanel.tsx — Explainable AI panel for a single student.
 *
 * Shows:
 *   • Risk score with semantic tier chip
 *   • Prediction confidence bar
 *   • Contributing factors (horizontal impact bars)
 *   • Narrative summary
 *
 * Designed to be embedded in a ClassroomView student row, a detail dialog,
 * or the AIInspectorPanel Explainability section.
 *
 * MD3 compliant — MUI v7 only.  No hardcoded colours, sizes or shadows.
 */
import React, { memo } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';

import type { SvgIconProps } from '@mui/material/SvgIcon';
import type { AIExplanation, RiskTier } from '../explainability/decisionExplainer';
import type { RiskFactor } from '../explainability/riskFactorAnalyzer';

// ── helpers ───────────────────────────────────────────────────────────────────

/** MD3 CSS token name → CSS `var()` */
function tok(name: string): string {
  return `var(--md-sys-color-${name})`;
}

const TIER_META: Record<RiskTier, {
  label: string;
  chipColor: string;
  chipBg: string;
  Icon: React.ComponentType<SvgIconProps>;
}> = {
  critical: {
    label: 'Critico',
    chipColor: tok('on-error-container'),
    chipBg: tok('error-container'),
    Icon: ErrorOutlineIcon,
  },
  at_risk: {
    label: 'A rischio',
    chipColor: tok('on-tertiary-container'),
    chipBg: tok('tertiary-container'),
    Icon: WarningAmberIcon,
  },
  watch: {
    label: 'Monitorare',
    chipColor: tok('on-secondary-container'),
    chipBg: tok('secondary-container'),
    Icon: VisibilityIcon,
  },
  safe: {
    label: 'Nella norma',
    chipColor: tok('on-primary-container'),
    chipBg: tok('primary-container'),
    Icon: CheckCircleOutlineIcon,
  },
};

/** Impact bar: a horizontal progress bar scaled 0–max (auto set to top factor) */
const FactorBar: React.FC<{ factor: RiskFactor; maxImpact: number }> = ({ factor, maxImpact }) => {
  const pct = maxImpact > 0 ? (factor.impact / maxImpact) * 100 : 0;

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Typography
            variant="bodySmall"
            sx={{ color: tok('on-surface'), fontWeight: 'var(--md-sys-typescale-weight-medium)' }}
          >
            {factor.label}
          </Typography>
          <Tooltip title={`${factor.description}  (rilevato: ${factor.evidence})`} arrow>
            <InfoOutlinedIcon
              fontSize="inherit"
              sx={{ color: tok('on-surface-variant'), cursor: 'help', fontSize: 16 }}
              aria-label={`Info: ${factor.label}`}
            />
          </Tooltip>
        </Stack>
        <Typography
          variant="labelSmall"
          sx={{ color: tok('on-surface-variant'), fontVariantNumeric: 'tabular-nums', ml: 1 }}
        >
          {Math.round(factor.impact * 100)} %
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        aria-label={`${factor.label}: ${Math.round(pct)}%`}
        sx={{
          height: 6,
          borderRadius: 'var(--md-sys-shape-corner-full)',
          bgcolor: tok('surface-container-highest'),
          '& .MuiLinearProgress-bar': {
            bgcolor: tok('tertiary'),
            borderRadius: 'var(--md-sys-shape-corner-full)',
          },
        }}
      />
    </Box>
  );
};

// ── confidence bar ────────────────────────────────────────────────────────────

const ConfidenceBar: React.FC<{ explanation: AIExplanation }> = ({ explanation }) => {
  const { score, label, colorToken } = explanation.confidence;

  const barColor = {
    primary:   tok('primary'),
    secondary: tok('secondary'),
    tertiary:  tok('tertiary'),
    error:     tok('error'),
    warning:   tok('tertiary'),
  }[colorToken] ?? tok('primary');

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
        <Typography variant="labelMedium" sx={{ color: tok('on-surface-variant') }}>
          Affidabilità previsione
        </Typography>
        <Typography
          variant="labelMedium"
          sx={{ color: barColor, fontVariantNumeric: 'tabular-nums' }}
        >
          {label} ({Math.round(score * 100)} %)
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={score * 100}
        aria-label={`Confidence: ${Math.round(score * 100)}%`}
        sx={{
          height: 8,
          borderRadius: 'var(--md-sys-shape-corner-full)',
          bgcolor: tok('surface-container-highest'),
          '& .MuiLinearProgress-bar': {
            bgcolor: barColor,
            borderRadius: 'var(--md-sys-shape-corner-full)',
          },
        }}
      />
    </Box>
  );
};

// ── risk score header ─────────────────────────────────────────────────────────

const RiskHeader: React.FC<{ explanation: AIExplanation }> = ({ explanation }) => {
  const { riskTier, riskScore } = explanation;
  const meta = TIER_META[riskTier];
  const { Icon } = meta;

  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <PsychologyAltIcon
          fontSize="small"
          sx={{ color: tok('tertiary') }}
          aria-hidden
        />
        <Typography variant="titleSmall" sx={{ color: tok('on-surface') }}>
          Risk Score
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography
          variant="titleLarge"
          sx={{
            color: meta.chipColor,
            fontVariantNumeric: 'tabular-nums',
          }}
          aria-label={`Risk score: ${Math.round(riskScore * 100)}%`}
        >
          {Math.round(riskScore * 100)} %
        </Typography>
        <Chip
          size="small"
          icon={<Icon fontSize="small" aria-hidden />}
          label={meta.label}
          sx={{
            bgcolor: meta.chipBg,
            color: meta.chipColor,
            fontWeight: 'var(--md-sys-typescale-weight-bold)',
            '& .MuiChip-icon': { color: 'inherit' },
          }}
        />
      </Stack>
    </Stack>
  );
};

// ── main export ───────────────────────────────────────────────────────────────

export interface StudentInsightPanelProps {
  explanation: AIExplanation;
  /** Max factors to display before truncating (default: 5) */
  maxFactors?: number;
}

const StudentInsightPanel: React.FC<StudentInsightPanelProps> = memo(({
  explanation,
  maxFactors = 5,
}) => {
  const visibleFactors = explanation.factors.slice(0, maxFactors);
  const maxImpact = visibleFactors[0]?.impact ?? 1;

  return (
    <Box
      sx={{
        p: 'var(--md-sys-spacing-4)',
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        bgcolor: tok('surface-container-low'),
        border: `1px solid ${tok('outline-variant')}`,
      }}
      role="region"
      aria-label="Analisi AI studente"
    >
      {/* ── Risk score ── */}
      <RiskHeader explanation={explanation} />

      <Box mt="var(--md-sys-spacing-4)">
        <ConfidenceBar explanation={explanation} />
      </Box>

      {/* ── Narrative ── */}
      <Box
        mt="var(--md-sys-spacing-4)"
        sx={{
          p: 'var(--md-sys-spacing-3)',
          borderRadius: 'var(--md-sys-shape-corner-small)',
          bgcolor: tok('surface-container'),
        }}
      >
        <Typography
          variant="bodySmall"
          sx={{ color: tok('on-surface-variant'), fontStyle: 'italic' }}
        >
          {explanation.narrative}
        </Typography>
      </Box>

      {/* ── Context stats ── */}
      {explanation.gradeAverage > 0 && (
        <Stack direction="row" spacing={2} mt="var(--md-sys-spacing-3)" flexWrap="wrap">
          <Typography variant="labelSmall" sx={{ color: tok('on-surface-variant') }}>
            Media:{' '}
            <Box component="span" sx={{ color: tok('on-surface'), fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>
              {explanation.gradeAverage.toFixed(1)}/10
            </Box>
          </Typography>
          {explanation.worstSubject && (
            <Typography variant="labelSmall" sx={{ color: tok('on-surface-variant') }}>
              Materia critica:{' '}
              <Box component="span" sx={{ color: tok('on-surface'), fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>
                {explanation.worstSubject}
              </Box>
            </Typography>
          )}
          <Typography variant="labelSmall" sx={{ color: tok('on-surface-variant') }}>
            Materie:{' '}
            <Box component="span" sx={{ color: tok('on-surface') }}>
              {explanation.subjectsCount}
            </Box>
          </Typography>
        </Stack>
      )}

      {/* ── Factors ── */}
      {visibleFactors.length > 0 && (
        <>
          <Divider sx={{ my: 'var(--md-sys-spacing-4)' }} />
          <Typography
            variant="labelLarge"
            sx={{ color: tok('on-surface-variant'), mb: 'var(--md-sys-spacing-3)', display: 'block' }}
          >
            Fattori contribuenti
          </Typography>
          <Stack spacing={1.5}>
            {visibleFactors.map(factor => (
              <FactorBar key={factor.id} factor={factor} maxImpact={maxImpact} />
            ))}
          </Stack>
          {explanation.factors.length > maxFactors && (
            <Typography
              variant="labelSmall"
              sx={{ color: tok('on-surface-variant'), mt: 1, fontStyle: 'italic' }}
            >
              +{explanation.factors.length - maxFactors} altri fattori non mostrati
            </Typography>
          )}
        </>
      )}

      {visibleFactors.length === 0 && explanation.gradeAverage > 0 && (
        <>
          <Divider sx={{ my: 'var(--md-sys-spacing-4)' }} />
          <Typography
            variant="bodySmall"
            sx={{ color: tok('on-surface-variant'), fontStyle: 'italic' }}
          >
            Nessun fattore di rischio rilevato.
          </Typography>
        </>
      )}
    </Box>
  );
});

StudentInsightPanel.displayName = 'StudentInsightPanel';
export default StudentInsightPanel;

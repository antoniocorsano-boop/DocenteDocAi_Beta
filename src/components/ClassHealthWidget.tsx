import React, { useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { InfoCard, AiMemoryChip } from './ui'
import type { Studente, Valutazione } from '../types'
// Fase 3 final batch: consolidate to AIBrain (user-centric health gesture)
import { AIBrain } from '../ai/brain/AIBrain'
import { computeClassHealthIndex } from '../ai/classHealth/classHealthIndex'
import type { ClassHealthIndex, HealthGrade } from '../ai/classHealth/types'

interface ClassHealthWidgetProps {
  /** Pre-computed result from useAIPipeline — skips internal computation */
  health?: ClassHealthIndex
  /** Required when health prop is not provided */
  students?: Studente[]
  /** Required when health prop is not provided */
  evaluations?: Valutazione[]
  className?: string
}

// ── Grade tokens ─────────────────────────────────────────────────────────────
const GRADE_META: Record<
  HealthGrade,
  { label: string; bg: string; fg: string; icon: string }
> = {
  ottimo: {
    label: 'OTTIMO',
    bg: 'var(--md-sys-color-tertiary-container)',
    fg: 'var(--md-sys-color-on-tertiary-container)',
    icon: 'sentiment_very_satisfied',
  },
  buono: {
    label: 'BUONO',
    bg: 'var(--md-sys-color-secondary-container)',
    fg: 'var(--md-sys-color-on-secondary-container)',
    icon: 'sentiment_satisfied',
  },
  sufficiente: {
    label: 'SUFFICIENTE',
    bg: 'var(--md-sys-color-surface-container-high)',
    fg: 'var(--md-sys-color-on-surface-variant)',
    icon: 'sentiment_neutral',
  },
  critico: {
    label: 'CRITICO',
    bg: 'var(--md-sys-color-error-container)',
    fg: 'var(--md-sys-color-on-error-container)',
    icon: 'sentiment_very_dissatisfied',
  },
}

// ── Dimension row ─────────────────────────────────────────────────────────────
const DimensionRow: React.FC<{
  label: string
  score: number
  detail: string
}> = ({ label, score, detail }) => {
  const fillColor =
    score >= 80
      ? 'var(--md-sys-color-tertiary)'
      : score >= 65
      ? 'var(--md-sys-color-secondary)'
      : score >= 50
      ? 'var(--md-sys-color-primary)'
      : 'var(--md-sys-color-error)'

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--md-sys-spacing-1)',
      }}
    >
      {/* Label row */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 'var(--md-sys-spacing-2)',
        }}
      >
        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          {label}
        </Typography>
        <Typography
          variant="labelSmall"
          sx={{
            color: 'var(--md-sys-color-on-surface)',
            fontWeight: 'var(--md-sys-typescale-weight-medium)',
            flexShrink: 0,
          }}
        >
          {score}
        </Typography>
      </Box>

      {/* Progress track */}
      <Box
        sx={{
          height: 'var(--md-sys-spacing-1)',
          borderRadius: 'var(--md-sys-shape-corner-full)',
          backgroundColor: 'var(--md-sys-color-surface-container-highest)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: `${score}%`,
            borderRadius: 'var(--md-sys-shape-corner-full)',
            backgroundColor: fillColor,
            transition: 'width 0.4s ease',
          }}
        />
      </Box>

      {/* Detail text */}
      <Typography
        variant="caption"
        sx={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.8 }}
      >
        {detail}
      </Typography>
    </Box>
  )
}

// ── Main widget ───────────────────────────────────────────────────────────────
const ClassHealthWidget: React.FC<ClassHealthWidgetProps> = ({
  health: healthProp,
  students = [],
  evaluations = [],
  className,
}) => {
  const computed = useMemo(() => {
    // Fase 3 final batch: use AIBrain central buildContext + health
    const aiCtx = AIBrain.buildContext({
      class: className || 'unknown',
      students,
      evaluations,
      source: 'class-health-widget'
    })
    return computeClassHealthIndex(aiCtx as Record<string, unknown>)
  }, [students, evaluations, className])
  // Use pipeline-provided result when available, otherwise compute locally.
  const health = healthProp ?? computed

  const meta = GRADE_META[health.grade]

  return (
    <InfoCard
      elevation={1}
      className={className}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--md-sys-spacing-4)',
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--md-sys-spacing-3)',
        }}
      >
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{ color: 'var(--md-sys-color-primary)' }}
        >
          monitor_heart
        </Box>
        <Typography
          variant="h6"
          sx={{ color: 'var(--md-sys-color-on-surface)', flex: 1 }}
        >
          Stato della Classe
        </Typography>
        <AiMemoryChip label="AI Health Index" />
      </Box>

      {/* Fase 3 final batch: Visible AIBrain (Fase 3) */}
      <Box sx={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', mb: 1, pl: 0.5 }}>
        AIBrain (Fase 3): ClassHealthWidget — buildContext + health via unified gateway
      </Box>

      {/* ── Score + grade badge ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--md-sys-spacing-4)',
        }}
      >
        <Typography
          variant="h2"
          sx={{
            color: 'var(--md-sys-color-on-surface)',
            fontWeight: 'var(--md-sys-typescale-weight-bold)',
            lineHeight: 1,
          }}
        >
          {health.score}
        </Typography>

        {/* Grade chip */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--md-sys-spacing-1)',
            backgroundColor: meta.bg,
            color: meta.fg,
            borderRadius: 'var(--md-sys-shape-corner-full)',
            paddingX: 'var(--md-sys-spacing-3)',
            paddingY: 'var(--md-sys-spacing-1)',
          }}
        >
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ fontSize: 'var(--md-sys-typescale-label-large-font-size)' }}
          >
            {meta.icon}
          </Box>
          <Typography
            variant="labelMedium"
            sx={{ fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}
          >
            {meta.label}
          </Typography>
        </Box>
      </Box>

      {/* ── Summary ── */}
      <Typography
        variant="body2"
        sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
      >
        {health.summary}
      </Typography>

      {/* ── Divider ── */}
      <Box
        sx={{
          height: '1px',
          backgroundColor: 'var(--md-sys-color-outline-variant)',
        }}
      />

      {/* ── Dimensions ── */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--md-sys-spacing-4)',
        }}
      >
        <DimensionRow
          label={health.dimensions.gradeAverage.label}
          score={health.dimensions.gradeAverage.score}
          detail={health.dimensions.gradeAverage.detail}
        />
        <DimensionRow
          label={health.dimensions.riskRatio.label}
          score={health.dimensions.riskRatio.score}
          detail={health.dimensions.riskRatio.detail}
        />
        <DimensionRow
          label={health.dimensions.assessmentCoverage.label}
          score={health.dimensions.assessmentCoverage.score}
          detail={health.dimensions.assessmentCoverage.detail}
        />
      </Box>
    </InfoCard>
  )
}

export default ClassHealthWidget

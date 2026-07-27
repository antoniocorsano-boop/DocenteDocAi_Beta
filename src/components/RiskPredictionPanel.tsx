import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { InfoCard, AiMemoryChip, EmptyState } from './ui'
import type { StudentRiskPrediction } from '../ai/prediction/types'
import type { Studente } from '../types'

interface RiskPredictionPanelProps {
  predictions: StudentRiskPrediction[]
  students: Studente[]
  className?: string
}

// ── Risk level tokens ─────────────────────────────────────────────────────────
function riskMeta(prob: number): { label: string; bar: string; chip: string; chipFg: string } {
  if (prob >= 0.7)
    return {
      label: 'Alto',
      bar: 'var(--md-sys-color-error)',
      chip: 'var(--md-sys-color-error-container)',
      chipFg: 'var(--md-sys-color-on-error-container)',
    }
  if (prob >= 0.4)
    return {
      label: 'Medio',
      bar: 'var(--md-sys-color-secondary)',
      chip: 'var(--md-sys-color-secondary-container)',
      chipFg: 'var(--md-sys-color-on-secondary-container)',
    }
  return {
    label: 'Basso',
    bar: 'var(--md-sys-color-tertiary)',
    chip: 'var(--md-sys-color-tertiary-container)',
    chipFg: 'var(--md-sys-color-on-tertiary-container)',
  }
}

// ── Single student row ────────────────────────────────────────────────────────
const PredictionRow: React.FC<{
  prediction: StudentRiskPrediction
  student: Studente | undefined
}> = ({ prediction, student }) => {
  const pct = Math.round(prediction.riskProbability * 100)
  const meta = riskMeta(prediction.riskProbability)
  const name = student ? `${student.cognome} ${student.nome}` : prediction.studentId

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--md-sys-spacing-2)',
        padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)',
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        border: '1px solid var(--md-sys-color-outline-variant)',
        backgroundColor: 'var(--md-sys-color-surface-container)',
      }}
    >
      {/* Name row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
        <Typography
          variant="body2"
          sx={{
            flex: 1,
            color: 'var(--md-sys-color-on-surface)',
            fontWeight: 'var(--md-sys-typescale-weight-medium)',
          }}
        >
          {name}
        </Typography>

        {/* Risk level chip */}
        <Box
          sx={{
            backgroundColor: meta.chip,
            color: meta.chipFg,
            borderRadius: 'var(--md-sys-shape-corner-full)',
            paddingX: 'var(--md-sys-spacing-2)',
            paddingY: '2px',
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>
            {meta.label} · {pct}%
          </Typography>
        </Box>
      </Box>

      {/* Progress bar */}
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
            width: `${pct}%`,
            borderRadius: 'var(--md-sys-shape-corner-full)',
            backgroundColor: meta.bar,
            transition: 'width 0.4s ease',
          }}
        />
      </Box>

      {/* Factors */}
      {prediction.factors.length > 0 && (
        <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-2)', flexWrap: 'wrap' }}>
          {prediction.factors.map((f) => (
            <Box
              key={f}
              sx={{
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                borderRadius: 'var(--md-sys-shape-corner-full)',
                paddingX: 'var(--md-sys-spacing-2)',
                paddingY: '2px',
              }}
            >
              <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {f}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
const RiskPredictionPanel: React.FC<RiskPredictionPanelProps> = ({
  predictions,
  students,
  className,
}) => {
  const studentMap = new Map(students.map((s) => [s.id, s]))

  // Sort descending by risk probability; show only students with any risk signal
  const sorted = [...predictions].sort((a, b) => b.riskProbability - a.riskProbability)
  const atRisk = sorted.filter((p) => p.riskProbability > 0)

  const highCount = atRisk.filter((p) => p.riskProbability >= 0.7).length

  return (
    <InfoCard
      elevation={1}
      className={className}
      sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{ color: 'var(--md-sys-color-error)' }}
        >
          trending_down
        </Box>
        <Typography variant="h6" sx={{ color: 'var(--md-sys-color-on-surface)', flex: 1 }}>
          Previsione Rischio
        </Typography>
        {highCount > 0 && (
          <AiMemoryChip
            label={`${highCount} ad alto rischio`}
          />
        )}
      </Box>

      {atRisk.length === 0 ? (
        <EmptyState
          title="Nessun rischio rilevato"
          description="Tutti gli studenti hanno un profilo di rischio basso per la selezione corrente."
          icon="check_circle"
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
          {atRisk.map((p) => (
            <PredictionRow key={p.studentId} prediction={p} student={studentMap.get(p.studentId)} />
          ))}
        </Box>
      )}
    </InfoCard>
  )
}

export default RiskPredictionPanel

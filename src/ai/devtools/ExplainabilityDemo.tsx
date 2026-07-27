/**
 * ExplainabilityDemo.tsx — Explainable AI section inside AIInspectorPanel.
 *
 * Provides a self-contained demo of the explainability engine:
 *   1. User picks or generates a simulated student scenario.
 *   2. The decision explainer runs and shows StudentInsightPanel.
 *   3. A list of all generated explanations is shown for comparison.
 *
 * For production use, `StudentInsightPanel` is imported directly by
 * ClassroomView / StudentProfile components to show real-student insights.
 *
 * MD3 compliant — MUI v7 only.
 */
import React, { memo, useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PsychologyIcon from '@mui/icons-material/Psychology';
import RefreshIcon from '@mui/icons-material/Refresh';

import { generateScenario } from '../simulation/scenarioGenerator';
import { simulateClassroom } from '../simulation/classroomSimulator';
import { explainClass } from '../explainability/decisionExplainer';
import { predictStudentRisk } from '../prediction/predictStudentRisk';
import StudentInsightPanel from './StudentInsightPanel';
import type { AIExplanation } from '../explainability/decisionExplainer';

// ── helpers ───────────────────────────────────────────────────────────────────

function generateDemoExplanations(seed: number): AIExplanation[] {
  const scenario = generateScenario(seed);
  const { students, evaluations } = simulateClassroom(scenario);

  // Build riskPredictions via the real predictor (no mock)
  const riskPredictions = students.map(s => {
    const evals = evaluations.filter(e => e.studenteId === s.id);
    return predictStudentRisk(s.id, evals);
  });

  const map = explainClass(students, evaluations, riskPredictions);
  return [...map.values()].sort((a, b) => b.riskScore - a.riskScore);
}

// ── tier label chip ───────────────────────────────────────────────────────────

const tierChipProps = {
  critical: { label: 'Critico',     color: 'error'   } as const,
  at_risk:  { label: 'A rischio',   color: 'warning' } as const,
  watch:    { label: 'Monitorare',  color: 'default' } as const,
  safe:     { label: 'OK',          color: 'success' } as const,
};

// ── main component ────────────────────────────────────────────────────────────

const ExplainabilityDemo: React.FC = memo(() => {
  const [seed, setSeed] = useState(42);
  const [explanations, setExplanations] = useState<AIExplanation[]>(() =>
    generateDemoExplanations(42),
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    () => explanations.find(e => e.riskTier === 'critical' || e.riskTier === 'at_risk')?.studentId ?? null,
  );

  const handleRegenerate = useCallback(() => {
    const nextSeed = Date.now() % 100_000;
    setSeed(nextSeed);
    const next = generateDemoExplanations(nextSeed);
    setExplanations(next);
    setSelectedId(
      next.find(e => e.riskTier === 'critical' || e.riskTier === 'at_risk')?.studentId ?? null,
    );
  }, []);

  const selected = explanations.find(e => e.studentId === selectedId) ?? explanations[0] ?? null;

  return (
    <Box>
      {/* ── Header ── */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
        mb="var(--md-sys-spacing-4)"
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <PsychologyIcon
            fontSize="small"
            sx={{ color: 'var(--md-sys-color-tertiary)' }}
            aria-hidden
          />
          <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
            Explainability Demo
          </Typography>
          <Chip
            size="small"
            label="Sprint 4"
            sx={{
              bgcolor: 'var(--md-sys-color-secondary-container)',
              color: 'var(--md-sys-color-on-secondary-container)',
              fontSize: 'var(--md-sys-typescale-label-small-font-size)',
            }}
          />
        </Stack>

        <Button
          size="small"
          variant="outlined"
          startIcon={<RefreshIcon aria-hidden />}
          onClick={handleRegenerate}
          aria-label="Genera nuovi studenti simulati"
        >
          Nuovo scenario (seed {seed})
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing="var(--md-sys-spacing-4)" alignItems="flex-start">
        {/* ── Student list ── */}
        <Box sx={{ minWidth: 200, flexShrink: 0 }}>
          <Typography
            variant="labelMedium"
            sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 1, display: 'block' }}
          >
            Studenti ({explanations.length})
          </Typography>
          <Stack spacing={0.5}>
            {explanations.slice(0, 12).map(exp => {
              const cp = tierChipProps[exp.riskTier];
              const isSelected = exp.studentId === selectedId;
              return (
                <Box
                  key={exp.studentId}
                  onClick={() => setSelectedId(exp.studentId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setSelectedId(exp.studentId)}
                  aria-pressed={isSelected}
                  aria-label={`Mostra insight per studente ${exp.studentId}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    px: 'var(--md-sys-spacing-3)',
                    py: 'var(--md-sys-spacing-2)',
                    borderRadius: 'var(--md-sys-shape-corner-small)',
                    cursor: 'pointer',
                    bgcolor: isSelected
                      ? 'var(--md-sys-color-secondary-container)'
                      : 'var(--md-sys-color-surface-container)',
                    border: isSelected
                      ? '1px solid var(--md-sys-color-secondary)'
                      : '1px solid transparent',
                    '&:hover': { bgcolor: 'var(--md-sys-color-surface-container-high)' },
                    transition: 'background-color 0.15s',
                  }}
                >
                  <Typography
                    variant="labelSmall"
                    sx={{
                      color: 'var(--md-sys-color-on-surface)',
                      fontFamily: 'monospace',
                      fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 90,
                    }}
                  >
                    {exp.studentId}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography
                      variant="labelSmall"
                      sx={{
                        color: 'var(--md-sys-color-on-surface-variant)',
                        fontVariantNumeric: 'tabular-nums',
                      fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                      }}
                    >
                      {Math.round(exp.riskScore * 100)} %
                    </Typography>
                    <Chip
                      size="small"
                      label={cp.label}
                      color={cp.color}
                      sx={{ fontSize: 'var(--md-sys-typescale-label-small-font-size)', height: 18 }}
                    />
                  </Stack>
                </Box>
              );
            })}
            {explanations.length > 12 && (
              <Typography
                variant="labelSmall"
                sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic', pl: 1 }}
              >
                +{explanations.length - 12} non mostrati
              </Typography>
            )}
          </Stack>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
        <Divider sx={{ display: { xs: 'block', md: 'none' }, width: '100%' }} />

        {/* ── Detail panel ── */}
        <Box flex="1" minWidth={0}>
          {selected ? (
            <StudentInsightPanel explanation={selected} maxFactors={6} />
          ) : (
            <Typography
              variant="bodySmall"
              sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic' }}
            >
              Seleziona uno studente dalla lista per vedere i dettagli.
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  );
});

ExplainabilityDemo.displayName = 'ExplainabilityDemo';
export default ExplainabilityDemo;

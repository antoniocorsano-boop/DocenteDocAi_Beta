/**
 * RecommendationPanel.tsx — Sprint 8: AI Decision Support
 *
 * DevTools panel showing AI-generated pedagogical recommendations that
 * synthesise signals from all three upstream sprint systems:
 *   • Sprint 6 — PedagogyReport  (Bloom's alignment)
 *   • Sprint 7 — TrustReport     (data quality / fairness)
 *   • Sprint 3 — BenchmarkMetrics (simulation F1, risk detection)
 *
 * Layout:
 *   Header: urgency chip + recommendation count + "Ricalcola" button
 *   Row 1: recommendation cards (title, description, impactScore bar, action chip)
 *   Row 2: per-card "Simula effetto" button → runBatch(5) in SimulationLab
 *   Row 3: PluginSlot "studio-tools" for plugin extensions
 */

import React, { useCallback, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AssistantOutlinedIcon from '@mui/icons-material/AssistantOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { generateScenario } from '../simulation/scenarioGenerator';
import { simulateClassroom } from '../simulation/classroomSimulator';
import { predictStudentRisk } from '../prediction/predictStudentRisk';
import { explainClass } from '../explainability/decisionExplainer';
import { generateBiasReport } from '../fairness/biasReport';
import { generateTrustReport } from '../trust/trustReport';
import { generatePedagogyReport } from '../pedagogy/pedagogyReport';
import { generateRecommendations, type Recommendation, type RecommendationAction } from '../recommendation/lessonRecommender';
import { useSimulationStore } from '../simulation/simulationStore';
import PluginSlot from '../../components/ui/PluginSlot';

// ── token helper ──────────────────────────────────────────────────────────────

function tok(name: string) {
  return `var(--md-sys-color-${name})`;
}

// ── action labels / chips ─────────────────────────────────────────────────────

const ACTION_LABELS: Record<RecommendationAction, string> = {
  adjustContent:  'Adatta contenuto',
  addExercise:    'Aggiungi esercizio',
  reschedule:     'Riorganizza',
  highlightRisk:  'Rischio rilevato',
};

const ACTION_COLORS: Record<RecommendationAction, { bg: string; fg: string }> = {
  adjustContent:  { bg: tok('secondary-container'), fg: tok('on-secondary-container') },
  addExercise:    { bg: tok('primary-container'),   fg: tok('on-primary-container')   },
  reschedule:     { bg: tok('tertiary-container'),  fg: tok('on-tertiary-container')  },
  highlightRisk:  { bg: tok('error-container'),     fg: tok('on-error-container')     },
};

const SOURCE_LABELS: Record<Recommendation['source'], string> = {
  pedagogy:   'Pedagogia',
  trust:      'Fiducia AI',
  simulation: 'Simulazione',
};

// ── urgency level helpers ─────────────────────────────────────────────────────

type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

function computeUrgency(recs: Recommendation[]): UrgencyLevel {
  if (recs.length === 0) return 'low';
  const maxScore = recs[0].impactScore; // already sorted desc
  if (maxScore >= 0.75) return 'critical';
  if (maxScore >= 0.55) return 'high';
  if (maxScore >= 0.35) return 'medium';
  return 'low';
}

const URGENCY_META: Record<UrgencyLevel, { label: string; icon: React.ReactElement; bg: string; fg: string }> = {
  critical: { label: 'Urgente',     icon: <ErrorOutlineIcon       fontSize="small" aria-hidden />, bg: tok('error-container'),     fg: tok('on-error-container')     },
  high:     { label: 'Alta priorità', icon: <WarningAmberIcon     fontSize="small" aria-hidden />, bg: tok('tertiary-container'),  fg: tok('on-tertiary-container')  },
  medium:   { label: 'Media priorità', icon: <TipsAndUpdatesOutlinedIcon fontSize="small" aria-hidden />, bg: tok('secondary-container'), fg: tok('on-secondary-container') },
  low:      { label: 'Bassa priorità', icon: <CheckCircleOutlineIcon fontSize="small" aria-hidden />, bg: tok('primary-container'), fg: tok('on-primary-container') },
};

// ── pipeline builder ──────────────────────────────────────────────────────────

function buildRecommendations(): Recommendation[] {
  const seed     = Date.now() % 100_000;
  const scenario = generateScenario(seed);
  const sim      = simulateClassroom(scenario);
  const students = sim.students;
  const evals    = sim.evaluations;

  // Trust pipeline
  const riskPreds    = students.map(s => predictStudentRisk(s.id, evals));
  const explanations = explainClass(students, evals, riskPreds);
  const biasReport   = generateBiasReport(students, explanations);

  const significantGroupIds = new Set(
    biasReport.metrics.filter(m => m.significant).map(m => m.groupId),
  );
  const affectedIds = new Set<string>(
    biasReport.profiles
      .filter(p => significantGroupIds.has(p.id))
      .flatMap(p => p.studentIds),
  );
  const trustReport = generateTrustReport(
    [...explanations.values()],
    biasReport.overallBiasLevel,
    0,
    affectedIds,
  );

  // Pedagogy pipeline (no real lessons/UDAs in devtools — pass empty arrays)
  const pedagogyReport = generatePedagogyReport([], []);

  return generateRecommendations([pedagogyReport], [trustReport], []);
}

// ── sub-component: RecommendationCard ─────────────────────────────────────────

const RecommendationCard: React.FC<{
  rec:          Recommendation;
  onSimulate:   () => void;
  simulating:   boolean;
}> = ({ rec, onSimulate, simulating }) => {
  const action = ACTION_COLORS[rec.suggestedAction];
  const pct    = Math.round(rec.impactScore * 100);

  return (
    <Box
      sx={{
        p:            'var(--md-sys-spacing-3)',
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        bgcolor:      tok('surface-container'),
        border:       `1px solid ${tok('outline-variant')}`,
      }}
      role="article"
      aria-label={`Raccomandazione: ${rec.title}`}
    >
      {/* Title row */}
      <Stack direction="row" alignItems="flex-start" spacing={1} mb={1}>
        <BoltOutlinedIcon
          fontSize="small"
          sx={{ color: tok('primary'), mt: 0.2, flexShrink: 0 }}
          aria-hidden
        />
        <Typography variant="titleSmall" sx={{ color: tok('on-surface'), flex: 1 }}>
          {rec.title}
        </Typography>
        <Tooltip title={`Impatto: ${pct}%`} arrow>
          <Typography
            variant="labelSmall"
            sx={{
              color:           tok('primary'),
              fontVariantNumeric: 'tabular-nums',
              fontWeight:      'var(--md-sys-typescale-weight-semibold)',
              flexShrink:      0,
            }}
          >
            {pct}%
          </Typography>
        </Tooltip>
      </Stack>

      {/* Description */}
      <Typography
        variant="bodySmall"
        sx={{ color: tok('on-surface-variant'), mb: 1.5, lineHeight: 1.55 }}
      >
        {rec.description}
      </Typography>

      {/* Impact bar */}
      <LinearProgress
        variant="determinate"
        value={pct}
        aria-label={`Impatto della raccomandazione: ${pct}%`}
        sx={{
          mb:       1.5,
          height:   6,
          borderRadius: 3,
          bgcolor:  tok('surface-container-high'),
          '& .MuiLinearProgress-bar': {
            bgcolor: pct >= 75 ? tok('error') : pct >= 55 ? tok('tertiary') : tok('primary'),
          },
        }}
      />

      {/* Chip row */}
      <Stack direction="row" spacing={1} flexWrap="wrap" mb={1.5}>
        <Chip
          label={ACTION_LABELS[rec.suggestedAction]}
          size="small"
          sx={{ bgcolor: action.bg, color: action.fg, fontSize: 'var(--md-sys-typescale-label-small-font-size)' }}
        />
        <Chip
          label={SOURCE_LABELS[rec.source]}
          size="small"
          sx={{
            bgcolor: tok('surface-container-high'),
            color:   tok('on-surface-variant'),
            fontSize: 'var(--md-sys-typescale-label-small-font-size)',
          }}
        />
        {rec.tags.slice(0, 2).map((tag: string) => (
          <Chip
            key={tag}
            label={tag}
            size="small"
            sx={{
              bgcolor: tok('surface-container-highest'),
              color:   tok('on-surface-variant'),
              fontSize: 'var(--md-sys-typescale-label-small-font-size)',
            }}
          />
        ))}
      </Stack>

      {/* Action buttons */}
      <Stack direction="row" spacing={1}>
        <Tooltip title="Esegui 5 simulazioni per stimare l'impatto di questa raccomandazione" arrow>
          <span>
            <Button
              variant="contained"
              size="small"
              disabled={simulating}
              onClick={onSimulate}
              startIcon={
                simulating
                  ? <CircularProgress size={12} aria-hidden />
                  : <PlayCircleOutlineIcon fontSize="small" aria-hidden />
              }
              aria-label={`Simula effetto della raccomandazione: ${rec.title}`}
              sx={{
                textTransform: 'none',
                color:         tok('on-secondary-container'),
                bgcolor:       tok('secondary-container'),
                boxShadow:     'none',
                '&:hover':     { bgcolor: tok('secondary-container'), boxShadow: 'none', filter: 'brightness(0.95)' },
              }}
            >
              {simulating ? 'Simulazione…' : 'Simula effetto'}
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Funzionalità disponibile in una futura versione" arrow>
          <span>
            <Button
              variant="outlined"
              size="small"
              disabled
              aria-label={`Applica raccomandazione: ${rec.title} (in sviluppo)`}
              sx={{
                textTransform: 'none',
                borderColor:   tok('outline-variant'),
                color:         tok('on-surface-variant'),
              }}
            >
              Applica
            </Button>
          </span>
        </Tooltip>
      </Stack>
    </Box>
  );
};

// ── main component ────────────────────────────────────────────────────────────

const RecommendationPanel: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);

  const simulationActions = useSimulationStore(s => s.actions);

  const run = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      try {
        setRecommendations(buildRecommendations());
      } finally {
        setLoading(false);
      }
    }, 0);
  }, []);

  const handleSimulate = useCallback(
    (recId: string) => {
      setSimulatingId(recId);
      simulationActions.runBatch(5).finally(() => setSimulatingId(null));
    },
    [simulationActions],
  );

  const urgency     = recommendations ? computeUrgency(recommendations) : null;
  const urgencyMeta = urgency ? URGENCY_META[urgency] : null;

  return (
    <Box sx={{ p: 'var(--md-sys-spacing-4)' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <AssistantOutlinedIcon sx={{ color: tok('primary') }} aria-hidden />
        <Typography variant="titleMedium" sx={{ color: tok('on-surface'), flex: 1 }}>
          Raccomandazioni AI
        </Typography>

        {recommendations !== null && urgencyMeta && (
          <Chip
            size="small"
            icon={urgencyMeta.icon}
            label={urgencyMeta.label}
            sx={{
              bgcolor:    urgencyMeta.bg,
              color:      urgencyMeta.fg,
              fontWeight: 'var(--md-sys-typescale-weight-semibold)',
              fontSize:   'var(--md-sys-typescale-label-small-font-size)',
              '& .MuiChip-icon': { color: 'inherit' },
            }}
          />
        )}
        {recommendations !== null && (
          <Tooltip title={`${recommendations.length} raccomandazione${recommendations.length !== 1 ? 'i' : 'e'} disponibil${recommendations.length !== 1 ? 'i' : 'e'}`} arrow>
            <Chip
              size="small"
              label={`${recommendations.length}`}
              aria-label={`${recommendations.length} raccomandazioni`}
              sx={{
                bgcolor: tok('surface-container-high'),
                color:   tok('on-surface'),
                fontVariantNumeric: 'tabular-nums',
              }}
            />
          </Tooltip>
        )}
        <Button
          variant="outlined"
          size="small"
          onClick={run}
          disabled={loading}
          startIcon={
            loading
              ? <CircularProgress size={14} aria-hidden />
              : <RefreshIcon fontSize="small" aria-hidden />
          }
          aria-label="Ricalcola raccomandazioni AI"
          sx={{
            borderColor: tok('outline'),
            color:       tok('primary'),
            textTransform: 'none',
            '&:hover': { borderColor: tok('primary'), bgcolor: tok('primary-container') },
          }}
        >
          {loading ? 'Analisi…' : 'Ricalcola'}
        </Button>
      </Stack>

      {/* ── Start prompt ────────────────────────────────────────────────────── */}
      {recommendations === null && !loading && (
        <Alert
          severity="info"
          icon={<TipsAndUpdatesOutlinedIcon fontSize="inherit" />}
          sx={{ bgcolor: tok('secondary-container'), color: tok('on-secondary-container') }}
        >
          Premi <strong>Ricalcola</strong> per ottenere raccomandazioni personalizzate basate su pedagogia, fiducia AI e simulazioni.
        </Alert>
      )}

      {loading && (
        <Stack alignItems="center" py={4}>
          <CircularProgress size={32} aria-label="Analisi raccomandazioni in corso" />
          <Typography variant="bodySmall" sx={{ mt: 1.5, color: tok('on-surface-variant') }}>
            Analisi pipeline completa — pedagogia · fiducia · simulazione…
          </Typography>
        </Stack>
      )}

      {recommendations !== null && !loading && (
        <Stack spacing={2}>
          {recommendations.length === 0 && (
            <Alert
              severity="success"
              icon={<CheckCircleOutlineIcon fontSize="inherit" />}
              sx={{ bgcolor: tok('primary-container'), color: tok('on-primary-container') }}
            >
              Nessuna raccomandazione critica rilevata. La classe mostra buoni indicatori pedagogici, di fiducia AI e di salute simulata.
            </Alert>
          )}

          {recommendations.map(rec => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              onSimulate={() => handleSimulate(rec.id)}
              simulating={simulatingId === rec.id}
            />
          ))}

          {recommendations.length > 0 && (
            <>
              <Divider />
              <Typography variant="bodySmall" sx={{ color: tok('on-surface-variant'), textAlign: 'right' }}>
                {recommendations.length} raccomandazion{recommendations.length !== 1 ? 'i' : 'e'} ordinate per impatto decrescente
              </Typography>
            </>
          )}
        </Stack>
      )}

      {/* ── PluginSlot: studio-tools ─────────────────────────────────────────── */}
      <PluginSlot
        slot="studio-tools"
        context={{ recommendations: recommendations ?? [] }}
        emptyFallback={null}
      />
    </Box>
  );
};

export default RecommendationPanel;

/**
 * CopilotRecommendationPanel.tsx — Sprint 9: Teacher-facing AI Recommendations
 *
 * Integrates the Sprint 8 recommendation engine into the real teacher UI.
 * Uses live classroom data (store + props) instead of the mock simulation
 * pipeline used in the DevTools RecommendationPanel.
 *
 * Pipeline (on demand — triggered by "Calcola" button):
 *   1. Curriculum analysis  — generateCurriculumRecommendations(lessons)
 *   2. Pedagogy pipeline    — generatePedagogyReport(lessons, udas)
 *   3. Trust pipeline       — predictStudentRisk → explainClass →
 *                             generateBiasReport → generateTrustReport
 *   4. Signal synthesis     — generateRecommendations([pedagogy], [trust], [])
 *   5. Merge & rank         — sort by impactScore desc
 *
 * Teacher-facing additions vs DevTools version:
 *   - "Genera attività" button expands Activity cards (activityGenerator)
 *   - No "Simula effetto" (simulation pipeline belongs to Dev Tools)
 *   - Context info row shows lesson/student/UDA counts
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
import RefreshIcon from '@mui/icons-material/Refresh';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { useAcademicStore } from '../../stores/useAcademicStore';
import PluginSlot from '../ui/PluginSlot';
import { predictStudentRisk } from '../../ai/prediction/predictStudentRisk';
import { explainClass } from '../../ai/explainability/decisionExplainer';
import { generateBiasReport } from '../../ai/fairness/biasReport';
import { generateTrustReport } from '../../ai/trust/trustReport';
import { generatePedagogyReport } from '../../ai/pedagogy/pedagogyReport';
import {
  generateRecommendations,
  type Recommendation,
  type RecommendationAction,
} from '../../ai/recommendation/lessonRecommender';
import { generateCurriculumRecommendations } from '../../ai/recommendation/curriculumAdvisor';
import { generateActivity, type Activity } from '../../ai/recommendation/activityGenerator';
import { useTerminology } from '../../hooks/useTerminology';
import { useNextAction } from '../../hooks/useNextAction';
import type { Studente, Valutazione, Uda } from '../../types';

// Fase 3 migration: route copilot recommendations through AIBrain (central gateway + deprecation path)
// LEGACY: recommendation engine calls kept side-by-side; migrate to AIBrain.getUnifiedRecommendations + ask
import { AIBrain } from '../../ai/brain/AIBrain';

// ── token helper ──────────────────────────────────────────────────────────────

function tok(name: string) {
  return `var(--md-sys-color-${name})`;
}

// ── action chips ──────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<RecommendationAction, string> = {
  adjustContent: 'Adatta contenuto',
  addExercise:   'Aggiungi esercizio',
  reschedule:    'Riorganizza',
  highlightRisk: 'Rischio rilevato',
};

const ACTION_COLORS: Record<RecommendationAction, { bg: string; fg: string }> = {
  adjustContent: { bg: tok('secondary-container'), fg: tok('on-secondary-container') },
  addExercise:   { bg: tok('primary-container'),   fg: tok('on-primary-container')   },
  reschedule:    { bg: tok('tertiary-container'),  fg: tok('on-tertiary-container')  },
  highlightRisk: { bg: tok('error-container'),     fg: tok('on-error-container')     },
};

const SOURCE_LABELS: Record<Recommendation['source'], string> = {
  pedagogy:   'Pedagogia',
  trust:      'Fiducia AI',
  simulation: 'Simulazione',
};

const ACTIVITY_TYPE_LABELS: Record<Activity['type'], string> = {
  quiz:       'Quiz',
  exercise:   'Esercizio',
  whatif:     'What-if',
  discussion: 'Discussione',
  lab:        'Laboratorio',
};

// ── urgency helpers ───────────────────────────────────────────────────────────

type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

function computeUrgency(recs: Recommendation[]): UrgencyLevel {
  if (recs.length === 0) return 'low';
  const max = recs[0].impactScore;
  if (max >= 0.75) return 'critical';
  if (max >= 0.55) return 'high';
  if (max >= 0.35) return 'medium';
  return 'low';
}

const URGENCY_META: Record<UrgencyLevel, { label: string; icon: React.ReactElement; bg: string; fg: string }> = {
  critical: {
    label: 'Urgente',
    icon:  <ErrorOutlineIcon fontSize="small" aria-hidden />,
    bg:    tok('error-container'),
    fg:    tok('on-error-container'),
  },
  high: {
    label: 'Alta priorità',
    icon:  <WarningAmberIcon fontSize="small" aria-hidden />,
    bg:    tok('tertiary-container'),
    fg:    tok('on-tertiary-container'),
  },
  medium: {
    label: 'Media priorità',
    icon:  <TipsAndUpdatesOutlinedIcon fontSize="small" aria-hidden />,
    bg:    tok('secondary-container'),
    fg:    tok('on-secondary-container'),
  },
  low: {
    label: 'Bassa priorità',
    icon:  <CheckCircleOutlineIcon fontSize="small" aria-hidden />,
    bg:    tok('primary-container'),
    fg:    tok('on-primary-container'),
  },
};

// ── sub-component: ActivityList ───────────────────────────────────────────────

const ActivityList: React.FC<{ activities: Activity[] }> = ({ activities }) => (
  <Stack spacing={1.5} mt={1.5}>
    {activities.map(act => (
      <Box
        key={act.id}
        sx={{
          p:            'var(--md-sys-spacing-3)',
          borderRadius: 'var(--md-sys-shape-corner-small)',
          bgcolor:      tok('surface-container-low'),
          border:       `1px solid ${tok('outline-variant')}`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} mb={0.5} flexWrap="wrap">
          <SchoolOutlinedIcon
            fontSize="small"
            sx={{ color: tok('tertiary'), flexShrink: 0 }}
            aria-hidden
          />
          <Typography variant="labelMedium" sx={{ color: tok('on-surface'), flex: 1 }}>
            {act.title}
          </Typography>
          <Chip
            label={ACTIVITY_TYPE_LABELS[act.type]}
            size="small"
            sx={{
              bgcolor:  tok('tertiary-container'),
              color:    tok('on-tertiary-container'),
              fontSize: 'var(--md-sys-typescale-label-small-font-size)',
            }}
          />
          <Chip
            label={`${act.durationMinutes} min`}
            size="small"
            sx={{
              bgcolor:  tok('surface-container-high'),
              color:    tok('on-surface-variant'),
              fontSize: 'var(--md-sys-typescale-label-small-font-size)',
            }}
          />
        </Stack>
        <Typography variant="bodySmall" sx={{ color: tok('on-surface-variant'), mb: 0.5 }}>
          {act.description}
        </Typography>
        <Typography
          variant="bodySmall"
          sx={{ color: tok('on-surface-variant'), fontStyle: 'italic' }}
        >
          {act.instructions}
        </Typography>
      </Box>
    ))}
  </Stack>
);

// ── sub-component: RecommendationCard ────────────────────────────────────────

const RecommendationCard: React.FC<{ rec: Recommendation }> = ({ rec }) => {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerateActivity = useCallback(() => {
    setGenerating(true);
    // setTimeout 0 defers work off the render cycle so the loading state paints first
    setTimeout(() => {
      setActivities(generateActivity(rec));
      setGenerating(false);
    }, 0);
  }, [rec]);

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
              color:              tok('primary'),
              fontVariantNumeric: 'tabular-nums',
              fontWeight:         'var(--md-sys-typescale-weight-semibold)',
              flexShrink:         0,
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
          sx={{
            bgcolor:  action.bg,
            color:    action.fg,
            fontSize: 'var(--md-sys-typescale-label-small-font-size)',
          }}
        />
        <Chip
          label={SOURCE_LABELS[rec.source]}
          size="small"
          sx={{
            bgcolor:  tok('surface-container-high'),
            color:    tok('on-surface-variant'),
            fontSize: 'var(--md-sys-typescale-label-small-font-size)',
          }}
        />
        {rec.tags.slice(0, 2).map((tag: string) => (
          <Chip
            key={tag}
            label={tag}
            size="small"
            sx={{
              bgcolor:  tok('surface-container-highest'),
              color:    tok('on-surface-variant'),
              fontSize: 'var(--md-sys-typescale-label-small-font-size)',
            }}
          />
        ))}
      </Stack>

      {/* Generate activity button */}
      {activities === null && (
        <Button
          variant="contained"
          size="small"
          disabled={generating}
          onClick={handleGenerateActivity}
          startIcon={
            generating
              ? <CircularProgress size={12} aria-hidden />
              : <SchoolOutlinedIcon fontSize="small" aria-hidden />
          }
          aria-label={`Genera attività per: ${rec.title}`}
          sx={{
            textTransform: 'none',
            color:         tok('on-secondary-container'),
            bgcolor:       tok('secondary-container'),
            boxShadow:     'none',
            '&:hover':     { bgcolor: tok('secondary-container'), boxShadow: 'none', filter: 'brightness(0.95)' },
          }}
        >
          {generating ? 'Generazione…' : 'Genera attività'}
        </Button>
      )}

      {/* Expanded activities */}
      {activities !== null && (
        <Box>
          <Divider sx={{ mb: 1 }} />
          <ActivityList activities={activities} />
        </Box>
      )}
    </Box>
  );
};

// ── props ─────────────────────────────────────────────────────────────────────

interface CopilotRecommendationPanelProps {
  students:    Studente[];
  evaluations: Valutazione[];
  udas:        Uda[];
  className:   string;
}

// ── main component ────────────────────────────────────────────────────────────

const CopilotRecommendationPanel: React.FC<CopilotRecommendationPanelProps> = ({
  students,
  evaluations,
  udas,
}) => {
  const lessonsMap = useAcademicStore(s => s.lessons);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const { udaLabelPlural } = useTerminology();
  const nextAction = useNextAction();

  // Fase 3 (sequenza): Real AIBrain consumption (buildContext + getUnifiedRecommendations + ask)
  // User-centric daily gesture: AI-enhanced recommendation insights
  // rollback-safe + deprecation path
  const recsContext = React.useMemo(() => AIBrain.buildContext({
    source: 'copilot-recommendation-panel',
    extra: { lessonCount: Object.keys(lessonsMap).length, studentCount: students.length }
  }), [lessonsMap, students.length]);

  const brainRecs = React.useMemo(() => {
    try {
      return AIBrain.getUnifiedRecommendations(recsContext);
    } catch { return null; }
  }, [recsContext]);

  const [aiRecInsight, setAiRecInsight] = React.useState<string | null>(null);
  const [aiRecLoading, setAiRecLoading] = React.useState(false);

  const fetchAIBrainRecInsight = React.useCallback(async () => {
    setAiRecLoading(true);
    try {
      const res = await AIBrain.ask({
        prompt: 'Dai un insight rapido o focus prioritario sulle raccomandazioni AI per questa classe.',
        context: recsContext,
        mode: 'balanced'
      });
      setAiRecInsight(res.content);

      // deprecation path exercise
      if (import.meta.env.DEV) {
        AIBrain.migrateLegacyAsk('legacy-recs-panel', recsContext).catch(() => {});
      }
    } catch {
      setAiRecInsight('Impossibile ottenere insight AIBrain.');
    } finally {
      setAiRecLoading(false);
    }
  }, [recsContext]);

  const run = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      try {
        const lessons = Object.values(lessonsMap);

        // 1. Curriculum recommendations from real lesson sequence
        const curriculumRecs = generateCurriculumRecommendations(lessons);

        // 2. Pedagogy pipeline from real lessons + UDAs
        const pedagogyReport = generatePedagogyReport(lessons, udas);

        // 3. Trust pipeline from real students + evaluations
        const riskPreds    = students.map(s => predictStudentRisk(s.id, evaluations));
        const explanations = explainClass(students, evaluations, riskPreds);
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
          pedagogyReport.overallScore,
          affectedIds,
        );

        // 4. Signal-synthesis recommendations (pedagogy + trust, no benchmarks)
        const signalRecs = generateRecommendations([pedagogyReport], [trustReport], []);

        // 5. Merge and sort by impactScore desc
        const merged = [...curriculumRecs, ...signalRecs].sort(
          (a, b) => b.impactScore - a.impactScore,
        );

        setRecommendations(merged);
      } finally {
        setLoading(false);
      }
    }, 0);
  }, [lessonsMap, students, evaluations, udas]);

  const urgency     = recommendations ? computeUrgency(recommendations) : null;
  const urgencyMeta = urgency ? URGENCY_META[urgency] : null;

  const lessonCount  = Object.keys(lessonsMap).length;
  const studentCount = students.length;
  const udaCount     = udas.length;

  return (
    <Box sx={{ p: 'var(--md-sys-spacing-4)' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
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
          <Tooltip
            title={`${recommendations.length} raccomandazion${recommendations.length !== 1 ? 'i' : 'e'} disponibil${recommendations.length !== 1 ? 'i' : 'e'}`}
            arrow
          >
            <Chip
              size="small"
              label={`${recommendations.length}`}
              aria-label={`${recommendations.length} raccomandazioni`}
              sx={{
                bgcolor:            tok('surface-container-high'),
                color:              tok('on-surface'),
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
          aria-label="Calcola raccomandazioni AI basate sui dati reali della classe"
          sx={{
            borderColor:   tok('outline'),
            color:         tok('primary'),
            textTransform: 'none',
            '&:hover':     { borderColor: tok('primary'), bgcolor: tok('primary-container') },
          }}
        >
          {loading ? 'Analisi…' : recommendations !== null ? 'Ricalcola' : 'Calcola'}
        </Button>
      </Stack>

      {/* ── Data context row ─────────────────────────────────────────────────── */}
      <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
        <Chip
          label={`${lessonCount} lezion${lessonCount !== 1 ? 'i' : 'e'}`}
          size="small"
          sx={{
            bgcolor:  tok('surface-container-high'),
            color:    tok('on-surface-variant'),
            fontSize: 'var(--md-sys-typescale-label-small-font-size)',
          }}
        />
        <Chip
          label={`${studentCount} student${studentCount !== 1 ? 'i' : 'e'}`}
          size="small"
          sx={{
            bgcolor:  tok('surface-container-high'),
            color:    tok('on-surface-variant'),
            fontSize: 'var(--md-sys-typescale-label-small-font-size)',
          }}
        />
        <Chip
          label={`${udaCount} ${udaLabelPlural}`}
          size="small"
          sx={{
            bgcolor:  tok('surface-container-high'),
            color:    tok('on-surface-variant'),
            fontSize: 'var(--md-sys-typescale-label-small-font-size)',
          }}
        />
      </Stack>

      {/* Fase 3 (sequenza): Real AIBrain unified recs + visible daily gesture */}
      {brainRecs?.primary && (
        <Box sx={{ mb: 1.5, p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: tok('tertiary-container') }}>
          <Typography variant="caption" sx={{ color: tok('on-tertiary-container'), fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>
            AIBrain (Fase 3): {brainRecs.primary.label || brainRecs.primary.title}
          </Typography>
        </Box>
      )}

      {/* Fase 3 continuation: Real AIBrain.ask insight button (visible daily gesture) */}
      <Box sx={{ mb: 2 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={fetchAIBrainRecInsight}
          disabled={aiRecLoading}
          startIcon={<Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>}
        >
          {aiRecLoading ? 'AIBrain…' : 'Insight AIBrain sulle raccomandazioni'}
        </Button>
        {aiRecInsight && (
          <Box sx={{ mt: 1, p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: tok('secondary-container') }}>
            <Typography variant="caption" sx={{ color: tok('on-secondary-container'), fontWeight: 500 }}>
              AIBrain (Fase 3): {aiRecInsight}
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── Initial prompt ───────────────────────────────────────────────────── */}      {/* ── Decision Engine guidance ──────────────────────────────────── */}
      {recommendations === null && !loading && (
        <Alert
          severity="info"
          icon={
            <Box component="span" className="material-symbols-outlined" aria-hidden="true"
              sx={{ fontSize: 'var(--md-sys-icon-size-sm)', verticalAlign: 'middle' }}>
              {nextAction.icon}
            </Box>
          }
          sx={{
            mb: 1.5,
            bgcolor: tok('primary-container'),
            color:   tok('on-primary-container'),
            '& .MuiAlert-icon': { color: tok('primary') },
          }}
        >
          <Typography variant="labelSmall" sx={{ display: 'block', mb: 0.25, fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}>
            {nextAction.label}
          </Typography>
          <Typography variant="bodySmall">
            {nextAction.reason}
          </Typography>
        </Alert>
      )}
      {recommendations === null && !loading && (
        <Alert
          severity="info"
          icon={<TipsAndUpdatesOutlinedIcon fontSize="inherit" />}
          sx={{ bgcolor: tok('secondary-container'), color: tok('on-secondary-container') }}
        >
          Premi <strong>Calcola</strong> per ottenere raccomandazioni basate sui dati reali della classe: analisi curricolo, pedagogia e fiducia AI.
        </Alert>
      )}

      {/* ── Loading state ────────────────────────────────────────────────────── */}
      {loading && (
        <Stack alignItems="center" py={4}>
          <CircularProgress size={32} aria-label="Analisi raccomandazioni in corso" />
          <Typography variant="bodySmall" sx={{ mt: 1.5, color: tok('on-surface-variant') }}>
            Analisi curricolo · pedagogia · fiducia AI in corso…
          </Typography>
        </Stack>
      )}

      {/* ── Results ──────────────────────────────────────────────────────────── */}
      {recommendations !== null && !loading && (
        <Stack spacing={2}>
          {recommendations.length === 0 && (
            <Alert
              severity="success"
              icon={<CheckCircleOutlineIcon fontSize="inherit" />}
              sx={{ bgcolor: tok('primary-container'), color: tok('on-primary-container') }}
            >
              Nessuna raccomandazione critica rilevata. La classe mostra buoni indicatori di curricolo, pedagogici e di fiducia AI.
            </Alert>
          )}

          {recommendations.map(rec => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}

          {recommendations.length > 0 && (
            <>
              <Divider />
              <Typography
                variant="bodySmall"
                sx={{ color: tok('on-surface-variant'), textAlign: 'right' }}
              >
                {recommendations.length} raccomandazion{recommendations.length !== 1 ? 'i' : 'e'} ordinate per impatto decrescente
              </Typography>
            </>
          )}
        </Stack>
      )}

      {/* ── Plugin extension slot (studio-tools) ─────────────────────────────── */}
      <PluginSlot
        slot="studio-tools"
        context={{ recommendations: recommendations ?? [] }}
        emptyFallback={null}
      />
    </Box>
  );
};

export default CopilotRecommendationPanel;

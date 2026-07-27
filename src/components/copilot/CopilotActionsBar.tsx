/**
 * CopilotActionsBar.tsx — Inline action buttons for at-risk students (FASE 2)
 *
 * Renders three action buttons per at-risk student:
 *   [Programma interrogazione]  [Crea attività recupero]  [Comunica alla famiglia]
 *
 * On click, opens a confirmation/preview dialog before the action is applied.
 * MD3 compliant — all containers via Box sx tokens, no raw div styling.
 */
import React, { useMemo, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import { useJourneyProgress } from '../../hooks/useJourneyProgress';
import { useNextAction } from '../../hooks/useNextAction';
import { M3Surface } from '../ui';
import type { Studente, Valutazione } from '@/types';
import type { AISuggestion } from '../../ai/contextEngine/types';

// Fase 3 migration: route through AIBrain (central + deprecation path for copilot actions)
import { AIBrain } from '../../ai/brain/AIBrain';
import {
  buildAllActionsForStudent,
  type CopilotAction,
  type OralExamPayload,
  type RecoveryPayload,
  type ParentMessagePayload,
} from '../../ai/copilot/actions';
import {
  logAIActionTriggered,
} from '../../ai/telemetry/aiTelemetry';

// ── helpers ───────────────────────────────────────────────────────────────────

const URGENCY_COLOR: Record<string, 'error' | 'warning' | 'default'> = {
  high: 'error',
  medium: 'warning',
  low: 'default',
};

const ACTION_ICON: Record<string, string> = {
  suggest_oral_exam: 'record_voice_over',
  schedule_recovery: 'school',
  generate_parent_message: 'mail',
};

// ── payload renderers ─────────────────────────────────────────────────────────

function OralPayload({ payload }: { payload: OralExamPayload }) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
        {payload.rationale}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip size="small" label={`Materia: ${payload.suggestedSubject}`} />
        <Chip size="small" label={`Entro ${payload.windowDays} giorni`} />
      </Box>
    </Stack>
  );
}

function RecoveryPayloadView({ payload }: { payload: RecoveryPayload }) {
  return (
    <Stack spacing={1.5}>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip size="small" label={`${payload.suggestedSessions} sessioni`} />
        <Chip
          size="small"
          label={payload.suggestedFormat === 'individual' ? 'Individuale' : 'Gruppo'}
        />
      </Box>
      <Typography variant="overline" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
        Obiettivi suggeriti
      </Typography>
      <Stack spacing={0.5}>
        {payload.objectives.map((obj, i) => (
          <Typography key={i} variant="body2" sx={{ display: 'flex', gap: 0.5 }}>
            <Box component="span" className="material-symbols-outlined" sx={{ fontSize: 16, mt: '1px', color: 'var(--md-sys-color-primary)' }} aria-hidden="true">
              check_circle
            </Box>
            {obj}
          </Typography>
        ))}
      </Stack>
    </Stack>
  );
}

function MessagePayloadView({ payload }: { payload: ParentMessagePayload }) {
  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          p: 1.5,
          bgcolor: 'var(--md-sys-color-surface-container)',
          borderRadius: 'var(--md-sys-shape-corner-small)',
          border: '1px solid var(--md-sys-color-outline-variant)',
        }}
      >
        <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'block', mb: 0.5 }}>
          Oggetto
        </Typography>
        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
          {payload.subject}
        </Typography>
      </Box>
      <Box
        sx={{
          p: 1.5,
          bgcolor: 'var(--md-sys-color-surface-container)',
          borderRadius: 'var(--md-sys-shape-corner-small)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          maxHeight: 200,
          overflowY: 'auto',
        }}
      >
        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
          {payload.body}
        </Typography>
      </Box>
    </Stack>
  );
}

function ActionPayloadContent({ action }: { action: CopilotAction }) {
  switch (action.actionType) {
    case 'suggest_oral_exam':
      return <OralPayload payload={action.payload as OralExamPayload} />;
    case 'schedule_recovery':
      return <RecoveryPayloadView payload={action.payload as RecoveryPayload} />;
    case 'generate_parent_message':
      return <MessagePayloadView payload={action.payload as ParentMessagePayload} />;
    default:
      return null;
  }
}

// ── action dialog ─────────────────────────────────────────────────────────────

interface ActionDialogProps {
  action: CopilotAction | null;
  onClose: () => void;
  onConfirm: (action: CopilotAction) => void;
}

function ActionDialog({ action, onClose, onConfirm }: ActionDialogProps) {
  if (!action) return null;
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{ color: 'var(--md-sys-color-primary)' }}
        >
          {ACTION_ICON[action.actionType]}
        </Box>
        {action.label}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity={action.urgency === 'high' ? 'error' : action.urgency === 'medium' ? 'warning' : 'info'}>
            {action.description}
          </Alert>
          <Divider />
          <ActionPayloadContent action={action} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button
          variant="contained"
          onClick={() => { onConfirm(action); onClose(); }}
          startIcon={
            <Box component="span" className="material-symbols-outlined" aria-hidden="true">
              check
            </Box>
          }
        >
          Applica azione
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── student risk row ──────────────────────────────────────────────────────────

interface RiskStudentRowProps {
  suggestion: AISuggestion;
  student: Studente;
  evaluations: Valutazione[];
  onActionApplied: (action: CopilotAction) => void;
}

function RiskStudentRow({ suggestion, student, evaluations, onActionApplied }: RiskStudentRowProps) {
  const [dialogAction, setDialogAction] = useState<CopilotAction | null>(null);

  const actions = useMemo(
    () => buildAllActionsForStudent(suggestion, student, evaluations),
    [suggestion, student, evaluations],
  );

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        bgcolor: 'var(--md-sys-color-surface-container)',
        border: '1px solid var(--md-sys-color-outline-variant)',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{ color: 'var(--md-sys-color-error)', fontSize: 18 }}
        >
          person_alert
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 'var(--md-sys-typescale-weight-medium)', flex: 1 }}>
          {student.nome} {student.cognome}
        </Typography>
        <Chip
          size="small"
          label={`${Math.round(suggestion.confidence * 100)}%`}
          color={URGENCY_COLOR[actions[0]?.urgency ?? 'low']}
          variant="outlined"
        />
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {actions.map((action) => (
          <Button
            key={action.id}
            size="small"
            variant="outlined"
            aria-label={`${action.label} per ${student.nome} ${student.cognome}`}
            onClick={() => {
              logAIActionTriggered(action.actionType, student.id);
              setDialogAction(action);
            }}
            startIcon={
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: '16px !important' }}
              >
                {ACTION_ICON[action.actionType]}
              </Box>
            }
            sx={{ textTransform: 'none' }}
          >
            {action.label}
          </Button>
        ))}
      </Stack>

      <ActionDialog
        action={dialogAction}
        onClose={() => setDialogAction(null)}
        onConfirm={onActionApplied}
      />
    </Box>
  );
}

// ── main component ────────────────────────────────────────────────────────────

interface CopilotActionsBarProps {
  /** Risk suggestions from the AI engine */
  riskSuggestions: AISuggestion[];
  /** Full student list (used to resolve student details) */
  students: Studente[];
  /** All evaluations */
  evaluations: Valutazione[];
  /** Optional external callback when a teacher accepts an action */
  onActionApplied?: (action: CopilotAction) => void;
  /** Max students to display (default: 5) */
  maxVisible?: number;
}

/**
 * CopilotActionsBar — renders per-student action buttons for at-risk students.
 *
 * @example
 * <CopilotActionsBar
 *   riskSuggestions={risks}
 *   students={students}
 *   evaluations={evaluations}
 * />
 */
export default function CopilotActionsBar({
  riskSuggestions,
  students,
  evaluations,
  onActionApplied,
  maxVisible = 5,
}: CopilotActionsBarProps): JSX.Element {
  const [appliedCount, setAppliedCount] = useState(0);
  const { level, progress } = useJourneyProgress();
  const nextAction = useNextAction();

  // Fase 3 continuation: Real AIBrain consumption (buildContext + getUnifiedRecommendations + ask)
  // user-centric daily gesture for at-risk actions
  // rollback-safe side-by-side + deprecation path
  const actionsContext = React.useMemo(() => AIBrain.buildContext({
    source: 'copilot-actions-bar',
    extra: { riskyCount: riskyStudents.length }
  }), [riskyStudents.length]);

  const actionsRecs = React.useMemo(() => {
    try { return AIBrain.getUnifiedRecommendations(actionsContext); } catch { return null; }
  }, [actionsContext]);

  const [aiActionsInsight, setAiActionsInsight] = React.useState<string | null>(null);
  const [aiActionsLoading, setAiActionsLoading] = React.useState(false);

  const fetchAIBrainActionsInsight = React.useCallback(async () => {
    setAiActionsLoading(true);
    try {
      const res = await AIBrain.ask({
        prompt: 'Suggerisci una rapida priorità o insight per le azioni su studenti a rischio.',
        context: actionsContext,
        mode: 'balanced'
      });
      setAiActionsInsight(res.content);
      if (import.meta.env.DEV) {
        AIBrain.migrateLegacyAsk('legacy-copilot-actions', actionsContext).catch(() => {});
      }
    } catch {
      setAiActionsInsight('Impossibile ottenere insight AIBrain.');
    } finally {
      setAiActionsLoading(false);
    }
  }, [actionsContext]);

  const studentMap = useMemo(
    () => new Map(students.map((s) => [s.id, s])),
    [students],
  );

  const riskyStudents = useMemo(
    () =>
      riskSuggestions
        .filter((s) => s.type === 'student_at_risk' && s.studentId)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, maxVisible)
        .map((s) => ({ suggestion: s, student: studentMap.get(s.studentId!) }))
        .filter((x): x is { suggestion: AISuggestion; student: Studente } => !!x.student),
    [riskSuggestions, studentMap, maxVisible],
  );

  const handleActionApplied = useCallback((action: CopilotAction) => {
    setAppliedCount((n) => n + 1);
    onActionApplied?.(action);
  }, [onActionApplied]);

  if (riskyStudents.length === 0) {
    return (
      <Alert
        severity="success"
        icon={
          <Box component="span" className="material-symbols-outlined" aria-hidden="true">
            verified
          </Box>
        }
      >
        Nessuno studente a rischio rilevato — nessuna azione necessaria.
      </Alert>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{ color: 'var(--md-sys-color-error)', fontSize: 20 }}
        >
          warning
        </Box>
        <Typography variant="titleSmall" sx={{ flex: 1, color: 'var(--md-sys-color-on-surface)' }}>
          Azioni suggerite ({riskyStudents.length} studenti a rischio)
        </Typography>
        {appliedCount > 0 && (
          <Chip size="small" color="success" label={`${appliedCount} applicate`} />
        )}
      </Stack>

      {riskyStudents.map(({ suggestion, student }) => (
        <RiskStudentRow
          key={student.id}
          suggestion={suggestion}
          student={student}
          evaluations={evaluations}
          onActionApplied={handleActionApplied}
        />
      ))}

      {/* Fase 3 continuation: Visible AIBrain unified + real ask (daily gesture in actions bar) */}
      {actionsRecs?.primary && (
        <Box sx={{ mt: 1, p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-tertiary-container)' }}>
          <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-tertiary-container)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>
            AIBrain (Fase 3): {actionsRecs.primary.label || actionsRecs.primary.title}
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 1 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={fetchAIBrainActionsInsight}
          disabled={aiActionsLoading}
          startIcon={<Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>}
        >
          {aiActionsLoading ? 'AIBrain…' : 'Insight AIBrain azioni rischio'}
        </Button>
        {aiActionsInsight && (
          <Box sx={{ mt: 1, p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-secondary-container)' }}>
            <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-secondary-container)' }}>
              AIBrain (Fase 3): {aiActionsInsight}
            </Typography>
          </Box>
        )}
      </Box>

      {level !== 'maestro' && (
        <M3Surface elevation={1} sx={{ p: 1.5, borderRadius: 'var(--md-sys-shape-corner-medium)' }}>
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Il tuo percorso
              </Typography>
              <Chip
                size="small"
                label={level === 'esploratore' ? 'Esploratore' : 'Praticante'}
                color={level === 'esploratore' ? 'default' : 'primary'}
                variant="outlined"
                sx={{ height: 20, fontSize: 'var(--md-sys-typescale-label-small-font-size)' }}
              />
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.round(progress * 100)}
              aria-label="Progresso livello"
              sx={{ borderRadius: 4, height: 6 }}
            />
            <Button
              size="small"
              variant="text"
              aria-label={nextAction.cta}
              sx={{ alignSelf: 'flex-start', fontSize: 'var(--md-sys-typescale-label-small-font-size)', p: 0, minHeight: 'auto' }}
              onClick={() => {}}
            >
              {nextAction.label}
            </Button>
          </Stack>
        </M3Surface>
      )}
    </Stack>
  );
}

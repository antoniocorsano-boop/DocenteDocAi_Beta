/**
 * FundingPanel.tsx — Pannello Finanziamenti e Bandi Educativi
 *
 * Tab 12 del CopilotDocentePanel. Gestisce:
 *   - Selezione tipo progetto
 *   - Check compliance GDPR/SPID/DPA/SLA
 *   - Lista bandi con urgency/impact bar
 *   - Generazione bozze candidatura
 *   - Simulazione probabilità approvazione
 *   - Tracker candidature
 *
 * MD3 Gold Compliant: usa M3Surface, MUI v7, aria-labels completi.
 * Nessun <div> wrapper per layout o semantica visiva.
 */

import React, { useCallback, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

import M3Surface from '../ui/M3Surface';
import { useFundingStore } from '../../stores/useFundingStore';
import { useAcademicStore } from '../../stores/useAcademicStore';
import { generateCandidaturaDraft, BANDI_CATALOGO } from '../../ai/funding/FundingAI';
import type {
  ProjectType,
  FundingOpportunity,
  CandidaturaSubmission,
  SubmissionStatus,
  UserFundingProfile,
} from '../../types/funding.types';
import type { Studente, Lezione, Uda } from '../../types';

// ── Token helper ──────────────────────────────────────────────────────────────

function tok(name: string) {
  return `var(--md-sys-color-${name})`;
}

// ── Tipi progetto ─────────────────────────────────────────────────────────────

const PROJECT_TYPES: { value: ProjectType; label: string; icon: React.ReactElement }[] = [
  { value: 'Pilota AI', label: 'Pilota AI', icon: <AutoAwesomeOutlinedIcon fontSize="small" aria-hidden /> },
  { value: 'Curriculum Innovativo', label: 'Curriculum Innovativo', icon: <SchoolOutlinedIcon fontSize="small" aria-hidden /> },
  { value: 'Inclusione Digitale', label: 'Inclusione Digitale', icon: <VerifiedOutlinedIcon fontSize="small" aria-hidden /> },
];

// ── Status candidatura ────────────────────────────────────────────────────────

const STATUS_META: Record<
  SubmissionStatus,
  { label: string; color: string; bg: string; icon: React.ReactElement }
> = {
  bozza: {
    label: 'Bozza',
    color: tok('on-surface-variant'),
    bg: tok('surface-variant'),
    icon: <ArticleOutlinedIcon fontSize="small" aria-hidden />,
  },
  inviato: {
    label: 'Inviato',
    color: tok('on-primary-container'),
    bg: tok('primary-container'),
    icon: <SendOutlinedIcon fontSize="small" aria-hidden />,
  },
  approvato: {
    label: 'Approvato ✅',
    color: tok('on-tertiary-container'),
    bg: tok('tertiary-container'),
    icon: <CheckCircleOutlineIcon fontSize="small" aria-hidden />,
  },
  rifiutato: {
    label: 'Rifiutato',
    color: tok('on-error-container'),
    bg: tok('error-container'),
    icon: <CancelOutlinedIcon fontSize="small" aria-hidden />,
  },
};

// ── Compliance badge ──────────────────────────────────────────────────────────

interface ComplianceBadgeProps {
  label: string;
  checked: boolean;
  tooltip: string;
  onChange: (v: boolean) => void;
}

function ComplianceBadge({ label, checked, tooltip, onChange }: ComplianceBadgeProps) {
  return (
    <Tooltip title={tooltip} arrow>
      <FormControlLabel
        label={
          <Stack direction="row" spacing={0.5} alignItems="center">
            {checked ? (
              <CheckCircleOutlineIcon fontSize="small" sx={{ color: tok('tertiary') }} aria-hidden />
            ) : (
              <WarningAmberOutlinedIcon fontSize="small" sx={{ color: tok('error') }} aria-hidden />
            )}
            <Typography variant="caption" sx={{ color: checked ? tok('on-surface') : tok('error') }}>
              {label}
            </Typography>
          </Stack>
        }
        control={
          <Switch
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            size="small"
            inputProps={{ 'aria-label': `Compliance ${label}` }}
          />
        }
        sx={{ m: 0 }}
      />
    </Tooltip>
  );
}

// ── Score bar ─────────────────────────────────────────────────────────────────

interface ScoreBarProps {
  label: string;
  value: number; // 0-1
  colorHigh: string;
  colorMid: string;
  colorLow: string;
}

function ScoreBar({ label, value, colorHigh, colorMid, colorLow }: ScoreBarProps) {
  const pct = Math.round(value * 100);
  const barColor = value >= 0.7 ? colorHigh : value >= 0.4 ? colorMid : colorLow;
  return (
    <Stack spacing={0.25}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption" sx={{ color: tok('on-surface-variant') }}>
          {label}
        </Typography>
        <Typography variant="caption" fontWeight={600} sx={{ color: barColor }}>
          {pct}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        aria-label={`${label}: ${pct}%`}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: tok('surface-variant'),
          '& .MuiLinearProgress-bar': { backgroundColor: barColor, borderRadius: 3 },
        }}
      />
    </Stack>
  );
}

// ── Bando card ────────────────────────────────────────────────────────────────

interface BandoCardProps {
  bando: FundingOpportunity;
  submission?: CandidaturaSubmission;
  onGeneraCandidatura: (bandoId: string) => void;
  onSimula: (bandoId: string) => void;
  onSetStatus: (bandoId: string, status: SubmissionStatus) => void;
}

function BandoCard({
  bando,
  submission,
  onGeneraCandidatura,
  onSimula,
  onSetStatus,
}: BandoCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { simulations } = useFundingStore();
  const sim = simulations[bando.id];
  const daysLeft = Math.ceil(
    (new Date(bando.scadenza).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isExpiring = daysLeft <= 30;

  return (
    <M3Surface
      elevation={2}
      sx={{
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        p: 'var(--md-sys-spacing-4)',
        border: isExpiring ? `1px solid ${tok('error')}` : `1px solid ${tok('outline-variant')}`,
      }}
    >
      {/* Header bando */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Stack spacing={0.5} flex={1}>
          <Typography
            variant="titleSmall"
            fontWeight={600}
            sx={{ color: tok('on-surface') }}
          >
            {bando.titolo}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              icon={<AccountBalanceOutlinedIcon fontSize="small" aria-hidden />}
              label={bando.ente}
              size="small"
              sx={{
                backgroundColor: tok('surface-container-low'),
                color: tok('on-surface-variant'),
                fontSize: 'var(--md-sys-typescale-label-small-font-size)',
              }}
            />
            <Chip
              label={`Scadenza: ${bando.scadenza}`}
              size="small"
              sx={{
                backgroundColor: isExpiring ? tok('error-container') : tok('surface-container-low'),
                color: isExpiring ? tok('on-error-container') : tok('on-surface-variant'),
                fontSize: 'var(--md-sys-typescale-label-small-font-size)',
              }}
            />
            <Chip
              label={bando.budget}
              size="small"
              sx={{
                backgroundColor: tok('secondary-container'),
                color: tok('on-secondary-container'),
                fontSize: 'var(--md-sys-typescale-label-small-font-size)',
              }}
            />
            {bando.tipoProgetto.map((t) => (
              <Chip
                key={t}
                label={t}
                size="small"
                sx={{
                  backgroundColor: tok('tertiary-container'),
                  color: tok('on-tertiary-container'),
                  fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                }}
              />
            ))}
          </Stack>
        </Stack>

        <IconButton
          size="small"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? `Comprimi dettagli ${bando.titolo}` : `Espandi dettagli ${bando.titolo}`}
        >
          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Stack>

      {/* Score bars */}
      <Stack spacing={1} sx={{ mt: 'var(--md-sys-spacing-3)' }}>
        <ScoreBar
          label="Urgenza"
          value={bando.urgencyScore}
          colorHigh={tok('error')}
          colorMid={tok('tertiary')}
          colorLow={tok('primary')}
        />
        <ScoreBar
          label="Impatto pedagogico"
          value={bando.impactScore}
          colorHigh={tok('tertiary')}
          colorMid={tok('primary')}
          colorLow={tok('on-surface-variant')}
        />
        {sim && (
          <ScoreBar
            label="Probabilità approvazione"
            value={sim.probabilita}
            colorHigh={tok('tertiary')}
            colorMid={tok('primary')}
            colorLow={tok('error')}
          />
        )}
      </Stack>

      {/* Stato candidatura */}
      {submission && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 'var(--md-sys-spacing-2)' }}>
          <Chip
            icon={STATUS_META[submission.status].icon}
            label={STATUS_META[submission.status].label}
            size="small"
            sx={{
              backgroundColor: STATUS_META[submission.status].bg,
              color: STATUS_META[submission.status].color,
            }}
          />
          {submission.dataSottomissione && (
            <Typography variant="caption" sx={{ color: tok('on-surface-variant') }}>
              {new Date(submission.dataSottomissione).toLocaleDateString('it-IT')}
            </Typography>
          )}
        </Stack>
      )}

      {/* Dettagli espansi */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Stack spacing='var(--md-sys-spacing-3)' sx={{ mt: 'var(--md-sys-spacing-3)' }}>
          <Divider />
          <Typography variant="body2" sx={{ color: tok('on-surface-variant') }}>
            {bando.descrizione}
          </Typography>

          {/* Requisiti */}
          <Stack spacing={0.5}>
            <Typography variant="labelMedium" fontWeight={600} sx={{ color: tok('on-surface') }}>
              Requisiti formali
            </Typography>
            {bando.requisiti.map((req) => (
              <Stack key={req} direction="row" spacing={0.5} alignItems="center">
                <GavelOutlinedIcon fontSize="small" sx={{ color: tok('primary'), flexShrink: 0 }} aria-hidden />
                <Typography variant="caption" sx={{ color: tok('on-surface') }}>
                  {req}
                </Typography>
              </Stack>
            ))}
          </Stack>

          {/* Attività suggerite */}
          {bando.suggestedActivities && (
            <Stack spacing={0.5}>
              <Typography variant="labelMedium" fontWeight={600} sx={{ color: tok('on-surface') }}>
                Attività AI suggerite
              </Typography>
              {bando.suggestedActivities.map((att) => (
                <Stack key={att} direction="row" spacing={0.5} alignItems="center">
                  <AutoAwesomeOutlinedIcon fontSize="small" sx={{ color: tok('tertiary'), flexShrink: 0 }} aria-hidden />
                  <Typography variant="caption" sx={{ color: tok('on-surface') }}>
                    {att}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}

          {/* Budget breakdown */}
          {bando.budgetBreakdown && (
            <Stack spacing={0.5}>
              <Typography variant="labelMedium" fontWeight={600} sx={{ color: tok('on-surface') }}>
                Ripartizione budget indicativa
              </Typography>
              {bando.budgetBreakdown.map((v) => (
                <Stack key={v.voce} direction="row" justifyContent="space-between">
                  <Typography variant="caption" sx={{ color: tok('on-surface-variant') }}>
                    {v.voce}
                  </Typography>
                  <Typography variant="caption" fontWeight={600} sx={{ color: tok('on-surface') }}>
                    {v.percentuale}%
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}

          {/* Simulazione risultati */}
          {sim && (
            <M3Surface
              elevation={3}
              sx={{ borderRadius: 'var(--md-sys-shape-corner-small)', p: 'var(--md-sys-spacing-3)' }}
            >
              <Typography variant="labelMedium" fontWeight={600} sx={{ mb: 1, color: tok('on-surface') }}>
                Simulazione approvazione — {Math.round(sim.probabilita * 100)}%
              </Typography>
              {sim.fattoriPositivi.length > 0 && (
                <Stack spacing={0.25} sx={{ mb: 1 }}>
                  {sim.fattoriPositivi.map((f) => (
                    <Stack key={f} direction="row" spacing={0.5} alignItems="center">
                      <CheckCircleOutlineIcon fontSize="small" sx={{ color: tok('tertiary') }} aria-hidden />
                      <Typography variant="caption" sx={{ color: tok('on-surface') }}>{f}</Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
              {sim.fattoriRischio.length > 0 && (
                <Stack spacing={0.25} sx={{ mb: 1 }}>
                  {sim.fattoriRischio.map((f) => (
                    <Stack key={f} direction="row" spacing={0.5} alignItems="center">
                      <WarningAmberOutlinedIcon fontSize="small" sx={{ color: tok('error') }} aria-hidden />
                      <Typography variant="caption" sx={{ color: tok('error') }}>{f}</Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
              {sim.suggerimenti.length > 0 && (
                <Stack spacing={0.25}>
                  <Typography variant="caption" fontWeight={600} sx={{ color: tok('on-surface-variant') }}>
                    Suggerimenti
                  </Typography>
                  {sim.suggerimenti.map((s) => (
                    <Typography key={s} variant="caption" sx={{ color: tok('on-surface-variant') }}>
                      • {s}
                    </Typography>
                  ))}
                </Stack>
              )}
            </M3Surface>
          )}

          {/* Bozza testuale */}
          {submission?.bozzaTestuale && (
            <M3Surface
              elevation={1}
              component="pre"
              sx={{
                borderRadius: 'var(--md-sys-shape-corner-small)',
                p: 'var(--md-sys-spacing-3)',
                fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                color: tok('on-surface'),
                maxHeight: 300,
                overflow: 'auto',
              }}
            >
              {submission.bozzaTestuale}
            </M3Surface>
          )}

          {/* Azioni */}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              variant="contained"
              startIcon={<ArticleOutlinedIcon aria-hidden />}
              onClick={() => onGeneraCandidatura(bando.id)}
              aria-label={`Genera bozza candidatura per ${bando.titolo}`}
            >
              Genera candidatura
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AutoAwesomeOutlinedIcon aria-hidden />}
              onClick={() => onSimula(bando.id)}
              aria-label={`Simula probabilità approvazione per ${bando.titolo}`}
            >
              Simula approvazione
            </Button>
            {bando.url && (
              <Button
                size="small"
                variant="text"
                component="a"
                href={bando.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Apri bando ufficiale ${bando.titolo} (nuova finestra)`}
              >
                Bando ufficiale ↗
              </Button>
            )}
          </Stack>

          {/* Cambio stato candidatura */}
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="caption" sx={{ color: tok('on-surface-variant') }}>
              Stato:
            </Typography>
            {(['bozza', 'inviato', 'approvato', 'rifiutato'] as SubmissionStatus[]).map((s) => (
              <Button
                key={s}
                size="small"
                variant={submission?.status === s ? 'contained' : 'outlined'}
                onClick={() => onSetStatus(bando.id, s)}
                aria-label={`Imposta stato ${STATUS_META[s].label} per ${bando.titolo}`}
                sx={{
                  fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                  py: 0.25,
                  px: 1,
                  minWidth: 0,
                  ...(submission?.status === s && {
                    backgroundColor: STATUS_META[s].bg,
                    color: STATUS_META[s].color,
                    borderColor: 'transparent',
                    '&:hover': { backgroundColor: STATUS_META[s].bg },
                  }),
                }}
              >
                {STATUS_META[s].label}
              </Button>
            ))}
          </Stack>
        </Stack>
      </Collapse>
    </M3Surface>
  );
}

// ── Props del pannello ────────────────────────────────────────────────────────

export interface FundingPanelProps {
  students: Studente[];
  udas: Uda[];
  className: string;
  /** Lezioni opzionali: se non fornite, vengono lette da useAcademicStore */
  lessons?: Lezione[];
  userProfile?: Partial<UserFundingProfile>;
}

// ── Componente principale ─────────────────────────────────────────────────────

export default function FundingPanel({
  students,
  lessons: lessonsProp,
  udas: _udas,
  className,
  userProfile: userProfileProp = {},
}: FundingPanelProps): JSX.Element {
  const storeLessons = useAcademicStore((s) => s.lessons);
  const lessons: Lezione[] = lessonsProp ?? Object.values(storeLessons);
  const {
    report,
    submissions,
    compliance,
    isLoading,
    error,
    lastBandiUpdate,
    actions,
  } = useFundingStore();

  const [selectedType, setSelectedType] = useState<ProjectType>('Pilota AI');
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [showDocuments, setShowDocuments] = useState(false);

  const userProfile = useMemo<UserFundingProfile>(() => ({
    className,
    istituto: userProfileProp.istituto,
    regione: userProfileProp.regione,
    hasSpid: compliance.spid,
    hasGdprRegistry: compliance.gdpr,
    hasDpa: compliance.dpa,
    hasSla: compliance.sla,
    ...userProfileProp,
  }), [className, userProfileProp, compliance.spid, compliance.gdpr, compliance.dpa, compliance.sla]);

  const handleCompute = useCallback(() => {
    actions.compute(selectedType, userProfile, lessons, students);
  }, [actions, selectedType, userProfile, lessons, students]);

  const handleGeneraCandidatura = useCallback(
    (bandoId: string) => {
      const bando = BANDI_CATALOGO.find((b) => b.id === bandoId);
      if (!bando) return;
      const bozza = generateCandidaturaDraft(
        bando,
        selectedType,
        userProfile,
        lessons.length,
        students.length
      );
      // Track submission as bozza if not already tracked
      const existing = submissions.find((s) => s.bandoId === bandoId);
      actions.trackSubmission(bandoId, existing?.status ?? 'bozza', existing?.documents ?? [], existing?.note);
      actions.setBozzaTestuale(bandoId, bozza);
    },
    [actions, selectedType, userProfile, lessons.length, students.length, submissions]
  );

  const handleSimula = useCallback(
    (bandoId: string) => {
      const aiMaturita = report?.contextStats.aiMaturita ?? 'bassa';
      actions.simulateBando(bandoId, lessons.length, students.length, aiMaturita);
    },
    [actions, report, lessons.length, students.length]
  );

  const handleSetStatus = useCallback(
    (bandoId: string, status: SubmissionStatus) => {
      const existing = submissions.find((s) => s.bandoId === bandoId);
      if (!existing) {
        actions.trackSubmission(bandoId, status, []);
      } else {
        actions.trackSubmission(bandoId, status, existing.documents, existing.note);
      }
    },
    [actions, submissions]
  );

  const complianceScore = report?.complianceScore ?? 0;
  const readyToSubmit = actions.readyToSubmit();

  return (
    <M3Surface elevation={0} sx={{ p: 'var(--md-sys-spacing-2)' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 'var(--md-sys-spacing-4)' }}>
        <Stack spacing={0.25}>
          <Typography variant="titleMedium" fontWeight={700} sx={{ color: tok('on-surface') }}>
            Finanziamenti e Bandi Educativi
          </Typography>
          <Typography variant="bodySmall" sx={{ color: tok('on-surface-variant') }}>
            Trova bandi adatti al tuo progetto, genera candidature e monitora lo stato.
          </Typography>
        </Stack>
        <Tooltip title="Aggiorna catalogo bandi" arrow>
          <IconButton
            size="small"
            onClick={() => actions.refreshBandi()}
            disabled={isLoading}
            aria-label="Aggiorna catalogo bandi ministeriali"
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {lastBandiUpdate && (
        <Typography variant="caption" sx={{ color: tok('on-surface-variant'), display: 'block', mb: 'var(--md-sys-spacing-2)' }}>
          Ultimo aggiornamento bandi: {new Date(lastBandiUpdate).toLocaleString('it-IT')}
        </Typography>
      )}

      {/* Sezione 1: Selezione tipo progetto */}
      <M3Surface
        elevation={2}
        sx={{
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          p: 'var(--md-sys-spacing-4)',
          mb: 'var(--md-sys-spacing-4)',
        }}
      >
        <Typography variant="labelLarge" fontWeight={600} sx={{ mb: 'var(--md-sys-spacing-2)', color: tok('on-surface') }}>
          1 — Seleziona tipo di progetto
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {PROJECT_TYPES.map(({ value, label, icon }) => (
            <Chip
              key={value}
              icon={icon}
              label={label}
              onClick={() => setSelectedType(value)}
              variant={selectedType === value ? 'filled' : 'outlined'}
              aria-pressed={selectedType === value}
              aria-label={`Seleziona tipo progetto: ${label}`}
              sx={{
                cursor: 'pointer',
                ...(selectedType === value && {
                  backgroundColor: tok('primary-container'),
                  color: tok('on-primary-container'),
                  borderColor: tok('primary'),
                }),
              }}
            />
          ))}
        </Stack>
      </M3Surface>

      {/* Sezione 2: Compliance check */}
      <M3Surface
        elevation={2}
        sx={{
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          p: 'var(--md-sys-spacing-4)',
          mb: 'var(--md-sys-spacing-4)',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 'var(--md-sys-spacing-2)' }}>
          <Typography variant="labelLarge" fontWeight={600} sx={{ color: tok('on-surface') }}>
            2 — Analisi readiness normativa
          </Typography>
          <Chip
            icon={
              readyToSubmit ? (
                <CheckCircleOutlineIcon fontSize="small" aria-hidden />
              ) : (
                <WarningAmberOutlinedIcon fontSize="small" aria-hidden />
              )
            }
            label={readyToSubmit ? 'Pronto per candidatura' : 'Compliance incompleta'}
            size="small"
            sx={{
              backgroundColor: readyToSubmit ? tok('tertiary-container') : tok('error-container'),
              color: readyToSubmit ? tok('on-tertiary-container') : tok('on-error-container'),
            }}
          />
        </Stack>

        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 'var(--md-sys-spacing-3)' }}>
          <ComplianceBadge
            label="GDPR"
            checked={compliance.gdpr}
            tooltip="Registro trattamenti GDPR art.30 completo, consenso famiglie firmato, informativa privacy aggiornata."
            onChange={(v) => actions.updateCompliance({ gdpr: v })}
          />
          <ComplianceBadge
            label="SPID"
            checked={compliance.spid}
            tooltip="Identità digitale SPID o CIE del docente referente verificata per accesso ai portali PA."
            onChange={(v) => actions.updateCompliance({ spid: v })}
          />
          <ComplianceBadge
            label="DPA"
            checked={compliance.dpa}
            tooltip="Data Processing Agreement firmato con il fornitore AI — obbligatorio per ogni bando con dati alunni."
            onChange={(v) => actions.updateCompliance({ dpa: v })}
          />
          <ComplianceBadge
            label="SLA / Accessibilità"
            checked={compliance.sla}
            tooltip="Dichiarazione di accessibilità WCAG 2.1 AA (Legge Stanca) e SLA del servizio digitale adottato."
            onChange={(v) => actions.updateCompliance({ sla: v })}
          />
        </Stack>

        {complianceScore > 0 && (
          <ScoreBar
            label="Score compliance"
            value={complianceScore}
            colorHigh={tok('tertiary')}
            colorMid={tok('primary')}
            colorLow={tok('error')}
          />
        )}

        {!readyToSubmit && (
          <Alert
            severity="warning"
            icon={<WarningAmberOutlinedIcon fontSize="small" />}
            sx={{ mt: 'var(--md-sys-spacing-2)', fontSize: 'var(--md-sys-typescale-body-small-font-size)' }}
          >
            Attiva tutti i flag compliance prima di inviare una candidatura ufficiale.
          </Alert>
        )}
      </M3Surface>

      {/* Sezione 3: Calcola */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 'var(--md-sys-spacing-4)' }}>
        <Button
          variant="contained"
          startIcon={isLoading ? <CircularProgress size={14} color="inherit" aria-hidden /> : <AutoAwesomeOutlinedIcon aria-hidden />}
          onClick={handleCompute}
          disabled={isLoading}
          aria-label="Calcola bandi e raccomandazioni AI per il progetto selezionato"
        >
          {isLoading ? 'Analisi in corso…' : 'Calcola bandi e suggerimenti AI'}
        </Button>
        {report && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<CancelOutlinedIcon fontSize="small" aria-hidden />}
            onClick={() => actions.clear()}
            aria-label="Azzera analisi finanziamenti"
          >
            Azzera
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 'var(--md-sys-spacing-3)' }}>
          {error}
        </Alert>
      )}

      {/* Risultati */}
      {report && (
        <Stack spacing='var(--md-sys-spacing-4)'>
          {/* Stats contesto */}
          <M3Surface
            elevation={1}
            sx={{
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              p: 'var(--md-sys-spacing-3)',
            }}
          >
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Chip
                icon={<SchoolOutlinedIcon fontSize="small" aria-hidden />}
                label={`${report.contextStats.lessonCount} lezioni`}
                size="small"
                sx={{ backgroundColor: tok('surface-container-low'), color: tok('on-surface-variant') }}
              />
              <Chip
                label={`${report.contextStats.studentCount} studenti`}
                size="small"
                sx={{ backgroundColor: tok('surface-container-low'), color: tok('on-surface-variant') }}
              />
              <Chip
                label={`${report.contextStats.udaCount} UDA collegate`}
                size="small"
                sx={{ backgroundColor: tok('surface-container-low'), color: tok('on-surface-variant') }}
              />
              <Chip
                icon={<AutoAwesomeOutlinedIcon fontSize="small" aria-hidden />}
                label={`Maturità AI: ${report.contextStats.aiMaturita}`}
                size="small"
                sx={{
                  backgroundColor:
                    report.contextStats.aiMaturita === 'alta'
                      ? tok('tertiary-container')
                      : report.contextStats.aiMaturita === 'media'
                      ? tok('primary-container')
                      : tok('error-container'),
                  color:
                    report.contextStats.aiMaturita === 'alta'
                      ? tok('on-tertiary-container')
                      : report.contextStats.aiMaturita === 'media'
                      ? tok('on-primary-container')
                      : tok('on-error-container'),
                }}
              />
              <Tooltip title="Punteggio di urgenza dei bandi disponibili" arrow>
                <Chip
                  icon={<HelpOutlineIcon fontSize="small" aria-hidden />}
                  label={`Urgenza: ${Math.round(report.urgencyScore * 100)}%`}
                  size="small"
                  sx={{ backgroundColor: tok('surface-container-low'), color: tok('on-surface-variant') }}
                />
              </Tooltip>
            </Stack>
          </M3Surface>

          {/* Raccomandazioni AI */}
          {report.recommendations.length > 0 && (
            <M3Surface
              elevation={2}
              sx={{ borderRadius: 'var(--md-sys-shape-corner-medium)', p: 'var(--md-sys-spacing-3)' }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 'var(--md-sys-spacing-2)' }}
              >
                <Typography variant="labelLarge" fontWeight={600} sx={{ color: tok('on-surface') }}>
                  Raccomandazioni AI
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setShowRecommendations((v) => !v)}
                  aria-expanded={showRecommendations}
                  aria-label={showRecommendations ? 'Comprimi raccomandazioni' : 'Espandi raccomandazioni'}
                >
                  {showRecommendations ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Stack>
              <Collapse in={showRecommendations}>
                <Stack spacing='var(--md-sys-spacing-3)'>
                  {report.recommendations.map((rec) => (
                    <M3Surface
                      key={rec.id}
                      elevation={3}
                      sx={{ borderRadius: 'var(--md-sys-shape-corner-small)', p: 'var(--md-sys-spacing-3)' }}
                    >
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <Chip
                          label={rec.priorita === 'alta' ? '🔴 Alta' : rec.priorita === 'media' ? '🟡 Media' : '🟢 Bassa'}
                          size="small"
                          sx={{
                            backgroundColor:
                              rec.priorita === 'alta'
                                ? tok('error-container')
                                : rec.priorita === 'media'
                                ? tok('tertiary-container')
                                : tok('secondary-container'),
                            color:
                              rec.priorita === 'alta'
                                ? tok('on-error-container')
                                : rec.priorita === 'media'
                                ? tok('on-tertiary-container')
                                : tok('on-secondary-container'),
                            flexShrink: 0,
                          }}
                        />
                        <Stack spacing={0.5}>
                          <Typography variant="labelMedium" fontWeight={600} sx={{ color: tok('on-surface') }}>
                            {rec.titolo}
                          </Typography>
                          <Typography variant="bodySmall" sx={{ color: tok('on-surface-variant') }}>
                            {rec.descrizione}
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                            <Tooltip title="Valore pedagogico" arrow>
                              <Chip
                                icon={<SchoolOutlinedIcon fontSize="small" aria-hidden />}
                                label={rec.pedagogicValue}
                                size="small"
                                sx={{
                                  backgroundColor: tok('primary-container'),
                                  color: tok('on-primary-container'),
                                  fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                                  maxWidth: 220,
                                  '& .MuiChip-label': { whiteSpace: 'normal', lineHeight: 1.3 },
                                }}
                              />
                            </Tooltip>
                            <Tooltip title="Valore curricolare" arrow>
                              <Chip
                                icon={<AssignmentTurnedInOutlinedIcon fontSize="small" aria-hidden />}
                                label={rec.curriculumValue}
                                size="small"
                                sx={{
                                  backgroundColor: tok('secondary-container'),
                                  color: tok('on-secondary-container'),
                                  fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                                  maxWidth: 220,
                                  '& .MuiChip-label': { whiteSpace: 'normal', lineHeight: 1.3 },
                                }}
                              />
                            </Tooltip>
                          </Stack>
                        </Stack>
                      </Stack>
                    </M3Surface>
                  ))}
                </Stack>
              </Collapse>
            </M3Surface>
          )}

          {/* Documenti necessari */}
          <M3Surface
            elevation={2}
            sx={{ borderRadius: 'var(--md-sys-shape-corner-medium)', p: 'var(--md-sys-spacing-3)' }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 'var(--md-sys-spacing-2)' }}
            >
              <Typography variant="labelLarge" fontWeight={600} sx={{ color: tok('on-surface') }}>
                Documenti necessari
              </Typography>
              <IconButton
                size="small"
                onClick={() => setShowDocuments((v) => !v)}
                aria-expanded={showDocuments}
                aria-label={showDocuments ? 'Comprimi documenti' : 'Espandi documenti'}
              >
                {showDocuments ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Stack>
            <Collapse in={showDocuments}>
              <Stack spacing={0.5}>
                {report.documentsNeeded.map((doc) => (
                  <Stack key={doc} direction="row" spacing={0.5} alignItems="center">
                    <ArticleOutlinedIcon fontSize="small" sx={{ color: tok('primary'), flexShrink: 0 }} aria-hidden />
                    <Typography variant="bodySmall" sx={{ color: tok('on-surface') }}>
                      {doc}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Collapse>
          </M3Surface>

          {/* Lista bandi */}
          <Stack spacing='var(--md-sys-spacing-3)'>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="labelLarge" fontWeight={600} sx={{ color: tok('on-surface') }}>
                Bandi disponibili ({report.fundingOpportunities.length})
              </Typography>
              <Typography variant="caption" sx={{ color: tok('on-surface-variant') }}>
                Ordinati per rilevanza · {selectedType}
              </Typography>
            </Stack>

            {report.fundingOpportunities.length === 0 ? (
              <Alert severity="info">
                Nessun bando trovato per il tipo di progetto selezionato. Prova con un altro tipo.
              </Alert>
            ) : (
              report.fundingOpportunities.map((bando) => (
                <BandoCard
                  key={bando.id}
                  bando={bando}
                  submission={submissions.find((s) => s.bandoId === bando.id)}
                  onGeneraCandidatura={handleGeneraCandidatura}
                  onSimula={handleSimula}
                  onSetStatus={handleSetStatus}
                />
              ))
            )}
          </Stack>

          {/* Tracker candidature */}
          {submissions.length > 0 && (
            <M3Surface
              elevation={2}
              sx={{ borderRadius: 'var(--md-sys-shape-corner-medium)', p: 'var(--md-sys-spacing-3)' }}
            >
              <Typography
                variant="labelLarge"
                fontWeight={600}
                sx={{ mb: 'var(--md-sys-spacing-2)', color: tok('on-surface') }}
              >
                Tracker candidature ({submissions.length})
              </Typography>
              <Stack spacing='var(--md-sys-spacing-2)'>
                {submissions.map((sub) => {
                  const bando = BANDI_CATALOGO.find((b) => b.id === sub.bandoId);
                  const meta = STATUS_META[sub.status];
                  return (
                    <Stack
                      key={sub.bandoId}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        p: 'var(--md-sys-spacing-2)',
                        borderRadius: 'var(--md-sys-shape-corner-small)',
                        backgroundColor: tok('surface-container-low'),
                      }}
                    >
                      <Stack spacing={0.25}>
                        <Typography variant="labelSmall" fontWeight={600} sx={{ color: tok('on-surface') }}>
                          {bando?.titolo ?? sub.bandoId}
                        </Typography>
                        {sub.dataSottomissione && (
                          <Typography variant="caption" sx={{ color: tok('on-surface-variant') }}>
                            Inviato: {new Date(sub.dataSottomissione).toLocaleDateString('it-IT')}
                          </Typography>
                        )}
                        {sub.probabilitaApprovazione !== undefined && (
                          <Typography variant="caption" sx={{ color: tok('on-surface-variant') }}>
                            Probabilità approvazione: {Math.round(sub.probabilitaApprovazione * 100)}%
                          </Typography>
                        )}
                      </Stack>
                      <Chip
                        icon={meta.icon}
                        label={meta.label}
                        size="small"
                        sx={{ backgroundColor: meta.bg, color: meta.color }}
                      />
                    </Stack>
                  );
                })}
              </Stack>
            </M3Surface>
          )}
        </Stack>
      )}
    </M3Surface>
  );
}

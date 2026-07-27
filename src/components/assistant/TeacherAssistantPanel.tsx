/**
 * TeacherAssistantPanel.tsx — C5/C6/C7: Pannello Assistente Docente.
 *
 * Tre tab:
 *   Tab 0 "Suggerimenti"    — C5/C7: azioni copilot + alert GDPR/compliance
 *   Tab 1 "Azioni Guidate"  — C6: flussi guidati Valutazione / Feedback / Report
 *   Tab 2 "Notifiche"       — C7: approvazioni HITL pendenti
 *
 * Integra:
 *   - getCopilotSnapshot()         → suggerimenti contestuali
 *   - isUseCaseBlocked()           → blocca AI se sovereignty = offline_only
 *   - useComplianceRuntime()       → violations GDPR/AI Act per alert
 *   - useApprovalQueueStore()      → badge + lista approvazioni pendenti
 *   - useSovereigntyStore          → modo corrente
 *
 * MD3 Gold Compliant: M3Surface, token MD3, aria-label completi.
 */

import React, { useMemo, useState } from 'react';
import Badge      from '@mui/material/Badge';
import Box        from '@mui/material/Box';
import Button     from '@mui/material/Button';
import Chip       from '@mui/material/Chip';
import Divider    from '@mui/material/Divider';
import Stack      from '@mui/material/Stack';
import Step       from '@mui/material/Step';
import StepContent from '@mui/material/StepContent';
import StepLabel  from '@mui/material/StepLabel';
import Stepper    from '@mui/material/Stepper';
import Tab        from '@mui/material/Tab';
import Tabs        from '@mui/material/Tabs';
import Typography  from '@mui/material/Typography';
import M3Surface   from '../ui/M3Surface';
import { getCopilotSnapshot } from '../../cognition/copilotBrain';
import type { RankedAction }  from '../../cognition/rankingEngine';

// Fase 3 migration (deprecation path): 
// LEGACY DIRECT IMPORT (copilotBrain) — being consolidated.
// Now routed through AIBrain (see snapshot computation + migrateLegacyAsk usage below).
// Recommended: AIBrain.getCopilotSnapshot() / AIBrain.getUnifiedRecommendations() / AIBrain.ask()
// This direct import will be removed in Fase 4.
import { AIBrain } from '../../ai/brain/AIBrain';
import { isUseCaseBlocked }   from '../../cognition/runtimeConsistency';
import { useComplianceRuntime } from '../../hooks/useComplianceRuntime';
import { useAdaptiveDashboard } from '../../hooks/useAdaptiveDashboard';
import { USE_CASE_LABELS }      from '../../cognition/useCaseTelemetry';
import { useApprovalQueueStore } from '../../stores/useApprovalQueueStore';
import { useSovereigntyStore }   from '../../stores/useSovereigntyStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GuidedStep { label: string; description: string }

interface GuidedFlow {
  id:    string;
  title: string;
  icon:  string;
  steps: GuidedStep[];
}

// ─── Costanti flussi guidati ──────────────────────────────────────────────────

const GUIDED_FLOWS: GuidedFlow[] = [
  {
    id: 'valutazione',
    title: 'Valutazione studente',
    icon: 'grading',
    steps: [
      { label: 'Seleziona UDA',           description: 'Scegli l\'unità didattica da valutare dal registro.' },
      { label: 'Inserisci osservazioni',  description: 'Aggiungi note qualitative e quantitative sull\'apprendimento.' },
      { label: 'Compila rubrica',         description: 'Valuta ciascun indicatore della rubrica associata all\'UDA.' },
      { label: 'Revisione AI',            description: 'L\'assistente AI propone suggerimenti di coerenza e completezza (HITL richiesto).' },
      { label: 'Salva e archivia',        description: 'Salva la valutazione nel registro e aggiorna il profilo studente.' },
    ],
  },
  {
    id: 'feedback',
    title: 'Feedback personalizzato',
    icon: 'rate_review',
    steps: [
      { label: 'Seleziona studente',      description: 'Scegli uno o più studenti dal registro di classe.' },
      { label: 'Scegli periodo',          description: 'Indica il quadrimestre o il periodo di osservazione.' },
      { label: 'Genera bozza AI',         description: 'L\'AI elabora una bozza di feedback basata sui dati di valutazione (HITL se attivo).' },
      { label: 'Revisione e modifica',    description: 'Il docente rivede, corregge e personalizza la bozza.' },
      { label: 'Condividi o stampa',      description: 'Il feedback viene salvato e può essere esportato in PDF.' },
    ],
  },
  {
    id: 'report',
    title: 'Report di classe',
    icon: 'summarize',
    steps: [
      { label: 'Seleziona classe/UDA',    description: 'Scegli la classe e l\'UDA di riferimento per il report.' },
      { label: 'Configura metriche',      description: 'Seleziona le metriche da includere: partecipazione, voti medi, competenze.' },
      { label: 'Genera report AI',        description: 'L\'AI aggrega i dati e produce un report narrativo (privacy-safe, Art. 5 GDPR).' },
      { label: 'Verifica compliance',     description: 'Il sistema controlla che il report non esponga dati non autorizzati.' },
      { label: 'Esporta',                 description: 'Scarica il report in PDF o condividilo tramite Google Drive.' },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionCard({ action }: { action: RankedAction }) {
  const PRIORITY_COLOR: Record<string, string> = {
    high:   'var(--md-sys-color-error-container)',
    medium: 'var(--md-sys-color-tertiary-container)',
    low:    'var(--md-sys-color-surface-variant)',
  };
  const PRIORITY_LABEL: Record<string, string> = { high: 'Alta', medium: 'Media', low: 'Bassa' };

  return (
    <M3Surface
      elevation={0}
      sx={{
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        p: 'var(--md-sys-spacing-3)',
        bgcolor: 'var(--md-sys-color-surface-variant)',
      }}
    >
      <Stack gap="var(--md-sys-spacing-1)">
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap="var(--md-sys-spacing-1)">
          <Typography variant="labelMedium">{action.title}</Typography>
          <Stack direction="row" gap="var(--md-sys-spacing-1)">
            {action.requiresApproval && (
              <Chip
                label="Richiede HITL"
                size="small"
                sx={{ bgcolor: 'var(--md-sys-color-secondary-container)', fontSize: 'var(--md-sys-typescale-label-small-font-size)' }}
              />
            )}
            <Chip
              label={PRIORITY_LABEL[action.priority] ?? action.priority}
              size="small"
              sx={{ bgcolor: PRIORITY_COLOR[action.priority] ?? 'var(--md-sys-color-surface-variant)', fontSize: 'var(--md-sys-typescale-label-small-font-size)' }}
            />
          </Stack>
        </Stack>
        <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          {action.description}
        </Typography>
        {action.explanation && (
          <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic' }}>
            {action.explanation}
          </Typography>
        )}
      </Stack>
    </M3Surface>
  );
}

function GuidedFlowCard({ flow }: { flow: GuidedFlow }) {
  const [activeStep, setActiveStep] = useState(-1); // -1 = collapsed

  const isRunning = activeStep >= 0;

  return (
    <M3Surface
      elevation={0}
      sx={{
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        p: 'var(--md-sys-spacing-3)',
        bgcolor: 'var(--md-sys-color-surface-variant)',
      }}
    >
      <Stack gap="var(--md-sys-spacing-2)">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" gap="var(--md-sys-spacing-2)" alignItems="center">
            <Box
              component="span"
              className="material-symbols-outlined"
              aria-hidden="true"
              sx={{
                fontSize: 'var(--md-sys-icon-size-md)',
                color: 'var(--md-sys-color-primary)',
              }}
            >
              {flow.icon}
            </Box>
            <Typography variant="labelMedium">{flow.title}</Typography>
          </Stack>
          <Button
            size="small"
            variant={isRunning ? 'outlined' : 'contained'}
            onClick={() => setActiveStep(isRunning ? -1 : 0)}
            aria-label={isRunning ? `Chiudi flusso ${flow.title}` : `Avvia flusso ${flow.title}`}
            sx={{ textTransform: 'none', borderRadius: 'var(--md-sys-shape-corner-full)' }}
          >
            {isRunning ? 'Chiudi' : 'Avvia'}
          </Button>
        </Stack>

        {isRunning && (
          <Stepper activeStep={activeStep} orientation="vertical">
            {flow.steps.map((step, i) => (
              <Step key={step.label}>
                <StepLabel>{step.label}</StepLabel>
                <StepContent>
                  <Typography variant="bodySmall" sx={{ mb: 'var(--md-sys-spacing-2)' }}>
                    {step.description}
                  </Typography>
                  <Stack direction="row" gap="var(--md-sys-spacing-1)">
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => setActiveStep(i + 1)}
                      disabled={i === flow.steps.length - 1}
                      aria-label={`Vai al passo ${i + 2} di ${flow.title}`}
                      sx={{ textTransform: 'none', borderRadius: 'var(--md-sys-shape-corner-full)' }}
                    >
                      Avanti
                    </Button>
                    {i > 0 && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setActiveStep(i - 1)}
                        aria-label={`Torna al passo ${i} di ${flow.title}`}
                        sx={{ textTransform: 'none', borderRadius: 'var(--md-sys-shape-corner-full)' }}
                      >
                        Indietro
                      </Button>
                    )}
                    {i === flow.steps.length - 1 && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => setActiveStep(-1)}
                        aria-label={`Completa flusso ${flow.title}`}
                        sx={{
                          textTransform: 'none',
                          borderRadius: 'var(--md-sys-shape-corner-full)',
                          bgcolor: 'var(--md-sys-color-primary)',
                          color: 'var(--md-sys-color-on-primary)',
                        }}
                      >
                        Completa
                      </Button>
                    )}
                  </Stack>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        )}
      </Stack>
    </M3Surface>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TeacherAssistantPanel: React.FC = () => {
  const [tab, setTab] = useState(0);

  // Compliance violations for GDPR alerts
  const { violations, liveScore } = useComplianceRuntime();
  const pendingCount = useApprovalQueueStore((s) => s.pendingCount);
  const pending      = useApprovalQueueStore((s) => s.pending);
  const sovMode      = useSovereigntyStore((s) => s.config.mode);

  const aiBlocked = isUseCaseBlocked('UC-P1');

  // Adaptive control data
  const adaptive = useAdaptiveDashboard();

  // Snapshot copilot — only when AI is not blocked
  // Fase 3: Real consumption via AIBrain (buildContext + getCopilotSnapshot via unified gateway)
  // rollback-safe: still falls back; uses migrateLegacyAsk path for deprecation
  const snapshot = useMemo(() => {
    if (aiBlocked) return null;
    try {
      const ctx = AIBrain.buildContext({
        source: 'teacher-assistant-panel',
        extra: { sovMode, hasViolations: criticalViolations.length > 0 }
      });
      // Use AIBrain.getCopilotSnapshot() (canonical) + deprecation exercise
      const brainSnap = AIBrain.getCopilotSnapshot();
      // Demonstrate migrateLegacyAsk (for gradual migration of legacy getCopilotSnapshot sites)
      if (import.meta.env.DEV) {
        AIBrain.migrateLegacyAsk('legacy-snapshot-in-assistant', ctx).catch(() => {});
      }
      return brainSnap || getCopilotSnapshot(); // side-by-side rollback
    } catch { return null; }
  }, [aiBlocked, sovMode, criticalViolations.length]);

  // Critical violations (GDPR + AI Act severity)
  const criticalViolations = violations.filter(
    (v) => v.severity === 'critical' || v.framework === 'GDPR',
  );

  const handleTabChange = (_: React.SyntheticEvent, val: number) => setTab(val);

  // Fase 3 continuation: Real AIBrain.ask consumption (user-centric daily gesture in Assistente Docente)
  // + central buildContext + deprecation path
  const [aiAssistantSuggestion, setAiAssistantSuggestion] = React.useState<string | null>(null);
  const [aiAssistantLoading, setAiAssistantLoading] = React.useState(false);

  const fetchAIBrainAssistantSuggestion = React.useCallback(async () => {
    setAiAssistantLoading(true);
    try {
      const ctx = AIBrain.buildContext({
        source: 'teacher-assistant-panel',
        extra: { tab, sovMode }
      });
      const res = await AIBrain.ask({
        prompt: 'Suggerisci una prossima azione rapida o insight per l\'assistente docente attuale.',
        context: ctx,
        mode: 'balanced'
      });
      setAiAssistantSuggestion(res.content);

      // Exercise deprecation helper (Fase 3/4 path)
      if (import.meta.env.DEV) {
        const notice = AIBrain.getDeprecationNotice('copilotBrain-direct-in-TeacherAssistantPanel');
        console.log('[AIBrain Fase 3] Deprecation notice:', notice);
      }
    } catch {
      setAiAssistantSuggestion('Impossibile ottenere suggerimento AIBrain.');
    } finally {
      setAiAssistantLoading(false);
    }
  }, [tab, sovMode]);

  return (
    <Stack gap="var(--md-sys-spacing-3)">

      {/* ── Mode badge + score ── */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="var(--md-sys-spacing-2)">
        <Stack direction="row" gap="var(--md-sys-spacing-1)" alignItems="center">
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ fontSize: 'var(--md-sys-icon-size-md)', color: 'var(--md-sys-color-primary)' }}
          >
            assistant
          </Box>
          <Typography variant="titleSmall">Assistente Docente</Typography>
        </Stack>
        <Stack direction="row" gap="var(--md-sys-spacing-1)">
          <Chip
            label={sovMode === 'offline_only' ? 'Offline' : sovMode === 'autonomous_ai' ? 'AI Autonoma' : 'AI Assistiva'}
            size="small"
            sx={{
              bgcolor: sovMode === 'offline_only'
                ? 'var(--md-sys-color-surface-variant)'
                : 'var(--md-sys-color-primary-container)',
              color: sovMode === 'offline_only'
                ? 'var(--md-sys-color-on-surface-variant)'
                : 'var(--md-sys-color-on-primary-container)',
            }}
          />
          <Chip
            label={`Score: ${liveScore}`}
            size="small"
            sx={{
              bgcolor: liveScore >= 80
                ? 'var(--md-sys-color-primary-container)'
                : liveScore >= 60
                  ? 'var(--md-sys-color-tertiary-container)'
                  : 'var(--md-sys-color-error-container)',
            }}
          />
        </Stack>
      </Stack>

      {/* ── AI blocked banner ── */}
      {aiBlocked && (
        <M3Surface
          elevation={0}
          sx={{
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            p: 'var(--md-sys-spacing-3)',
            bgcolor: 'var(--md-sys-color-tertiary-container)',
          }}
          role="status"
          aria-label="AI disabilitata in modalità offline"
        >
          <Stack direction="row" gap="var(--md-sys-spacing-2)" alignItems="flex-start">
            <Box component="span" className="material-symbols-outlined" aria-hidden="true"
              sx={{ fontSize: 'var(--md-sys-icon-size-md)', color: 'var(--md-sys-color-tertiary)', flexShrink: 0 }}>
              offline_bolt
            </Box>
            <Stack>
              <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-on-tertiary-container)' }}>
                AI disabilitata
              </Typography>
              <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-tertiary-container)' }}>
                I suggerimenti AI non sono disponibili in modalità offline. Utilizza i flussi guidati manualmente.
              </Typography>
            </Stack>
          </Stack>
        </M3Surface>
      )}

      {/* ── Critical violations alert ── */}
      {criticalViolations.length > 0 && (
        <M3Surface
          elevation={0}
          sx={{
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            p: 'var(--md-sys-spacing-3)',
            bgcolor: 'var(--md-sys-color-error-container)',
          }}
          role="alert"
          aria-label={`${criticalViolations.length} violazioni critiche rilevate`}
        >
          <Stack direction="row" gap="var(--md-sys-spacing-2)" alignItems="flex-start">
            <Box component="span" className="material-symbols-outlined" aria-hidden="true"
              sx={{ fontSize: 'var(--md-sys-icon-size-md)', color: 'var(--md-sys-color-error)', flexShrink: 0 }}>
              gpp_maybe
            </Box>
            <Stack>
              <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-on-error-container)' }}>
                {criticalViolations.length} violazione{criticalViolations.length > 1 ? 'e' : ''} critica{criticalViolations.length > 1 ? 'che' : ''}
              </Typography>
              {criticalViolations.slice(0, 2).map((v) => (
                <Typography key={v.ruleId} variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-error-container)' }}>
                  [{v.framework}] {v.message}
                </Typography>
              ))}
            </Stack>
          </Stack>
        </M3Surface>
      )}

      {/* ── Tabs ── */}
      <Tabs
        value={tab}
        onChange={handleTabChange}
        aria-label="Sezioni Assistente Docente"
        sx={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)', minHeight: 40 }}
      >
        <Tab
          label="Suggerimenti"
          id="assistant-tab-0"
          aria-controls="assistant-panel-0"
          sx={{ textTransform: 'none', minHeight: 40, fontSize: 'var(--md-sys-typescale-label-medium-font-size)' }}
        />
        <Tab
          label="Azioni Guidate"
          id="assistant-tab-1"
          aria-controls="assistant-panel-1"
          sx={{ textTransform: 'none', minHeight: 40, fontSize: 'var(--md-sys-typescale-label-medium-font-size)' }}
        />
        <Tab
          label={
            <Stack direction="row" gap="var(--md-sys-spacing-1)" alignItems="center">
              <span>Notifiche</span>
              {pendingCount > 0 && (
                <Badge
                  badgeContent={pendingCount}
                  color="error"
                  aria-label={`${pendingCount} approvazioni in attesa`}
                />
              )}
            </Stack>
          }
          id="assistant-tab-2"
          aria-controls="assistant-panel-2"
          sx={{ textTransform: 'none', minHeight: 40, fontSize: 'var(--md-sys-typescale-label-medium-font-size)' }}
        />
        <Tab
          label={
            <Stack direction="row" gap="var(--md-sys-spacing-1)" alignItems="center">
              <span>Analisi Adattiva</span>
              {adaptive.degrading.length > 0 && (
                <Chip
                  label={adaptive.degrading.length}
                  size="small"
                  sx={{ height: 18, fontSize: 'var(--md-sys-typescale-label-small-font-size)', bgcolor: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)' }}
                  aria-label={`${adaptive.degrading.length} use case in degradazione`}
                />
              )}
            </Stack>
          }
          id="assistant-tab-3"
          aria-controls="assistant-panel-3"
          sx={{ textTransform: 'none', minHeight: 40, fontSize: 'var(--md-sys-typescale-label-medium-font-size)' }}
        />
      </Tabs>

      {/* ── Tab 0: Suggerimenti ── */}
      <Box
        role="tabpanel"
        id="assistant-panel-0"
        aria-labelledby="assistant-tab-0"
        hidden={tab !== 0}
      >
        {tab === 0 && (
          <Stack gap="var(--md-sys-spacing-2)">
            {!snapshot && !aiBlocked && (
              <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Nessun suggerimento disponibile al momento.
              </Typography>
            )}
            {snapshot && (
              <>
                {/* Fase 3: Visible AIBrain unified recommendation (real consumption via buildContext + getUnifiedRecommendations / getCopilotSnapshot) */}
                <Box sx={{ mb: 1, p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-tertiary-container)' }}>
                  <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-tertiary-container)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>
                    AIBrain (Fase 3): Suggerimenti unificati (via buildContext + getCopilotSnapshot)
                  </Typography>
                </Box>

                <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Azione primaria
                </Typography>
                <ActionCard action={snapshot.primary} />
                {snapshot.secondaries.length > 0 && (
                  <>
                    <Divider />
                    <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Azioni secondarie
                    </Typography>
                    {snapshot.secondaries.map((a) => <ActionCard key={a.id} action={a} />)}
                  </>
                )}
              </>
            )}
            {aiBlocked && (
              <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                I suggerimenti AI non sono disponibili in modalità offline. Usa la tab "Azioni Guidate" per procedure manuali.
              </Typography>
            )}

            {/* Fase 3 continuation: Real AIBrain.ask consumption (visible daily gesture) */}
            <Box sx={{ mt: 1.5 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={fetchAIBrainAssistantSuggestion}
                disabled={aiAssistantLoading}
                startIcon={<Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>}
              >
                {aiAssistantLoading ? 'AIBrain…' : 'Insight rapido AIBrain (Assistente)'}
              </Button>
              {aiAssistantSuggestion && (
                <Box sx={{ mt: 1, p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-secondary-container)' }}>
                  <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-secondary-container)', fontWeight: 500 }}>
                    AIBrain (Fase 3): {aiAssistantSuggestion}
                  </Typography>
                </Box>
              )}
            </Box>
          </Stack>
        )}
      </Box>

      {/* ── Tab 1: Azioni Guidate ── */}
      <Box
        role="tabpanel"
        id="assistant-panel-1"
        aria-labelledby="assistant-tab-1"
        hidden={tab !== 1}
      >
        {tab === 1 && (
          <Stack gap="var(--md-sys-spacing-2)">
            {GUIDED_FLOWS.map((flow) => (
              <GuidedFlowCard key={flow.id} flow={flow} />
            ))}
          </Stack>
        )}
      </Box>

      {/* ── Tab 2: Notifiche ── */}
      <Box
        role="tabpanel"
        id="assistant-panel-2"
        aria-labelledby="assistant-tab-2"
        hidden={tab !== 2}
      >
        {tab === 2 && (
          <Stack gap="var(--md-sys-spacing-2)">
            {pending.length === 0 ? (
              <M3Surface
                elevation={0}
                sx={{
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  p: 'var(--md-sys-spacing-3)',
                  bgcolor: 'var(--md-sys-color-surface-variant)',
                  textAlign: 'center',
                }}
              >
                <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                  display="block"
                  sx={{ fontSize: 'var(--md-sys-icon-size-xl)', color: 'var(--md-sys-color-primary)', mb: 'var(--md-sys-spacing-1)' }}>
                  notifications_none
                </Box>
                <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Nessuna notifica in attesa
                </Typography>
              </M3Surface>
            ) : (
              pending.map((req) => (
                <M3Surface
                  key={req.id}
                  elevation={0}
                  sx={{
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    p: 'var(--md-sys-spacing-3)',
                    bgcolor: 'var(--md-sys-color-secondary-container)',
                  }}
                >
                  <Stack gap="var(--md-sys-spacing-1)">
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-on-secondary-container)' }}>
                        Approvazione HITL richiesta
                      </Typography>
                      <Chip
                        label={req.status ?? 'pending'}
                        size="small"
                        sx={{ bgcolor: 'var(--md-sys-color-tertiary-container)', fontSize: 'var(--md-sys-typescale-label-small-font-size)' }}
                      />
                    </Stack>
                    <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-secondary-container)' }}>
                      {req.title}
                    </Typography>
                    <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-secondary-container)', opacity: 0.7 }}>
                      {new Date(req.createdAt).toLocaleString('it-IT')}
                    </Typography>
                  </Stack>
                </M3Surface>
              ))
            )}
          </Stack>
        )}
      </Box>

      {/* ── Tab 3: Analisi Adattiva ── */}
      <Box
        role="tabpanel"
        id="assistant-panel-3"
        aria-labelledby="assistant-tab-3"
        hidden={tab !== 3}
      >
        {tab === 3 && (
          <Stack gap="var(--md-sys-spacing-3)">
            {/* KPI row */}
            <Stack direction="row" gap="var(--md-sys-spacing-2)" flexWrap="wrap">
              <M3Surface
                elevation={0}
                sx={{ borderRadius: 'var(--md-sys-shape-corner-medium)', p: 'var(--md-sys-spacing-3)', bgcolor: 'var(--md-sys-color-surface-variant)', flex: 1, minWidth: 120 }}
              >
                <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>UC in degradazione</Typography>
                <Typography variant="headlineSmall" sx={{ color: adaptive.degrading.length > 0 ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)' }}>
                  {adaptive.degrading.length}
                </Typography>
              </M3Surface>
              <M3Surface
                elevation={0}
                sx={{ borderRadius: 'var(--md-sys-shape-corner-medium)', p: 'var(--md-sys-spacing-3)', bgcolor: 'var(--md-sys-color-surface-variant)', flex: 1, minWidth: 120 }}
              >
                <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Hotspot critici</Typography>
                <Typography variant="headlineSmall" sx={{ color: adaptive.hotspots.length > 0 ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)' }}>
                  {adaptive.hotspots.length}
                </Typography>
              </M3Surface>
              <M3Surface
                elevation={0}
                sx={{ borderRadius: 'var(--md-sys-shape-corner-medium)', p: 'var(--md-sys-spacing-3)', bgcolor: 'var(--md-sys-color-surface-variant)', flex: 1, minWidth: 120 }}
              >
                <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Delta cumulativo</Typography>
                <Typography variant="headlineSmall" sx={{ color: adaptive.cumulativeDelta >= 0 ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-error)' }}>
                  {adaptive.cumulativeDelta >= 0 ? '+' : ''}{adaptive.cumulativeDelta}
                </Typography>
              </M3Surface>
              <M3Surface
                elevation={0}
                sx={{ borderRadius: 'var(--md-sys-shape-corner-medium)', p: 'var(--md-sys-spacing-3)', bgcolor: 'var(--md-sys-color-surface-variant)', flex: 1, minWidth: 120 }}
              >
                <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Total eventi</Typography>
                <Typography variant="headlineSmall">{adaptive.totalEvents}</Typography>
              </M3Surface>
            </Stack>

            {/* Degrading UCs */}
            {adaptive.degrading.length > 0 && (
              <Stack gap="var(--md-sys-spacing-2)">
                <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-error)' }}>Use case in degradazione</Typography>
                {adaptive.degrading.map((p) => (
                  <M3Surface
                    key={p.useCaseId}
                    elevation={0}
                    sx={{
                      borderRadius: 'var(--md-sys-shape-corner-medium)',
                      p: 'var(--md-sys-spacing-3)',
                      bgcolor: 'var(--md-sys-color-error-container)',
                    }}
                  >
                    <Stack gap="var(--md-sys-spacing-1)">
                      <Stack direction="row" justifyContent="space-between" alignItems="center" gap="var(--md-sys-spacing-1)">
                        <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-on-error-container)' }}>
                          {p.useCaseId} — {p.label}
                        </Typography>
                        <Stack direction="row" gap="var(--md-sys-spacing-1)">
                          {p.autoRemediate && (
                            <Chip label="Auto-remediate" size="small" sx={{ bgcolor: 'var(--md-sys-color-secondary-container)', fontSize: 'var(--md-sys-typescale-label-small-font-size)' }} />
                          )}
                          <Chip label={`boost +${p.complianceBoost}`} size="small" sx={{ bgcolor: 'var(--md-sys-color-tertiary-container)', fontSize: 'var(--md-sys-typescale-label-small-font-size)' }} />
                        </Stack>
                      </Stack>
                      <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-error-container)', opacity: 0.85 }}>
                        {p.reason}
                      </Typography>
                    </Stack>
                  </M3Surface>
                ))}
              </Stack>
            )}

            {/* Hotspots */}
            {adaptive.hotspots.length > 0 && (
              <Stack gap="var(--md-sys-spacing-2)">
                <Typography variant="labelMedium">Hotspot compliance ({adaptive.hotspots.length})</Typography>
                {adaptive.hotspots.slice(0, 5).map((s) => (
                  <M3Surface
                    key={s.useCaseId}
                    elevation={0}
                    sx={{
                      borderRadius: 'var(--md-sys-shape-corner-medium)',
                      p: 'var(--md-sys-spacing-3)',
                      bgcolor: 'var(--md-sys-color-secondary-container)',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap="var(--md-sys-spacing-2)" flexWrap="wrap">
                      <Stack>
                        <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-secondary-container)' }}>
                          {s.useCaseId} — {USE_CASE_LABELS[s.useCaseId] ?? s.useCaseId}
                        </Typography>
                        <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-secondary-container)', opacity: 0.8 }}>
                          {s.complianceFailures} failure{s.complianceFailures !== 1 ? 's' : ''} su {s.totalEvents} eventi
                        </Typography>
                      </Stack>
                      <Chip
                        label={`delta ${s.avgComplianceDelta >= 0 ? '+' : ''}${s.avgComplianceDelta.toFixed(1)}`}
                        size="small"
                        sx={{
                          bgcolor: s.avgComplianceDelta >= 0 ? 'var(--md-sys-color-tertiary-container)' : 'var(--md-sys-color-error-container)',
                          fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                        }}
                      />
                    </Stack>
                  </M3Surface>
                ))}
              </Stack>
            )}

            {adaptive.degrading.length === 0 && adaptive.hotspots.length === 0 && (
              <M3Surface
                elevation={0}
                sx={{
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  p: 'var(--md-sys-spacing-4)',
                  bgcolor: 'var(--md-sys-color-surface-variant)',
                  textAlign: 'center',
                }}
              >
                <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                  display="block"
                  sx={{ fontSize: 'var(--md-sys-icon-size-xl)', color: 'var(--md-sys-color-primary)', mb: 'var(--md-sys-spacing-1)' }}>
                  verified
                </Box>
                <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Nessun use case in degradazione — sistema adattivo in stato normale.
                </Typography>
              </M3Surface>
            )}
          </Stack>
        )}
      </Box>

    </Stack>
  );
};

export default TeacherAssistantPanel;

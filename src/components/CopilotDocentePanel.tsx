import React from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import InfoCard from './ui/InfoCard';
import SectionHeader from './ui/SectionHeader';
import CopilotSplashScreen from './ui/CopilotSplashScreen';
// Tab 0 — default tab, kept eager to avoid Suspense flash on first render
import CopilotPerformancePanel from './copilot/CopilotPerformancePanel';
import { AITabErrorBoundary } from './copilot/AITabErrorBoundary';
import { useTeacherModelStore } from '../stores/useTeacherModelStore';

// NEW: Route through single AI Brain (migration step A)
import { AIBrain } from '../ai/brain/AIBrain';

import type { AISuggestion } from '../ai/contextEngine/types';
import type { ClassHealthIndex } from '../ai/classHealth/types';
import type { AISnapshot } from '../stores/useAISnapshotStore';
import type { Studente, Valutazione, Uda, Competenza, TimetableSettings } from '../types';

// ── Lazy-loaded panels (chunk loaded on first tab visit) ──────────────────────
const CopilotHealthOverviewPanel = React.lazy(() => import('./copilot/CopilotHealthOverviewPanel'));
const AITrendPanel = React.lazy(() => import('./AITrendPanel'));
const ExportModal = React.lazy(() => import('./ExportModal'));
const PlanningAssistantPanel = React.lazy(() => import('./copilot/PlanningAssistantPanel'));
const CommunicationHelperPanel = React.lazy(() => import('./copilot/CommunicationHelperPanel'));
const TrendPredictionPanel = React.lazy(() => import('./copilot/TrendPredictionPanel'));
const AggregatedDashboard = React.lazy(() => import('./copilot/AggregatedDashboard'));
const CopilotActionsBar = React.lazy(() => import('./copilot/CopilotActionsBar'));
const AIExplainabilityPanel = React.lazy(() => import('./copilot/AIExplainabilityPanel'));
const AIDevToolsPanel = React.lazy(() => import('./copilot/AIDevToolsPanel'));
const CopilotRecommendationPanel = React.lazy(() => import('./copilot/CopilotRecommendationPanel'));
const FundingPanel = React.lazy(() => import('./copilot/FundingPanel'));
const CopilotMaturitaPanel = React.lazy(() =>
  import('./copilot/maturita').then((m) => ({ default: m.CopilotMaturitaPanel })),
);
const ArtisticConsiliumPanel = React.lazy(() => import('./copilot/ArtisticConsiliumPanel'));
const IntelligentDashboard   = React.lazy(() => import('./copilot/IntelligentDashboard'));
const UseCaseAnalyticsDashboard = React.lazy(() => import('./copilot/UseCaseAnalyticsDashboard'));

// ── Tab loading fallback ──────────────────────────────────────────────────────
function TabFallback(): JSX.Element {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 'var(--md-sys-spacing-8)' }}>
      <CircularProgress size={32} aria-label="Caricamento pannello" />
    </Box>
  );
}

// ── First-run onboarding ──────────────────────────────────────────────────────
const ONBOARDING_KEY = 'copilot_onboarding_v1';
const COPILOT_TAB_KEY = 'copilot_active_tab_v1';

function useFirstRun(): [boolean, () => void] {
  const [show, setShow] = React.useState<boolean>(() => {
    try { return localStorage.getItem(ONBOARDING_KEY) !== 'true'; } catch { return false; }
  });
  const dismiss = React.useCallback(() => {
    try { localStorage.setItem(ONBOARDING_KEY, 'true'); } catch { /* ignore */ }
    setShow(false);
  }, []);
  return [show, dismiss];
}

interface CopilotDocentePanelProps {
  suggestions: AISuggestion[];
  classHealth: ClassHealthIndex;
  snapshots: AISnapshot[];
  className: string;
  studentId: string;
  students: Studente[];
  evaluations: Valutazione[];
  udas: Uda[];
  competenze: Competenza[];
  settings: TimetableSettings;
  initialTab?: number;
}

export default function CopilotDocentePanel({ suggestions, classHealth, snapshots, className, studentId, students, evaluations, udas, settings, initialTab }: Omit<CopilotDocentePanelProps, 'competenze'>): JSX.Element {
  const [tab, setTab] = React.useState<number>(() => {
    if (initialTab !== undefined) return initialTab;
    try { const s = sessionStorage.getItem(COPILOT_TAB_KEY); return s !== null ? Number(s) : 0; }
    catch { return 0; }
  });
  const [exportOpen, setExportOpen] = React.useState(false);
  const [showSplash, setShowSplash] = React.useState(true);
  const capabilityLevel = useTeacherModelStore((s) => s.capabilityLevel);

  // Migration step A: Use the single AIBrain for copilot actions
  const primaryAction = React.useMemo(() => AIBrain.getCopilotPrimaryAction(), []);

  // Fase 3 (sequenza): Use central buildContext + unified recommendations (primary + secondaries)
  const unifiedRecs = React.useMemo(() => {
    try {
      const ctx = AIBrain.buildContext({
        class: className,
        students: students,
        evaluations: evaluations,
        source: 'copilot-panel'
      });
      return AIBrain.getUnifiedRecommendations(ctx);
    } catch {
      return null;
    }
  }, [className, students, evaluations]);

  // Fase 3 (sequenza): also get secondaries for richer recommendation
  const secondaryRecs = React.useMemo(() => {
    try {
      return AIBrain.getTopSecondaryActions();
    } catch {
      return [];
    }
  }, []);

  // Fase 3 continuation: Real AIBrain.ask consumption (user-centric daily gesture in Copilot)
  const [aiInsight, setAiInsight] = React.useState<string | null>(null);
  const [aiInsightLoading, setAiInsightLoading] = React.useState(false);

  const fetchAIBrainInsight = React.useCallback(async () => {
    setAiInsightLoading(true);
    try {
      const ctx = AIBrain.buildContext({
        class: className,
        students: students,
        evaluations: evaluations,
        source: 'copilot-insight'
      });
      const res = await AIBrain.ask({
        prompt: `Suggerisci una prossima azione o insight rapido per la classe ${className}.`,
        context: ctx,
        mode: 'balanced'
      });
      setAiInsight(res.content);
    } catch {
      setAiInsight('Impossibile ottenere insight in questo momento.');
    } finally {
      setAiInsightLoading(false);
    }
  }, [className, students, evaluations]);

  const [altroAnchor, setAltroAnchor] = React.useState<null | HTMLElement>(null);
  const [showOnboarding, dismissOnboarding] = useFirstRun();

  // Navigate to a tab and persist the choice
  const navToTab = React.useCallback((v: number) => {
    setTab(v);
    try { sessionStorage.setItem(COPILOT_TAB_KEY, String(v)); } catch { /* ignore */ }
    setAltroAnchor(null);
  }, []);

  return (
    <InfoCard variant="outlined" sx={{ mt: 'var(--md-sys-spacing-6)', position: 'relative' }}>
      {showSplash && (
        <CopilotSplashScreen
          onFinished={() => setShowSplash(false)}
          message="Preparazione Copilot Docente…"
        />
      )}
      <SectionHeader
        title="Copilot Docente"
        subtitle="AI per pianificazione, gestione e automazioni didattiche."
      />

      {/* Fase 3 (sequenza) — Visible AIBrain unified recommendation (primary + secondaries) */}
      {unifiedRecs?.primary && (
        <Box sx={{
          mb: 2,
          p: 1.5,
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          bgcolor: 'var(--md-sys-color-primary-container)',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component="span" className="material-symbols-outlined" sx={{ color: 'var(--md-sys-color-primary)' }}>auto_awesome</Box>
            <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-primary-container)', fontWeight: 500 }}>
              AIBrain (Fase 3): {unifiedRecs.primary.label || unifiedRecs.primary.title}
            </Typography>
          </Box>
          {secondaryRecs.length > 0 && (
            <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-primary-container)', opacity: 0.85, pl: 3.5 }}>
              + {secondaryRecs.slice(0, 2).map(r => r.label || r.title).join(' • ')}
            </Typography>
          )}
        </Box>
      )}

      {/* Fase 3 continuation: Real AIBrain.ask consumption (visible daily gesture in Copilot) */}
      <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          size="small"
          variant="text"
          onClick={fetchAIBrainInsight}
          disabled={aiInsightLoading}
          startIcon={<Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>}
        >
          {aiInsightLoading ? 'AIBrain…' : 'Ottieni insight rapido (AIBrain)'}
        </Button>
      </Box>

      {aiInsight && (
        <Box sx={{ mb: 2, p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-tertiary-container)' }}>
          <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-tertiary-container)', fontWeight: 500 }}>
            AIBrain (Fase 3): {aiInsight}
          </Typography>
        </Box>
      )}
      <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => navToTab(v as number)}
          aria-label="Copilot Docente Tabs"
          sx={{ mb: 'var(--md-sys-spacing-4)', flex: 1 }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Performance" />
          <Tab label="Overview" />
          <Tab label="Andamento" />
          <Tab label="Esportazione" />
          <Tab label="Planning" />
          <Tab label="Comunicazione" />
          <Tab label="Predizione" sx={{ display: 'none' }} />
          <Tab label="Dashboard" />
          <Tab label="Azioni" />
          <Tab label="Spiegabilità" sx={{ display: 'none' }} />
          <Tab label="Dev Tools" sx={{ display: 'none' }} />
          <Tab label="Raccomandazioni AI" />
          <Tab label="Finanziamenti" sx={{ display: 'none' }} />
          <Tab label="Maturità AI" sx={{ display: 'none' }} />
          <Tab label="Artistico" sx={{ display: 'none' }} />
          <Tab label="Brain" sx={{ display: 'none' }} />
          <Tab label="Analitiche UC" sx={{ display: 'none' }} />
        </Tabs>
        <Tooltip title="Sezioni avanzate">
          <Button
            size="small"
            variant="text"
            onClick={(e) => setAltroAnchor(e.currentTarget)}
            aria-label="Apri menu sezioni avanzate"
            aria-haspopup="true"
            aria-expanded={Boolean(altroAnchor)}
            sx={{ mb: 'var(--md-sys-spacing-4)', flexShrink: 0, textTransform: 'none' }}
          >
            Altro ▾
          </Button>
        </Tooltip>
      </Box>
      <Menu
        anchorEl={altroAnchor}
        open={Boolean(altroAnchor)}
        onClose={() => setAltroAnchor(null)}
        MenuListProps={{ 'aria-label': 'Sezioni avanzate' }}
      >
        <MenuItem onClick={() => navToTab(12)}>Finanziamenti</MenuItem>
        <MenuItem onClick={() => navToTab(13)}>Maturità AI</MenuItem>
        <MenuItem onClick={() => navToTab(6)}>Predizione</MenuItem>
        <MenuItem onClick={() => navToTab(9)}>Spiegabilità</MenuItem>
        <MenuItem onClick={() => navToTab(15)}>Brain</MenuItem>
        <MenuItem onClick={() => navToTab(16)}>Analitiche UC</MenuItem>
        {capabilityLevel >= 2 && (
          <MenuItem onClick={() => navToTab(14)}>Artistico</MenuItem>
        )}
        {import.meta.env.DEV && (
          <MenuItem onClick={() => navToTab(10)}>Dev Tools</MenuItem>
        )}
      </Menu>
      <React.Suspense fallback={<TabFallback />}>
      <Box sx={{ minHeight: 80 }}>
        {tab === 0 && (
          <AITabErrorBoundary tabName="Performance">
            <CopilotPerformancePanel
              suggestions={suggestions}
              className={className}
              studentId={studentId}
              students={students}
              evaluations={evaluations}
            />
          </AITabErrorBoundary>
        )}
        {tab === 1 && (
          <AITabErrorBoundary tabName="Overview">
            <CopilotHealthOverviewPanel classHealth={classHealth} snapshots={snapshots} className={className} />
          </AITabErrorBoundary>
        )}
        {tab === 2 && (
          <AITabErrorBoundary tabName="Andamento">
            <AITrendPanel snapshots={snapshots} className={className} />
          </AITabErrorBoundary>
        )}
        {tab === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Esporta lo storico AI della classe come report PDF/CSV.
            </Typography>
            <Button variant="contained" onClick={() => setExportOpen(true)} aria-label="Esporta report classe">
              Esporta Report Classe
            </Button>
            {exportOpen && (
              <ExportModal
                onClose={() => setExportOpen(false)}
                students={students}
                evaluations={evaluations}
                competencyEvaluations={[]}
                settings={settings}
                selectedClass={className}
                prove={[]}
              />
            )}
          </Box>
        )}
        {tab === 4 && (
          <AITabErrorBoundary tabName="Planning">
            <PlanningAssistantPanel
              suggestions={suggestions}
              students={students}
              evaluations={evaluations}
              udas={udas}
              className={className}
              studentId={studentId}
            />
          </AITabErrorBoundary>
        )}
        {tab === 5 && (
          <AITabErrorBoundary tabName="Comunicazione">
            <CommunicationHelperPanel
              suggestions={suggestions}
              students={students}
              evaluations={evaluations}
              className={className}
              studentId={studentId}
            />
          </AITabErrorBoundary>
        )}
        {tab === 6 && (
          <AITabErrorBoundary tabName="Predizione">
            <TrendPredictionPanel
              students={students}
              evaluations={evaluations}
              className={className}
              studentId={studentId}
            />
          </AITabErrorBoundary>
        )}
        {tab === 7 && (
          <AITabErrorBoundary tabName="Dashboard">
            <AggregatedDashboard
              suggestions={suggestions}
              classHealth={classHealth}
              snapshots={snapshots}
              students={students}
              evaluations={evaluations}
              udas={udas}
              className={className}
              studentId={studentId}
            />
          </AITabErrorBoundary>
        )}
        {tab === 8 && (
          <AITabErrorBoundary tabName="Azioni">
            <CopilotActionsBar
              riskSuggestions={suggestions}
              students={students}
              evaluations={evaluations}
            />
          </AITabErrorBoundary>
        )}
        {tab === 9 && (
          <AITabErrorBoundary tabName="Spiegabilità">
            <AIExplainabilityPanel suggestions={suggestions} defaultFirstExpanded />
          </AITabErrorBoundary>
        )}
        {tab === 10 && (
          <AITabErrorBoundary tabName="Dev Tools">
            <AIDevToolsPanel />
          </AITabErrorBoundary>
        )}
        {tab === 11 && (
          <AITabErrorBoundary tabName="Raccomandazioni AI">
            <CopilotRecommendationPanel
              students={students}
              evaluations={evaluations}
              udas={udas}
              className={className}
            />
          </AITabErrorBoundary>
        )}
        {tab === 12 && (
          <AITabErrorBoundary tabName="Finanziamenti">
            <FundingPanel
              students={students}
              udas={udas}
              className={className}
            />
          </AITabErrorBoundary>
        )}
        {tab === 13 && (
          <AITabErrorBoundary tabName="Maturità AI">
            <CopilotMaturitaPanel
              students={students}
              evaluations={evaluations}
              className={className}
            />
          </AITabErrorBoundary>
        )}
        {tab === 15 && (
          <AITabErrorBoundary tabName="Brain">
            <IntelligentDashboard />
          </AITabErrorBoundary>
        )}
        {tab === 16 && (
          <AITabErrorBoundary tabName="Analitiche UC">
            <UseCaseAnalyticsDashboard />
          </AITabErrorBoundary>
        )}
        {tab === 14 && (
          <AITabErrorBoundary tabName="Artistico">
            {capabilityLevel >= 2 ? (
              <ArtisticConsiliumPanel
                defaultUdaTitle={udas.length > 0 ? udas[0].title : undefined}
              />
            ) : (
              <Box sx={{ p: 'var(--md-sys-spacing-4)', textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Questa funzionalità è disponibile a partire dal livello <strong>Praticante</strong>.
                </Typography>
              </Box>
            )}
          </AITabErrorBoundary>
        )}
      </Box>
      </React.Suspense>
      <Dialog
        open={showOnboarding}
        onClose={dismissOnboarding}
        aria-labelledby="copilot-onboarding-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="copilot-onboarding-title">Benvenuto nel Copilot Docente</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 'var(--md-sys-spacing-3)' }}>
            Il <strong>Copilot Docente</strong> è il tuo assistente AI sempre disponibile.
            Analizza la tua classe, suggerisce interventi didattici e ti guida passo dopo passo.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Esplora i pannelli: <strong>Performance</strong> per una panoramica immediata,{' '}
            <strong>Planning</strong> per ottimizzare le lezioni,{' '}
            <strong>Predizione</strong> per anticipare difficoltà degli studenti.
          </Typography>
          {capabilityLevel >= 2 && (
            <Typography variant="body2" sx={{ mt: 'var(--md-sys-spacing-2)', color: 'var(--md-sys-color-tertiary)' }}>
              ✦ Hai sbloccato il <strong>Consilium Artistico</strong> — visita il tab{' '}
              <strong>Artistico</strong> per suggerimenti narrativi e creativi.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={dismissOnboarding}
            variant="contained"
            aria-label="Chiudi introduzione Copilot e inizia ad esplorare"
          >
            Inizia ad esplorare
          </Button>
        </DialogActions>
      </Dialog>
    </InfoCard>
  );
}

// MD3 GOLD COMPLIANT — Home: Centro di Comando Docente
// "Oggi" view — dashboard contestuale + teaser AI + azioni rapide (AI consolidata in Assistente)

import React, { useState, useMemo, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Fab from '@mui/material/Fab';
import ButtonBase from '@mui/material/ButtonBase';
import Button from '@mui/material/Button';
import { PageWrapper, M3Surface } from './ui';
import { JourneyProgressPanel, LevelUpCelebration } from './journey';
import { useJourneyProgress } from '../hooks/useJourneyProgress';
import { useNextAction } from '../hooks/useNextAction';
import { View, NavigationParams } from '../types';
import { useAcademicStore } from '../stores/useAcademicStore';
import { useStudentStore } from '../stores/useStudentStore';
import DailyBriefingModal from './DailyBriefingModal';
import ContextualAskAI from './ui/ContextualAskAI';

// Fase 3 continuation: Route daily "Oggi" gestures through single AIBrain (buildContext + getUnifiedRecommendations + ask)
import { AIBrain } from '../ai/brain/AIBrain';

interface HomeProps {
  onNavigate: (view: View, params?: NavigationParams) => void;
  onOpenRegisterImport?: () => void;
  // Legacy props kept for compatibility with ViewManager — not used in "Oggi"
  appState?: unknown;
  onSuggestionAction?: unknown;
  onStartClassroom?: unknown;
  finalizedRegister?: unknown;
  draftRegister?: unknown;
  showGuidanceTips?: unknown;
  suggestions?: unknown;
  dismissSuggestion?: unknown;
  onAiProcessing?: unknown;
  user?: unknown;
  onConnectDrive?: unknown;
  aiSettings?: unknown;
  settings?: unknown;
  handleOpenOperations?: unknown;
}

// â”€â”€ Azioni contestuali per ora del giorno â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getTimedActions(h: number): { label: string; icon: string; view: View; color: string }[] {
  if (h < 9) return [
    { label: 'Registro',   icon: 'menu_book',   view: 'register' as View,       color: 'var(--md-sys-color-primary)' },
    // 'presenze' non ha view dedicata — il registro include la gestione presenze
    { label: 'Presenze',   icon: 'fact_check',  view: 'register' as View,       color: 'var(--md-sys-color-secondary)' },
    { label: 'Orario',     icon: 'schedule',    view: 'timetable' as View,      color: 'var(--md-sys-color-tertiary)' },
  ];
  if (h < 14) return [
    { label: 'Registro',        icon: 'menu_book',     view: 'register' as View,       color: 'var(--md-sys-color-primary)' },
    { label: 'Valutazioni',     icon: 'grading',       view: 'evaluations' as View,    color: 'var(--md-sys-color-secondary)' },
    { label: 'Assistente Live', icon: 'smart_display', view: 'live-assistant' as View, color: 'var(--md-sys-color-tertiary)' },
  ];
  if (h < 18) return [
    { label: 'Progettazione', icon: 'architecture', view: 'progettazione-hub' as View, color: 'var(--md-sys-color-primary)' },
    { label: 'UDA',           icon: 'layers',       view: 'uda' as View,               color: 'var(--md-sys-color-secondary)' },
    { label: 'Reportistica',  icon: 'bar_chart',    view: 'reportistica' as View,      color: 'var(--md-sys-color-tertiary)' },
  ];
  return [
    { label: 'Analisi',       icon: 'analytics',     view: 'analytics' as View,      color: 'var(--md-sys-color-primary)' },
    { label: 'Knowledge',     icon: 'library_books', view: 'knowledge-base' as View, color: 'var(--md-sys-color-secondary)' },
    { label: 'Studio AI',     icon: 'psychology',    view: 'studio' as View,         color: 'var(--md-sys-color-tertiary)' },
  ];
}

function getTimedLabel(h: number): string {
  if (h < 9)  return 'Prima di entrare in classe';
  if (h < 14) return 'In aula adesso';
  if (h < 18) return 'Nel pomeriggio';
  return 'Questa sera';
}

// â”€â”€ Prompt contestuali per ora del giorno â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â”€â”€ Documenti burocratici â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DOC_ACTIONS: { label: string; icon: string; view: View; desc: string }[] = [
  { label: 'UDA',           icon: 'layers',            view: 'uda' as View,                        desc: 'Unità di Apprendimento' },
  { label: 'Rubriche',      icon: 'checklist',          view: 'rubriche' as View,                   desc: 'Rubriche valutazione' },
  { label: 'Programmazione',icon: 'event_note',         view: 'progettazione-hub' as View,          desc: 'Piano annuale' },
  { label: 'PDP / PEI',     icon: 'accessibility',      view: 'didattica-inclusiva' as View,        desc: 'Documenti BES/DSA' },
  { label: 'Scrutinio',     icon: 'grading',            view: 'evaluations' as View,                desc: 'Preparazione scrutinio' },
  { label: 'C.d.C.',        icon: 'groups',             view: 'consiglio-di-classe' as View,        desc: 'Consiglio di Classe' },
  { label: 'Reportistica',  icon: 'summarize',          view: 'reportistica' as View,               desc: 'Relazioni e report' },
  { label: 'Orientamento',  icon: 'explore',            view: 'orientamento' as View,               desc: 'Percorso orientamento' },
  { label: 'Curriculum',    icon: 'account_tree',       view: 'curriculum-manager' as View,         desc: 'Curricolo verticale' },
  { label: 'Certificazioni',icon: 'workspace_premium',  view: 'class-competency-dashboard' as View, desc: 'Certificazioni competenze' },
];

// â”€â”€ Scadenzario normativo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getDeadlineAlerts(now: Date): { icon: string; text: string; urgency: 'error' | 'warning' | 'info' }[] {
  const m = now.getMonth() + 1; // 1–12
  const result: { icon: string; text: string; urgency: 'error' | 'warning' | 'info' }[] = [];
  if (m === 1)  result.push({ icon: 'assignment_late',    text: 'Scrutinio 1° quadrimestre in vista',            urgency: 'error' });
  if (m === 2)  result.push({ icon: 'description',        text: 'Aggiorna i PDP/PEI per il 2° periodo',          urgency: 'warning' });
  if (m === 3)  result.push({ icon: 'fact_check',         text: 'UDA 2° bimestre: verifica avanzamento',         urgency: 'warning' });
  if (m === 5)  result.push({ icon: 'workspace_premium',  text: 'Certificazioni competenze: avvia compilazione', urgency: 'error' });
  if (m === 6)  result.push({ icon: 'summarize',          text: 'Relazioni finali di classe da produrre',        urgency: 'error' });
  if (m === 9)  result.push({ icon: 'event_note',         text: 'Setup classi e programmazione annuale',         urgency: 'warning' });
  if (m === 10) result.push({ icon: 'article',            text: 'PTOF: contributo disciplinare da consegnare',   urgency: 'info' });
  return result;
}

const ALL_AREAS: { label: string; icon: string; view: string }[] = [
  { label: 'Classi',       icon: 'school',         view: 'aula' },
  { label: 'Studenti',     icon: 'group',          view: 'studenti' },
  { label: 'Calendario',   icon: 'calendar_month', view: 'calendario' },
  { label: 'Registro',     icon: 'menu_book',      view: 'register' },
  // 'presenze' non ha una view dedicata — si usa il registro (che include la gestione presenze)
  { label: 'Presenze',     icon: 'fact_check',     view: 'register' },
  { label: 'Inbox',        icon: 'inbox',          view: 'teacher-inbox' },
  { label: 'C.d.C.',       icon: 'groups',         view: 'consiglio-di-classe' },
  { label: 'Inclusiva',    icon: 'accessibility',  view: 'didattica-inclusiva' },
  { label: 'Live',         icon: 'smart_display',  view: 'live-assistant' },
  { label: 'Impostazioni', icon: 'settings',       view: 'settings' },
];

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const lessons  = useAcademicStore(s => s.lessons);
  const students = useStudentStore(s => s.students);

  const [isDailyBriefingOpen, setIsDailyBriefingOpen] = useState(false);

  // â”€â”€ Derived â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Refresh current time when user returns to the tab
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') setNow(new Date()); };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, []);
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buongiorno' : hour < 18 ? 'Buon pomeriggio' : 'Buona sera';
  const dateLabel = now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

  const timedActions     = useMemo(() => getTimedActions(hour), [hour]);
  const timedLabel       = useMemo(() => getTimedLabel(hour), [hour]);
  const deadlineAlerts   = useMemo(() => getDeadlineAlerts(now), [now]);

  const lessonsCount = Object.keys(lessons || {}).length;
  const studentsCount = students?.length ?? 0;

  const { level } = useJourneyProgress();
  const nextAction = useNextAction();

  const isEsploratore = level === 'esploratore';

  // Fase 3 continuation (user-centric daily gesture): Real AIBrain consumption in "Oggi" (Home)
  // buildContext + getUnifiedRecommendations + ask for contextual daily insight
  // rollback-safe + deprecation path
  const homeContext = useMemo(() => AIBrain.buildContext({
    source: 'home',
    extra: { hour, studentsCount, lessonsCount, level }
  }), [hour, studentsCount, lessonsCount, level]);

  const homeRecs = useMemo(() => {
    try {
      return AIBrain.getUnifiedRecommendations(homeContext);
    } catch {
      return null;
    }
  }, [homeContext]);

  // Real AIBrain.ask for daily tip (visible daily teacher gesture)
  const [homeAiTip, setHomeAiTip] = React.useState<string | null>(null);
  const [homeAiLoading, setHomeAiLoading] = React.useState(false);

  const fetchHomeAiTip = React.useCallback(async () => {
    setHomeAiLoading(true);
    try {
      const res = await AIBrain.ask({
        prompt: `Suggerisci un'azione rapida o insight per l'insegnante alle ${hour}:00 (classe attuale).`,
        context: homeContext,
        mode: 'balanced'
      });
      setHomeAiTip(res.content);
      if (import.meta.env.DEV) {
        AIBrain.migrateLegacyAsk('legacy-home-daily', homeContext).catch(() => {});
      }
    } catch {
      setHomeAiTip('Impossibile ottenere suggerimento AIBrain.');
    } finally {
      setHomeAiLoading(false);
    }
  }, [hour, homeContext]);

  // Rinomina UDA → Lezione per chi è ancora all'inizio
  const adaptedTimedActions = useMemo(() =>
    timedActions.map(a => a.view === 'uda' && isEsploratore ? { ...a, label: 'Lezione', icon: 'edit_document' } : a),
    [timedActions, isEsploratore]
  );

  const visibleDocActions = useMemo(() =>
    DOC_ACTIONS.map(d => d.view === 'uda' && isEsploratore ? { ...d, label: 'Lezione', desc: 'Pianifica una lezione' } : d),
    [isEsploratore]
  );

  // Prossimo passo guidato — mostrato agli esploratori
  const nextStep = useMemo(() => {
    if (!isEsploratore) return null;
    return { label: nextAction.label, icon: nextAction.icon, view: (nextAction.targetView ?? 'copilot') as View };
  }, [isEsploratore, nextAction]);

  const fabLabel = hour < 14 ? 'Inizia Giornata' : (isEsploratore ? 'Nuova Lezione' : 'Nuova UDA');
  const fabIcon  = hour < 14 ? 'playlist_add_check' : (isEsploratore ? 'edit_document' : 'layers');

  // Auto-fetch a quick daily tip on mount (user-centric daily gesture)
  React.useEffect(() => {
    fetchHomeAiTip();
  }, [fetchHomeAiTip]);

  return (
    <>
      <PageWrapper
        maxWidth="var(--md-sys-layout-content-max-width)"
        gap="var(--md-sys-spacing-5)"
        sx={{
          px: 'var(--md-sys-spacing-4)',
          pt: 'var(--md-sys-spacing-4)',
          pb: 'calc(88px + env(safe-area-inset-bottom, 0px))',
          boxSizing: 'border-box',
        }}
      >
        {/* â”€â”€ Intestazione â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--md-sys-spacing-3)' }}>
          <Box>
            <Typography variant="h5" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
              {greeting}
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'capitalize' }}>
              {dateLabel}
            </Typography>
          </Box>
          {(studentsCount > 0 || lessonsCount > 0) && (
            <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-2)' }}>
              {studentsCount > 0 && (
                <ButtonBase
                  onClick={() => onNavigate('aula' as View)}
                  aria-label={`${studentsCount} studenti — vai a Classi`}
                  focusRipple
                  sx={{
                    textAlign: 'center', px: 'var(--md-sys-spacing-3)', py: 'var(--md-sys-spacing-2)',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    bgcolor: 'var(--md-sys-color-surface-container)',
                    '&:hover': { bgcolor: 'var(--md-sys-color-surface-container-high)' },
                  }}
                >
                  <Typography variant="h6" sx={{ color: 'var(--md-sys-color-primary)', lineHeight: 1 }}>{studentsCount}</Typography>
                  <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>studenti</Typography>
                </ButtonBase>
              )}
              {lessonsCount > 0 && (
                <ButtonBase
                  onClick={() => onNavigate('lessons' as View)}
                  aria-label={`${lessonsCount} lezioni`}
                  focusRipple
                  sx={{
                    textAlign: 'center', px: 'var(--md-sys-spacing-3)', py: 'var(--md-sys-spacing-2)',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    bgcolor: 'var(--md-sys-color-surface-container)',
                    '&:hover': { bgcolor: 'var(--md-sys-color-surface-container-high)' },
                  }}
                >
                  <Typography variant="h6" sx={{ color: 'var(--md-sys-color-tertiary)', lineHeight: 1 }}>{lessonsCount}</Typography>
                  <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>lezioni</Typography>
                </ButtonBase>
              )}
            </Box>
          )}
        </Box>

        {/* â”€â”€ Scadenzario normativo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* Prossimo passo — guida contestuale per gli esploratori */}
        {nextStep && (
          <ButtonBase
            onClick={() => onNavigate(nextStep.view)}
            aria-label={nextStep.label}
            focusRipple
            sx={{
              width: '100%',
              display: 'flex', alignItems: 'center',
              gap: 'var(--md-sys-spacing-3)',
              px: 'var(--md-sys-spacing-4)', py: 'var(--md-sys-spacing-3)',
              borderRadius: 'var(--md-sys-shape-corner-large)',
              bgcolor: 'var(--md-sys-color-secondary-container)',
              textAlign: 'left',
              '&:hover': { filter: 'brightness(0.97)' },
            }}
          >
            <Box component="span" className="material-symbols-outlined" aria-hidden="true"
              sx={{ fontSize: 24, color: 'var(--md-sys-color-on-secondary-container)', flexShrink: 0 }}>
              {nextStep.icon}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-secondary-container)', opacity: 0.75, display: 'block' }}>
                Prossimo passo
              </Typography>
              <Typography variant="labelLarge" sx={{ color: 'var(--md-sys-color-on-secondary-container)' }}>
                {nextStep.label}
              </Typography>
            </Box>
            <Box component="span" className="material-symbols-outlined" aria-hidden="true"
              sx={{ fontSize: 20, color: 'var(--md-sys-color-on-secondary-container)', opacity: 0.7 }}>
              arrow_forward
            </Box>
          </ButtonBase>
        )}

        {/* ── Quick AI Entry (Fase 1/2) ──
           Usa il componente riutilizzabile AskAIButton per coerenza
           Naviga alla vista dedicata "Assistente" (P44.6 preservato) */}
        <ContextualAskAI onNavigate={onNavigate} fullWidth />

        {/* Fase 3 continuation: Real AIBrain consumption in Home ("Oggi" - daily teacher gesture) */}
        {/* Visible AIBrain (Fase 3) unified recommendation + ask tip */}
        {homeRecs?.primary && (
          <Box sx={{ mt: 1, p: 1.5, borderRadius: 'var(--md-sys-shape-corner-medium)', bgcolor: 'var(--md-sys-color-primary-container)' }}>
            <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-primary-container)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>
              AIBrain (Fase 3): {homeRecs.primary.label || homeRecs.primary.title}
            </Typography>
          </Box>
        )}

        {/* Real AIBrain.ask daily tip (visible daily gesture) */}
        <Box sx={{ mt: 1, mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="outlined"
            onClick={fetchHomeAiTip}
            disabled={homeAiLoading}
            startIcon={<Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>}
          >
            {homeAiLoading ? 'AIBrain…' : 'Suggerimento rapido AIBrain (Oggi)'}
          </Button>
          {homeAiTip && (
            <Box sx={{ p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-tertiary-container)', flex: 1, minWidth: 180 }}>
              <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-tertiary-container)', fontWeight: 500 }}>
                AIBrain (Fase 3): {homeAiTip}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Sottotesto contestuale per la vista "Oggi" */}
        <Typography
          variant="bodySmall"
          sx={{
            color: 'var(--md-sys-color-on-surface-variant)',
            textAlign: 'center',
            mt: '-var(--md-sys-spacing-1)',
            mb: 'var(--md-sys-spacing-2)',
          }}
        >
          Esperienza completa con Orbit, Decision Card e tutto il core P44.6
        </Typography>

        {/* Scadenzario normativo — MD3 compliant */}
        {deadlineAlerts.length > 0 && (
          <M3Surface
            elevation={1}
            sx={{
              borderRadius: 'var(--md-sys-shape-corner-large)',
              p: 'var(--md-sys-spacing-3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--md-sys-spacing-1)',
            }}
          >
            <Typography
              variant="labelSmall"
              sx={{
                color: 'var(--md-sys-color-on-surface-variant)',
                letterSpacing: '0.08em',
                mb: 'var(--md-sys-spacing-1)',
              }}
            >
              Scadenzario
            </Typography>
            {deadlineAlerts.map((alert, index) => {
              const bg = alert.urgency === 'error'
                ? 'var(--md-sys-color-error-container)'
                : alert.urgency === 'warning'
                  ? 'var(--md-sys-color-tertiary-container)'
                  : 'var(--md-sys-color-surface-container)';
              const fg = alert.urgency === 'error'
                ? 'var(--md-sys-color-on-error-container)'
                : alert.urgency === 'warning'
                  ? 'var(--md-sys-color-on-tertiary-container)'
                  : 'var(--md-sys-color-on-surface)';

              return (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--md-sys-spacing-2)',
                    px: 'var(--md-sys-spacing-2)',
                    py: 'var(--md-sys-spacing-1)',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    bgcolor: bg,
                    color: fg,
                  }}
                >
                  <Box
                    component="span"
                    className="material-symbols-outlined"
                    aria-hidden="true"
                    sx={{ fontSize: 18, flexShrink: 0 }}
                  >
                    {alert.icon}
                  </Box>
                  <Typography variant="bodySmall" sx={{ color: 'inherit' }}>
                    {alert.text}
                  </Typography>
                </Box>
              );
            })}
          </M3Surface>
        )}

        {/* Journey panel + adaptive sections */}
        <JourneyProgressPanel />

        {(level === 'praticante' || level === 'maestro') && (
          <Box component="section" aria-label="Insight di oggi">
            <Typography variant="overline" sx={{ color: 'var(--md-sys-color-secondary)', letterSpacing: '0.08em', mb: 'var(--md-sys-spacing-2)', display: 'block' }}>Insight di oggi</Typography>
            <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-3)', flexWrap: 'wrap' }}>
              <ButtonBase onClick={() => onNavigate('copilot' as View)} focusRipple aria-label="Vai al Copilot per analisi andamento" sx={{ flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)', px: 'var(--md-sys-spacing-3)', py: 'var(--md-sys-spacing-3)', borderRadius: 'var(--md-sys-shape-corner-large)', bgcolor: 'var(--md-sys-color-secondary-container)', '&:hover': { filter: 'brightness(0.95)' } }}>
                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 20, color: 'var(--md-sys-color-on-secondary-container)' }}>bar_chart</Box>
                <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-on-secondary-container)' }}>Andamento classe</Typography>
              </ButtonBase>
              <ButtonBase onClick={() => onNavigate('studio' as View)} focusRipple aria-label="Vai allo Studio AI" sx={{ flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)', px: 'var(--md-sys-spacing-3)', py: 'var(--md-sys-spacing-3)', borderRadius: 'var(--md-sys-shape-corner-large)', bgcolor: 'var(--md-sys-color-tertiary-container)', '&:hover': { filter: 'brightness(0.95)' } }}>
                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 20, color: 'var(--md-sys-color-on-tertiary-container)' }}>psychology</Box>
                <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-on-tertiary-container)' }}>Analisi predittiva</Typography>
              </ButtonBase>
            </Box>
          </Box>
        )}

        {level === 'esploratore' && (
          <Box component="section" aria-label="Scopri l'AI Artistica Educativa">
            <ButtonBase
              onClick={() => onNavigate('copilot' as View)}
              focusRipple
              aria-label="Scopri il Consilium Artistico AI nel tab Artistico del Copilot Docente"
              sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)', px: 'var(--md-sys-spacing-4)', py: 'var(--md-sys-spacing-3)', borderRadius: 'var(--md-sys-shape-corner-large)', bgcolor: 'var(--md-sys-color-primary-container)', textAlign: 'left', '&:hover': { filter: 'brightness(0.95)' } }}
            >
              <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 24, color: 'var(--md-sys-color-on-primary-container)', flexShrink: 0 }}>palette</Box>
              <Box>
                <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-on-primary-container)', display: 'block' }}>AI Artistica Educativa</Typography>
                <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-primary-container)', opacity: 0.8 }}>Genera attività creative e interdisciplinari per le tue UDA</Typography>
              </Box>
            </ButtonBase>
          </Box>
        )}

        {(level === 'praticante' || level === 'maestro') && (
          <Box component="section" aria-label={level === 'maestro' ? 'Automazioni suggerite' : 'Suggerimenti contestuali'}>
            <Typography variant="overline" sx={{ color: 'var(--md-sys-color-tertiary)', letterSpacing: '0.08em', mb: 'var(--md-sys-spacing-2)', display: 'block' }}>{level === 'maestro' ? 'Automazioni suggerite' : 'Suggerimenti contestuali'}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)' }}>
              <ButtonBase focusRipple aria-label={nextAction.label} onClick={() => nextAction.targetView && onNavigate(nextAction.targetView as View)} sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)', px: 'var(--md-sys-spacing-3)', py: 'var(--md-sys-spacing-3)', borderRadius: 'var(--md-sys-shape-corner-large)', bgcolor: 'var(--md-sys-color-surface-container)', textAlign: 'left', '&:hover': { bgcolor: 'var(--md-sys-color-surface-container-high)' } }}>
                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 20, color: 'var(--md-sys-color-tertiary)', flexShrink: 0 }}>{nextAction.icon}</Box>
                <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>{nextAction.label}</Typography>
              </ButtonBase>
            </Box>
          </Box>
        )}


        {/* â”€â”€ Azioni Adesso â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Box component="section" aria-label={timedLabel}>
          <Typography variant="overline" sx={{
            color: 'var(--md-sys-color-primary)', letterSpacing: '0.08em',
            mb: 'var(--md-sys-spacing-2)', display: 'block',
          }}>
            {timedLabel}
          </Typography>
          {isEsploratore ? (
            /* Esploratore: 1 azione principale prominente + 2 secondarie compatte */
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)' }}>
              <ButtonBase
                onClick={() => onNavigate(adaptedTimedActions[0].view)}
                aria-label={`Vai a ${adaptedTimedActions[0].label}`}
                focusRipple
                sx={{
                  width: '100%',
                  display: 'flex', alignItems: 'center',
                  gap: 'var(--md-sys-spacing-3)', px: 'var(--md-sys-spacing-4)', py: 'var(--md-sys-spacing-4)',
                  borderRadius: 'var(--md-sys-shape-corner-large)',
                  bgcolor: 'var(--md-sys-color-primary-container)',
                  textAlign: 'left',
                  '&:hover': { filter: 'brightness(0.97)' },
                  '&:focus-visible': { outline: `2px solid ${adaptedTimedActions[0].color}`, outlineOffset: 2 },
                }}
              >
                <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                  sx={{ fontSize: 32, color: 'var(--md-sys-color-on-primary-container)' }}>
                  {adaptedTimedActions[0].icon}
                </Box>
                <Typography variant="titleMedium" sx={{ color: 'var(--md-sys-color-on-primary-container)' }}>
                  {adaptedTimedActions[0].label}
                </Typography>
              </ButtonBase>
              <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-2)' }}>
                {adaptedTimedActions.slice(1).map(a => (
                  <ButtonBase
                    key={String(a.view)}
                    onClick={() => onNavigate(a.view)}
                    aria-label={`Vai a ${a.label}`}
                    focusRipple
                    sx={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 'var(--md-sys-spacing-2)', px: 'var(--md-sys-spacing-3)', py: 'var(--md-sys-spacing-2)',
                      borderRadius: 'var(--md-sys-shape-corner-large)',
                      border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                      bgcolor: 'transparent',
                      '&:hover': { bgcolor: 'var(--md-sys-color-surface-container)' },
                    }}
                  >
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                      sx={{ fontSize: 18, color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {a.icon}
                    </Box>
                    <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {a.label}
                    </Typography>
                  </ButtonBase>
                ))}
              </Box>
            </Box>
          ) : (
            /* Praticante / Maestro: griglia 3 tile */
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--md-sys-spacing-3)' }}>
              {adaptedTimedActions.map(a => (
                <ButtonBase
                  key={String(a.view)}
                  onClick={() => onNavigate(a.view)}
                  aria-label={`Vai a ${a.label}`}
                  focusRipple
                  sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 'var(--md-sys-spacing-2)', p: 'var(--md-sys-spacing-4)',
                    borderRadius: 'var(--md-sys-shape-corner-large)',
                    bgcolor: 'var(--md-sys-color-surface-container)',
                    transition: 'background-color 0.2s',
                    '&:hover': { bgcolor: 'var(--md-sys-color-surface-container-high)' },
                    '&:focus-visible': { outline: `2px solid ${a.color}`, outlineOffset: 2 },
                  }}
                >
                  <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                    sx={{ fontSize: 28, color: a.color, fontVariationSettings: '"FILL" 0' }}>
                    {a.icon}
                  </Box>
                  <Typography variant="caption" sx={{
                    color: 'var(--md-sys-color-on-surface)',
                    fontWeight: 'var(--md-sys-typescale-weight-medium)',
                    textAlign: 'center',
                  }}>
                    {a.label}
                  </Typography>
                </ButtonBase>
              ))}
            </Box>
          )}
        </Box>

        {/* â”€â”€ Documenti & Burocrazia â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Box component="section" aria-label="Documenti e burocrazia">
          <Typography variant="overline" sx={{
            color: 'var(--md-sys-color-primary)', letterSpacing: '0.08em',
            mb: 'var(--md-sys-spacing-2)', display: 'block',
          }}>
            Documenti & Burocrazia
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' }, gap: 'var(--md-sys-spacing-2)' }}>
            {visibleDocActions.map(d => (
              <ButtonBase
                key={String(d.view)}
                onClick={() => onNavigate(d.view)}
                focusRipple
                aria-label={`${d.label} — ${d.desc}`}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)',
                  width: '100%', justifyContent: 'flex-start',
                  px: 'var(--md-sys-spacing-3)', py: 'var(--md-sys-spacing-2)',
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                  bgcolor: 'transparent',
                  transition: 'background-color 0.15s',
                  '&:hover': { bgcolor: 'var(--md-sys-color-surface-container)' },
                }}
              >
                <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                  sx={{ fontSize: 16, color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {d.icon}
                </Box>
                <Typography variant="body2" sx={{
                  color: 'var(--md-sys-color-on-surface)',
                  fontWeight: 'var(--md-sys-typescale-weight-medium)',
                }}>
                  {d.label}
                </Typography>
              </ButtonBase>
            ))}
          </Box>
        </Box>

        {/* â”€â”€ Tutte le aree â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Box component="section" aria-label="Tutte le aree">
          <Typography variant="overline" sx={{
            color: 'var(--md-sys-color-primary)', letterSpacing: '0.08em',
            mb: 'var(--md-sys-spacing-2)', display: 'block',
          }}>
            Tutte le aree
          </Typography>
          <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-2)', flexWrap: 'wrap' }}>
            {ALL_AREAS.map(item => (
              <Chip
                key={item.view}
                size="small"
                variant="outlined"
                onClick={() => onNavigate(item.view as View)}
                aria-label={`Vai a ${item.label}`}
                icon={
                  <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                    sx={{ fontSize: '14px !important', ml: '6px !important', color: 'var(--md-sys-color-on-surface-variant) !important' }}>
                    {item.icon}
                  </Box>
                }
                sx={{
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  '&:hover': { bgcolor: 'var(--md-sys-color-surface-container)' },
                }}
              />
            ))}
          </Box>
        </Box>
      </PageWrapper>

      {/* â”€â”€ FAB contestuale â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Fab
        color="primary"
        aria-label={fabLabel}
        onClick={hour < 14 ? () => setIsDailyBriefingOpen(true) : () => onNavigate('uda' as View)}
        sx={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          right: 'calc(var(--md-sys-spacing-4, 16px) + 64px)',
          zIndex: 1250,
          bgcolor: 'var(--md-sys-color-primary)',
          color: 'var(--md-sys-color-on-primary)',
          borderRadius: 'var(--md-sys-shape-corner-large)',
        }}
      >
        <Box component="span" className="material-symbols-outlined" aria-hidden="true"
          sx={{ fontSize: 24 }}>
          {fabIcon}
        </Box>
      </Fab>

      {isDailyBriefingOpen && (
        <DailyBriefingModal
          onClose={() => setIsDailyBriefingOpen(false)}
          onNavigate={onNavigate}
        />
      )}
      <LevelUpCelebration />
    </>
  );
};

export default Home;

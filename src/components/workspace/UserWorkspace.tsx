/**
 * UserWorkspace.tsx — Spazio di lavoro del docente.
 *
 * Componente centrale del pilot: connette la pipeline cognitiva all'UI.
 *
 *   [Input Area]      — testo libero o upload file → ingestInput()
 *   [Recent Content]  — lista entrate cognitive cliccabili → openMenu()
 *   [ThumbMenu]       — menu radiale azioni (Portal-rendered)
 *   [OnboardingOverlay] — guida al primo avvio (localStorage-gated)
 *
 * Non richiede props: legge tenantId da tenantRegistry e si iscrive ai
 * cambiamenti tramite tenantRegistry.subscribe + useCognitiveStore.subscribe.
 *
 * MD3 Gold Compliant:
 *   - M3Surface per ogni container visivo
 *   - nessun <div> per layout/shell/card
 *   - token var(--md-sys-color-*) per tutti i colori
 *   - fontWeight via var(--md-sys-typescale-weight-semibold)
 *   - aria-label su ogni elemento interattivo
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Box              from '@mui/material/Box';
import Button           from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider          from '@mui/material/Divider';
import IconButton       from '@mui/material/IconButton';
import List             from '@mui/material/List';
import ListItemButton   from '@mui/material/ListItemButton';
import ListItemText     from '@mui/material/ListItemText';
import Stack            from '@mui/material/Stack';
import TextField        from '@mui/material/TextField';
import Tooltip          from '@mui/material/Tooltip';
import Typography       from '@mui/material/Typography';
import AttachFileOutlinedIcon    from '@mui/icons-material/AttachFileOutlined';
import AutoAwesomeIcon           from '@mui/icons-material/AutoAwesome';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import SendOutlinedIcon          from '@mui/icons-material/SendOutlined';

import M3Surface        from '../ui/M3Surface';
import ThumbMenu        from '../ui/ThumbMenu';
import JarvisIndicator  from '../ui/JarvisIndicator';
import InlineActionStrip from '../ui/InlineActionStrip';
import AccountLinkingPanel from './AccountLinkingPanel';
import ScheduleLanding  from '../landing/ScheduleLanding';
import ClassLanding     from '../landing/ClassLanding';
import LessonLanding    from '../landing/LessonLanding';
import SettingsLanding  from '../settings/SettingsLanding';
import ContextualAskAI from '../ui/ContextualAskAI';
import { View } from '../../types';

import { ingestInput }        from '../../modules/cognitiveLayer';
import { useCognitiveStore }  from '../../modules/cognitiveLayer/cognitiveStore';
import type { CognitiveEntry } from '../../modules/cognitiveLayer/types';
import type { ScheduleContext } from '../../modules/orchestration/types';
import { decideInitialView } from '../../modules/orchestration/entryDecision';
import { getAutomationLevel } from '../../modules/orchestration/orchestrationService';
import { tenantRegistry }     from '../../services/tenant/tenantRegistry';
import { useAcademicStore }   from '../../stores/useAcademicStore';
import { useSettingsStore }   from '../../stores/useSettingsStore';
import { useJarvisKeyboard }      from '../../hooks/useJarvisKeyboard';
import { useThumbMenu }           from '../../hooks/useThumbMenu';
import { useUniversalInput }      from '../../hooks/useUniversalInput';
import { useProactiveSchedule }   from '../../hooks/useProactiveSchedule';
import { useSkillSuggestion, autoName } from '../../hooks/useSkillSuggestion';
import { useAutoSettingsEngine }      from '../../hooks/useAutoSettingsEngine';
import { useExternalSync }        from '../../hooks/useExternalSync';
import { useOrbitSession }        from '../../hooks/useOrbitSession';
import { seedDemoContent }       from '../../utils/seedDemoContent';
import SimulationPanel          from '../../simulation/SimulationPanel';
import JarvisNexus              from '../ui/JarvisNexus';
import type { NexusState }       from '../ui/JarvisNexus';
import { useEmergentSkillsStore } from '../../stores/useEmergentSkillsStore';
import { useTrustStore }          from '../../stores/useTrustStore';
import { useFlowStore, selectActiveFlows } from '../../stores/useFlowStore';
import { buildFlowFromPattern, executeFlow } from '../../modules/flows/flowEngine';
import type { OrbitBehaviorSignals }             from '../../theme/orbitStates';
import { getBehaviorSignals,
         recordInteraction }                      from '../../modules/orchestration/patternDetector';
import { resolveFinalPresence }                  from '../../theme/presenceEngine';
import { resolveDominantPersonality }            from '../../theme/agentPersonality';
import { runExecutionPipeline }                  from '../../modules/orbit/executionEngine';
import { useOrbitPipeline }                      from '../../hooks/useOrbitPipeline';
import { useIdleDetection }                      from '../../hooks/useIdleDetection';

// ─── Domain display helpers ───────────────────────────────────────────────────

const DOMAIN_CHIP_COLOR: Record<string, string> = {
  pedagogical:    'var(--md-sys-color-primary)',
  compliance:     'var(--md-sys-color-error)',
  administrative: 'var(--md-sys-color-secondary)',
  technical:      'var(--md-sys-color-tertiary)',
  commercial:     'var(--md-sys-color-tertiary)',
  operational:    'var(--md-sys-color-secondary)',
  unknown:        'var(--md-sys-color-outline)',
};

const DOMAIN_LABEL: Record<string, string> = {
  pedagogical:    'Pedagogico',
  compliance:     'Compliance',
  administrative: 'Amministrativo',
  technical:      'Tecnico',
  commercial:     'Commerciale',
  operational:    'Operativo',
  unknown:        'Altro',
};

function relativeTime(ts: number): string {
  const min = Math.floor((Date.now() - ts) / 60_000);
  if (min < 1)  return 'adesso';
  if (min < 60) return `${min}m fa`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `${h}h fa`;
  return `${Math.floor(h / 24)}g fa`;
}

// ─── Proactive scoring ────────────────────────────────────────────────────────

const DOMAIN_SCORE: Record<string, number> = {
  compliance: 40, pedagogical: 30, administrative: 20,
  technical: 10, operational: 5, commercial: 5, unknown: 0,
};
const CONF_SCORE:   Record<string, number> = { high: 20, medium: 10, low: 0 };
const URGENT_TAGS = new Set([
  'gdpr', 'uda', 'urgente', 'scadenza', 'dpia', 'audit', 'violazione',
]);

function scoreEntry(e: CognitiveEntry): number {
  let s = (DOMAIN_SCORE[e.domain] ?? 0) + (CONF_SCORE[e.confidence] ?? 0);
  const ageMin = (Date.now() - e.enteredAt) / 60_000;
  if (ageMin < 10)  s += 15;
  else if (ageMin < 60) s += 5;
  if (e.tags.some(t => URGENT_TAGS.has(t.toLowerCase()))) s += 10;
  return s;
}

function getProactiveReason(e: CognitiveEntry): string {
  if (e.tags.some(t => URGENT_TAGS.has(t.toLowerCase()))) return 'Elemento critico rilevato';
  if (e.domain === 'compliance')                           return 'Richiede attenzione normativa';
  if (e.domain === 'pedagogical' && e.confidence === 'high') return 'Pronto per analisi';
  if ((Date.now() - e.enteredAt) / 60_000 < 5)            return 'Appena aggiunto';
  return 'Suggerito da Jarvis';
}

// ─── Active context resolver ──────────────────────────────────────────────────

interface ActiveContext { type: string; label: string }

/** Determina quale landing fullscreen aprire in base ai tag dell'entry. */
type LandingType = 'schedule' | 'class' | 'lesson' | 'settings';

const DOMAIN_CONTEXT_LABEL: Record<string, string> = {
  compliance:     'Revisione compliance',
  pedagogical:    'Attività pedagogica',
  administrative: 'Gestione amministrativa',
  technical:      'Supporto tecnico',
  operational:    'Attività operativa',
  commercial:     'Area commerciale',
};

function resolveActiveContext(entries: CognitiveEntry[]): ActiveContext {
  if (entries.length === 0) return { type: 'unknown', label: 'Attività in corso' };
  const recent = entries.slice(0, 10);
  // Compliance always takes priority
  if (recent.some(e => e.domain === 'compliance')) {
    return { type: 'compliance', label: 'Revisione compliance' };
  }
  // Most frequent domain
  const freq: Record<string, number> = {};
  for (const e of recent) freq[e.domain] = (freq[e.domain] ?? 0) + 1;
  const topDomain = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
  return { type: topDomain, label: DOMAIN_CONTEXT_LABEL[topDomain] ?? 'Attività in corso' };
}
// ─── Schedule context resolver ────────────────────────────────────────────────────────

/**
 * Legge useAcademicStore + useSettingsStore one-shot per costruire il
 * contesto orario del momento. Chiamato solo al click su una entry —
 * non crea subscription né side-effect.
 */
function resolveScheduleContext(): ScheduleContext {
  const { lessons } = useAcademicStore.getState();
  const { settings } = useSettingsStore.getState();

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLessons = Object.values(lessons).filter(l => l.data === todayStr && !l.svolta);
  if (todayLessons.length === 0) return {};

  const next = todayLessons[0];
  const [h, m] = (settings.orarioInizio ?? '08:00').split(':').map(Number);
  const now = new Date();
  const startMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime();
  const minsToLesson = Math.floor((startMs - Date.now()) / 60_000);

  return {
    currentLessonId: next.id,
    activeClassId:   next.classe,
    nextLessonAt:    startMs,
    lessonType:      next.tipoLezione,
    minsToLesson,
  };
}

/**
 * Decodifica il tipo di landing da aprire in base ai tag dell'entry.
 * Ritorna null se l'entry non è destinata a una landing fullscreen.
 */
function decodeLandingType(entry: CognitiveEntry): LandingType | null {
  const tags = entry.tags.map(t => t.toLowerCase());
  if (tags.includes('schedule')) return 'schedule';
  if (tags.includes('classe') && tags.includes('lesson')) return 'lesson';
  if (tags.includes('classe')) return 'class';
  return null;
}
// ─── Component ────────────────────────────────────────────────────────────────

interface UserWorkspaceProps {
  onNavigate?: (view: View, context?: any) => void;
}

export default function UserWorkspace({ onNavigate }: UserWorkspaceProps = {}): React.JSX.Element {

  // ── Tenant (reactive) ──────────────────────────────────────────────────────
  const [tenantId, setTenantId] = useState(
    () => tenantRegistry.getContext().tenantId,
  );
  useEffect(() => {
    return tenantRegistry.subscribe(ctx => setTenantId(ctx.tenantId));
  }, []);

  // ── Cognitive entries (reactive) ───────────────────────────────────────────
  const [entries, setEntries] = useState<CognitiveEntry[]>(() =>
    useCognitiveStore.getState().listRecent(20, tenantId),
  );
  useEffect(() => {
    const refresh = () =>
      setEntries(useCognitiveStore.getState().listRecent(20, tenantId));
    refresh();
    return useCognitiveStore.subscribe(refresh);
  }, [tenantId]);

  // ── Account linking panel ─────────────────────────────────────────────
  const [accountPanelOpen, setAccountPanelOpen] = useState(false);

  // ── Landing overlays (Orbit fullscreen context views) ─────────────────
  const [activeLanding, setActiveLanding] = useState<LandingType | null>(null);
  const [landingCtx,    setLandingCtx]    = useState<ScheduleContext | null>(null);
  // ── Jarvis auto-execute toast ──────────────────────────────────────────
  const [autoToastLabel, setAutoToastLabel] = useState<string | null>(null);
  /** Prevent context takeover from firing more than once */
  const initialDecisionMade = useRef(false);
  // ── Input state ───────────────────────────────────────────────────────────
  const [text,           setText]          = useState('');
  const [ingesting,      setIngesting]     = useState(false);
  const [loadingEntryId, setLoadingEntryId] = useState<string | null>(null);
  const fileRef              = useRef<HTMLInputElement>(null);
  const inputRef             = useRef<HTMLInputElement>(null);
  /** Anchor element of the latest (first) entry — used by Ctrl+J */
  const latestEntryAnchorRef  = useRef<HTMLElement | null>(null);

  const handleIngest = useCallback(async (content: string, label?: string) => {
    if (!content.trim()) return;
    setIngesting(true);
    try {
      await ingestInput({
        tenantId,
        sourceId:  `user-${Date.now()}`,
        inputType: 'text',
        content:   content.trim(),
        label:     label ?? content.trim().slice(0, 60),
      });
      setText('');
    } finally {
      setIngesting(false);
    }
  }, [tenantId]);

  const handleSubmit = useCallback(() => {
    handleIngest(text);
  }, [text, handleIngest]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      if (file.type.startsWith('image/')) {
        reader.onload = () => {
          const ts = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
          handleIngest(reader.result as string, `Screenshot ${ts}`);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => {
          handleIngest(reader.result as string, file.name);
        };
        reader.readAsText(file);
      }
      e.target.value = '';
    },
    [handleIngest],
  );

  // ── ThumbMenu ─────────────────────────────────────────────────────────────
  const {
    open, anchorEl, context, loading: menuLoading,
    openMenu, handleSelect, executeFor, handleClose,
  } = useThumbMenu(tenantId);

  const handleEntryClick = useCallback(
    async (entry: CognitiveEntry, el: HTMLElement) => {
      if (loadingEntryId) return;
      // Landing intercept: orbit entries with special tags open fullscreen views
      const landingType = decodeLandingType(entry);
      if (landingType) {
        setLandingCtx(resolveScheduleContext());
        setActiveLanding(landingType);
        return;
      }
      setLoadingEntryId(entry.id);
      try {
        recordInteraction();
        const schedCtx = resolveScheduleContext();
        const orchCtx = await openMenu(entry.id, el, schedCtx, orbitSession);
        // Auto-execute: if Jarvis confidence is 'auto', run silently without showing menu
        if (orchCtx) {
          const autoAction = orchCtx.actions.find(
            a => getAutomationLevel(a.ctaType) === 'auto',
          );
          if (autoAction) {
            handleClose();
            setAutoToastLabel(autoAction.label);
            await executeFor(autoAction, orchCtx);
            setTimeout(() => setAutoToastLabel(null), 3000);
          }
        }
      } finally {
        setLoadingEntryId(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openMenu, handleClose, executeFor, loadingEntryId],
  );

  // ── Ctrl+, → open Settings Landing ────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        setActiveLanding(prev => prev === 'settings' ? null : 'settings');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Jarvis global keyboard shortcuts (Ctrl+J, Ctrl+U, Ctrl+Shift+D) ────────
  useJarvisKeyboard({
    open,
    latestEntryId:     entries[0]?.id ?? null,
    latestEntryAnchor: latestEntryAnchorRef.current,
    openMenu,
    handleClose,
  });

  // ── Demo seed — once, if workspace starts empty ───────────────────────────
  useEffect(() => {
    if (entries.length === 0) {
      seedDemoContent(tenantId).catch(() => { /* non-critical */ });
    }
    // Intentionally runs only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ── Context Takeover — Jarvis decides initial view on first load ─────────
  useEffect(() => {
    if (initialDecisionMade.current || entries.length === 0) return;
    initialDecisionMade.current = true;
    const decision = decideInitialView(entries);
    if (decision.type === 'lesson-takeover') {
      setLandingCtx(decision.ctx);
      setActiveLanding('lesson');
      setAutoToastLabel(`Lezione pronta — ${decision.lessonLabel}`);
      setTimeout(() => setAutoToastLabel(null), 4000);
    } else if (decision.type === 'schedule-prime') {
      setLandingCtx(decision.ctx);
      setActiveLanding('schedule');
    } else if (decision.type === 'suggestion') {
      forceIdle();
    }
    // ref guard ensures single execution; entries is the correct trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length]);
  // ── Active context ─────────────────────────────────────────────────────────
  const activeContext = useMemo(() => resolveActiveContext(entries), [entries]);

  // ── Proactive intelligence — scored best entry ────────────────────────────
  const suggestedEntry = useMemo(() => {
    if (entries.length === 0) return null;
    return entries.reduce((best, e) => scoreEntry(e) > scoreEntry(best) ? e : best);
  }, [entries]);

  // ── Idle timer — P22: throttled, zero-dep listeners ─────────────────────
  const {
    isIdle:    proactiveIdle,
    forceIdle,
  } = useIdleDetection({ enabled: entries.length > 0 && !open, idleMs: 4_000 });

  // ── Universal input layer — global paste / drag & drop ────────────────────
  const { isProcessing } = useUniversalInput({ tenantId });

  // ── Proactive schedule — timer-driven orbital suggestions ─────────────────
  useProactiveSchedule(tenantId);

  // ── External connector sync ( register, email, file — 2 min poll) ─────────
  useExternalSync(tenantId);

  // ── Orbit session — context-aware session mode for action ranking ──────────
  const { session: orbitSession } = useOrbitSession();

  // ── Jarvis presence level — viewport-aware ────────────────────────────────
  const [viewportWidth, setViewportWidth] = React.useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  React.useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Auto-open ClassLanding when a lesson is in progress (one-shot per session)
  const sessionLandingFiredRef = useRef(false);
  useEffect(() => {
    if (
      !sessionLandingFiredRef.current &&
      orbitSession.mode === 'teaching' &&
      orbitSession.timeContext === 'lesson' &&
      orbitSession.activeClassId &&
      !activeLanding
    ) {
      sessionLandingFiredRef.current = true;
      setLandingCtx({
        currentLessonId: orbitSession.currentLessonId,
        activeClassId:   orbitSession.activeClassId,
      });
      setActiveLanding('class');
    }
    // Reset guard when lesson ends so next lesson can trigger again
    if (orbitSession.timeContext !== 'lesson') {
      sessionLandingFiredRef.current = false;
    }
  // activeLanding is intentionally excluded: don't fight a user-dismissed landing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orbitSession.mode, orbitSession.timeContext, orbitSession.activeClassId]);

  // ── Emergent skill suggestion — pattern-based skill learning loop ─────────
  const { skillDraft, confirmSkill, dismissSkill, autoFiredCount: asAutoFiredCount, ambientFiredCount: asAmbientFiredCount } = useSkillSuggestion();

  // ── Auto-Settings Engine — adaptive configuration ────────────────────────
  const { pending: asPending, appliedIds: asAppliedIds, stealthCount: asStealthCount, applyDelta, dismissDelta } =
    useAutoSettingsEngine(tenantId);

  // ── Trust engine ───────────────────────────────────────────────────────
  const trustActions = useTrustStore(s => s.actions);

  const handleApplyDelta = useCallback((id: string): void => {
    const delta = asPending.find(d => d.id === id);
    if (delta) {
      trustActions.applyEvent({ type: 'delta_applied', deltaId: id, category: delta.category });
    }
    applyDelta(id);
  }, [asPending, applyDelta, trustActions]);

  const handleDismissDelta = useCallback((id: string): void => {
    const delta = asPending.find(d => d.id === id);
    if (delta) {
      trustActions.applyEvent({ type: 'delta_dismissed', deltaId: id, category: delta.category });
    }
    dismissDelta(id);
  }, [asPending, dismissDelta, trustActions]);

  // ── Emergent skills persistence ───────────────────────────────────────────
  const emergentSkillActions = useEmergentSkillsStore(s => s.actions);

  /** Wraps confirmSkill to also sync the singleton to the persisted store */
  const handleConfirmSkill = useCallback(() => {
    confirmSkill();
    setTimeout(() => emergentSkillActions.syncFromSingleton(), 0);
  }, [confirmSkill, emergentSkillActions]);

  // ── Flow Store — Orbit flows ───────────────────────────────────────────────
  const activeFlows   = useFlowStore(selectActiveFlows);
  const flowTrust     = useFlowStore(s => s.flowTrust);
  const flowActions   = useFlowStore(s => s.actions);

  /** Try to build a flow from current action log patterns — at most once per session */
  const flowBuiltRef = useRef(false);
  useEffect(() => {
    if (flowBuiltRef.current) return;
    const flow = buildFlowFromPattern();
    if (flow) {
      flowBuiltRef.current = true;
      flowActions.addFlow(flow);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // single run on mount — log patterns are session-ephemeral

  const handleRunFlow = useCallback(async (flowId: string) => {
    const flow = useFlowStore.getState().flows.find(f => f.id === flowId);
    if (!flow) return;
    const ctx = tenantRegistry.getContext();
    const result = await executeFlow(flow, { tenantId: ctx.tenantId, role: ctx.role });
    if (result.completedFully) {
      flowActions.onSuccess(flowId);
    } else {
      flowActions.onReversal(flowId);
    }
  }, [flowActions]);

  const handleRemoveFlow = useCallback((flowId: string) => {
    flowActions.removeFlow(flowId);
  }, [flowActions]);

  // ── Jarvis Nexus (Ctrl+Shift+J) ────────────────────────────────────────────
  const [nexusOpen, setNexusOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        setNexusOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Auto-open Nexus when a new skill is detected ──────────────────────
  const prevSkillDraftRef = useRef<typeof skillDraft>(null);
  useEffect(() => {
    if (skillDraft != null && prevSkillDraftRef.current == null && !nexusOpen) {
      setNexusOpen(true);
    }
    prevSkillDraftRef.current = skillDraft;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillDraft]); // nexusOpen intentionally excluded: don't auto-open if already open

  // ── Nexus visual state ───────────────────────────────────────────────────────
  const nexusState: NexusState = skillDraft != null
    ? 'learning'
    : asPending.length > 0
      ? 'suggestion'
      : (asAppliedIds.length > 0 || asStealthCount > 0)
        ? 'decision'
        : 'idle';

  // ── Jarvis indicator state (for JarvisIndicator — separate from nexusState) ───
  const jarvisState = (menuLoading || isProcessing) ? 'processing'
    : proactiveIdle    ? 'active'
    : entries.length > 0 ? 'suggestion'
    : 'idle';

  // ── Jarvis presence level — adaptive (P16) ───────────────────────────────
  // activeAgentsCount = active flows (flow-agents) + 1 if any ambient fires
  const activeAgentsCount =
    activeFlows.length + (asAmbientFiredCount > 0 ? 1 : 0);

  // ── P22: stable behaviorSignals reference for pipeline hook memoization ──
  // entries.length is a proxy dep: getBehaviorSignals() reads the module-level
  // interaction log which changes only when recordInteraction() is called.
  const behaviorSignals = useMemo<OrbitBehaviorSignals>(() => ({
    viewportWidth,
    ambientFiredCount: asAmbientFiredCount,
    activeAgentsCount,
    ...getBehaviorSignals(),
  }), [viewportWidth, asAmbientFiredCount, activeAgentsCount]);

  // ── P16–P21 pipeline (P22: single memoized hook, replaces 6 inline calcs) ─
  const {
    sessionAgents,
    cognitiveSignals,
    attentionMap,
    coordinationActions,
    narrative: coordinationLabel,
  } = useOrbitPipeline({ behaviorSignals, activeFlows, flowTrust });

  // Personality + presence level for Nexus (depends on nexusState — local only)
  const dominantPersonality = useMemo(
    () => resolveDominantPersonality(sessionAgents),
    [sessionAgents],
  );
  const nexusPresenceLevel = resolveFinalPresence({
    nexusState,
    behaviorSignals,
    cognitiveSignals,
    agents: sessionAgents,
  });

  // ── P20 — Execution pipeline ──────────────────────────────────────────────
  // Ref prevents re-running the pipeline when the action set hasn't changed.
  const lastPipelineKeyRef = useRef('');
  useEffect(() => {
    if (coordinationActions.length === 0) return;

    const key = coordinationActions.map(a => `${a.agentId}:${a.type}`).join('|');
    if (key === lastPipelineKeyRef.current) return;
    lastPipelineKeyRef.current = key;

    void runExecutionPipeline(coordinationActions, {
      dispatch: (event) => {
        if (import.meta.env.DEV) {
          console.debug('[orbit/P20]', event.type, event.payload);
        }
      },
      logger: import.meta.env.DEV
        ? (msg, data) => console.debug(msg, data)
        : undefined,
    });
  }, [coordinationActions]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <M3Surface
      elevation={0}
      sx={{
        minHeight:     '100%',
        display:       'flex',
        flexDirection: 'column',
        gap:           1.5,
        p:             { xs: 1.5, sm: 2 },
      }}
    >
      {/* ── Header — zero-UI: only active context + account icon ──────── */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography
          variant="titleSmall"
          component="h1"
          sx={{
            color:      'var(--md-sys-color-on-surface-variant)',
            fontWeight: 'var(--md-sys-typescale-weight-semibold)',
            transition: 'color 300ms',
          }}
        >
          {activeContext.label}
        </Typography>

        <Stack direction="row" alignItems="center" gap={0.5}>
          {onNavigate && (
            <ContextualAskAI
              onNavigate={onNavigate}
              context={{ source: 'workspace' }}
              compact
            />
          )}
          <Tooltip title="Jarvis Nexus (Ctrl+Shift+J)">
            <IconButton
              size="small"
              onClick={() => setNexusOpen(p => !p)}
              aria-label="Apri Jarvis Nexus (Ctrl+Shift+J)"
              sx={{
                mt:         0.25,
                color:      nexusOpen
                  ? 'var(--md-sys-color-primary)'
                  : nexusState === 'learning'
                    ? 'var(--md-sys-color-tertiary)'
                    : nexusState === 'suggestion'
                      ? 'var(--md-sys-color-primary)'
                      : 'var(--md-sys-color-on-surface-variant)',
                animation: !nexusOpen && (nexusState === 'learning' || nexusState === 'suggestion' || asAmbientFiredCount > 0)
                  ? 'nexusHubPulse 2.2s ease-in-out infinite'
                  : 'none',
                '@keyframes nexusHubPulse': {
                  '0%, 100%': { opacity: 0.8, transform: 'scale(1)' },
                  '50%':      { opacity: 1,   transform: 'scale(1.12)' },
                },
              }}
            >
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-md, 20px)' }}
              >
                hub
              </Box>
            </IconButton>
          </Tooltip>
          <Tooltip title="Impostazioni (Ctrl+,)">
            <IconButton
              size="small"
              onClick={() => setActiveLanding(prev => prev === 'settings' ? null : 'settings')}
              aria-label="Apri impostazioni (Ctrl+,)"
              sx={{ color: 'var(--md-sys-color-on-surface-variant)', mt: 0.25 }}
            >
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-md, 20px)' }}
              >
                settings
              </Box>
            </IconButton>
          </Tooltip>
          <Tooltip title="Gestisci account collegati">
            <IconButton
              size="small"
              onClick={() => setAccountPanelOpen(true)}
              aria-label="Apri pannello account collegati"
              sx={{ color: 'var(--md-sys-color-on-surface-variant)', mt: 0.25 }}
            >
              <AccountCircleOutlinedIcon
                sx={{ fontSize: 'var(--md-sys-icon-size-md, 20px)' }}
              />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* ── Universal input ─────────────────────────────────────────────── */}
      <M3Surface
        elevation={1}
        sx={{ borderRadius: 2, p: 1.5 }}
        aria-label="Area inserimento contenuto"
      >
        <Stack direction="row" spacing={1} alignItems="flex-end">
          <input
            type="file"
            ref={fileRef}
            accept=".txt,.md,.csv,.json,.png,.jpg,.jpeg,.gif,.webp,application/pdf"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            aria-hidden
          />
          <TextField
            inputRef={inputRef}
            multiline
            minRows={1}
            maxRows={5}
            fullWidth
            placeholder={
              activeContext.type === 'compliance'
                ? 'Incolla documento GDPR, verbale, circolare…'
                : 'Incolla testo, PDF o trascina un file…'
            }
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={ingesting}
            aria-label="Inserisci contenuto da analizzare"
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius:    2,
                backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
              },
            }}
          />
          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, pb: 0.25 }}>
            <Tooltip title="Carica file o PDF">
              <span>
                <IconButton
                  onClick={() => fileRef.current?.click()}
                  disabled={ingesting}
                  aria-label="Carica file"
                  size="small"
                  sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                >
                  <AttachFileOutlinedIcon
                    sx={{ fontSize: 'var(--md-sys-icon-size-md, 20px)' }}
                  />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={ingesting ? 'Analisi in corso…' : 'Invia (Ctrl+Invio)'}>
              <span>
                <IconButton
                  onClick={handleSubmit}
                  disabled={ingesting || !text.trim()}
                  aria-label={ingesting ? 'Analisi in corso' : 'Analizza contenuto'}
                  size="small"
                  sx={{
                    color: text.trim()
                      ? 'var(--md-sys-color-primary)'
                      : 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  {ingesting
                    ? <CircularProgress size={16} color="inherit" aria-label="Analisi in corso" />
                    : <SendOutlinedIcon sx={{ fontSize: 'var(--md-sys-icon-size-md, 20px)' }} />
                  }
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </M3Surface>

      {/* ── Jarvis suggestion block ─────────────────────────────────────── */}
      {suggestedEntry && (
        <Box
          sx={{
            px:         0.5,
            transition: 'opacity 400ms ease',
            opacity:    proactiveIdle ? 1 : 0.65,
          }}
        >
          <Typography
            variant="labelSmall"
            sx={{
              color:         proactiveIdle
                ? 'var(--md-sys-color-primary)'
                : 'var(--md-sys-color-on-surface-variant)',
              letterSpacing: '0.06em',
              transition:    'color 300ms',
            }}
          >
            {proactiveIdle ? 'Jarvis suggerisce' : 'Suggerito'}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            noWrap
          >
            {getProactiveReason(suggestedEntry)}: {suggestedEntry.label}
          </Typography>
        </Box>
      )}

      {/* ── Content list ────────────────────────────────────────────────── */}
      <M3Surface
        elevation={1}
        sx={{ borderRadius: 2, overflow: 'hidden', flexGrow: 1 }}
        aria-label="Lista contenuti recenti — clicca per aprire le azioni"
      >
        {entries.length === 0 ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ py: 5, px: 3 }}
          >
            <Typography
              variant="body2"
              sx={{
                color:     'var(--md-sys-color-on-surface-variant)',
                textAlign: 'center',
                mb:        1.5,
              }}
            >
              Incolla o trascina contenuti
            </Typography>
            <Button
              size="small"
              variant="text"
              onClick={() => inputRef.current?.focus()}
              aria-label="Inizia ad inserire contenuto"
              sx={{ borderRadius: 8 }}
            >
              Inizia
            </Button>
          </Stack>
        ) : (
          <List disablePadding aria-label="Contenuti recenti">
            {entries.map((entry, idx) => (
              <React.Fragment key={entry.id}>
                {idx > 0 && <Divider component="li" sx={{ opacity: 0.4 }} />}
                <ListItemButton
                  ref={idx === 0 ? (el) => { latestEntryAnchorRef.current = el; } : undefined}
                  onClick={e => { void handleEntryClick(entry, e.currentTarget); }}
                  disabled={!!(loadingEntryId && loadingEntryId !== entry.id)}
                  aria-label={[
                    entry.label,
                    DOMAIN_LABEL[entry.domain] ?? entry.domain,
                    relativeTime(entry.enteredAt),
                  ].join(' — ')}
                  sx={{
                    px: 2,
                    py: 0.625,
                    borderLeft: entry.id === suggestedEntry?.id && proactiveIdle
                      ? `3px solid ${DOMAIN_CHIP_COLOR[entry.domain] ?? 'var(--md-sys-color-primary)'}`
                      : '3px solid transparent',
                    transition: 'border-left-color 300ms ease',
                    '&:hover': {
                      backgroundColor: 'var(--md-sys-color-surface-container-low)',
                    },
                    '&:hover .jarvis-hint-icon': { opacity: 1 },
                    '&:hover .entry-timestamp': { opacity: 0.7 },
                  }}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Tooltip title={DOMAIN_LABEL[entry.domain] ?? entry.domain}>
                          <Box
                            sx={{
                              width:        6,
                              height:       6,
                              borderRadius: '50%',
                              flexShrink:   0,
                              cursor:       'help',
                              bgcolor:      DOMAIN_CHIP_COLOR[entry.domain]
                                ?? 'var(--md-sys-color-outline)',
                            }}
                            role="img"
                            aria-label={DOMAIN_LABEL[entry.domain] ?? entry.domain}
                          />
                        </Tooltip>
                        <Typography
                          variant="body2"
                          component="span"
                          sx={{ color: 'var(--md-sys-color-on-surface)', flexGrow: 1 }}
                          noWrap
                        >
                          {entry.label}
                        </Typography>
                        {loadingEntryId === entry.id ? (
                          <CircularProgress
                            size={12}
                            thickness={5}
                            aria-label="Caricamento azioni"
                            sx={{ flexShrink: 0, color: 'var(--md-sys-color-primary)' }}
                          />
                        ) : (
                          <Typography
                            className="entry-timestamp"
                            variant="caption"
                            component="span"
                            sx={{
                              color:      'var(--md-sys-color-on-surface-variant)',
                              flexShrink: 0,
                              opacity:    0,
                              transition: 'opacity 150ms',
                            }}
                          >
                            {relativeTime(entry.enteredAt)}
                          </Typography>
                        )}
                        <AutoAwesomeIcon
                          className="jarvis-hint-icon"
                          sx={{
                            fontSize:   'var(--md-sys-icon-size-xs, 14px)',
                            color:      'var(--md-sys-color-on-surface-variant)',
                            opacity:    0.3,
                            flexShrink: 0,
                            transition: 'opacity 120ms',
                          }}
                          aria-hidden
                        />
                      </Stack>
                    }
                  />
                </ListItemButton>
              </React.Fragment>
            ))}
          </List>
        )}
      </M3Surface>

      {/* ── Account linking panel ─────────────────────────────────────── */}
      <AccountLinkingPanel
        open={accountPanelOpen}
        onClose={() => setAccountPanelOpen(false)}
      />

      {/* ── InlineActionStrip — azioni assistite sticky ──────────────────── */}
      <InlineActionStrip
        context={context}
        onSelect={ctaType => {
          const action = context?.actions.find(a => a.ctaType === ctaType);
          if (action) void handleSelect(action);
        }}
        hidden={open}
      />

      {/* ── ThumbMenu (Portal-rendered, radial action wheel) ────────────── */}
      <ThumbMenu
        open={open}
        anchorEl={anchorEl}
        context={context}
        tenantId={tenantId}
        onSelect={handleSelect}
        onClose={handleClose}
      />

      {/* ── Jarvis indicator — always visible ───────────────────────────── */}
      <JarvisIndicator
        count={entries.length}
        latestEntryId={suggestedEntry?.id ?? null}
        hidden={open}
        state={jarvisState}
        onActivate={openMenu}
      />

      {/* ── Emergent skill suggestion card (compact, outside Nexus) ────────── */}
      {skillDraft && !nexusOpen && (
        <M3Surface
          elevation={2}
          aria-live="polite"
          aria-label="Jarvis suggerisce una nuova skill"
          sx={{
            position:  'fixed',
            bottom:    132,
            right:     24,
            maxWidth:  280,
            p:         1.5,
            borderRadius: 3,
            zIndex:    1199,
            bgcolor:   'var(--md-sys-color-surface-container-high)',
          }}
        >
          <Typography
            variant="labelSmall"
            component="p"
            sx={{ color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}
          >
            Jarvis suggerisce
          </Typography>
          <Typography
            variant="bodySmall"
            component="p"
            sx={{ mt: 0.5, color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            Hai eseguito spesso «{autoName(skillDraft.ctaType)}» ({skillDraft.count}×).
            Vuoi salvarla come skill personalizzata?
          </Typography>
          <Stack direction="row" spacing={1} mt={1}>
            <Button
              size="small"
              variant="contained"
              onClick={handleConfirmSkill}
              aria-label="Conferma creazione skill emergente"
            >
              Crea
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={dismissSkill}
              aria-label="Ignora suggerimento skill emergente"
            >
              Ignora
            </Button>
          </Stack>
        </M3Surface>
      )}

      {/* ── JarvisNexus — cinematic right-panel command center ─────────────── */}
      <JarvisNexus
        open={nexusOpen}
        onClose={() => setNexusOpen(false)}
        tenantId={tenantId}
        nexusState={nexusState}
        stealthCount={asStealthCount}
        autoFiredCount={asAutoFiredCount}
        ambientFiredCount={asAmbientFiredCount}
        presenceLevel={nexusPresenceLevel}
        agentMotionMultiplier={dominantPersonality?.motionMultiplier}
        agentColorShift={dominantPersonality?.colorShift}
        attentionMap={attentionMap}
        coordinationLabel={coordinationLabel}
        pending={asPending}
        appliedIds={asAppliedIds}
        onApplyDelta={handleApplyDelta}
        onDismissDelta={handleDismissDelta}
        skillDraft={skillDraft}
        onConfirmSkill={handleConfirmSkill}
        onDismissSkill={dismissSkill}
        flows={activeFlows}
        onRunFlow={handleRunFlow}
        onRemoveFlow={handleRemoveFlow}
      />

      {/* ── Jarvis auto-execute banner ────────────────────────────────── */}
      {autoToastLabel && (
        <M3Surface
          elevation={3}
          aria-live="assertive"
          aria-label={`Jarvis: ${autoToastLabel}`}
          sx={{
            position:   'fixed',
            top:        16,
            left:       '50%',
            transform:  'translateX(-50%)',
            px:         2.5,
            py:         1,
            borderRadius: 8,
            zIndex:     1400,
            bgcolor:    'var(--md-sys-color-primary-container)',
            display:    'flex',
            alignItems: 'center',
            gap:        1,
            animation:  'jarvisBannerIn 220ms ease-out',
            '@keyframes jarvisBannerIn': {
              from: { opacity: 0, transform: 'translateX(-50%) translateY(-10px)' },
              to:   { opacity: 1, transform: 'translateX(-50%) translateY(0)' },
            },
          }}
        >
          <AutoAwesomeIcon
            sx={{ fontSize: 'var(--md-sys-icon-size-sm, 18px)', color: 'var(--md-sys-color-primary)' }}
            aria-hidden
          />
          <Typography
            variant="labelMedium"
            sx={{ color: 'var(--md-sys-color-on-primary-container)', whiteSpace: 'nowrap' }}
          >
            {autoToastLabel}
          </Typography>
        </M3Surface>
      )}

      {/* ── Landing overlays (Orbit fullscreen context views) ─────────────── */}
      {activeLanding === 'schedule' && (
        <Box
          sx={{
            animation: 'orbitIn 200ms ease-out',
            '@keyframes orbitIn': {
              from: { opacity: 0, transform: 'scale(0.985)' },
              to:   { opacity: 1, transform: 'scale(1)' },
            },
          }}
        >
          <ScheduleLanding
            onClose={() => setActiveLanding(null)}
            onNavigate={(type, ctx) => { setLandingCtx(ctx); setActiveLanding(type); }}
            ctx={landingCtx}
          />
        </Box>
      )}
      {activeLanding === 'class' && (
        <Box
          sx={{
            animation: 'orbitIn 200ms ease-out',
            '@keyframes orbitIn': {
              from: { opacity: 0, transform: 'scale(0.985)' },
              to:   { opacity: 1, transform: 'scale(1)' },
            },
          }}
        >
          <ClassLanding
            onClose={() => setActiveLanding(null)}
            onNavigate={(type, ctx) => { setLandingCtx(ctx); setActiveLanding(type); }}
            ctx={landingCtx}
          />
        </Box>
      )}
      {activeLanding === 'lesson' && (
        <Box
          sx={{
            animation: 'orbitIn 200ms ease-out',
            '@keyframes orbitIn': {
              from: { opacity: 0, transform: 'scale(0.985)' },
              to:   { opacity: 1, transform: 'scale(1)' },
            },
          }}
        >
          <LessonLanding
            onClose={() => setActiveLanding(null)}
            ctx={landingCtx}
            context={context}
          />
        </Box>
      )}
      {activeLanding === 'settings' && (
        <Box
          sx={{
            position:    'fixed',
            inset:       0,
            zIndex:      1600,
            animation:   'orbitIn 180ms ease-out',
            '@keyframes orbitIn': {
              from: { opacity: 0, transform: 'scale(0.98)' },
              to:   { opacity: 1, transform: 'scale(1)' },
            },
          }}
        >
          <SettingsLanding
            onClose={() => setActiveLanding(null)}
            tenantId={tenantId}
          />
        </Box>
      )}

      {/* ── Simulation Engine demo panel ────────────────────────────── */}
      <SimulationPanel tenantId={tenantId} />
    </M3Surface>
  );
}

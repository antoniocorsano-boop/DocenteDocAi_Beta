/**
 * DesktopWorkspace.tsx — Shell premium per modalità desktop (≥ 1024px).
 *
 * Architettura:
 *
 *   ┌─────────────────────────────────────────────────────┐
 *   │ ContextBar — data, classe, countdown, ⌘K hint       │  56 px
 *   ├──────────────────────────────────┬──────────────────┤
 *   │                                  │                  │
 *   │  SplitView.primary               │  JarvisDock      │
 *   │    UserWorkspace                 │  260 px          │
 *   │    (scroll)                      │                  │
 *   │                                  │                  │
 *   └──────────────────────────────────┴──────────────────┘
 *
 *   FocusMode: sovrascrive tutto, mostra solo il contenuto primario.
 *   CommandPalette: overlay fullscreen, attivato con Ctrl+K.
 *
 * Non-goals:
 *   - Non duplica la logica di UserWorkspace.
 *   - Non gestisce il lifecycle degli entry cognitivi.
 *
 * MD3 Gold Compliant:
 *   - nessun <div> visivo → Box/M3Surface
 *   - colori via var(--md-sys-color-*)
 *   - fontWeight via var(--md-sys-typescale-weight-*)
 *   - aria-label su ogni elemento interattivo
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Box from '@mui/material/Box';

import ContextBar       from '../ui/ContextBar';
import JarvisDock       from '../ui/JarvisDock';
import CommandPalette   from '../ui/CommandPalette';
import SplitView        from '../ui/SplitView';
import FocusMode        from '../ui/FocusMode';
import UserWorkspace          from './UserWorkspace';
import { WorkspaceErrorBoundary } from './WorkspaceErrorBoundary';
import ScheduleLanding  from '../landing/ScheduleLanding';

import { buildContext, executeAction, getAutomationLevel } from '../../modules/orchestration/orchestrationService';
import { useCognitiveStore }  from '../../modules/cognitiveLayer/cognitiveStore';
import { tenantRegistry }     from '../../services/tenant/tenantRegistry';
import { useUIStore }         from '../../stores/useUIStore';
import type { OrchestrationAction, OrchestrationContext } from '../../modules/orchestration/types';

// ─── Global dock actions (no entry needed) ────────────────────────────────────

const DOCK_GLOBAL_ACTIONS: OrchestrationAction[] = [
  {
    id:       'global-schedule',
    label:    'Vedi agenda',
    priority: 1,
    ctaType:  'view-schedule',
    domain:   'pedagogical',
  },
  {
    id:       'global-cmd',
    label:    'Cerca comando…',
    priority: 2,
    ctaType:  'open-command-palette',
    domain:   'pedagogical',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DesktopWorkspace(): React.JSX.Element {
  const showToast   = useUIStore(s => s.actions.showToast);
  const [tenantId]  = useState(() => tenantRegistry.getContext().tenantId);

  // ── Cognitive entries ──────────────────────────────────────────────────────
  const entryCount = useCognitiveStore(s =>
    s.listRecent(1, tenantId).length,
  );
  const latestEntryId = useCognitiveStore(s =>
    s.listRecent(1, tenantId)[0]?.id ?? null,
  );

  // ── Desktop-local panel state ──────────────────────────────────────────────
  const [scheduleOpen,  setScheduleOpen]  = useState(false);
  const [cmdOpen,       setCmdOpen]       = useState(false);
  const [focusMode,     setFocusMode]     = useState(false);

  // Dock state derived from entry count + building state
  const [dockBuilding, setDockBuilding] = useState(false);
  const dockState: 'idle' | 'suggestion' | 'active' | 'processing' =
    dockBuilding    ? 'processing'
    : entryCount > 0 ? 'suggestion'
    : 'idle';

  // Synthetic dock context (global actions). No per-entry context here.
  const dockContext = useMemo<OrchestrationContext>(() => ({
    inputId:      'global',
    suggestions:  [],
    actions:      DOCK_GLOBAL_ACTIONS,
    capabilities: [],
    trustStatus:  'verified',
  }), []);

  const dockHint = entryCount > 0
    ? `${entryCount} element${entryCount === 1 ? 'o' : 'i'} da elaborare`
    : undefined;

  // ── Ctrl+K global shortcut ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // ── JarvisDock action handler ──────────────────────────────────────────────
  const handleDockAction = useCallback((action: OrchestrationAction) => {
    switch (action.ctaType) {
      case 'open-command-palette':
        setCmdOpen(true);
        return;
      case 'view-schedule':
        setScheduleOpen(true);
        return;
      default:
        // Try to execute against latest entry
        if (!latestEntryId) {
          showToast('Nessuna nota recente — aggiungi un contenuto prima.', 'info');
          return;
        }
        void executeActionForEntry(latestEntryId, action.ctaType);
    }
  }, [latestEntryId, showToast]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── CommandPalette execution ───────────────────────────────────────────────
  const handlePaletteExecute = useCallback(async (ctaType: string) => {
    setCmdOpen(false);

    if (!latestEntryId) {
      showToast('Nessuna nota — aggiungi contenuto per eseguire comandi.', 'info');
      return;
    }

    await executeActionForEntry(latestEntryId, ctaType);
  }, [latestEntryId, showToast]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Shared action executor (by entryId + ctaType) ─────────────────────────
  async function executeActionForEntry(entryId: string, ctaType: string): Promise<void> {
    setDockBuilding(true);
    try {
      const ctx = tenantRegistry.getContext();
      const orchCtx = await buildContext(entryId, {
        tenantId: ctx.tenantId,
        role:     ctx.role,
      });
      if (!orchCtx) {
        showToast('Impossibile costruire il contesto per questa azione.', 'error');
        return;
      }
      const action = orchCtx.actions.find(a => a.ctaType === ctaType);
      if (!action) {
        showToast('Azione non disponibile per il contenuto corrente.', 'info');
        return;
      }
      // Auto-execute only if confidence warrants it
      if (getAutomationLevel(action.ctaType) === 'auto' || getAutomationLevel(action.ctaType) === 'assisted') {
        const suggestion = orchCtx.suggestions.find(s =>
          s.id === action.id || s.ctaType === action.ctaType,
        ) ?? orchCtx.suggestions[0];
        if (suggestion) {
          const result = await executeAction(action.ctaType, suggestion, {
            tenantId: ctx.tenantId,
            role:     ctx.role,
          });
          showToast(
            result.success
              ? `Completato: ${action.label}`
              : (result.reason ?? 'Errore durante l\'esecuzione.'),
            result.success ? 'success' : 'error',
          );
        }
      } else {
        showToast(`Apri la nota per eseguire: ${action.label}`, 'info');
      }
    } finally {
      setDockBuilding(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Schedule panel (SplitView secondary)
  const schedulePrimary = (
    <WorkspaceErrorBoundary label="desktop-schedule">
      <UserWorkspace />
    </WorkspaceErrorBoundary>
  );
  const schedulePanel   = scheduleOpen
    ? <ScheduleLanding
        onClose={() => setScheduleOpen(false)}
        onNavigate={(_type, _ctx) => { setScheduleOpen(false); }}
      />
    : undefined;

  return (
    <FocusMode active={focusMode} onExit={() => setFocusMode(false)}>
      <Box
        sx={{
          display:        'flex',
          flexDirection:  'column',
          height:         '100dvh',
          overflow:       'hidden',
          bgcolor:        'var(--md-sys-color-background)',
        }}
      >
        {/* ── Header bar ─────────────────────────────────────────────── */}
        {!focusMode && (
          <ContextBar onOpenSchedule={() => setScheduleOpen(prev => !prev)} />
        )}

        {/* ── Main body ──────────────────────────────────────────────── */}
        <Box
          sx={{
            display:  'flex',
            flexGrow: 1,
            overflow: 'hidden',
          }}
        >
          {/* Centre — SplitView (schedule panel optional) */}
          <SplitView
            primary={schedulePrimary}
            secondary={schedulePanel}
            onCloseSecondary={() => setScheduleOpen(false)}
            defaultSplitPct={58}
          />

          {/* Right — JarvisDock (collapsed in FocusMode) */}
          {!focusMode && (
            <JarvisDock
              state={dockState}
              context={dockContext}
              hint={dockHint}
              onAction={handleDockAction}
              collapsed={false}
            />
          )}
          {focusMode && (
            <Box sx={{ position: 'fixed', bottom: 24, right: 80, zIndex: 1500 }}>
              <JarvisDock
                state={dockState}
                context={dockContext}
                onAction={handleDockAction}
                collapsed
              />
            </Box>
          )}
        </Box>

        {/* ── Command Palette overlay ─────────────────────────────────── */}
        <CommandPalette
          open={cmdOpen}
          onClose={() => setCmdOpen(false)}
          onExecute={ctaType => { void handlePaletteExecute(ctaType); }}
        />
      </Box>
    </FocusMode>
  );
}

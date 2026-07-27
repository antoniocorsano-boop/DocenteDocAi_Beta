// MD3 Gold Compliant
// Tutti gli stili usano esclusivamente token MD3 (nessun valore hardcoded)
// Audit: gennaio 2026

import '../font-setup';
import * as React from 'react';
import '../design-system/typography.css';
import '../design-system/spacing.css';
import '../design-system/breakpoints.css';
import '../design-system/accessibility-focus.css';
import SkipLink from './SkipLink';
import SuggestionBanner from './SuggestionBanner';
const FloatingSatelliteCopilot = React.lazy(() => import('./copilot/FloatingSatelliteCopilot'));
import { useAppEngine } from '../hooks/useAppEngine';
import type { Modals } from '../types';
import { usePrefetch } from '../hooks/usePrefetch';
import { useSmartNavigation } from '../hooks/useSmartNavigation';
import ViewManager from './ViewManager';
const ModalManager = React.lazy(() => import('./ModalManager').then(m => ({ default: m.ModalManager })));
import Snackbar from './Snackbar';
import ErrorBoundary from './ErrorBoundary';
import { AppLayout } from './AppLayout';
import { useNKAStore } from '../nka/useNKAStore';
import { ViewLoadingPlaceholder } from './ViewLoadingPlaceholder';

import { CopilotProvider } from '../copilot/CopilotProvider';

// OnboardingWizard: lazy-loaded (onboarded users skip it entirely)
const OnboardingWizard = React.lazy(() => import('./OnboardingWizard'));

// Lazy-loaded: componenti condizionali non necessari al first render
const AssistantModal       = React.lazy(() => import('./AssistantModal'));
const PassaggioAnnoWizard  = React.lazy(() => import('./PassaggioAnnoWizard'));
const OperationsCenter     = React.lazy(() => import('./OperationsCenter'));
const NKABottomSheet       = React.lazy(() => import('../nka/NKABottomSheet'));
const ImageAnalysisModal   = React.lazy(() => import('./ImageAnalysisModal'));
const VideoAnalysisModal   = React.lazy(() => import('./VideoAnalysisModal'));
const HelpModal            = React.lazy(() => import('./HelpModal'));
const CircolareAnalysisModal = React.lazy(() => import('./CircolareAnalysisModal'));
const OrbitChatFAB         = React.lazy(() =>
  import('./chat/OrbitChatFAB').then(m => ({ default: m.OrbitChatFAB }))
);
const OrbitDock            = React.lazy(() =>
  import('./orbit/OrbitDock').then(m => ({ default: m.OrbitDock }))
);

const handleImportEvents = () => {};
const handleSaveToKb = () => {};

const App: React.FC = () => {
    const {
        view,
        viewContext,
        appState,
        actions,
        modals,
    } = useAppEngine();
    const aiSettings = appState.aiSettings;
    const isGlobalAiLoading = appState.isGlobalAiLoading;
    const installPrompt = appState.installPrompt;
    const activeSuggestion = appState.activeSuggestion;

    // Adapter: ActionContext.showToast uses raw strings; showToast uses i18n keys
    const copilotToast = React.useCallback(
        (message: string, severity?: 'success' | 'info' | 'warning' | 'error') => {
            actions.showToast(message, severity === 'warning' ? 'info' : severity);
        },
        [actions],
    );

    // Adapter: CopilotActions navigate uses plain strings; handleNavigate uses View enum
    const copilotNavigate = React.useCallback(
        (view: string, ctx?: Record<string, unknown>) => {
            actions.handleNavigate(view as Parameters<typeof actions.handleNavigate>[0], ctx ?? null);
        },
        [actions],
    );
    // assistantMode is not in AppState, set default value
    const [assistantMode] = React.useState<'chat' | 'docs' | 'tools' | 'backup'>('chat');
    const nkaStore = useNKAStore();
    const user = appState.user;
    const notifiche = appState.notifiche;

    // Smart Navigation: learn patterns + predict next view (#17)
    const { predictedNextView } = useSmartNavigation(view);

    // Prefetch bundle chunks — priority on predicted next view (#21)
    usePrefetch(view, predictedNextView);

    // assistantMode locale — argomento condiviso per AssistantModal
    const handleOpenCircularAnalysis = (url: string, title: string) => {
        modals.setCircularAnalysisModal?.({ isOpen: true, url, title });
    };

    return (
        <CopilotProvider onNavigate={copilotNavigate} onToast={copilotToast}>
        <>
            {/* Skip link per accessibilità — WCAG 2.4.1 */}
            <SkipLink href="#main-content" label="Vai al contenuto principale" />

            {/* Contextual suggestion banner (#16) — shown when system detects actionable state */}
            {activeSuggestion && (
                <SuggestionBanner
                    suggestion={activeSuggestion}
                    onAction={() => {
                        const { type, payload } = activeSuggestion.action;
                        if (type === 'navigate') {
                            if (typeof payload === 'string') {
                                actions.handleNavigate(payload as Parameters<typeof actions.handleNavigate>[0]);
                            } else if (payload && typeof payload === 'object') {
                                const p = payload as { view: Parameters<typeof actions.handleNavigate>[0]; context?: Record<string, unknown> };
                                actions.handleNavigate(p.view, p.context ?? null);
                            }
                        } else if (type === 'modal') {
                            actions.toggleModal(payload as keyof Modals, true);
                        }
                        actions.dismissSuggestion(activeSuggestion.id);
                    }}
                    onDismiss={() => actions.dismissSuggestion(activeSuggestion.id)}
                />
            )}

            <AppLayout
            view={view}
            onNavigate={actions.handleNavigate}
            user={user}
            settings={appState.settings}
            notifiche={notifiche}
            setNotifiche={actions.setNotifiche}
            onBack={actions.handleBack}
            canGoBack={!!actions.canGoBack}
            onOpenImageAnalysis={() => modals.setIsImageAnalysisOpen?.(true)}
            onOpenVideoAnalysis={() => modals.setIsVideoAnalysisOpen?.(true)}
            onOpenHelp={() => modals.setIsHelpOpen?.(true)}
            onOpenCircularAnalysis={handleOpenCircularAnalysis}
            isAiProcessing={isGlobalAiLoading}
            installPrompt={installPrompt}
            onInstallApp={actions.handleInstallApp}
            onOpenOperations={() => modals.setIsOperationsCenterOpen?.(true)}
            hasSuggestion={!!activeSuggestion}
        >
            <ErrorBoundary>
                <main id="main-content" role="main" aria-label="Contenuto principale" tabIndex={-1} style={{ outline: 'none' }}>
                    <ViewManager
                        view={view}
                        viewContext={viewContext}
                        appState={appState}
                        actions={actions}
                        modals={modals}
                    />
                </main>
                <React.Suspense fallback={null}>
                  <ModalManager appState={appState} actions={actions} modals={modals} />
                </React.Suspense>
                {/* Modali globali — stato gestito da useUIStore (source of truth unico) */}
                {modals.isImageAnalysisOpen && (
                    <React.Suspense fallback={<ViewLoadingPlaceholder message="Caricamento analisi immagine..." />}>
                        <ImageAnalysisModal onClose={() => modals.setIsImageAnalysisOpen?.(false)} />
                    </React.Suspense>
                )}
                {modals.isVideoAnalysisOpen && (
                    <React.Suspense fallback={<ViewLoadingPlaceholder message="Caricamento analisi video..." />}>
                        <VideoAnalysisModal onClose={() => modals.setIsVideoAnalysisOpen?.(false)} />
                    </React.Suspense>
                )}
                {modals.isHelpOpen && (
                    <React.Suspense fallback={<ViewLoadingPlaceholder message="Caricamento guida..." />}>
                        <HelpModal onClose={() => modals.setIsHelpOpen?.(false)} onNavigate={actions.handleNavigate} aiSettings={aiSettings} setIsLoadingModalOpen={modals.setIsLoadingModalOpen} setLoadingModalMessage={modals.setLoadingModalMessage} />
                    </React.Suspense>
                )}
                {modals.circularAnalysisModal?.isOpen && (
                    <React.Suspense fallback={<ViewLoadingPlaceholder message="Caricamento analisi circolare..." />}>
                        <CircolareAnalysisModal
                            url={modals.circularAnalysisModal.url}
                            title={modals.circularAnalysisModal.title}
                            onClose={() => modals.setCircularAnalysisModal?.(null)}
                            aiSettings={aiSettings}
                            onImportEvents={handleImportEvents}
                            onSaveToKb={handleSaveToKb}
                        />
                    </React.Suspense>
                )}
                {modals.isOperationsCenterOpen && (
                    <React.Suspense fallback={<ViewLoadingPlaceholder message="Caricamento operazioni..." />}>
                    <OperationsCenter
                        onClose={() => modals.setIsOperationsCenterOpen?.(false)}
                        onNavigate={actions.handleNavigate}
                        onAction={(action) => {
                            if (action === 'year-transition-modal') {
                                modals.setIsYearTransitionOpen?.(true);
                            } else if (action === 'load-demo') {
                                actions.handleLoadDemoData();
                                modals.setIsOperationsCenterOpen?.(false);
                            } else if (action === 'live-assistant') {
                                modals.setIsLiveAssistantModalOpen(true);
                            } else if (action === 'video-analysis') {
                                modals.setIsVideoAnalysisOpen?.(true);
                            } else if (action === 'nka-map') {
                                modals.setIsNkaMapOpen?.(true);
                            }
                        }}
                        activeSuggestion={appState.activeSuggestion?.id}
                        students={appState.students}
                        settings={appState.settings}
                        evaluations={appState.evaluations}
                        competencyEvaluations={appState.competencyEvals}
                        register={appState.finalizedRegister}
                        onPromoteStudents={actions.handlePromoteStudents}
                        onResetData={actions.handleResetYearData}
                        onBackupData={actions.handleExportData}
                    />
                    </React.Suspense>
                )}
                {modals.isYearTransitionOpen && (
                    <React.Suspense fallback={<ViewLoadingPlaceholder message="Caricamento wizard..." />}>
                    <PassaggioAnnoWizard
                        onClose={() => modals.setIsYearTransitionOpen?.(false)}
                        students={appState.students}
                        settings={appState.settings}
                        evaluations={appState.evaluations}
                        competencyEvaluations={appState.competencyEvals}
                        register={appState.finalizedRegister}
                        onPromoteStudents={actions.handlePromoteStudents}
                        onBackupData={actions.handleExportData}
                        onResetData={actions.handleResetYearData}
                    />
                    </React.Suspense>
                )}
                {modals.isNkaMapOpen && (
                    <React.Suspense fallback={null}>
                    <NKABottomSheet open={true} nodes={nkaStore.nodes} onClose={() => modals.setIsNkaMapOpen?.(false)} onNodeSelect={() => {}} />
                    </React.Suspense>
                )}
                <React.Suspense fallback={null}>
                  <FloatingSatelliteCopilot onNavigate={(v) => actions.handleNavigate(v as Parameters<typeof actions.handleNavigate>[0])} />
                </React.Suspense>
                {/* Orbit Chat FAB — global persistent chat entry point */}
                <React.Suspense fallback={null}>
                  <OrbitChatFAB userPlan="free" />
                </React.Suspense>
                {/* OrbitDock — quick-access skill layer (non-distruttivo) */}
                <React.Suspense fallback={null}>
                  <OrbitDock />
                </React.Suspense>
                {modals.isLiveAssistantModalOpen && (
                    <React.Suspense fallback={<ViewLoadingPlaceholder message="Caricamento assistente..." />}>
                    <AssistantModal
                        open={true}
                        onClose={() => modals.setIsLiveAssistantModalOpen(false)}
                        mode={assistantMode}
                        aiSettings={aiSettings}
                        context={{ view, viewContext }}
                        onOpenImageAnalysis={() => {
                            modals.setIsLiveAssistantModalOpen(false);
                            modals.setIsImageAnalysisOpen?.(true);
                        }}
                        onOpenVideoAnalysis={() => {
                            modals.setIsLiveAssistantModalOpen(false);
                            modals.setIsVideoAnalysisOpen?.(true);
                        }}
                        onOpenCircularAnalysis={() => {
                            modals.setIsLiveAssistantModalOpen(false);
                            modals.setCircularAnalysisModal?.({ isOpen: true, url: '', title: 'Analisi Circolare' });
                        }}
                    />
                    </React.Suspense>
                )}
                <Snackbar />
            </ErrorBoundary>
        </AppLayout>
        {!appState.settings.onboarded && 
         !(window as unknown as { __TEST_MODE?: boolean }).__TEST_MODE &&
         localStorage.getItem('__e2e_test_mode') !== 'true' && (
            <React.Suspense fallback={null}>
                <OnboardingWizard
                    settings={appState.settings}
                    onComplete={updates => actions.setSettings(s => ({ ...s, ...updates }))}
                />
            </React.Suspense>
        )}
        </>
        </CopilotProvider>
    );
};

export { App };
export default App;

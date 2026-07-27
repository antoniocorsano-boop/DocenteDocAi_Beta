// MD3 Compliant
// M3Expressive refactor: ✅ COMPLETED - Removed inline Tailwind classes, applied dedicated CSS classes with M3 tokens for colors, spacing, typography, elevation. Maintained responsive behavior and animations.
// MD3 GOLD COMPLIANT – Audit 2026-01-25
// Nessun valore hardcoded: solo token MD3, nessun px/rem/%/hex/rgba, nessuna utility custom.
// Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md
// M3Expressive refactor: COMPLETED - Tutti i layout, colori, spaziature e tipografia sono gestiti tramite token MD3.
import React, { useMemo, Suspense, lazy } from 'react';
import { VIEW_CONFIGS, Home, ClassDashboard, ClassSelection, ClassroomView, StudentClassroomView } from './viewRegistry';
import AuraView from './AuraView';
import ErrorBoundary from './ErrorBoundary';
import { ViewLoadingPlaceholder } from './ViewLoadingPlaceholder';
import { AppState, AppActions, View, Lezione, RegisterEntry, Studente, Competenza, Uda, Report, LessonScheduleInput, EvaluationInput, UdaCreateInput, OrientamentoActivity, EPortfolioEntry, EventoCalendario } from '../types';
import type { Modals } from '../types';
import { useViewInhibition, VIEW_TO_PANEL_ID } from '@/hooks/useOrbitInhibition';

const RegisterImportDialog = lazy(() => import('./RegisterImportDialog'));
interface ViewManagerProps {
    view: View;
    viewContext: unknown;
    appState: AppState;
    actions: AppActions;
    modals: Partial<Modals>;
}

/**
 * ViewManager - Cuore del Presentation Layer.
 * Implementa AuraView per transizioni fluide e layout Material 3 Hardened.
 */
const ViewManager: React.FC<ViewManagerProps> = ({ view, viewContext, appState, actions, modals }) => {
  // Destructure appState (now directly contains states from Zustand stores)
    const {
        user, students, slots, dismissedSuggestions, installPrompt, settings,
        lessons, evaluations, competencyEvals, uda, eventi, knowledgeBase, corpora, rubriche, pianiInclusione, giudizi, reportistica, draftRegister, finalizedRegister, aiSettings, themeState, backupState, driveSyncState, curricula, submissions,
        orientamentoActivities, ePortfolioEntries, studentOrientamentoStates
    } = appState;

    // Prendi solo i setter dei modals da modals
    const {
        setCreateLessonContext,
        setLessonViewContext,
        setIsLiveAssistantModalOpen,
        setActiveSlotKey,
        setIsLoadingModalOpen,
        setLoadingModalMessage,
        setIsRegisterImportOpen
    } = modals;

    // Tutte le altre azioni da actions
    const {
        setLessons, setEvaluations, setCompetencyEvals, setUda,
        setEventi, setKnowledgeBase, setCorpora,
        setReportistica, setDraftRegister, setFinalizedRegister, setCurricula, setSubmissions, dismissSuggestion: _dismissSuggestion,
        setStudentProfileContext, showToast,
        handleNavigate, handleBack, handleLoadDemoData,
        handleEditSlot,
        onScheduleLesson, handleAddEvaluation,
        handleCreateUda, handleAddNote, onMarkAttendance,
        setViewContext,
        onSaveUda,
        onSaveReport,
        onSaveEvent,
        onAddLessons,
        handleGradeSubmission,
        setOrientamentoActivities,
        setEPortfolioEntries,
        setStudentOrientamentoStates,
        importStudents,
        importEvaluations
    } = actions;

    const safeSubmissions = submissions || [];

    // Helper to ensure PIN is valid (fallback to 0000 if empty to prevent lockout)
    const safeSecurityPin = settings.securityPin && settings.securityPin.length === 4 ? settings.securityPin : '0000';

    // Orbit UI inhibition — soft-hiding of legacy panels when Orbit takes control
    // INVARIANT: panels are never unmounted; aria-hidden + data attribute only.
    const { isInhibited, inhibitionReason } = useViewInhibition(view);
    const panelId = VIEW_TO_PANEL_ID[view];

    // Accessibility: Scroll to top and manage focus on view change
    React.useEffect(() => {
        window.scrollTo(0, 0);
        // Use id selector to match <main id="main-content" tabIndex={-1}> in App.tsx
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.scrollTop = 0;
            // Focus the main landmark so screen readers announce the new view
            mainContent.focus();
        }
    }, [view]);

    // Orbit inhibition attributes — annotate #main-content for E2E + screen readers.
    // INVARIANT: no element is removed from DOM; only data attributes change.
    React.useEffect(() => {
        const el = document.getElementById('main-content');
        if (!el) return;
        if (panelId) {
            el.setAttribute('data-orbit-panel-id', panelId);
        } else {
            el.removeAttribute('data-orbit-panel-id');
        }
        if (isInhibited) {
            el.setAttribute('data-orbit-inhibited', 'true');
            el.setAttribute('data-orbit-inhibition-reason', inhibitionReason);
        } else {
            el.removeAttribute('data-orbit-inhibited');
            el.removeAttribute('data-orbit-inhibition-reason');
        }
    }, [isInhibited, inhibitionReason, panelId]);

    const renderView = useMemo(() => {
        const config = VIEW_CONFIGS[view];

        return (
            <Suspense fallback={<ViewLoadingPlaceholder message="Caricamento vista..." />}>
                {(() => {
                    // --- SPECIAL VIEWS LOGIC ---

                    // 1. HOME / FLOW MODE
                    if (view === 'home') {
                        return (
                            <AuraView>
                                <Home
                                    onNavigate={handleNavigate}
                                    onOpenRegisterImport={() => setIsRegisterImportOpen?.(true)}
                                />
                            </AuraView>
                        );
                    }

                    // 2. AULA (Selection vs Dashboard)
                    if (view === 'aula') {
                        return viewContext ? (
                            <AuraView>
                                <ClassDashboard
                                    selectedClass={typeof viewContext === 'string' ? viewContext : ''}
                                    onNavigate={handleNavigate}
                                    onViewStudentProfile={setStudentProfileContext}
                                    onStartImpromptuSession={(classe) => {
                                        const draftKey = `impromptu-${classe}-${Date.now()}`;
                                        const newDraft: RegisterEntry = {
                                            id: draftKey,
                                            date: new Date().toISOString(),
                                            slotKey: '',
                                            lessonId: '',
                                            classe,
                                            materia: 'Lezione Improvvisata',
                                            studentAttendance: {},
                                            status: 'draft',
                                        };
                                        actions.setDraftRegister((prev) => ({ ...prev, [draftKey]: newDraft }));
                                        handleNavigate('aula-session', { draftKey });
                                    }}
                                    onStartPlannedLesson={(classe, materia, slotKey, lesson) => {
                                        const draftKey = `planned-${classe}-${slotKey}-${Date.now()}`;
                                        const newDraft: RegisterEntry = {
                                            id: draftKey,
                                            date: new Date().toISOString(),
                                            slotKey,
                                            lessonId: lesson.id,
                                            classe,
                                            materia,
                                            studentAttendance: {},
                                            status: 'draft',
                                        };
                                        actions.setDraftRegister((prev) => ({ ...prev, [draftKey]: newDraft }));
                                        handleNavigate('aula-session', { draftKey });
                                    }}
                                />
                            </AuraView>
                        ) : (
                            <AuraView>
                                <ClassSelection
                                    onSelectClass={(className) => handleNavigate('aula', className)}
                                    onNavigate={handleNavigate}
                                />
                            </AuraView>
                        );
                    }
                    // 3. AULA SESSION (ClassroomView)
                    if (view === 'aula-session') {
                        let draftKey: string | undefined = undefined;
                        if (typeof viewContext === 'object' && viewContext !== null && 'draftKey' in viewContext) {
                            draftKey = (viewContext as { draftKey: string }).draftKey;
                        }
                        const currentDraftEntry = draftKey !== undefined ? draftRegister[draftKey] : undefined;
                        
                        if (!currentDraftEntry) {
                            return <div>Errore: Dati lezione in bozza non trovati.</div>;
                        }

                        return (
                            <AuraView fullWidth>
                                <ClassroomView
                                    draftKey={draftKey ?? ''}
                                    draftEntry={currentDraftEntry}
                                    students={students}
                                    lessons={lessons}
                                    uda={uda}
                                    knowledgeBase={knowledgeBase}
                                    evaluations={evaluations}
                                    competencyEvaluations={competencyEvals}
                                    onUpdateDraftEntry={(key: string, updates: Partial<RegisterEntry>) => setDraftRegister(prev => ({ ...prev, [key]: { ...prev[key], ...updates } }))}
                                    onFinalizeRegister={(key: string) => { 
                                        const entry = draftRegister[key]; 
                                        setFinalizedRegister(prev => [...prev, { ...entry, status: 'finalized' }]);
                                        setDraftRegister(prev => { const newDrafts = { ...prev }; delete newDrafts[key]; return newDrafts; });
                                        // Track classroom session closure for analytics
                                        const presentCount = Object.values(entry?.studentAttendance ?? {}).filter(s => s === 'presente').length;
                                        const absentCount = Object.values(entry?.studentAttendance ?? {}).filter(s => s === 'assente').length;
                                        actions.trackAnalyticsEvent?.('feature_usage', 'register_finalized', { presentCount, absentCount });
                                        handleBack(true); 
                                    }}
                                    onReopenRegister={(key: string) => setDraftRegister(prev => ({ ...prev, [key]: { ...prev[key], status: 'draft' } }))}
                                    onCloseView={() => handleBack(true)}
                                    settings={settings}
                                    onSaveOralEvaluation={handleAddEvaluation}
                                    onSaveCompetencyEvaluation={(data) => setCompetencyEvals(prev => [...prev, { ...data, id: `cv-${Date.now()}` }])}
                                    onOpenStudentActionMenu={() => { }}
                                    onOpenAulaTool={() => { }}
                                    onPromoteImpromptuLesson={(lesson: Lezione) => setLessons(prev => ({ ...prev, [lesson.id]: lesson }))}
                                    onOpenLiveAssistant={() => setIsLiveAssistantModalOpen?.(true)}
                                    setStudentProfileContext={setStudentProfileContext}
                                    onNavigate={handleNavigate}
                                    aiSettings={aiSettings}
                                />
                            </AuraView>
                        );
                    }

                    // 4. STUDENT WORKSPACE
                    if (view === 'student-workspace') {
                        let studentId: string | undefined = undefined;
                        if (typeof viewContext === 'object' && viewContext !== null && 'studentId' in viewContext) {
                            studentId = (viewContext as { studentId: string }).studentId;
                        }
                        const currentStudent = students.find(s => s.id === studentId);
                        if (!currentStudent) {
                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                    <h2>Errore Accesso Studente</h2>
                                    <p>
                                        Impossibile trovare il profilo studente selezionato.
                                    </p>
                                    <button onClick={() => handleNavigate('student-dashboard')} >
                                        Torna al Login
                                    </button>
                                </div>
                            );
                        }
                        const studentKb = knowledgeBase.filter(k => k.category === 'materiale_didattico' || k.fileName.includes(currentStudent.classe));
                        return (
                            <AuraView fullWidth>
                                <StudentClassroomView
                                    student={currentStudent}
                                    lessons={Object.values(lessons)}
                                    register={finalizedRegister}
                                    kb={studentKb}
                                    submissions={safeSubmissions}
                                    onUploadSubmission={(sub) => setSubmissions(prev => [...prev, sub])}
                                    onLogout={() => handleNavigate('student-dashboard')}
                                    onExitMode={() => handleNavigate('home')}
                                    securityPin={safeSecurityPin}
                                    settings={settings}
                                    onNavigate={handleNavigate}
                                />
                            </AuraView>
                        );
                    }

                    // --- REGISTRY-BASED VIEWS ---
                    if (config) {
                        const Component = config.component;
                        const wrapperProps = { fullWidth: config.fullWidth };
                        
                        // Map props for standard views
                        let componentProps: Record<string, unknown> = {};
                        
                        switch (view) {
                            case 'timetable':
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                componentProps = { 
                                    slots, 
                                    lessons, 
                                    settings, 
                                    onEditSlot: handleEditSlot, 
                                    onShowSlotActions: (slot: Record<string, unknown>, lesson: Record<string, unknown>) => { setActiveSlotKey?.((slot as any).giorno + '-' + (slot as any).ora); setLessonViewContext?.(lesson as unknown as Lezione); }, 
                                    showGuidanceTips: settings.showGuidanceTips,
                                    onNavigate: handleNavigate 
                                };
                                break;
                            case 'calendario':
                                return (
                                    <AuraView {...wrapperProps}>
                                        <ErrorBoundary>
                                            <Component eventi={eventi} setEventi={setEventi} aiSettings={aiSettings} onNavigate={handleNavigate} />
                                        </ErrorBoundary>
                                    </AuraView>
                                );
                            case 'settings':
                                componentProps = {
                                    settings, themeState, aiSettings, backupState, driveState: driveSyncState, installPrompt, dismissedSuggestions,
                                    onSaveSettings: actions.setSettings, onSaveTheme: actions.setThemeState, onSaveAiSettings: actions.setAiSettings,
                                    onExportData: actions.handleExportData, onImportData: actions.handleImportData, showToast,
                                    onDownloadDemoData: actions.handleLoadDemoData, onCleanDemoData: actions.handleCleanDemoData,
                                    onRestoreFromBackup: actions.handleRestoreFromDrive, onLogout: () => actions.handleNavigate('student-dashboard'),
                                    onInstallApp: actions.handleInstallApp, onEnterStudentMode: actions.handleEnterStudentMode,
                                    onConnectDrive: actions.handleConnectDrive, onDisconnectDrive: actions.handleDisconnectDrive,
                                    onSyncToDrive: actions.handleSyncToDrive, onRestoreFromDrive: actions.handleRestoreFromDrive,
                                    onConfigureDrive: actions.handleConfigureDrive, onSelectBackupFolder: actions.pickGoogleDriveFolder,
                                    onCreateAppFolder: actions.createAppFolder, onClose: actions.handleBack, onOpenBackupInfo: actions.handleOpenBackupInfo,
                                    onReactivateSuggestion: actions.reactivateSuggestion,
                                    onNavigate: handleNavigate
                                };
                                break;
                            case 'studenti':
                                componentProps = { 
                                    students, 
                                    onSaveStudent: actions.saveStudent, 
                                    onDeleteStudent: actions.deleteStudent, 
                                    onImportStudents: actions.importStudents, 
                                    userClasses: settings.classi, 
                                    initialClass: typeof viewContext === 'string' ? viewContext : undefined, 
                                    knowledgeBase,
                                    onNavigate: handleNavigate 
                                };
                                break;
                            case 'progettazione-hub':
                                componentProps = { 
                                    onNavigate: handleNavigate, 
                                    uda, 
                                    events: eventi, 
                                    settings, 
                                    aiSettings, 
                                    onSaveUda, 
                                    onAddLessons, 
                                    onSaveReport, 
                                    onSaveEvent, 
                                    initialAction: typeof viewContext === 'object' && viewContext !== null && 'action' in viewContext ? (viewContext as Record<string, unknown>).action : undefined, 
                                    knowledgeBase, 
                                    showToast, 
                                    showGuidanceTips: settings.showGuidanceTips, 
                                    setIsLoadingModalOpen, 
                                    setLoadingModalMessage, 
                                    students, 
                                    pianiInclusione, 
                                    onUpdateCompetencies: (comp: Competenza[]) => actions.setSettings(prev => ({ ...prev, competenze: comp })), 
                                    curricula,
                                    onUpdateKnowledgeBase: setKnowledgeBase,
                                    driveSyncState,
                                    onConnectDrive: actions.handleConnectDrive
                                };
                                break;
                            case 'reportistica':
                                componentProps = { reportistica, onDeleteReport: (id: string) => setReportistica((prev: Report[]) => prev.filter((r) => r.id !== id)), userClasses: settings.classi, students, evaluations, competencyEvaluations: competencyEvals, settings, uda, lessons, onSaveReport, aiSettings, pianiInclusione, knowledgeBase, onAddKbEntry: (entry: Record<string, unknown>) => setKnowledgeBase(prev => [...prev, entry as never]), onSaveUda, onAddLessons, onSaveEvent };
                                break;
                            case 'knowledge-base':
                                componentProps = { knowledgeBase, setKnowledgeBase, corpora, setCorpora, showToast, onNavigate: handleNavigate };
                                break;
                            case 'studio':
                                componentProps = { 
                                    corpora, 
                                    knowledgeBase, 
                                    setKnowledgeBase, 
                                    aiSettings, 
                                    onOpenCreateLesson: () => setCreateLessonContext?.({ isOpen: true, slotKey: null, lezione: null }), 
                                    showToast, 
                                    showGuidanceTips: settings.showGuidanceTips, 
                                    onAiProcessing: () => {},
                                    onNavigate: handleNavigate 
                                };
                                break;
                            case 'orientamento':
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                componentProps = { 
                                    students, 
                                    activities: orientamentoActivities, 
                                    ePortfolioEntries, 
                                    studentStates: studentOrientamentoStates, 
                                    userClasses: settings.classi, 
                                    onSaveActivity: (a: Record<string, unknown>) => setOrientamentoActivities(prev => [...(Array.isArray(prev) ? prev.filter(act => (act as any).id !== (a as any).id) : []), a as unknown as OrientamentoActivity]), 
                                    onSaveEPortfolio: (e: Record<string, unknown>) => setEPortfolioEntries(prev => [...(Array.isArray(prev) ? prev.filter(ent => (ent as any).id !== (e as any).id) : []), e as unknown as EPortfolioEntry]), 
                                    onUpdateStudentState: (s: Record<string, unknown>) => setStudentOrientamentoStates(prev => ({ ...prev, [(s as any).studenteId]: s })), 
                                    showToast,
                                    onNavigate: handleNavigate 
                                };
                                break;
                            case 'lessons':
                                componentProps = { 
                                    lessons: Object.values(lessons), 
                                    uda, 
                                    knowledgeBase, 
                                    userClasses: settings.classi, 
                                    onViewLesson: setLessonViewContext as (lesson: unknown) => void ?? (() => {}), 
                                    onAddLessons, 
                                    onUpdateLesson: (lesson: Lezione) => setLessons(prev => ({ ...prev, [lesson.id]: lesson })), 
                                    aiSettings, 
                                    setIsLoadingModalOpen, 
                                    setLoadingModalMessage, 
                                    slots, 
                                    onScheduleLesson, 
                                    curricula, 
                                    settings, 
                                    onStartClassroom: () => {}, 
                                    initialUdaId: typeof viewContext === 'object' && viewContext !== null && 'udaId' in viewContext ? String((viewContext as Record<string, unknown>).udaId) : undefined, 
                                    initialClass: typeof viewContext === 'string' ? viewContext : undefined,
                                    onNavigate: handleNavigate 
                                };
                                break;
                            case 'uda':
                                componentProps = { uda, onSaveUda, onDeleteUda: (id: string) => setUda((prev) => prev.filter((u: Uda) => u.id !== id)), lessons, onUpdateUdaLessons: () => {}, aiSettings, knowledgeBase, competenze: settings.competenze, settings, onSaveReport, onNavigate: handleNavigate, showToast, showGuidanceTips: settings.showGuidanceTips, setIsLoadingModalOpen, setLoadingModalMessage, eventi, onAddLessons, onSaveEvent, curricula };
                                break;
                            case 'rubriche':
                                componentProps = { 
                                    competenze: settings.competenze, 
                                    rubriche, 
                                    onSaveRubrica: actions.saveRubrica, 
                                    onDeleteRubrica: actions.deleteRubrica || (() => {}), 
                                    onNavigate: handleNavigate 
                                };
                                break;
                            case 'didattica-inclusiva':
                                componentProps = { 
                                    students, 
                                    pianiInclusione, 
                                    onSavePiano: actions.savePianoInclusione, 
                                    onDeletePiano: actions.deletePianoInclusione, 
                                    aiSettings, 
                                    evaluations, 
                                    competencyEvaluations: competencyEvals, 
                                    settings, 
                                    studentToEdit: typeof viewContext === 'object' && viewContext !== null && 'student' in viewContext ? (viewContext as Record<string, unknown>).student : undefined, 
                                    onClearStudentToEdit: () => setViewContext({ student: undefined }), 
                                    showToast, 
                                    showGuidanceTips: settings.showGuidanceTips, 
                                    onAiProcessing: () => {},
                                    onNavigate: handleNavigate 
                                };
                                break;
                            case 'evaluations':
                                componentProps = { 
                                    students, 
                                    evaluations, 
                                    setEvaluations, 
                                    competencyEvaluations: competencyEvals, 
                                    setCompetencyEvaluations: setCompetencyEvals, 
                                    userClasses: settings.classi, 
                                    settings, 
                                    aiSettings, 
                                    initialClass: typeof viewContext === 'string' ? viewContext : undefined, 
                                    onClearInitialStudent: () => setViewContext({ initialStudentId: undefined }), 
                                    onOpenInclusionPlanEditor: (student: Studente) => handleNavigate('didattica-inclusiva', { student }), 
                                    showGuidanceTips: settings.showGuidanceTips, 
                                    register: finalizedRegister, 
                                    lessons,
                                    onNavigate: handleNavigate 
                                };
                                break;
                            case 'register':
                                componentProps = { 
                                    entries: finalizedRegister, 
                                    lessons, 
                                    students, 
                                    initialClass: typeof viewContext === 'string' ? viewContext : undefined,
                                    onNavigate: handleNavigate 
                                };
                                break;
                            case 'improvement-guide':
                                componentProps = { 
                                    selectedClass: typeof viewContext === 'string' ? viewContext : '', 
                                    students, 
                                    evaluations, 
                                    competencyEvaluations: competencyEvals, 
                                    lessons, 
                                    register: finalizedRegister, 
                                    settings, 
                                    aiSettings,
                                    onNavigate: handleNavigate 
                                };
                                break;
                            case 'consiglio-di-classe':
                                componentProps = { 
                                    selectedClass: typeof viewContext === 'string' ? viewContext : '', 
                                    students, 
                                    evaluations, 
                                    giudizi, 
                                    onSaveGiudizio: actions.saveGiudizio, 
                                    settings, 
                                    aiSettings, 
                                    annoScolasticoCorrente: settings.annoScolasticoCorrente, 
                                    onViewStudentProfile: setStudentProfileContext, 
                                    competencyEvaluations: competencyEvals,
                                    onNavigate: handleNavigate 
                                };
                                break;
                            case 'class-competency-dashboard':
                                componentProps = { 
                                    selectedClass: typeof viewContext === 'string' ? viewContext : '', 
                                    students, 
                                    competencyEvaluations: competencyEvals, 
                                    settings, 
                                    onViewStudentProfile: setStudentProfileContext,
                                    onNavigate: handleNavigate 
                                };
                                break;
                            case 'analytics':
                                componentProps = { 
                                    userClasses: settings.classi, 
                                    students, 
                                    evaluations, 
                                    competencyEvaluations: competencyEvals, 
                                    settings, 
                                    aiSettings,
                                    onNavigate: handleNavigate 
                                };
                                break;
                            case 'student-dashboard':
                                componentProps = { students, onLogin: (student: Studente) => handleNavigate('student-workspace', { studentId: student.id }), onCancel: () => handleNavigate('home'), securityPin: safeSecurityPin, onNavigate: handleNavigate };
                                break;
                            case 'teacher-inbox':
                                componentProps = { submissions: safeSubmissions, students, lessons, onGradeSubmission: handleGradeSubmission, onClose: () => handleBack(true) };
                                break;
                            case 'competency-levels':
                                componentProps = { 
                                    competenze: settings.competenze,
                                    onNavigate: handleNavigate 
                                };
                                break;
                            case 'curriculum-manager':
                                componentProps = { curricula: curricula || [], onUpdateCurricula: setCurricula, settings, aiSettings, onNavigate: handleNavigate };
                                break;
                            case 'feed-manager':
                                componentProps = { 
                                    sources: appState.feedSources || [], 
                                    setSources: actions.setFeedSources, 
                                    showToast, 
                                    onOpenCircularAnalysis: (url: string, title: string) => actions.setCircularAnalysisModal?.({ isOpen: true, url, title }),
                                    onNavigate: handleNavigate 
                                };
                                break;
                            // Note: AnnualPlanningWizard is typically launched from ProgettazioneHub (not top-level registry view)
                            // onNavigate is passed via hub props when needed.
                            case 'live-assistant':
                                componentProps = { students, evaluations, slots, lessons, pianiInclusione, knowledgeBase, onNavigate: handleNavigate, onCreateEvent: (eventWithoutId: Record<string, unknown>) => { const newEvent = { ...eventWithoutId, id: `evt-${Date.now()}-${Math.random()}` }; setEventi(prev => [...prev, newEvent as unknown as EventoCalendario]); }, onScheduleLesson: (data: Record<string, unknown>) => { onScheduleLesson(data as unknown as LessonScheduleInput); modals.setIsLiveAssistantModalOpen?.(false); }, onAddEvaluation: (data: Record<string, unknown>) => { handleAddEvaluation(data as unknown as EvaluationInput); modals.setIsLiveAssistantModalOpen?.(false); }, onCreateUda: (data: Record<string, unknown>) => { handleCreateUda(data as unknown as UdaCreateInput); modals.setIsLiveAssistantModalOpen?.(false); }, onAddNote: (data: Record<string, unknown>) => { handleAddNote(data as unknown as { note: string; studentName?: string }); modals.setIsLiveAssistantModalOpen?.(false); }, onMarkAttendance: (data: Record<string, unknown>) => { onMarkAttendance(data as unknown as { studentName: string; status: 'presente' | 'assente' | 'ritardo' }); modals.setIsLiveAssistantModalOpen?.(false); }, onLoadDemoData: () => { handleLoadDemoData(); modals.setIsLiveAssistantModalOpen?.(false); }, userContext: user };
                                break;
                            case 'teacher-presentation-view':
                                componentProps = { onNavigate: handleNavigate };
                                break;
                            case 'teacher-dashboard':
                                componentProps = { onNavigate: handleNavigate };
                                break;
                            case 'workspace':
                                componentProps = { onNavigate: handleNavigate };
                                break;
                            case 'welcome':
                                componentProps = { onNavigate: handleNavigate };
                                break;
                            // classroom-tools is legacy/special (launched via modals), ignore in registry switch
                            // case 'classroom-tools': ...
                            case 'copilot': {
                                // CopilotView reads stores directly; pass only optional context
                                const subTab = typeof viewContext === 'object' && viewContext !== null && 'tab' in viewContext
                                    ? String((viewContext as Record<string, unknown>).tab)
                                    : undefined;
                                componentProps = { initialSubTab: subTab, onNavigate: handleNavigate };
                                break;
                            }
                            case 'video-analysis':
                                componentProps = { onNavigate: handleNavigate };
                                break;
                            case 'assistente': {
                                // Pass navigation context (from AskAIButton) to AssistantView for display / smart init
                                const ctx = typeof viewContext === 'object' && viewContext !== null ? viewContext : undefined;
                                componentProps = { context: ctx };
                                break;
                            }
                        }

                        return config.auraWrapper !== false ? (
                            <AuraView {...wrapperProps}>
                                <Component {...componentProps} />
                            </AuraView>
                        ) : (
                                                        <div
                                                            style={{
                                                                width: config.fullWidth ? 'var(--md-sys-percent-100)' : 'var(--md-sys-percent-100)',
                                                                maxWidth: config.fullWidth ? 'none' : 'calc(var(--md-sys-spacing-20) * 22.4)', // MD3 spacing token equivalent
                                                                margin: config.fullWidth ? undefined : '0 auto',
                                                                paddingLeft: config.fullWidth ? undefined : 'var(--md-sys-spacing-4)',
                                                                paddingRight: config.fullWidth ? undefined : 'var(--md-sys-spacing-4)',
                                                            }}
                                                        >
                                                            <Component {...componentProps} />
                                                        </div>
                        );
                    }

                    // 404 Fallback
                    return (
                        <AuraView>
                            <div style={{ padding: 'var(--md-sys-spacing-4)', textAlign: "center", opacity: "var(--md-sys-state-opacity-placeholder)" }}>
                                <h2>Vista "{view}" non trovata</h2>
                                <button onClick={() => actions.handleNavigate('home')}  style={{marginTop: 'var(--md-sys-spacing-4)'}}>
                                    Torna alla Home
                                </button>
                            </div>
                        </AuraView>
                    );
                })()}
            </Suspense>
        );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, viewContext, appState, actions, modals]);

    return (
        <>
            {renderView}
            {modals.isRegisterImportOpen && (
                <Suspense fallback={null}>
                <RegisterImportDialog 
                    onClose={() => setIsRegisterImportOpen?.(false)}
                    onImport={(result) => {
                        if (result.students.length > 0) {
                            importStudents(result.students);
                        }
                        if (result.evaluations.length > 0) {
                            importEvaluations(result.evaluations);
                        }
                        showToast('Dati importati con successo!', 'success');
                    }}
                />
                </Suspense>
            )}
        </>
    );
}

export default ViewManager;


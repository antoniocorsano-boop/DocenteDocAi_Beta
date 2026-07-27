/**
 * useAppEngine — thin composition root.
 *
 * Compone i 4 engine specializzati (navigation, notification, backup, drive)
 * e li orchestra insieme agli store Zustand per produrre l'interfaccia
 * AppState + AppActions consumata da App.tsx.
 *
 * Ogni responsabilità specifica vive nel proprio hook:
 *   useNotificationEngine  — toast + PWA install
 *   useNavigationEngine    — view state + navigate/back + CognitionBus
 *   useBackupEngine        — IndexedDB load/restore/demo/export/import
 *   useDriveSyncEngine     — Google Drive OAuth + sync + auto-sync
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useCallback, useMemo } from 'react';
import {
    AppState, AppActions,
    Studente, Lezione, Slot, Valutazione, ValutazioneCompetenza, Uda, EventoCalendario,
    KnowledgeBaseEntry, Corpus, Notifica, Rubrica, PianoInclusione, GiudizioPeriodico,
    Report, FeedSource, RegisterEntry, NotebookNote, ToDoItem, AiSuggestion, SystemSuggestion,
    BackupState, DriveSyncState, View, CurriculumSubject, HomeworkSubmission,
    LessonScheduleInput, EvaluationInput, UdaCreateInput,
    BackupPayload,
} from '../types.ts';
import { usePersistence } from './usePersistence';
import { analyzeSystemState } from '../utils/suggestionUtils';
import { useUIStore } from '../stores/useUIStore';
import { useStudentStore } from '../stores/useStudentStore';
import { useAcademicStore } from '../stores/useAcademicStore';
import { useSystemStore } from '../stores/useSystemStore';
import type { SyncConflictData } from '../types';
import { useSettingsStore } from '../stores/useSettingsStore';
import { ThemeService } from '../services/ThemeService';
import { useCognitionBusEmitter } from './useCognitionBusEmitter';
import { cognitionBus } from '../cognition/CognitionBus';
// Sub-engines
import { useNotificationEngine } from './useNotificationEngine';
import { useNavigationEngine } from './useNavigationEngine';
import { useBackupEngine } from './useBackupEngine';
import { useDriveSyncEngine } from './useDriveSyncEngine';
import { pickGoogleDriveFolder, createAppFolder } from '../services/googleDriveService';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useAppEngine = () => {
    // ─── SUB-ENGINES ───────────────────────────────────────────────────────────
    const { showToast, handleInstallApp } = useNotificationEngine();
    const { view, viewContext, setViewContext, handleNavigate, handleBack, canGoBack } = useNavigationEngine(showToast);
    const { isDataLoaded, handleLoadDemoData, handleCleanDemoData, handleExportData, handleImportData } = useBackupEngine(showToast);
    const { handleConnectDrive, handleDisconnectDrive, handleSyncToDrive, handleRestoreFromDrive, handleConfigureDrive } = useDriveSyncEngine(showToast, isDataLoaded);

    // ─── STORES ────────────────────────────────────────────────────────────────
    const { students, evaluations, competencyEvals, pianiInclusione, studentProfileContext, selectedClassForDashboard, orientamentoActivities, ePortfolioEntries, studentOrientamentoStates, actions: studentActions } = useStudentStore();
    const { lessons, slots, uda, eventi, rubriche, curricula, submissions, draftRegister, finalizedRegister, giudizi, reportistica, actions: academicActions } = useAcademicStore();
    const { user, knowledgeBase, corpora, notifiche, feedSources, suggestions, activeSuggestion, dismissedSuggestions, analyticsEvents, analyticsMetrics, analyticsSettings, templates, actions: systemActions } = useSystemStore();
    const { modals, circularAnalysisModal, syncConflictModal, createLessonContext, editingSlotKey, activeSlotKey, lessonViewContext, loadingModalMessage, toast, installPrompt, canShowInstallPrompt, isGlobalAiLoading, navigationHistory, backupState, driveSyncState, actions: uiActions } = useUIStore();
    const { settings, aiSettings, themeState, actions: settingsActions } = useSettingsStore();

    // ─── DESTRUCTURED ACTIONS ──────────────────────────────────────────────────
    const { setStudents, setEvaluations, setCompetencyEvals, setPianiInclusione, setStudentProfileContext, setSelectedClassForDashboard, setOrientamentoActivities, setEPortfolioEntries, setStudentOrientamentoStates } = studentActions;
    const { setLessons, setSlots, setUda, setEventi, setRubriche, setCurricula, setSubmissions, setDraftRegister, setFinalizedRegister, setGiudizi, setReportistica } = academicActions;
    const { setUser, setKnowledgeBase, setCorpora, setNotifiche, setFeedSources, setSuggestions, setActiveSuggestion, trackAnalyticsEvent, setTemplates, dismissSuggestion, reactivateSuggestion } = systemActions;

    // ─── CROSS-CUTTING HOOKS ───────────────────────────────────────────────────
    usePersistence(isDataLoaded);
    useCognitionBusEmitter();

    // ─── SYSTEM SUGGESTION ENGINE ──────────────────────────────────────────────
    useEffect(() => {
        if (!isDataLoaded) return;
        const timer = setTimeout(() => {
            const suggestion = analyzeSystemState(students, slots, uda, eventi, evaluations);
            systemActions.setActiveSuggestion(suggestion);
        }, 5000);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDataLoaded, students, slots, uda, eventi, evaluations]);

    // ─── AI SUGGESTIONS ────────────────────────────────────────────────────────
    const isTestMode = (typeof window !== 'undefined' && (window as { __TEST_MODE?: boolean }).__TEST_MODE === true) || ((import.meta as ImportMeta).env?.VITE_TEST_MODE === 'true');
    useEffect(() => {
        if (!isDataLoaded || isTestMode) return;
        const generateSuggestions = async () => {
            try {
                const { generateAiSuggestions } = await import('../utils/aiSuggestionGenerator');
                const aiSuggestions = await generateAiSuggestions({
                    user, students, lessons, slots, evaluations, competencyEvals, uda, eventi,
                    knowledgeBase, corpora, rubriche, pianiInclusione, giudizi, reportistica,
                    feedSources, draftRegister, finalizedRegister, curricula, submissions,
                    notifiche, suggestions, activeSuggestion, dismissedSuggestions,
                    studentProfileContext, selectedClassForDashboard,
                    actions: { ...studentActions, ...academicActions, ...systemActions },
                } as unknown as AppState);
                systemActions.setSuggestions(aiSuggestions);
            } catch (err) {
                console.error('AI suggestions generation failed', err);
            }
        };
        generateSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDataLoaded, isTestMode]);

    // ─── THEME APPLICATION ─────────────────────────────────────────────────────
    useEffect(() => { ThemeService.applyThemeState(themeState); }, [themeState]);
    useEffect(() => {
        if (themeState.mode !== 'system') return;
        const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
        if (!mq) return;
        const handler = () => ThemeService.applyThemeState(themeState);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [themeState]);

    // ─── COORDINATION ACTIONS ──────────────────────────────────────────────────

    const onScheduleLesson = useCallback((data: LessonScheduleInput) => {
        const newLesson: Lezione = {
            id: `les-${Date.now()}`,
            ...data,
            svolta: false,
            tipoLezione: data.tipoLezione || 'Teoria',
            contenuto: data.contenuto || 'Lezione',
        };
        setLessons(prev => ({ ...prev, [newLesson.id]: newLesson }));
        if (data.slotKey) {
            setSlots(prev => ({
                ...prev,
                [data.slotKey!]: { ...prev[data.slotKey!], lezioneId: newLesson.id, materia: newLesson.materia, classe: newLesson.classe },
            }));
        }
        cognitionBus.emit('lesson.created', { lessonId: newLesson.id });
    }, [setLessons, setSlots]);

    const onSaveUda = useCallback((udaItem: Uda) => {
        setUda((prev: Uda[]) => {
            const index = prev.findIndex(u => u.id === udaItem.id);
            if (index !== -1) {
                const newArr = [...prev];
                newArr[index] = udaItem;
                return newArr;
            }
            return [...prev, udaItem];
        });
        cognitionBus.emit('uda.updated', { udaId: udaItem.id });
        showToast('udaSaved', 'success');
    }, [setUda, showToast]);

    const onSaveReport = useCallback((report: Report) => {
        setReportistica((prev: Report[]) => [...prev, report]);
    }, [setReportistica]);

    const onSaveEvent = useCallback((event: EventoCalendario) => {
        setEventi((prev: EventoCalendario[]) => {
            const index = prev.findIndex(e => e.id === event.id);
            if (index !== -1) {
                const newEventi = [...prev];
                newEventi[index] = event;
                return newEventi;
            }
            return [...prev, event];
        });
    }, [setEventi]);

    const handleGradeSubmission = useCallback((submissionId: string, grade: string, feedback: string) => {
        setSubmissions((prev: HomeworkSubmission[]) => prev.map(s => s.id === submissionId ? { ...s, status: 'graded', teacherFeedback: grade } : s));
        const sub = submissions?.find(s => s.id === submissionId);
        if (sub) {
            const lesson = lessons[sub.lessonId];
            const newEval: Valutazione = {
                id: `eval-sub-${Date.now()}`,
                studenteId: sub.studentId,
                materia: lesson?.materia || 'Generale',
                data: new Date().toISOString().split('T')[0],
                tipo: 'Pratico',
                voto: grade,
                argomento: lesson?.contenuto || 'Compito',
                note: feedback,
            };
            setEvaluations((prev: Valutazione[]) => [...prev, newEval]);
        }
    }, [setSubmissions, submissions, lessons, setEvaluations]);

    const handleAddEvaluation = useCallback((data: EvaluationInput) => {
        const newEval = { ...data, id: `eval-${Date.now()}` };
        setEvaluations(prev => [...prev, newEval]);
        cognitionBus.emit('evaluation.added', { studentId: data.studenteId });
        trackAnalyticsEvent('feature_usage', 'evaluation_saved', { tipo: data.tipo, materia: data.materia });
    }, [setEvaluations, trackAnalyticsEvent]);

    const handleCreateUda = useCallback((_data: UdaCreateInput) => {
        const newUda: Uda = {
            id: `uda-${Date.now()}`,
            title: 'New UDA',
            classe: 'Default Class',
            materia: 'Default Subject',
            introduction: 'Introduction text',
            finalProduct: 'Final product description',
            competencyIds: [],
            phases: [],
            evaluation: 'Evaluation text',
            tools: 'Tools description',
            startPos: 0,
            width: 100,
            color: 'var(--md-sys-color-primary)',
            borderColor: 'var(--md-sys-color-outline)',
            textColor: 'var(--md-sys-color-on-primary)',
        };
        setUda(prev => [...prev, newUda]);
        cognitionBus.emit('uda.created', { udaId: newUda.id });
    }, [setUda]);

    const handleEnterStudentMode = useCallback(() => {
        handleNavigate('student-dashboard');
    }, [handleNavigate]);

    const handleStartClassroom = useCallback((classe: string, materia: string, slotKey: string, lesson: Lezione) => {
        if (!draftRegister[slotKey]) {
            const newEntry: RegisterEntry = {
                id: `reg-${Date.now()}`,
                date: new Date().toISOString(),
                slotKey, lessonId: lesson.id, classe, materia,
                studentAttendance: {}, status: 'draft',
            };
            setDraftRegister(prev => ({ ...prev, [slotKey]: newEntry }));
        }
        handleNavigate('aula-session', { draftKey: slotKey });
    }, [draftRegister, handleNavigate, setDraftRegister]);

    const handleEditSlot = useCallback((giorno: string, ora: string) => {
        uiActions.setEditingSlotKey(`${giorno}-${ora}`);
    }, [uiActions]);

    const handleShowSlotActions = useCallback((slot: Slot, lesson: Lezione) => {
        uiActions.setActiveSlotKey(`${slot.giorno}-${slot.ora}`);
        uiActions.setLessonViewContext(lesson);
    }, [uiActions]);

    const handleAiSuggest = useCallback((slot: Slot) => {
        handleNavigate('studio', {
            prompt: `Suggerisci un'attività didattica creativa per la prossima lezione di ${slot.materia} nella classe ${slot.classe}.`,
            targetSlot: slot,
        });
        showToast('aiSuggestionPrep', 'info');
    }, [handleNavigate, showToast]);

    const onMarkAttendance = useCallback((data: { studentName: string; status: 'presente' | 'assente' | 'ritardo' }) => {
        const { studentName, status } = data;
        const draftKey = viewContext?.draftKey;
        if (draftKey && draftRegister[draftKey as string]) {
            setDraftRegister(prev => ({
                ...prev,
                [draftKey as string]: {
                    ...prev[draftKey as string],
                    studentAttendance: { ...prev[draftKey as string].studentAttendance, [studentName]: status },
                },
            }));
            showToast('attendanceMarked', 'success');
        }
    }, [setDraftRegister, viewContext, draftRegister, showToast]);

    const handleOpenBackupInfo  = useCallback(() => { uiActions.toggleModal('isBackupInfoModalOpen', true); }, [uiActions]);
    const handleOpenOperations  = useCallback(() => { uiActions.toggleModal('isOperationsCenterOpen', true); }, [uiActions]);

    const handleAiSuggestionFromHome = useCallback((action: { type: string; payload?: string | Record<string, unknown> }) => {
        if (action.type === 'navigate' && action.payload) handleNavigate(action.payload as View);
    }, [handleNavigate]);

    const onAddLessonsWrapper = useCallback((newLessons: Lezione[]) => {
        setLessons(prev => {
            const updated = { ...prev };
            newLessons.forEach(l => { updated[l.id] = l; });
            return updated;
        });
    }, [setLessons]);

    const handlePromoteStudents = useCallback((promotedStudents: Studente[], archiveYear: string) => {
        setStudents(promotedStudents);
        settingsActions.updateSettings({ annoScolasticoCorrente: archiveYear });
        showToast('studentsPromoted', 'success');
    }, [setStudents, settingsActions, showToast]);

    const handleResetYearData = useCallback(async () => {
        setEvaluations([]); setCompetencyEvals([]); setDraftRegister({});
        setFinalizedRegister([]); setEventi([]); setReportistica([]);
        setUda([]); setSubmissions([]); setPianiInclusione({}); setGiudizi({});
        showToast('dbReset', 'info');
    }, [setEvaluations, setCompetencyEvals, setDraftRegister, setFinalizedRegister, setEventi, setReportistica, setUda, setSubmissions, setPianiInclusione, setGiudizi, showToast]);

    const dismissSuggestionWrapper = useCallback((id: string) => {
        const updatedSuggestions = suggestions.filter((s: AiSuggestion) => s.id !== id);
        systemActions.setSuggestions(updatedSuggestions);
        systemActions.dismissSuggestion(id);
        showToast('Suggestion dismissed', 'info');
    }, [suggestions, showToast, systemActions]);

    const handleAddNote = useCallback((data: { note: string; studentName?: string }) => {
        showToast(`Nota aggiunta${data.studentName ? ` per ${data.studentName}` : ''}: ${data.note.substring(0, 20)}...`, 'success');
    }, [showToast]);

    // ─── AGGREGATE STATE ───────────────────────────────────────────────────────
    const appStateObject: AppState = useMemo(() => ({
        user, students, lessons, slots, evaluations, competencyEvals, uda, eventi,
        knowledgeBase, corpora, notifiche, rubriche, pianiInclusione, giudizi, reportistica,
        feedSources, draftRegister, finalizedRegister,
        settings, aiSettings, themeState,
        backupState, driveSyncState,
        installPrompt: installPrompt as import('../types').BeforeInstallPromptEvent | null,
        canShowInstallPrompt,
        suggestions, studentProfileContext, selectedClassForDashboard,
        activeSuggestion, dismissedSuggestions,
        isGlobalAiLoading,
        navigationHistory: navigationHistory.map(entry => ({
            ...entry,
            context: entry.context as import('../types').NavigationParams | null,
        })),
        curricula, submissions,
        selectedDocuments: [],
        orientamentoActivities, ePortfolioEntries, studentOrientamentoStates,
    }), [user, students, lessons, slots, evaluations, competencyEvals, uda, eventi,
        knowledgeBase, corpora, notifiche, rubriche, pianiInclusione, giudizi, reportistica,
        feedSources, draftRegister, finalizedRegister,
        settings, aiSettings, themeState, backupState, driveSyncState, installPrompt,
        canShowInstallPrompt, suggestions, studentProfileContext, selectedClassForDashboard,
        activeSuggestion, dismissedSuggestions, isGlobalAiLoading, navigationHistory,
        curricula, submissions, orientamentoActivities, ePortfolioEntries, studentOrientamentoStates]);

    // ─── AGGREGATE ACTIONS ─────────────────────────────────────────────────────
    const actionsObject: AppActions = useMemo(() => ({
        setUser, setStudents, setLessons, setSlots, setEvaluations, setCompetencyEvals, setUda,
        setEventi, setKnowledgeBase, setCorpora, setNotifiche, setRubriche, setPianiInclusione,
        setGiudizi, setReportistica, setFeedSources, setDraftRegister, setFinalizedRegister,
        setCurricula, setSubmissions,
        setOrientamentoActivities, setEPortfolioEntries, setStudentOrientamentoStates,
        addEvaluation: studentActions.addEvaluation,
        updateEvaluation: studentActions.updateEvaluation,
        deleteEvaluation: studentActions.deleteEvaluation,
        saveStudent: studentActions.saveStudent,
        deleteStudent: studentActions.deleteStudent,
        importStudents: studentActions.importStudents,
        savePianoInclusione: studentActions.savePianoInclusione,
        deletePianoInclusione: studentActions.deletePianoInclusione,
        saveRubrica: academicActions.saveRubrica,
        deleteRubrica: academicActions.deleteRubrica || ((id: string) => { /* no-op for now */ }),
        saveGiudizio: academicActions.saveGiudizio,
        setSuggestions: systemActions.setSuggestions,
        setActiveSuggestion: systemActions.setActiveSuggestion,
        dismissSuggestion: dismissSuggestionWrapper,
        reactivateSuggestion: systemActions.reactivateSuggestion,
        setStudentProfileContext: studentActions.setStudentProfileContext,
        setSelectedClassForDashboard: studentActions.setSelectedClassForDashboard,
        loadFromBackup: (data: unknown) => {
            const d = data as Partial<BackupPayload>;
            studentActions.loadFromBackup(d);
            academicActions.loadFromBackup(d);
            systemActions.loadFromBackup(d);
        },
        resetAll: () => {
            studentActions.resetStudentData();
            academicActions.resetAcademicData();
            systemActions.resetSystemData();
        },
        handleAddNote,
        setSettings: settingsActions.setSettings,
        setThemeState: settingsActions.setThemeState,
        setAiSettings: settingsActions.setAiSettings,
        setInstallPrompt: uiActions.setInstallPrompt,
        setCanShowInstallPrompt: uiActions.setCanShowInstallPrompt,
        setIsGlobalAiLoading: uiActions.setIsGlobalAiLoading,
        setNavigationHistory: uiActions.setNavigationHistory,
        addNavigationEntry: uiActions.addNavigationEntry,
        popNavigationEntry: uiActions.popNavigationEntry,
        clearNavigationHistory: uiActions.clearNavigationHistory,
        setBackupState: (input: Partial<BackupState> | ((prev: BackupState) => Partial<BackupState>)) => {
            if (typeof input === 'function') {
                uiActions.setBackupState((prev: BackupState) => ({ ...prev, ...input(prev) } as BackupState));
            } else {
                uiActions.setBackupState(prev => ({ ...prev, ...input } as BackupState));
            }
        },
        setDriveSyncState: (input: Partial<DriveSyncState> | ((prev: DriveSyncState) => Partial<DriveSyncState>)) => {
            if (typeof input === 'function') {
                uiActions.setDriveSyncState((prev: DriveSyncState) => ({ ...prev, ...input(prev) } as DriveSyncState));
            } else {
                uiActions.setDriveSyncState(prev => ({ ...prev, ...input } as DriveSyncState));
            }
        },
        setCircularAnalysisModal: uiActions.setCircularAnalysisModal,
        setIsLoadingModalOpen: (val: boolean) => uiActions.setLoading(val),
        setLoadingModalMessage: (m: string) => uiActions.setLoading(true, m),
        setActiveSlotKey: uiActions.setActiveSlotKey,
        setEditingSlotKey: uiActions.setEditingSlotKey,
        setViewContext,
        setIsVideoAnalysisOpen: uiActions.setIsVideoAnalysisOpen,
        setIsRestoring: uiActions.setIsRestoring,
        showToast,
        clearToast: uiActions.clearToast,
        handleNavigate, handleBack, canGoBack, handleLoadDemoData, handleCleanDemoData,
        handleConfigureDrive, handleConnectDrive, handleDisconnectDrive, handleSyncToDrive,
        handleRestoreFromDrive, pickGoogleDriveFolder, createAppFolder, handleInstallApp,
        handleEnterStudentMode, handleStartClassroom, handleEditSlot, handleShowSlotActions,
        handleAiSuggest, onScheduleLesson, handleAddEvaluation,
        handleCreateUda, onMarkAttendance,
        trackAnalyticsEvent,
        handleOpenBackupInfo, handleExportData, handleImportData,
        handleAiSuggestionFromHome,
        handleOpenOperations,
        onAddLessons: onAddLessonsWrapper,
        onSaveUda, onSaveReport, onSaveEvent,
        handleGradeSubmission, handlePromoteStudents, handleResetYearData,
        importEvaluations: studentActions.importEvaluations,
        toggleModal: uiActions.toggleModal,
        setSyncConflictModal: (modal: { isOpen: boolean; data: SyncConflictData | null } | null) => uiActions.setSyncConflictModal(modal),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [setUser, setStudents, setLessons, setSlots, setEvaluations, setCompetencyEvals, setUda,
        setEventi, setKnowledgeBase, setCorpora, setNotifiche, setRubriche, setPianiInclusione,
        setGiudizi, setReportistica, setFeedSources, setDraftRegister, setFinalizedRegister,
        setCurricula, setSubmissions, setOrientamentoActivities, setEPortfolioEntries, setStudentOrientamentoStates,
        studentActions.addEvaluation, studentActions.updateEvaluation, studentActions.deleteEvaluation,
        studentActions.saveStudent, studentActions.deleteStudent, studentActions.importStudents,
        studentActions.savePianoInclusione, studentActions.deletePianoInclusione,
        academicActions.saveRubrica, academicActions.saveGiudizio,
        studentActions, academicActions, systemActions, settingsActions.setSettings, settingsActions.setThemeState,
        settingsActions.setAiSettings, uiActions, showToast, handleNavigate, handleBack,
        handleLoadDemoData, handleCleanDemoData, handleConfigureDrive, handleConnectDrive,
        handleDisconnectDrive, handleSyncToDrive, handleRestoreFromDrive, handleInstallApp,
        handleEnterStudentMode, handleStartClassroom, handleEditSlot, handleShowSlotActions,
        handleAiSuggest, onScheduleLesson, handleAddEvaluation, handleCreateUda, onMarkAttendance,
        trackAnalyticsEvent, handleOpenBackupInfo, handleExportData, handleImportData,
        handleAiSuggestionFromHome, handleOpenOperations, onAddLessonsWrapper,
        onSaveUda, onSaveReport, onSaveEvent, handleGradeSubmission, handlePromoteStudents,
        handleResetYearData, uiActions.setLessonViewContext, dismissSuggestionWrapper, handleAddNote]);

    // ─── MODALS PROXY ──────────────────────────────────────────────────────────
    const modalsProxy = useMemo(() => ({
        isOperationsCenterOpen: modals.isOperationsCenterOpen,
        setIsOperationsCenterOpen: uiActions.toggleModal.bind(null, 'isOperationsCenterOpen'),
        isImageAnalysisOpen: modals.isImageAnalysisOpen,
        setIsImageAnalysisOpen: uiActions.toggleModal.bind(null, 'isImageAnalysisOpen'),
        isLiveAssistantModalOpen: modals.isLiveAssistantModalOpen,
        setIsLiveAssistantModalOpen: uiActions.toggleModal.bind(null, 'isLiveAssistantModalOpen'),
        isHelpOpen: modals.isHelpOpen,
        setIsHelpOpen: uiActions.toggleModal.bind(null, 'isHelpOpen'),
        circularAnalysisModal,
        setCircularAnalysisModal: uiActions.setCircularAnalysisModal,
        isLoadingModalOpen: modals.isLoadingModalOpen,
        setIsLoadingModalOpen: (value?: boolean) => uiActions.setLoading(!!value),
        loadingModalMessage,
        setLoadingModalMessage: (msg?: string) => uiActions.setLoading(true, msg ?? ''),
        editingSlotKey, setEditingSlotKey: uiActions.setEditingSlotKey,
        activeSlotKey, setActiveSlotKey: uiActions.setActiveSlotKey,
        lessonViewContext, setLessonViewContext: uiActions.setLessonViewContext,
        toast,
        isBackupInfoModalOpen: modals.isBackupInfoModalOpen,
        setIsBackupInfoModalOpen: uiActions.toggleModal.bind(null, 'isBackupInfoModalOpen'),
        isRegisterImportOpen: modals.isRegisterImportOpen,
        setIsRegisterImportOpen: uiActions.toggleModal.bind(null, 'isRegisterImportOpen'),
        syncConflictModal,
        setSyncConflictModal: (modal: { isOpen: boolean; data: SyncConflictData | null } | null) => uiActions.setSyncConflictModal(modal),
        createLessonContext, setCreateLessonContext: uiActions.setCreateLessonContext,
        isYearTransitionOpen: modals.isYearTransitionOpen,
        setIsYearTransitionOpen: uiActions.toggleModal.bind(null, 'isYearTransitionOpen'),
        isVideoAnalysisOpen: modals.isVideoAnalysisOpen,
        setIsVideoAnalysisOpen: (value?: boolean) => uiActions.setIsVideoAnalysisOpen(typeof value === 'boolean' ? value : false),
        isNkaMapOpen: modals.isNkaMapOpen,
        setIsNkaMapOpen: uiActions.toggleModal.bind(null, 'isNkaMapOpen'),
        isRestoring: modals.isRestoring,
        setIsRestoring: uiActions.setIsRestoring,
        setNotifiche,
    }), [modals, circularAnalysisModal, syncConflictModal, createLessonContext, editingSlotKey,
        activeSlotKey, lessonViewContext, loadingModalMessage, toast, uiActions, setNotifiche]);

    return { view, viewContext, appState: appStateObject, actions: actionsObject, modals: modalsProxy, isDataLoaded };
};


/**
 * useBackupEngine — caricamento dati iniziale, demo, export, import.
 *
 * Estratto da useAppEngine (Step 1 – Foundation Stabilization).
 * Responsabilità:
 *   - Caricamento dati da IndexedDB al mount (incluso test mode)
 *   - handleLoadDemoData / handleCleanDemoData
 *   - handleExportData (snapshot JSON + download)
 *   - handleImportData (JSON backup e CSV/Excel)
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from 'react';
import { useStudentStore } from '../stores/useStudentStore';
import { useAcademicStore } from '../stores/useAcademicStore';
import { useSystemStore } from '../stores/useSystemStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useUIStore } from '../stores/useUIStore';
import { loadBackup, deleteBackup } from '../services/backupService';
import {
    loadKbContentFromIndexedDB,
    saveKbContentToIndexedDB,
    clearIndexedDB,
} from '../services/indexedDbService';
import { validateBackupData } from '../utils/dataValidator';
import { ImportService } from '../services/importService';
import { logger } from '../utils/logger';
import type {
    BackupPayload, KnowledgeBaseEntry, BackupState, DriveSyncState, View,
} from '../types.ts';
import type { ShowToast } from './useNotificationEngine';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useBackupEngine = (showToast: ShowToast) => {
    const isTestMode =
        (typeof window !== 'undefined' &&
            (window as { __TEST_MODE?: boolean }).__TEST_MODE === true) ||
        ((import.meta as ImportMeta).env?.VITE_TEST_MODE === 'true');

    const [isDataLoaded, setIsDataLoaded] = useState(false);

    const {
        students, evaluations, competencyEvals, pianiInclusione, studentProfileContext,
        selectedClassForDashboard,
        actions: studentActions,
    } = useStudentStore();
    const {
        lessons, slots, uda, eventi, rubriche, curricula, submissions,
        draftRegister, finalizedRegister, giudizi, reportistica,
        actions: academicActions,
    } = useAcademicStore();
    const {
        user, knowledgeBase, corpora, notifiche, feedSources,
        suggestions, activeSuggestion, dismissedSuggestions,
        actions: systemActions,
    } = useSystemStore();
    const { settings, aiSettings, themeState, actions: settingsActions } = useSettingsStore();
    const {
        backupState, driveSyncState, navigationHistory, installPrompt,
        canShowInstallPrompt, isGlobalAiLoading,
        actions: uiActions,
    } = useUIStore();

    // --- DEMO DATA LOAD ---
    const handleLoadDemoData = useCallback(() => {
        import('../services/demoData.ts').then(module => {
            const demoData = module.DEMO_DATA as Partial<BackupPayload>;
            studentActions.loadFromBackup(demoData);
            academicActions.loadFromBackup(demoData);
            systemActions.loadFromBackup(demoData);
            settingsActions.loadFromBackup({});
            uiActions.setBackupState({ status: 'synced', lastBackup: new Date() });
            uiActions.setDriveSyncState({ isAuthenticated: false, isSyncing: false, lastSyncTime: null, error: undefined });
            systemActions.setNotifiche([]);
            uiActions.setInstallPrompt(null);
            uiActions.setCanShowInstallPrompt(false);
            uiActions.setIsGlobalAiLoading(false);
            uiActions.clearNavigationHistory();
            showToast('demoLoaded', 'success');
        });
     
    }, [showToast, studentActions, academicActions, systemActions, settingsActions, uiActions]);

    // --- INITIAL DATA LOAD EFFECT ---
    useEffect(() => {
        const load = async () => {
            try {
                setIsDataLoaded(false);
                uiActions.setIsRestoring(true);

                if (isTestMode) {
                    logger.info('[useBackupEngine] Test mode — attempting test backup restore or demo user');
                    systemActions.setUser({ id: 'test-local', displayName: 'Test Teacher' } as { id: string; displayName: string });
                    settingsActions.loadFromBackup({});
                    uiActions.setBackupState({ status: 'synced', lastBackup: null } as BackupState);
                    uiActions.setDriveSyncState({ isAuthenticated: false, isSyncing: false, lastSyncTime: null, error: undefined });
                    uiActions.setNavigationHistory([] as { view: View; context: unknown }[]);
                    if (uiActions.toggleModal) uiActions.toggleModal('isLiveAssistantModalOpen', false);

                    try {
                        const raw = await loadBackup();
                        const localData = raw ? validateBackupData(raw) : null;
                        if (localData) {
                            logger.info('[useBackupEngine] Test backup found — restoring');
                            studentActions.loadFromBackup(localData);
                            academicActions.loadFromBackup(localData);
                            systemActions.loadFromBackup(localData);
                            settingsActions.loadFromBackup({
                                settings: localData.settings,
                                aiSettings: localData.aiSettings,
                                themeState: localData.themeState,
                            });
                            uiActions.setBackupState(localData.backupState || { status: 'synced', lastBackup: null });
                            uiActions.setDriveSyncState(localData.driveSyncState || { isAuthenticated: false, isSyncing: false, lastSyncTime: null, error: undefined });
                            uiActions.setNavigationHistory(localData.navigationHistory || []);
                            try {
                                const kbContentMap = await loadKbContentFromIndexedDB();
                                const fullKb = (localData.knowledgeBase || []).map((entry: KnowledgeBaseEntry) => ({
                                    ...entry,
                                    ...(kbContentMap[entry.id] || {}),
                                }));
                                systemActions.setKnowledgeBase(fullKb);
                            } catch (kbError) {
                                logger.warn('[useBackupEngine] KB load failed during test restore:', kbError);
                            }
                        } else {
                            logger.info('[useBackupEngine] No test backup, using demo-light state');
                            try {
                                setTimeout(() => { handleLoadDemoData(); }, 200);
                            } catch (e) {
                                logger.warn('[useBackupEngine] Demo load failed in test mode:', e);
                            }
                        }
                    } catch (e) {
                        logger.warn('[useBackupEngine] Test backup restore attempt failed:', e);
                    }

                    setIsDataLoaded(true);
                    uiActions.setIsRestoring(false);
                    return;
                }

                const rawData = await loadBackup();
                const localData = rawData ? validateBackupData(rawData) : null;

                if (localData) {
                    logger.debug('[useBackupEngine] Valid backup found, restoring…');
                    studentActions.loadFromBackup(localData);
                    academicActions.loadFromBackup(localData);
                    systemActions.loadFromBackup(localData);
                    settingsActions.loadFromBackup({
                        settings: localData.settings,
                        aiSettings: localData.aiSettings,
                        themeState: localData.themeState,
                    });
                    uiActions.setBackupState(localData.backupState || { status: 'synced', lastBackup: null });
                    uiActions.setDriveSyncState(localData.driveSyncState || { isAuthenticated: false, isSyncing: false, lastSyncTime: null, error: undefined });
                    uiActions.setNavigationHistory(localData.navigationHistory || []);
                    uiActions.setInstallPrompt(null);
                    uiActions.setCanShowInstallPrompt(false);
                    uiActions.setIsGlobalAiLoading(false);

                    try {
                        const kbContentMap = await loadKbContentFromIndexedDB();
                        const fullKb = (localData.knowledgeBase || []).map((entry: KnowledgeBaseEntry) => ({
                            ...entry,
                            ...(kbContentMap[entry.id] || {}),
                        }));
                        systemActions.setKnowledgeBase(fullKb);
                    } catch (kbError) {
                        logger.warn('[useBackupEngine] KB content load failed, using light data:', kbError);
                    }
                } else {
                    logger.debug('[useBackupEngine] No valid backup found, starting empty state.');
                }
            } catch (e) {
                logger.error('[useBackupEngine] Initial data load failed:', e);
                studentActions.resetStudentData();
                academicActions.resetAcademicData();
                systemActions.resetSystemData();
                settingsActions.reset();
                uiActions.clearNavigationHistory();
                uiActions.setBackupState({ status: 'error', lastBackup: null });
                uiActions.setDriveSyncState({ isAuthenticated: false, isSyncing: false, lastSyncTime: null, error: 'Initial load failed' });
            } finally {
                setIsDataLoaded(true);
                uiActions.setIsRestoring(false);
            }
        };
        load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- CLEAN DEMO DATA ---
    const handleCleanDemoData = useCallback(async () => {
        await deleteBackup();
        await clearIndexedDB();
        studentActions.resetStudentData();
        academicActions.resetAcademicData();
        systemActions.resetSystemData();
        settingsActions.reset();
        uiActions.setBackupState({ status: 'synced', lastBackup: null });
        uiActions.setDriveSyncState({ isAuthenticated: false, isSyncing: false, lastSyncTime: null, error: undefined });
        uiActions.clearNavigationHistory();
        systemActions.setNotifiche([]);
        uiActions.setInstallPrompt(null);
        uiActions.setCanShowInstallPrompt(false);
        uiActions.setIsGlobalAiLoading(false);
        showToast('delete', 'success');
     
    }, [showToast, studentActions, academicActions, systemActions, settingsActions, uiActions]);

    // --- EXPORT DATA ---
    const handleExportData = useCallback(async () => {
        const snapshot = {
            user, students, lessons, slots, evaluations, competencyEvals, uda, eventi,
            knowledgeBase, corpora, notifiche, rubriche, pianiInclusione, giudizi, reportistica,
            feedSources, draftRegister, finalizedRegister, curricula, submissions,
            suggestions, activeSuggestion, studentProfileContext, selectedClassForDashboard,
            settings, aiSettings, themeState,
            dismissedSuggestions: Array.from(dismissedSuggestions),
            navigationHistory, installPrompt, canShowInstallPrompt, isGlobalAiLoading,
            backupState, driveSyncState,
        };
        const dataStr = JSON.stringify(snapshot);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `OrarioDoc_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, students, lessons, slots, evaluations, competencyEvals, uda, eventi,
        knowledgeBase, corpora, notifiche, rubriche, pianiInclusione, giudizi, reportistica,
        feedSources, draftRegister, finalizedRegister, curricula, submissions,
        settings, aiSettings, themeState, navigationHistory, backupState, driveSyncState,
        installPrompt, canShowInstallPrompt, isGlobalAiLoading, dismissedSuggestions]);

    // --- IMPORT DATA ---
    const handleImportData = useCallback(async (file: File) => {
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (extension === 'json') {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target?.result as string);
                    if (data.settings || data.students || data.lessons) {
                        studentActions.loadFromBackup(data);
                        academicActions.loadFromBackup(data);
                        systemActions.loadFromBackup(data);
                        settingsActions.loadFromBackup({
                            settings: data.settings,
                            aiSettings: data.aiSettings,
                            themeState: data.themeState,
                        });
                        uiActions.setBackupState(data.backupState ?? { status: 'synced', lastBackup: null });
                        uiActions.setDriveSyncState(data.driveSyncState ?? { isAuthenticated: false, isSyncing: false, lastSyncTime: null, error: undefined });
                        showToast('imported', 'success');
                        return;
                    }
                    const result = await ImportService.parseFile(file);
                    if (result.students.length > 0) {
                        studentActions.importStudents(result.students);
                        if (result.evaluations.length > 0) {
                            studentActions.importEvaluations(result.evaluations);
                        }
                        showToast('imported', 'success');
                    } else {
                        showToast('invalidFile', 'error');
                    }
                } catch {
                    showToast('invalidFile', 'error');
                }
            };
            reader.readAsText(file);
        } else {
            try {
                const result = await ImportService.parseFile(file);
                if (result.students.length > 0) {
                    studentActions.importStudents(result.students);
                    if (result.evaluations.length > 0) {
                        studentActions.importEvaluations(result.evaluations);
                    }
                    showToast('imported', 'success');
                } else if (result.errors.length > 0) {
                    logger.error('Import errors:', result.errors);
                    showToast('invalidFile', 'error');
                } else {
                    showToast('invalidFile', 'error');
                }
            } catch {
                showToast('invalidFile', 'error');
            }
        }
     
    }, [showToast, studentActions, academicActions, systemActions, settingsActions, uiActions]);

    return {
        isDataLoaded,
        handleLoadDemoData,
        handleCleanDemoData,
        handleExportData,
        handleImportData,
    };
};

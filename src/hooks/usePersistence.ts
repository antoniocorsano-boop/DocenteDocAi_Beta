 
import { useEffect, useRef } from 'react';
import { saveKbContentToIndexedDB } from '../services/indexedDbService.ts';
import { saveBackup } from '../services/backupService.ts';
import { KnowledgeBaseEntry, BackupPayload } from '../types.ts';

// Import stores directly to avoid dynamic import issues in tests and ensure reliability
import { useStudentStore } from '../stores/useStudentStore.ts';
import { useAcademicStore } from '../stores/useAcademicStore.ts';
import { useSystemStore } from '../stores/useSystemStore.ts';
import { useSettingsStore } from '../stores/useSettingsStore.ts';
import { useUIStore } from '../stores/useUIStore.ts';
import { logger } from '../utils/logger';

/**
 * Middleware di Persistenza Unificato.
 * Gestisce il salvataggio automatico su IndexedDB e previene conflitti durante il ripristino.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const usePersistence = (isDataLoaded: boolean) => {
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isSavingRef = useRef(false);
    // Emergency stabilization: add dirty-check and rate limit
    const lastSavedDataRef = useRef<BackupPayload | null>(null);
    const lastSaveTimeRef = useRef<number>(0);
    const SAVE_DEBOUNCE_MS = 1000;
    const SAVE_RATE_LIMIT_MS = 5000;

    useEffect(() => {
        // Safety check: ensure store functions exist and have getState
        if (!useStudentStore?.getState || !useAcademicStore?.getState || !useSystemStore?.getState || !useSettingsStore?.getState || !useUIStore?.getState) {
            return;
        }
        
        let setBackupState: ((stateOrFn: import('../types').BackupState | ((prev: import('../types').BackupState) => import('../types').BackupState)) => void) | undefined;
        let isRestoring: boolean;
        
        try {
            // Use getState() instead of hook syntax inside useEffect
            const uiState = useUIStore.getState();
            setBackupState = uiState.actions?.setBackupState;
            isRestoring = uiState.modals?.isRestoring ?? false;
        } catch (e) {
            logger.error('Failed to access store state:', e);
            return;
        }

        // Non avviare salvataggi se i dati non sono pronti o è in corso un restore
        if (!isDataLoaded || !setBackupState || isRestoring) return;

        const handleSave = async () => {
            if (isSavingRef.current) {
                logger.debug('[usePersistence] Save already in progress, skipping');
                return;
            }
            // Dirty-check and rate limit
             
            const { actions: _studentActions, ...studentStateRaw } = useStudentStore.getState();
             
            const { actions: _academicActions, ...academicStateRaw } = useAcademicStore.getState();
             
            const { actions: _systemActions, ...systemStateRaw } = useSystemStore.getState();
             
            const { actions: _settingsActions, ...settingsStateRaw } = useSettingsStore.getState();
             
            const { actions: uiActions, ...uiStateRaw } = useUIStore.getState();

            // Create clean, serializable versions of states
            const studentState = { ...studentStateRaw };
            const academicState = { ...academicStateRaw };
            const systemState = {
                ...systemStateRaw,
                dismissedSuggestions: Array.from(systemStateRaw.dismissedSuggestions || []),
            };
            const settingsState = { ...settingsStateRaw };
            const uiState = {
                installPrompt: null,
                canShowInstallPrompt: uiStateRaw.canShowInstallPrompt,
                isGlobalAiLoading: uiStateRaw.isGlobalAiLoading,
                navigationHistory: uiStateRaw.navigationHistory,
                backupState: uiStateRaw.backupState,
                driveSyncState: uiStateRaw.driveSyncState,
            };

            // Prepare backup payload for dirty-check
            const lightKb = (systemState.knowledgeBase || []).map((kb: KnowledgeBaseEntry) => ({
                ...kb,
                content: '',
                htmlContent: '',
                fileContent: undefined
            }));
            const backupPayload: BackupPayload = {
                ...studentState,
                ...academicState,
                ...systemState,
                knowledgeBase: lightKb,
                settings: settingsState.settings,
                aiSettings: settingsState.aiSettings,
                themeState: settingsState.themeState,
                installPrompt: uiState.installPrompt,
                canShowInstallPrompt: uiState.canShowInstallPrompt,
                isGlobalAiLoading: uiState.isGlobalAiLoading,
                navigationHistory: uiState.navigationHistory,
                backupState: uiState.backupState,
                driveSyncState: uiState.driveSyncState,
            } as unknown as BackupPayload;

            const now = Date.now();
            const lastSavedData = lastSavedDataRef.current;
            const lastSaveTime = lastSaveTimeRef.current;
            const isDirty = JSON.stringify(backupPayload) !== JSON.stringify(lastSavedData);
            const isRateLimited = now - lastSaveTime < SAVE_RATE_LIMIT_MS;
            if (!isDirty) {
                logger.debug('[usePersistence] No changes detected, skipping save');
                return;
            }
            if (isRateLimited) {
                logger.debug('[usePersistence] Save rate-limited, skipping save');
                return;
            }
            isSavingRef.current = true;
            try {
                logger.debug('[usePersistence] Starting save operation...');
                // 1. Persist heavy KB content
                if (systemState.knowledgeBase && systemState.knowledgeBase.length > 0) {
                    logger.debug('[usePersistence] Saving KB content to IndexedDB...');
                    await saveKbContentToIndexedDB(systemState.knowledgeBase);
                }
                // 2. Save backup
                logger.debug('[usePersistence] Saving backup...');
                await saveBackup(backupPayload);
                lastSavedDataRef.current = backupPayload;
                lastSaveTimeRef.current = Date.now();
                logger.debug('[usePersistence] Save operation completed successfully');
            } catch (error) {
                logger.error("Auto-save Bridge failed:", error);
                const currentUiActions = useUIStore.getState().actions;
                if (currentUiActions?.setBackupState) {
                    currentUiActions.setBackupState({ status: 'error' } as import('../types').BackupState);
                }
            } finally {
                isSavingRef.current = false;
            }
        };

        const triggerDebouncedSave = () => {
            logger.debug('[usePersistence] Save triggered, scheduling debounced save...');
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
                logger.debug('[usePersistence] Executing debounced save...');
                handleSave();
            }, SAVE_DEBOUNCE_MS);
        };

        // Sottoscrizione ai cambiamenti degli store core
        const unsubStudent = useStudentStore.subscribe(() => {
            logger.debug('[usePersistence] Student store changed, triggering save');
            triggerDebouncedSave();
        });
        const unsubAcademic = useAcademicStore.subscribe(() => {
            logger.debug('[usePersistence] Academic store changed, triggering save');
            triggerDebouncedSave();
        });
        const unsubSystem = useSystemStore.subscribe(() => {
            logger.debug('[usePersistence] System store changed, triggering save');
            triggerDebouncedSave();
        });
        const unsubSettings = useSettingsStore.subscribe(() => {
            logger.debug('[usePersistence] Settings store changed, triggering save');
            triggerDebouncedSave();
        });
        
        // Don't subscribe to UI store changes to avoid loops
        // const unsubUi = useUIStore.subscribe(triggerDebouncedSave);

        return () => {
            unsubStudent();
            unsubAcademic();
            unsubSystem();
            unsubSettings();
            // unsubUi(); // Disabled to prevent loops
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [isDataLoaded]);
};


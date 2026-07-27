/**
 * useDriveSyncEngine — Google Drive OAuth, sync, restore, auto-sync.
 *
 * Estratto da useAppEngine (Step 1 – Foundation Stabilization).
 * Responsabilità:
 *   - handleConnectDrive / handleDisconnectDrive / handleConfigureDrive
 *   - handleSyncToDrive (con conflict detection)
 *   - handleRestoreFromDrive
 *   - Auto-sync interval effect
 */
 
import { useEffect, useCallback } from 'react';
import {
    initTokenClient, requestAccessToken, revokeAccessToken,
    uploadBackup, downloadBackup, getBackupMetadata,
    pickGoogleDriveFolder, createAppFolder,
} from '../services/googleDriveService';
import { saveKbContentToIndexedDB } from '../services/indexedDbService';
import { useStudentStore } from '../stores/useStudentStore';
import { useAcademicStore } from '../stores/useAcademicStore';
import { useSystemStore } from '../stores/useSystemStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useUIStore } from '../stores/useUIStore';
import { cognitionBus } from '../cognition/CognitionBus';
import type { BackupPayload } from '../types.ts';
import type { ShowToast } from './useNotificationEngine';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useDriveSyncEngine = (showToast: ShowToast, isDataLoaded: boolean) => {
    const { actions: studentActions } = useStudentStore();
    const { actions: academicActions } = useAcademicStore();
    const {
        students, evaluations, competencyEvals, pianiInclusione, studentProfileContext,
        selectedClassForDashboard,
    } = useStudentStore();
    const {
        lessons, slots, uda, eventi, rubriche, curricula, submissions,
        draftRegister, finalizedRegister, giudizi, reportistica,
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

    // --- CONNECT / DISCONNECT ---
    const handleConnectDrive = useCallback(() => {
        const initialized = initTokenClient((_tokenResponse) => {
            uiActions.setDriveSyncState(prev => ({ ...prev, isAuthenticated: true }));
            cognitionBus.emit('drive.connected', {});
            showToast('driveConnected', 'success');
        }, settings.googleClientId);

        if (initialized) requestAccessToken();
        else showToast('driveInitError', 'error');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings.googleClientId]);

    const handleDisconnectDrive = useCallback(() => {
        revokeAccessToken();
        uiActions.setDriveSyncState({ isAuthenticated: false, isSyncing: false, lastSyncTime: null, error: undefined });
        showToast('driveDisconnected', 'info');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleConfigureDrive = useCallback((clientId: string, apiKey?: string) => {
        settingsActions.updateSettings({ googleClientId: clientId, googleApiKey: apiKey });
        showToast('driveConfigUpdated', 'success');
    }, [showToast, settingsActions]);

    // --- SYNC TO DRIVE ---
    const handleSyncToDrive = useCallback(async (folderId?: string) => {
        if (!driveSyncState.isAuthenticated) return;

        uiActions.setDriveSyncState(prev => ({ ...prev, isSyncing: true, error: undefined }));
        try {
            const remoteMeta = await getBackupMetadata(folderId || settings.backupFolderId || '') as { modifiedTime?: string } | null;
            if (
                remoteMeta?.modifiedTime &&
                driveSyncState.lastSyncTime &&
                new Date(remoteMeta.modifiedTime) > new Date(driveSyncState.lastSyncTime)
            ) {
                uiActions.setSyncConflictModal({
                    isOpen: true,
                    data: {
                        remoteTime: new Date(remoteMeta.modifiedTime!).getTime(),
                        localTime: new Date(driveSyncState.lastSyncTime as string).getTime(),
                    },
                });
                uiActions.setDriveSyncState(prev => ({ ...prev, isSyncing: false }));
                return;
            }

            const payload: Partial<BackupPayload> = {
                user, students, lessons, slots, evaluations, competencyEvals, uda, eventi,
                knowledgeBase, corpora, notifiche, rubriche, pianiInclusione, giudizi, reportistica,
                feedSources, draftRegister, finalizedRegister, curricula, submissions,
                suggestions, activeSuggestion, studentProfileContext, selectedClassForDashboard,
                settings, aiSettings, themeState,
                dismissedSuggestions: Array.from(dismissedSuggestions) as unknown as Set<string>,
                backupState, driveSyncState,
                navigationHistory: navigationHistory as unknown as import('../types').BackupPayload['navigationHistory'],
                installPrompt, canShowInstallPrompt, isGlobalAiLoading,
            };

            await uploadBackup(payload, folderId || settings.backupFolderId);
            uiActions.setDriveSyncState(prev => ({ ...prev, isSyncing: false, lastSyncTime: new Date() }));
            cognitionBus.emit('drive.backup.saved', {});
            showToast('success', 'success');
        } catch (e: unknown) {
            showToast('error', 'error');
            uiActions.setDriveSyncState(prev => ({ ...prev, isSyncing: false, error: e instanceof Error ? e.message : String(e) }));
        }
    }, [user, students, lessons, slots, evaluations, competencyEvals, uda, eventi,
        knowledgeBase, corpora, notifiche, rubriche, pianiInclusione, giudizi, reportistica,
        feedSources, draftRegister, finalizedRegister, curricula, submissions,
        suggestions, activeSuggestion, studentProfileContext, selectedClassForDashboard,
        settings, aiSettings, themeState, driveSyncState, navigationHistory,
        uiActions, showToast, installPrompt, canShowInstallPrompt, isGlobalAiLoading,
        dismissedSuggestions, backupState]);

    // --- AUTO-SYNC INTERVAL ---
    useEffect(() => {
        if (!isDataLoaded || !settings.autoSyncEnabled || !driveSyncState.isAuthenticated) return;
        const interval = setInterval(() => { handleSyncToDrive(); }, (settings.autoSyncInterval || 30) * 60 * 1000);
        return () => clearInterval(interval);
    }, [isDataLoaded, settings.autoSyncEnabled, settings.autoSyncInterval, driveSyncState.isAuthenticated, handleSyncToDrive]);

    // --- RESTORE FROM DRIVE ---
    const handleRestoreFromDrive = useCallback(async (folderId?: string) => {
        if (!driveSyncState.isAuthenticated) return;

        uiActions.setDriveSyncState(prev => ({ ...prev, isSyncing: true, error: undefined }));
        uiActions.setIsRestoring(true);

        try {
            const restoredData = await downloadBackup(folderId || settings.backupFolderId || '') as Partial<BackupPayload> | null;
            if (restoredData) {
                studentActions.loadFromBackup(restoredData);
                academicActions.loadFromBackup(restoredData);
                systemActions.loadFromBackup(restoredData);
                settingsActions.loadFromBackup({
                    settings: restoredData.settings,
                    aiSettings: restoredData.aiSettings,
                    themeState: restoredData.themeState,
                });
                uiActions.setBackupState(restoredData.backupState ?? { status: 'synced', lastBackup: new Date() });
                uiActions.setDriveSyncState(restoredData.driveSyncState ?? { isAuthenticated: true, isSyncing: false, lastSyncTime: new Date() });
                uiActions.setNavigationHistory(restoredData.navigationHistory ?? []);
                uiActions.setInstallPrompt(restoredData.installPrompt ?? null);
                uiActions.setCanShowInstallPrompt(restoredData.canShowInstallPrompt ?? false);
                uiActions.setIsGlobalAiLoading(restoredData.isGlobalAiLoading ?? false);

                if (restoredData.knowledgeBase) {
                    await saveKbContentToIndexedDB(restoredData.knowledgeBase);
                    systemActions.setKnowledgeBase(restoredData.knowledgeBase);
                }
                cognitionBus.emit('drive.backup.restored', {});
                showToast('restoreSuccess', 'success');
            }
        } catch (e: unknown) {
            showToast('restoreError', 'error');
            uiActions.setDriveSyncState(prev => ({ ...prev, error: e instanceof Error ? e.message : String(e) }));
        } finally {
            uiActions.setDriveSyncState(prev => ({ ...prev, isSyncing: false }));
            uiActions.setIsRestoring(false);
        }
    }, [studentActions, academicActions, systemActions, settingsActions, driveSyncState, uiActions, settings.backupFolderId, showToast]);

    return {
        handleConnectDrive,
        handleDisconnectDrive,
        handleSyncToDrive,
        handleRestoreFromDrive,
        handleConfigureDrive,
        /** Re-export for consumers that previously imported from googleDriveService via AppEngine */
        pickGoogleDriveFolder,
        createAppFolder,
    };
};

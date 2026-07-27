// MD3 Compliant
/**
 * SettingsViews.tsx
 * Raggruppa viste relative a configurazione e gestione
 * - Settings
 * - Home
 * - KnowledgeBase
 * - Studio
 * - FeedManager
 */

/**
 * SettingsViews.tsx
 * // M3Expressive refactor: Componente renderer senza stili, già conforme M3.
 */

import React from 'react';
import Settings from '../Settings';
import Home from '../Home';
import KnowledgeBase from '../KnowledgeBase';
import { Studio } from '../Studio';
import FeedManager from '../FeedManager';
import CopilotView from './CopilotView';
import {
    Lezione, KnowledgeBaseEntry, Corpus, Studente,
    Valutazione, ValutazioneCompetenza, RegisterEntry, AiSuggestion,
    TimetableSettings, AppThemeState, AiSettings, BackupState, DriveSyncState,
    AppState, Slot,
    Notifica, BeforeInstallPromptEvent
} from '../../types';

export interface SettingsViewsProps {
    settings: TimetableSettings;
    themeState: AppThemeState;
    aiSettings: AiSettings;
    backupState: BackupState;
    driveSyncState: DriveSyncState;
    knowledgeBase: KnowledgeBaseEntry[];
    corpora: Corpus[];
    notifiche: Notifica[];
    slots: Record<string, Slot>;
    lessons: Record<string, Lezione>;
    studenti: Studente[];
    students: Studente[];
    evaluations: Valutazione[];
    competencyEvals: ValutazioneCompetenza[];
    finalizedRegister: RegisterEntry[];
    draftRegister: Record<string, RegisterEntry>;
    suggestions: AiSuggestion[];
    isGlobalAiLoading: boolean;
    installPrompt: BeforeInstallPromptEvent | null;
    viewContext?: unknown;
    onNavigate: (view: string, context?: unknown) => void;
    onUpdateSettings: (settings: TimetableSettings) => void;
    onUpdateTheme: (theme: AppThemeState) => void;
    onUpdateAiSettings: (settings: AiSettings) => void;
    onExportData: () => void;
    onImportData: (file: File) => void;
    onDownloadDemoData: () => void;
    onCleanDemoData: () => void;
    onRestoreFromBackup: () => void;
    onLogout: () => void;
    onInstallApp: () => void;
    onEnterStudentMode: () => void;
    onConnectDrive: () => void;
    onDisconnectDrive: () => void;
    onSyncToDrive: () => void;
    onConfigureDrive: () => void;
    onSelectBackupFolder: (apiKey: string) => Promise<{ id: string; name: string; } | null>;
    onCreateAppFolder: () => void;
    onOpenBackupInfo: () => void;
    showToast: (message: string, type?: "success" | "error" | "info") => void;
    dismissSuggestion: (id: string) => void;
    setKnowledgeBase: React.Dispatch<React.SetStateAction<KnowledgeBaseEntry[]>>;
    setCorpora: React.Dispatch<React.SetStateAction<Corpus[]>>;
    setNotifiche: (updater: (prev: Notifica[]) => Notifica[]) => void;
    setIsGlobalAiLoading: (loading: boolean) => void;
    onStartClassroom: (classe: string, materia: string, draftKey: string, lesson: Lezione) => void;
    onSuggestionAction: (action: string) => void;
    onOpenOperations: () => void;
    dismissedSuggestions?: Set<string>;
    onReactivateSuggestion?: (id: string) => void;
}

export const SettingsViewsRenderer: React.FC<{
    viewType: 'home' | 'settings' | 'knowledge-base' | 'studio' | 'feed-manager' | 'copilot';
    props: SettingsViewsProps;
}> = ({ viewType, props }) => {
    switch (viewType) {
        case 'home':
            return (
                <Home
                    onNavigate={props.onNavigate}
                    appState={{
                        user: null,
                        students: props.students,
                        lessons: props.lessons,
                        slots: props.slots,
                        evaluations: props.evaluations,
                        competencyEvals: props.competencyEvals,
                        udas: [],
                        eventi: [],
                        knowledgeBase: props.knowledgeBase,
                        corpora: props.corpora,
                        notifiche: props.notifiche,
                        rubriche: [],
                        pianiInclusione: {},
                        giudizi: {},
                        reports: [],
                        feedSources: [],
                        draftRegister: props.draftRegister,
                        finalizedRegister: props.finalizedRegister,
                        curricula: [],
                        submissions: [],
                        settings: props.settings,
                        aiSettings: props.aiSettings,
                        themeState: props.themeState,
                        backupState: props.backupState,
                        driveSyncState: props.driveSyncState,
                        installPrompt: props.installPrompt,
                    } as unknown as AppState}
                    onSuggestionAction={(action: { type: string; payload?: unknown }) => props.onSuggestionAction(action.type)}
                    onStartClassroom={props.onStartClassroom}
                    finalizedRegister={props.finalizedRegister}
                    draftRegister={props.draftRegister}
                    showGuidanceTips={props.settings.showGuidanceTips}
                    suggestions={props.suggestions}
                    dismissSuggestion={props.dismissSuggestion}
                    onAiProcessing={props.setIsGlobalAiLoading}
                    user={null}
                    onConnectDrive={props.onConnectDrive}
                    aiSettings={props.aiSettings}
                    settings={props.settings}
                    handleOpenOperations={props.onOpenOperations}
                />
            );
        case 'settings':
            return (
                <Settings
                    settings={props.settings}
                    themeState={props.themeState}
                    aiSettings={props.aiSettings}
                    onSaveSettings={props.onUpdateSettings}
                    onSaveTheme={props.onUpdateTheme}
                    onSaveAiSettings={props.onUpdateAiSettings}
                    onExportData={props.onExportData}
                    onImportData={props.onImportData}
                    showToast={props.showToast}
                    onDownloadDemoData={props.onDownloadDemoData}
                    onCleanDemoData={props.onCleanDemoData}
                    backupState={props.backupState}
                    onRestoreFromBackup={props.onRestoreFromBackup}
                    onLogout={props.onLogout}
                    installPrompt={props.installPrompt}
                    onInstallApp={props.onInstallApp}
                    onEnterStudentMode={props.onEnterStudentMode}
                    driveState={props.driveSyncState}
                    onConnectDrive={props.onConnectDrive}
                    onDisconnectDrive={props.onDisconnectDrive}
                    onSyncToDrive={props.onSyncToDrive}
                    onRestoreFromDrive={props.onRestoreFromBackup}
                    onConfigureDrive={props.onConfigureDrive}
                    onSelectBackupFolder={props.onSelectBackupFolder}
                    onCreateAppFolder={async () => {
                        props.onCreateAppFolder();
                        return { id: '', name: '' };
                    }}
                    onClose={() => {}}
                    onOpenBackupInfo={props.onOpenBackupInfo}
                    dismissedSuggestions={props.dismissedSuggestions ?? new Set()}
                    onReactivateSuggestion={props.onReactivateSuggestion ?? (() => {})}
                />
            );
        case 'knowledge-base':
            return (
                <KnowledgeBase
                    knowledgeBase={props.knowledgeBase}
                    setKnowledgeBase={props.setKnowledgeBase}
                    corpora={props.corpora}
                    setCorpora={props.setCorpora}
                    aiSettings={props.aiSettings}
                    showToast={props.showToast}
                    settings={props.settings}
                    showGuidanceTips={props.settings.showGuidanceTips}
                    onNavigate={props.onNavigate as any}
                />
            );
        case 'studio':
            return (
                <Studio
                    corpora={props.corpora}
                    knowledgeBase={props.knowledgeBase}
                    setKnowledgeBase={props.setKnowledgeBase}
                    aiSettings={props.aiSettings}
                    onOpenCreateLesson={() => {}}
                    showToast={props.showToast}
                    showGuidanceTips={props.settings.showGuidanceTips}
                    onAiProcessing={props.setIsGlobalAiLoading}
                    onNavigate={props.onNavigate as any}
                />
            );
        case 'feed-manager':
            return (
                <FeedManager
                    showToast={props.showToast}
                    sources={[]}
                    setSources={() => {}}
                    onOpenCircularAnalysis={() => {}}
                />
            );
        case 'copilot': {
            const ctx = props.viewContext;
            const subTab = typeof ctx === 'object' && ctx !== null && 'subTab' in ctx
                ? (ctx as { subTab?: string }).subTab
                : undefined;
            return <CopilotView initialSubTab={subTab} />;
        }
        default:
            return null;
    }
};


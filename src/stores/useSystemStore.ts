import { create } from 'zustand';
import {
    UserProfile, AnalyticsEvent, AnalyticsMetrics, AnalyticsSettings,
    Notifica, AiSuggestion, SystemSuggestion, KnowledgeBaseEntry,
    Corpus, DocumentTemplate, FeedSource
} from '../types';
import { INITIAL_KB_GUIDE } from '../constants';
import { DEFAULT_TEMPLATES } from '../constants/defaultTemplates';
import { initKeyVault, clearKeyVault } from '../modules/system/KeyVault';

// ============================================================================
// TYPES
// ============================================================================

// System State interface - defines the shape of the store state
export interface SystemState {
    user: UserProfile | null;
    analyticsEvents: AnalyticsEvent[];
    analyticsMetrics: AnalyticsMetrics;
    analyticsSettings: AnalyticsSettings;
    notifiche: Notifica[];
    suggestions: AiSuggestion[];
    activeSuggestion: SystemSuggestion | null;
    dismissedSuggestions: Set<string>;
    knowledgeBase: KnowledgeBaseEntry[];
    corpora: Corpus[];
    templates: DocumentTemplate[];
    feedSources: FeedSource[];
}

// System Actions interface - defines all available actions
export interface SystemActions {
    setUser: (user: UserProfile | null) => void;
    setAnalyticsEvents: (input: AnalyticsEvent[] | ((prev: AnalyticsEvent[]) => AnalyticsEvent[])) => void;
    setAnalyticsMetrics: (input: AnalyticsMetrics | ((prev: AnalyticsMetrics) => AnalyticsMetrics)) => void;
    setAnalyticsSettings: (input: AnalyticsSettings | ((prev: AnalyticsSettings) => AnalyticsSettings)) => void;
    trackAnalyticsEvent: (eventType: AnalyticsEvent['eventType'], featureName: string, metadata?: Record<string, string | number | boolean>) => void;
    setNotifiche: (input: Notifica[] | ((prev: Notifica[]) => Notifica[])) => void;
    setSuggestions: (suggestions: AiSuggestion[]) => void;
    setActiveSuggestion: (activeSuggestion: SystemSuggestion | null) => void;
    dismissSuggestion: (id: string) => void;
    reactivateSuggestion: (id: string) => void;
    setKnowledgeBase: (input: KnowledgeBaseEntry[] | ((prev: KnowledgeBaseEntry[]) => KnowledgeBaseEntry[])) => void;
    setCorpora: (input: Corpus[] | ((prev: Corpus[]) => Corpus[])) => void;
    setTemplates: (input: DocumentTemplate[] | ((prev: DocumentTemplate[]) => DocumentTemplate[])) => void;
    setFeedSources: (input: FeedSource[] | ((prev: FeedSource[]) => FeedSource[])) => void;
    loadFromBackup: (data: Partial<SystemState>) => void;
    resetSystemData: () => void;
}

// Complete store type - combines state and actions
export type SystemStore = SystemState & { actions: SystemActions };

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

// Create the Zustand store with proper typing
export const useSystemStore = create<SystemStore>((set) => ({
    user: null,
    analyticsEvents: [],
    analyticsMetrics: {
        totalDocumentsGenerated: 0,
        documentsByType: {},
        featuresUsage: {},
        templatesCreated: 0,
        exportBatchesCount: 0,
        aiInteractionsCount: 0,
        averageSessionDuration: 0,
        lastUpdated: new Date().toISOString()
    },
    analyticsSettings: {
        enabled: true,
        collectFeatureUsage: true,
        collectDocumentMetrics: true,
        collectPerformanceMetrics: false,
        retentionDays: 90,
        lastReset: null
    },
    notifiche: [],
    suggestions: [],
    activeSuggestion: null,
    dismissedSuggestions: new Set<string>(),
    knowledgeBase: [INITIAL_KB_GUIDE],
    corpora: [],
    templates: DEFAULT_TEMPLATES,
    feedSources: [],
    actions: {
        setUser: (user) => {
            set({ user });
            // P24: initialise/clear the per-user encryption key on every identity change
            if (user) {
                void initKeyVault({ id: user.id, email: user.email });
            } else {
                clearKeyVault();
            }
        },
        setAnalyticsEvents: (input) => set((state) => ({ 
            analyticsEvents: typeof input === 'function' ? input(state.analyticsEvents) : input 
        })),
        setAnalyticsMetrics: (input) => set((state) => ({ 
            analyticsMetrics: typeof input === 'function' ? input(state.analyticsMetrics) : input 
        })),
        setAnalyticsSettings: (input) => set((state) => ({ 
            analyticsSettings: typeof input === 'function' ? input(state.analyticsSettings) : input 
        })),
        trackAnalyticsEvent: (eventType, featureName, metadata) => set((state) => {
            if (!state.analyticsSettings.enabled) return state;
            const sessionId = `session_${Date.now()}`;
            const event: AnalyticsEvent = {
                id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date().toISOString(),
                eventType,
                featureName,
                metadata: metadata || {},
                sessionId
            };
            const newEvents = [...state.analyticsEvents, event];
            const newMetrics = { ...state.analyticsMetrics };
            newMetrics.lastUpdated = new Date().toISOString();
            switch (eventType) {
                case 'document_generated':
                    newMetrics.totalDocumentsGenerated++;
                    newMetrics.documentsByType[featureName] = (newMetrics.documentsByType[featureName] || 0) + 1;
                    break;
                case 'feature_usage':
                    newMetrics.featuresUsage[featureName] = (newMetrics.featuresUsage[featureName] || 0) + 1;
                    break;
                case 'template_created':
                    newMetrics.templatesCreated++;
                    break;
                case 'export_batch':
                    newMetrics.exportBatchesCount++;
                    break;
                case 'ai_interaction':
                    newMetrics.aiInteractionsCount++;
                    break;
            }
            return { analyticsEvents: newEvents, analyticsMetrics: newMetrics };
        }),
        setNotifiche: (input) => set((state) => ({ 
            notifiche: typeof input === 'function' ? input(state.notifiche) : input 
        })),
        setSuggestions: (suggestions) => set({ suggestions }),
        setActiveSuggestion: (activeSuggestion) => set({ activeSuggestion }),
        dismissSuggestion: (id) => set((state) => {
            const newDismissed = new Set(state.dismissedSuggestions);
            newDismissed.add(id);
            return { dismissedSuggestions: newDismissed };
        }),
        reactivateSuggestion: (id) => set((state) => {
            const newDismissed = new Set(state.dismissedSuggestions);
            newDismissed.delete(id);
            return { dismissedSuggestions: newDismissed };
        }),
        setKnowledgeBase: (input) => set((state) => ({ 
            knowledgeBase: typeof input === 'function' ? input(state.knowledgeBase) : input 
        })),
        setCorpora: (input) => set((state) => ({ 
            corpora: typeof input === 'function' ? input(state.corpora) : input 
        })),
        setTemplates: (input) => set((state) => ({ 
            templates: typeof input === 'function' ? input(state.templates) : input 
        })),
        setFeedSources: (input) => set((state) => ({ 
            feedSources: typeof input === 'function' ? input(state.feedSources) : input 
        })),
        loadFromBackup: (data) => set((state) => ({
            ...state,
            ...data,
            dismissedSuggestions: data.dismissedSuggestions 
                ? new Set(Array.from(data.dismissedSuggestions))
                : new Set<string>(),
        })),
        resetSystemData: () => set({
            user: null,
            analyticsEvents: [],
            analyticsMetrics: {
                totalDocumentsGenerated: 0,
                documentsByType: {},
                featuresUsage: {},
                templatesCreated: 0,
                exportBatchesCount: 0,
                aiInteractionsCount: 0,
                averageSessionDuration: 0,
                lastUpdated: new Date().toISOString()
            },
            analyticsSettings: {
                enabled: true,
                collectFeatureUsage: true,
                collectDocumentMetrics: true,
                collectPerformanceMetrics: false,
                retentionDays: 90,
                lastReset: new Date().toISOString()
            },
            notifiche: [],
            suggestions: [],
            activeSuggestion: null,
            dismissedSuggestions: new Set<string>(),
            knowledgeBase: [INITIAL_KB_GUIDE],
            corpora: [],
            templates: [],
            feedSources: []
        })
    }
}));


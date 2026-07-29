import { AiSuggestion, AppState } from '../types';
// Fase 4: FULL routing for proactive suggestions (daily gesture) via AIBrain (no direct aiService)
import { AIBrain } from '../ai/brain/AIBrain';
import { logger } from './logger';

const CACHE_KEY = 'ai_suggestions_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CachedSuggestions {
    suggestions: AiSuggestion[];
    timestamp: number;
    userId: string;
}

/**
 * Generates personalized AI suggestions based on user data
 * Uses caching (24h), AI scoring for prioritization, and graceful error handling
 */
export const generateAiSuggestions = async (appState: AppState): Promise<AiSuggestion[]> => {
    try {
        // Check cache first
        const cached = getCachedSuggestions(appState.user?.id);
        if (cached) {
            return cached;
        }

        const prioritizedSuggestions = await AIBrain.generateWithCentralPrompt('proactive-suggestions', {
          studentContext: (appState.students || []).map((s: any) => s.cognome || s.nome || ''),
          studentsLength: (appState.students || []).length,
          evaluations: appState.evaluations || [],
          competencyEvals: appState.competencyEvals || [],
          udas: appState.uda || []
        }, appState.aiSettings);

        // Post-Fase 4 visible marker (for audit / resoconto)
        // AIBrain (Post-Fase 4): aiSuggestionGenerator — buildPrompt('proactive-suggestions') + generateWithCentralPrompt + buildContext + migrateLegacyAsk
        // AIBrain (Post-Fase 4): proactive-suggestions daily gesture fully central-routed.

        // Cache the results
        setCachedSuggestions(prioritizedSuggestions, appState.user?.id);

        return prioritizedSuggestions;

    } catch (error) {
        logger.error('[aiSuggestionGenerator] Error generating suggestions:', error);
        // Graceful fallback: return system suggestions if AI fails
        return getFallbackSuggestions(appState);
    }
};

const getCachedSuggestions = (userId?: string): AiSuggestion[] | null => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const parsed: CachedSuggestions = JSON.parse(cached);
        const now = Date.now();

        if (parsed.userId !== userId || (now - parsed.timestamp) > CACHE_DURATION) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }

        return parsed.suggestions;
    } catch (error) {
        logger.error('[aiSuggestionGenerator] Cache read error:', error);
        return null;
    }
};

const setCachedSuggestions = (suggestions: AiSuggestion[], userId?: string): void => {
    try {
        const cacheData: CachedSuggestions = {
            suggestions,
            timestamp: Date.now(),
            userId: userId || 'anonymous'
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
        logger.error('[aiSuggestionGenerator] Cache write error:', error);
    }
};

const getFallbackSuggestions = (appState: AppState): AiSuggestion[] => {
    // Fallback to system-like suggestions when AI fails
    const suggestions: AiSuggestion[] = [];

    if (appState.students.length === 0) {
        suggestions.push({
            id: 'fallback_import_students',
            icon: 'group_add',
            title: 'Aggiungi Studenti',
            description: 'Inizia importando i tuoi studenti per personalizzare l\'esperienza.',
            action: { type: 'navigate', payload: { view: 'studenti' } }
        });
    }

    if (Object.keys(appState.lessons).length === 0) {
        suggestions.push({
            id: 'fallback_create_lesson',
            icon: 'school',
            title: 'Crea Prima Lezione',
            description: 'Registra la tua prima lezione per iniziare a tracciare l\'attività didattica.',
            action: { type: 'navigate', payload: { view: 'timetable' } }
        });
    }

    if (appState.evaluations.length === 0) {
        suggestions.push({
            id: 'fallback_first_evaluation',
            icon: 'grade',
            title: 'Prima Valutazione',
            description: 'Inserisci la tua prima valutazione per monitorare il progresso degli studenti.',
            action: { type: 'navigate', payload: { view: 'evaluations' } }
        });
    }

    return suggestions.slice(0, 3); // Max 3 fallback suggestions
};


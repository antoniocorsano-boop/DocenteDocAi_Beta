import { create } from 'zustand';
import { TimetableSettings, AiSettings, AppThemeState, SettingsState } from '../types';
import { DEFAULT_TIMETABLE_SETTINGS } from '../constants';

// ============================================================================
// TYPES
// ============================================================================

// Settings Actions interface - defines all available actions
export interface SettingsActions {
  setSettings: (value: TimetableSettings | ((prev: TimetableSettings) => TimetableSettings)) => void;
  updateSettings: (partial: Partial<TimetableSettings>) => void;
  setAiSettings: (value: AiSettings | ((prev: AiSettings) => AiSettings)) => void;
  setThemeState: (value: AppThemeState | ((prev: AppThemeState) => AppThemeState)) => void;
  loadFromBackup: (data: Partial<SettingsState>) => void;
  reset: () => void;
}

// Complete store type - combines state and actions
export type SettingsStore = SettingsState & { actions: SettingsActions };

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

// Create the Zustand store with proper typing
export const useSettingsStore = create<SettingsStore>((set) => ({
  // Initial state
  settings: DEFAULT_TIMETABLE_SETTINGS,
  aiSettings: { model: 'gemini-3-flash-preview' },
  themeState: {
    mode: 'light',
    visualStyle: 'aura',
    customizationName: 'M3 Default',
    glassBlur: 30,
    radiusMultiplier: 1,
    uiMode: 'classic'  // Required field with default value
  },

  // Actions
  actions: {
    setSettings: (value: TimetableSettings | ((prev: TimetableSettings) => TimetableSettings)) => set((state) => ({
      settings: typeof value === 'function' ? value(state.settings) : value
    })),

    updateSettings: (partial: Partial<TimetableSettings>) => set((state) => ({
      settings: { ...state.settings, ...partial }
    })),

    setAiSettings: (value: AiSettings | ((prev: AiSettings) => AiSettings)) => set((state) => ({
      aiSettings: typeof value === 'function' ? value(state.aiSettings) : value
    })),

    setThemeState: (value: AppThemeState | ((prev: AppThemeState) => AppThemeState)) => set((state) => ({
      themeState: typeof value === 'function' ? value(state.themeState) : value
    })),

    loadFromBackup: (data: Partial<SettingsState>) => set((state) => ({
      ...state,
      settings: data.settings || state.settings,
      aiSettings: data.aiSettings || state.aiSettings,
      themeState: data.themeState ? {
        ...data.themeState,
        uiMode: data.themeState.uiMode || 'classic'  // Safe migration: add uiMode if missing
      } : state.themeState
    })),

    reset: () => set({
      settings: DEFAULT_TIMETABLE_SETTINGS,
      aiSettings: { model: 'gemini-3-flash-preview' },
      themeState: {
        mode: 'light',
        visualStyle: 'aura',
        customizationName: 'M3 Default',
        glassBlur: 30,
        radiusMultiplier: 1,
        uiMode: 'classic'  // Required field with default value
      }
    })
  }
}));


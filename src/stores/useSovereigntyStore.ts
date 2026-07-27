/**
 * useSovereigntyStore.ts — Zustand store for UserSovereigntyConfig.
 *
 * Persisted to localStorage under key 'sovereignty_config_v1'.
 *
 * Provides a non-reactive getter (getConfig) for use in copilotBrain and
 * executeCopilotAction — mirrors the pattern of useUserBehaviorStore.ts.
 *
 * Default: assistive_ai mode, AI enabled, audit logging on, all sharing off.
 * This default is compliant with GDPR data minimisation (Art. 5(1)(c)).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  UserSovereigntyConfig,
  SystemMode,
  DataSharingConfig,
  PersonalizationConfig,
} from '../types/sovereignty.types';

// ─── Default config ───────────────────────────────────────────────────────────

const DEFAULT_CONFIG: UserSovereigntyConfig = {
  mode:      'assistive_ai',
  aiEnabled: true,
  dataSharing: {
    telemetry: false,
    audit:     true,
    openData:  false,
  },
  personalization: {
    localOnly:        true,
    adaptiveLearning: false,
  },
  lastConsentUpdate: '',
};

// ─── Store shape ──────────────────────────────────────────────────────────────

interface SovereigntyState {
  config: UserSovereigntyConfig;
  /** Set the operational mode. */
  setMode:               (mode: SystemMode) => void;
  /** Toggle the master AI kill-switch. */
  setAiEnabled:          (enabled: boolean) => void;
  /** Partially update data sharing preferences. */
  updateDataSharing:     (partial: Partial<DataSharingConfig>) => void;
  /** Partially update personalisation preferences. */
  updatePersonalization: (partial: Partial<PersonalizationConfig>) => void;
  /** Record that the user has reviewed and accepted the sovereignty config. */
  recordConsentUpdate:   () => void;
  /** Non-reactive getter for use outside React (copilotBrain, executeCopilotAction). */
  getConfig:             () => UserSovereigntyConfig;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSovereigntyStore = create<SovereigntyState>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CONFIG,

      setMode(mode) {
        set((state) => ({ config: { ...state.config, mode } }));
      },

      setAiEnabled(enabled) {
        set((state) => ({ config: { ...state.config, aiEnabled: enabled } }));
      },

      updateDataSharing(partial) {
        set((state) => ({
          config: {
            ...state.config,
            dataSharing: { ...state.config.dataSharing, ...partial },
          },
        }));
      },

      updatePersonalization(partial) {
        set((state) => ({
          config: {
            ...state.config,
            personalization: { ...state.config.personalization, ...partial },
          },
        }));
      },

      recordConsentUpdate() {
        set((state) => ({
          config: { ...state.config, lastConsentUpdate: new Date().toISOString() },
        }));
      },

      getConfig() {
        return get().config;
      },
    }),
    {
      name:    'sovereignty_config_v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/**
 * Returns true if the user has completed sovereignty onboarding at least once.
 * Usable outside React components (e.g. main.tsx bootstrap gate).
 */
export function hasSovereigntyConfig(): boolean {
  return useSovereigntyStore.getState().getConfig().lastConsentUpdate !== '';
}

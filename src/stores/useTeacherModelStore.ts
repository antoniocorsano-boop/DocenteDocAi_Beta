/**
 * useTeacherModelStore — Zustand store for TeacherModel persistence.
 *
 * Persisted at localStorage key 'docentedoc-tcm-v1'.
 * On hydration it calls syncFromAnalytics() to migrate existing usage data
 * from analyticsMetrics (see TeacherModel.mergeUsageFromAnalytics).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  TeacherModel,
  UsageProfile,
  CopilotInteractionProfile,
  WorkflowPattern,
  CapabilityLevel,
  TeacherPreferences,
} from '../types/teacherModel.types';
import type { AnalyticsMetrics } from '../types/analytics.types';
import {
  createEmptyTeacherModel,
  mergeUsageFromAnalytics,
  computeCapability,
  onSuggestionAccepted,
  onSuggestionIgnored,
} from '../cognition';

interface TeacherModelState extends TeacherModel {
  // ── Actions ──────────────────────────────────────────────────────────────
  updateUsageProfile: (partial: Partial<UsageProfile>) => void;
  updateCopilotProfile: (partial: Partial<CopilotInteractionProfile>) => void;
  addWorkflowPattern: (pattern: Omit<WorkflowPattern, 'occurrences'> & { occurrences?: number }) => void;
  markLevelUpSeen: () => void;
  dismissHint: (hintId: string) => void;
  /** Seeds model from existing analyticsMetrics (call once at mount) */
  syncFromAnalytics: (metrics: Partial<AnalyticsMetrics>) => void;
  /** Feedback loop: registra accettazione di un suggerimento */
  acceptSuggestion: (actionKey: string) => void;
  /** Feedback loop: registra rifiuto/ignore di un suggerimento */
  ignoreSuggestion: (actionKey: string) => void;
  /** Aggiorna le preferenze del docente */
  updatePreferences: (partial: Partial<TeacherPreferences>) => void;
  // Required by UsageTracker interface
  getUsageProfile: () => UsageProfile;
  getCopilotProfile: () => CopilotInteractionProfile;
  getWorkflowPatterns: () => WorkflowPattern[];
}

const STORE_KEY = 'docentedoc-tcm-v1';

function applyCapabilityUpdate(model: TeacherModel): Partial<TeacherModel> {
  const { level, confidence } = computeCapability(model);
  const levelChanged = level !== model.capabilityLevel;
  const updates: Partial<TeacherModel> = {
    capabilityLevel: level as CapabilityLevel,
    confidenceScore: confidence,
    lastUpdated: Date.now(),
  };
  if (levelChanged && level > model.capabilityLevel) {
    updates.levelUpPending = true;
  }
  return updates;
}

export const useTeacherModelStore = create<TeacherModelState>()(
  persist(
    (set, get) => ({
      ...createEmptyTeacherModel(),

      updateUsageProfile(partial) {
        set((state) => {
          const nextUsage = { ...state.usageProfile, ...partial };
          const nextModel: TeacherModel = { ...(state as TeacherModel), usageProfile: nextUsage };
          return { usageProfile: nextUsage, ...applyCapabilityUpdate(nextModel) };
        });
      },

      updateCopilotProfile(partial) {
        set((state) => {
          const nextCopilot = { ...state.copilotInteractionProfile, ...partial };
          const nextModel: TeacherModel = { ...(state as TeacherModel), copilotInteractionProfile: nextCopilot };
          return { copilotInteractionProfile: nextCopilot, ...applyCapabilityUpdate(nextModel) };
        });
      },

      addWorkflowPattern(pattern) {
        set((state) => {
          const existing = state.workflowPatterns.findIndex(
            (p) => p.patternId === pattern.patternId,
          );
          const updated: WorkflowPattern[] =
            existing >= 0
              ? state.workflowPatterns.map((p, i) =>
                  i === existing
                    ? { ...p, occurrences: pattern.occurrences ?? p.occurrences + 1, lastDetected: pattern.lastDetected }
                    : p,
                )
              : [
                  ...state.workflowPatterns,
                  { ...pattern, occurrences: pattern.occurrences ?? 1 },
                ];
          return { workflowPatterns: updated, lastUpdated: Date.now() };
        });
      },

      markLevelUpSeen() {
        set({ levelUpPending: false, lastUpdated: Date.now() });
      },

      dismissHint(hintId) {
        set((state) => ({
          dismissedHints: state.dismissedHints.includes(hintId)
            ? state.dismissedHints
            : [...state.dismissedHints, hintId],
          lastUpdated: Date.now(),
        }));
      },

      syncFromAnalytics(metrics) {
        set((state) => {
          const merged = mergeUsageFromAnalytics(state as TeacherModel, metrics);
          const capUpdates = applyCapabilityUpdate(merged);
          // Don't trigger levelUpPending from migration data — it would surprise users
          return { ...merged, ...capUpdates, levelUpPending: false };
        });
      },

      acceptSuggestion(actionKey) {
        set((state) => {
          const updated = onSuggestionAccepted(state as TeacherModel, actionKey);
          return { ...updated };
        });
      },

      ignoreSuggestion(actionKey) {
        set((state) => {
          const updated = onSuggestionIgnored(state as TeacherModel, actionKey);
          return { ...updated };
        });
      },

      updatePreferences(partial) {
        set((state) => ({
          preferences: { ...state.preferences, ...partial },
          lastUpdated: Date.now(),
        }));
      },

      getUsageProfile() {
        return get().usageProfile;
      },

      getCopilotProfile() {
        return get().copilotInteractionProfile;
      },

      getWorkflowPatterns() {
        return get().workflowPatterns;
      },
    }),
    {
      name: STORE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate(persistedState: unknown, version: number) {
        const s = (persistedState ?? {}) as Record<string, unknown>;
        if (version < 2) {
          // v1→v2: add personal-mode, workspace and integration counters to usageProfile.
          const freshUsage = createEmptyTeacherModel().usageProfile;
          s['usageProfile'] = { ...freshUsage, ...(s['usageProfile'] as object ?? {}) };
        }
        if (version < 3) {
          // v2→v3: add decision memory fields (completedActions, ignoredSuggestions,
          // preferences, suggestionCooldown) — merge defaults with persisted state.
          const fresh = createEmptyTeacherModel();
          s['completedActions'] = (s['completedActions'] as string[] | undefined) ?? fresh.completedActions;
          s['ignoredSuggestions'] = (s['ignoredSuggestions'] as Record<string, number> | undefined) ?? fresh.ignoredSuggestions;
          s['preferences'] = { ...fresh.preferences, ...(s['preferences'] as object ?? {}) };
          s['suggestionCooldown'] = (s['suggestionCooldown'] as Record<string, number> | undefined) ?? fresh.suggestionCooldown;
        }
        return s as unknown as ReturnType<typeof createEmptyTeacherModel>;
      },
    },
  ),
);

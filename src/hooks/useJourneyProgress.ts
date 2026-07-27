/**
 * useJourneyProgress — reads TeacherModel store and returns derived journey data.
 *
 * Returns:
 *   level          — UX-facing JourneyLevel ('esploratore'|'praticante'|'maestro')
 *   capabilityLevel — internal 1–4
 *   progress       — 0.0–1.0 progress within current level band
 *   nextActions    — up to 3 CopilotSuggestion proactive hints
 *   levelUpPending — true when celebration should be shown
 *   confidenceScore — 0.0–1.0 classification confidence
 */

import { useMemo, useState, useEffect } from 'react';
import { useTeacherModelStore } from '../stores/useTeacherModelStore';
import { useAIMaturitaStore } from '../stores/useAIMaturitaStore';
import {
  toJourneyLevel,
  computeJourneyProgress,
  generateNextActions,
} from '../cognition';
import { generateArtisticNextActions } from '../cognition/SuggestionEngine';
import type { SuggestionContext } from '../cognition/SuggestionEngine';
import type { JourneyLevel, CopilotSuggestion, CapabilityLevel } from '../types/teacherModel.types';

export interface JourneyProgress {
  level: JourneyLevel;
  capabilityLevel: CapabilityLevel;
  progress: number;
  nextActions: CopilotSuggestion[];
  levelUpPending: boolean;
  confidenceScore: number;
  /** True when teacher is operating in personal mode (no class) */
  isPersonalMode: boolean;
}

export function useJourneyProgress(): JourneyProgress {
  const model = useTeacherModelStore((s) => ({
    capabilityLevel: s.capabilityLevel,
    confidenceScore: s.confidenceScore,
    levelUpPending: s.levelUpPending,
    dismissedHints: s.dismissedHints,
    lastUpdated: s.lastUpdated,
    usageProfile: s.usageProfile,
    pedagogicalProfile: s.pedagogicalProfile,
    workflowPatterns: s.workflowPatterns,
    copilotInteractionProfile: s.copilotInteractionProfile,
    // v3: memoria decisionale
    completedActions: s.completedActions,
    ignoredSuggestions: s.ignoredSuggestions,
    preferences: s.preferences,
    suggestionCooldown: s.suggestionCooldown,
  }));

  const interactionMode = useAIMaturitaStore((s) => s.interactionMode);
  const aiMaturitaScore = useAIMaturitaStore((s) => s.globalScore);

  // Async artistic suggestions — enriches nextActions without blocking render
  const [artisticActions, setArtisticActions] = useState<CopilotSuggestion[]>([]);

  const capabilityLevel = model.capabilityLevel;
  useEffect(() => {
    const level = toJourneyLevel(capabilityLevel);
    if (level === 'esploratore') {
      setArtisticActions([]);
      return;
    }
    let cancelled = false;
    const ctx: SuggestionContext = {
      model: {
        capabilityLevel,
        dismissedHints: [],
        lastUpdated: 0,
        usageProfile: { featuresDiscovered: 0, bookServicesLinked: 0, externalServicesConnected: 0, isPersonalMode: false, workspaceConfigured: false },
        pedagogicalProfile: { preferredMethods: [], subjectAreas: [], classTypes: [], innovationScore: 0 },
        workflowPatterns: [],
        copilotInteractionProfile: { suggestionAcceptanceRate: 0, manualOverrides: 0, automationEnabled: false, preferredSuggestionTypes: [] },
        confidenceScore: 0,
        levelUpPending: false,
      } as unknown as import('../types/teacherModel.types').TeacherModel,
      interactionMode,
      aiMaturitaScore,
    };
    generateArtisticNextActions(ctx).then((actions) => {
      if (!cancelled) setArtisticActions(actions);
    });
    return () => { cancelled = true; };
  // Re-run only when level changes or AI score crosses threshold — not on every model update
   
  }, [capabilityLevel, aiMaturitaScore, interactionMode]);

  return useMemo(() => {
    const level = toJourneyLevel(model.capabilityLevel);
    const progress = computeJourneyProgress(model);
    const isPersonalMode = model.usageProfile.isPersonalMode ?? false;
    const staticActions = generateNextActions({ model, interactionMode, aiMaturitaScore, isPersonalMode });
    const nextActions = [...staticActions, ...artisticActions].slice(0, 3);

    return {
      level,
      capabilityLevel: model.capabilityLevel,
      progress,
      nextActions,
      levelUpPending: model.levelUpPending,
      confidenceScore: model.confidenceScore,
      isPersonalMode,
    };
  }, [model, interactionMode, aiMaturitaScore, artisticActions]);
}

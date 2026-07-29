/**
 * useCopilotDashboard.ts — React hook for the Intelligent Dashboard (Sprint 10).
 *
 * Provides a live snapshot of the Copilot Brain state, reactive to new signals.
 * Uses useSyncExternalStore to subscribe to DecisionMemory signal emissions.
 *
 * Returns:
 *   secondaries   — top 2 secondary SuggestedActions (from getTopSecondaryActions)
 *   systemStatus  — GDPR/AgID compliance + pending approvals + risk level
 *   recentSignals — last 10 SystemSignals, newest first
 */

import React, { useMemo, useSyncExternalStore } from 'react';
import { decisionMemory }               from '../cognition/decisionMemory';
import { approvalGate }                 from '../services/enterprise/approvalGate';
import { getCopilotPrimaryAction, getTopSecondaryActions } from '../cognition/copilotBrain';

// Fase 3 migration: route copilot primary/secondary through AIBrain (central gateway + deprecation path)
import { AIBrain } from '../ai/brain/AIBrain';
import type { SystemSignal }            from '../cognition/signals';
import type { SuggestedAction }         from '../cognition/copilotBrain';
import type { RankedAction }            from '../cognition/rankingEngine';
import type { ComplianceSlot, DecisionMemoryState } from '../cognition/decisionMemory';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface SystemStatus {
  gdpr:             ComplianceSlot;
  agid:             ComplianceSlot;
  pendingApprovals: number;
  activeSignals:    number;
  /** Derived: 'critical' if any critical signal, 'warning' if any warning, else 'ok' */
  riskLevel:        'ok' | 'warning' | 'critical';
}

export interface CopilotDashboardData {
  /** Highest-ranked primary action (RankedAction includes scoreBreakdown for explainability) */
  primaryRanked: RankedAction;
  secondaries:   SuggestedAction[];
  systemStatus:  SystemStatus;
  recentSignals: SystemSignal[];
}

// ─── Store subscription helpers ───────────────────────────────────────────────

function subscribe(onChange: () => void): () => void {
  // Returns the unsubscribe function — signature matches useSyncExternalStore
  return decisionMemory.onSignal(onChange);
}

function getSnapshot(): Readonly<DecisionMemoryState> {
  // DecisionMemory replaces _state object reference on every mutation (see implementation).
  // useSyncExternalStore will detect reference changes and trigger re-renders.
  return decisionMemory.getState();
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCopilotDashboard(): CopilotDashboardData {
  // Subscribe to signal emissions; re-render whenever a new signal is emitted.
  const dmState = useSyncExternalStore(subscribe, getSnapshot);

  // Recompute primary + secondaries on every render triggered by dmState change
  // Fase 3: Real consumption via AIBrain.getUnifiedRecommendations + getCopilot* (central + cached)
  // Uses buildContext for context + migrateLegacyAsk deprecation helper
  const primaryRanked = React.useMemo(() => {
    try {
      const ctx = AIBrain.buildContext({ source: 'copilot-dashboard-hook', extra: { signals: dmState.signals.length } });
      // Prefer unified gateway
      const recs = AIBrain.getUnifiedRecommendations(ctx);
      if (recs?.primary) return recs.primary as unknown;
      // Fallback + deprecation path exercise
      if (import.meta.env.DEV) AIBrain.migrateLegacyAsk('legacy-copilot-dashboard', ctx).catch(() => {});
      return getCopilotPrimaryAction();
    } catch {
      return getCopilotPrimaryAction();
    }
  }, [dmState]);

  const secondaries = React.useMemo(() => {
    try {
      const recs = AIBrain.getUnifiedRecommendations();
      return (recs?.secondary || getTopSecondaryActions()) as unknown;
    } catch {
      return getTopSecondaryActions();
    }
  }, []);

  const systemStatus = useMemo((): SystemStatus => {
    const hasCritical = dmState.signals.some((s) => s.severity === 'critical');
    const hasWarning  = dmState.signals.some((s) => s.severity === 'warning');
    return {
      gdpr:             dmState.complianceStatus.gdpr,
      agid:             dmState.complianceStatus.agid,
      pendingApprovals: approvalGate.getPendingCount(),
      activeSignals:    dmState.signals.length,
      riskLevel:        hasCritical ? 'critical' : hasWarning ? 'warning' : 'ok',
    };
  }, [dmState]);

  const recentSignals = useMemo(
    (): SystemSignal[] => [...dmState.signals].slice(-10).reverse(),
    [dmState],
  );

  return { primaryRanked, secondaries, systemStatus, recentSignals };
}

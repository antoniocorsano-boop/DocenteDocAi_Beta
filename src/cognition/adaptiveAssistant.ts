/**
 * adaptiveAssistant.ts — UC-aware adaptive scrutiny layer.
 *
 * Reads drift data from the Use Case Telemetry layer and produces
 * AdaptiveProfiles that modify how the copilot assistant behaves per use case:
 *
 *   degrading UC → high scrutiny   (compliance actions boosted, auto-remediation on)
 *   improving UC → relaxed          (no extra overhead, standard flow)
 *   stable UC   → normal            (neutral baseline)
 *
 * Integration points:
 *   - rankingEngine.ts  reads `buildUCAdaptiveBoosts()` via ScoringFactors
 *   - copilotBrain.ts   calls `buildUCAdaptiveBoosts()` inside buildScoringFactors()
 *   - UI panels         call `getAllAdaptiveProfiles()` and `getDegradingUseCases()`
 *
 * Pure: no side-effects. Safe for useMemo and non-React contexts.
 */

import { detectDriftByUseCase }  from '../self-compliance/runtime/audit/driftDetector';
import { USE_CASE_LABELS }       from './useCaseTelemetry';
import type { UseCaseId }        from './useCaseTelemetry';

// ─── Public types ─────────────────────────────────────────────────────────────

export type ScrutinyLevel = 'high' | 'normal' | 'relaxed';

export interface AdaptiveProfile {
  useCaseId:       UseCaseId;
  /** Human-readable UC label (from USE_CASE_LABELS) */
  label:           string;
  /** Scrutiny mode derived from compliance drift */
  scrutinyLevel:   ScrutinyLevel;
  /**
   * Extra compliance score boost injected into the ranking engine when actions
   * belonging to this UC are evaluated. Range: 0–50.
   * Proportional to drift magnitude: |delta| × 4, capped at 50.
   */
  complianceBoost: number;
  /**
   * When true, the assistant proactively injects a remediation suggestion
   * into the ranked action list for this UC's flow.
   */
  autoRemediate:   boolean;
  /** Human-readable reason for the current adaptation level */
  reason:          string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_USE_CASE_IDS: UseCaseId[] = [
  'UC-P1', 'UC-P2',
  'UC-E1', 'UC-E2', 'UC-E3',
  'UC-V1', 'UC-V2', 'UC-V3',
  'UC-R1', 'UC-R2', 'UC-R3', 'UC-R4', 'UC-R5',
];

/**
 * Maps SuggestedAction.type → UseCaseId.
 * Mirrors ACTION_TYPE_TO_USE_CASE in executeCopilotAction.ts to ensure
 * the adaptive boost applies to every action that touches a given UC flow.
 */
const ACTION_TYPE_TO_UC: Record<string, UseCaseId> = {
  enterprise:  'UC-R5',
  compliance:  'UC-R1',
  copilot:     'UC-R4',
  students:    'UC-P1',
  planning:    'UC-P2',
  uda:         'UC-E1',
  evaluation:  'UC-E3',
  analytics:   'UC-V2',
  general:     'UC-R4',
};

// ─── Profile computation ──────────────────────────────────────────────────────

/**
 * Compute the adaptive profile for a single UC based on its telemetry drift.
 * Delegates to detectDriftByUseCase() which reads from useCaseTelemetry.
 */
export function getAdaptiveProfile(useCaseId: UseCaseId): AdaptiveProfile {
  const drift = detectDriftByUseCase(useCaseId);
  const label = USE_CASE_LABELS[useCaseId] ?? useCaseId;

  switch (drift.status) {
    case 'degrading':
      return {
        useCaseId,
        label,
        scrutinyLevel:   'high',
        complianceBoost: Math.min(50, Math.round(Math.abs(drift.delta) * 4)),
        autoRemediate:   true,
        reason:          drift.message,
      };

    case 'improving':
      return {
        useCaseId,
        label,
        scrutinyLevel:   'relaxed',
        complianceBoost: 0,
        autoRemediate:   false,
        reason:          drift.message,
      };

    default: // 'stable'
      return {
        useCaseId,
        label,
        scrutinyLevel:   'normal',
        complianceBoost: 0,
        autoRemediate:   false,
        reason:          drift.message,
      };
  }
}

/**
 * Returns adaptive profiles for all 13 UCs.
 * Used by UI panels (Intelligent Dashboard, UC analytics).
 */
export function getAllAdaptiveProfiles(): AdaptiveProfile[] {
  return ALL_USE_CASE_IDS.map(getAdaptiveProfile);
}

/**
 * Returns action-type–keyed compliance boosts, computed from UC drift.
 * Injected into rankingEngine via ScoringFactors.ucAdaptiveBoosts.
 *
 * Example output:
 *   { enterprise: 0, compliance: 0, evaluation: 35, uda: 0, ... }
 *
 * A non-zero boost means the UC for that action type is currently degrading,
 * so compliance/approval actions for that flow are ranked higher automatically.
 */
export function buildUCAdaptiveBoosts(): Record<string, number> {
  const boosts: Record<string, number> = {};
  for (const [actionType, ucId] of Object.entries(ACTION_TYPE_TO_UC)) {
    boosts[actionType] = getAdaptiveProfile(ucId).complianceBoost;
  }
  return boosts;
}

/**
 * Returns the adaptive boost for a specific action type.
 * Convenience wrapper — avoids constructing the full boosts map.
 */
export function getAdaptiveBoost(actionType: string): number {
  const ucId = ACTION_TYPE_TO_UC[actionType];
  if (!ucId) return 0;
  return getAdaptiveProfile(ucId).complianceBoost;
}

/**
 * Returns all UCs currently in 'high' scrutiny mode (degrading compliance drift).
 * Used to surface proactive warnings in UI panels and the copilot header.
 */
export function getDegradingUseCases(): AdaptiveProfile[] {
  return getAllAdaptiveProfiles().filter((p) => p.scrutinyLevel === 'high');
}

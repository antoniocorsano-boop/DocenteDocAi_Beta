/**
 * rankingEngine.ts — Sprint 14: Dynamic Ranking Engine.
 *
 * Pure function that re-orders SuggestedActions by a multi-factor score that
 * combines rule-based priority, user behaviour history, active signals,
 * compliance state, and recency.
 *
 * Formula:
 *   finalScore =
 *     basePriority       TIER_0=100 / TIER_1=80 / TIER_2=60 / TIER_3=40 / TIER_4=20 / TIER_5=10
 *     + userAffinity     preferred action: +15 | ignored action: −20
 *     + urgency          signal critical: +25 | signal warning: +10
 *     + complianceWeight compliance non-ok: +30
 *     + recencyBoost     not executed in last 24 h: +5
 *
 * Rules:
 *   - Critical actions have a score floor of 100 (never suppressed).
 *   - Scores are capped at 200.
 *   - Output is max 5 ranked actions, sorted highest score first.
 *   - Every RankedAction includes a human-readable `explanation`.
 *
 * Exported types:
 *   - ScoringFactors    — context injected by copilotBrain
 *   - ScoreBreakdown    — per-factor contribution
 *   - RankedAction      — SuggestedAction with score metadata
 *
 * Exported functions:
 *   - rankActions(candidates, factors) — returns RankedAction[]
 */

import type { SuggestedAction } from './copilotBrain';
import type { UserBehaviorProfile } from './userBehaviorModel';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ScoringFactors {
  /** Active signals (type + severity) from decisionMemory */
  activeSignals:     Array<{ type: string; severity: 'critical' | 'warning' | 'info' }>;
  /** Whether compliance (GDPR/AgID) is non-ok */
  complianceNonOk:   boolean;
  /** Set of actionIds executed in the last 24 h (from audit log) */
  recentlyExecuted:  Set<string>;
  /** Current user behaviour profile */
  userProfile:       UserBehaviorProfile;
  /**
   * Action-type–keyed adaptive boosts from the Use Case drift layer.
   * Built by adaptiveAssistant.buildUCAdaptiveBoosts().
   * A non-zero value means the UC for that action type is currently degrading —
   * the assistant applies extra scrutiny and surfaces compliance actions first.
   */
  ucAdaptiveBoosts?: Record<string, number>;
}

export interface ScoreBreakdown {
  basePriority:      number;
  userAffinity:      number;
  urgency:           number;
  complianceWeight:  number;
  recencyBoost:      number;
  /** Extra boost from adaptive UC scrutiny (0 when UC is stable/improving) */
  adaptiveBoost:     number;
}

export interface RankedAction extends SuggestedAction {
  finalScore:     number;
  scoreBreakdown: ScoreBreakdown;
  explanation:    string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_PRIORITY: Record<SuggestedAction['priority'], number> = {
  high:   80,
  medium: 40,
  low:    10,
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

function computeBasePriority(action: SuggestedAction): number {
  return BASE_PRIORITY[action.priority] ?? 10;
}

function computeUserAffinity(action: SuggestedAction, profile: UserBehaviorProfile): number {
  if (profile.preferredActions.includes(action.id)) return 15;
  if (profile.ignoredActions.includes(action.id))   return -20;
  return 0;
}

function computeUrgency(
  action: SuggestedAction,
  signals: ScoringFactors['activeSignals'],
): number {
  const hasCritical = signals.some((s) => s.severity === 'critical');
  const hasWarning  = signals.some((s) => s.severity === 'warning');

  // Compliance / approval actions benefit from active signals
  const isUrgentType = action.type === 'enterprise' || action.requiresApproval;

  if (isUrgentType && hasCritical) return 25;
  if (isUrgentType && hasWarning)  return 10;
  if (hasCritical)                 return 15;
  if (hasWarning)                  return 5;
  return 0;
}

function computeComplianceWeight(
  action: SuggestedAction,
  complianceNonOk: boolean,
): number {
  if (!complianceNonOk) return 0;
  // Boost for compliance-related or approval-required actions
  if (action.type === 'enterprise' || action.requiresApproval) return 30;
  return 0;
}

function computeRecencyBoost(action: SuggestedAction, recentlyExecuted: Set<string>): number {
  return recentlyExecuted.has(action.id) ? 0 : 5;
}

/**
 * Adaptive boost: if the UC associated with this action type is currently
 * degrading compliance-wise, boost compliance/approval actions for that flow.
 * Source: adaptiveAssistant.buildUCAdaptiveBoosts() → ucAdaptiveBoosts.
 */
function computeAdaptiveBoost(
  action: SuggestedAction,
  ucAdaptiveBoosts: Record<string, number> | undefined,
): number {
  if (!ucAdaptiveBoosts) return 0;
  const raw = ucAdaptiveBoosts[action.type] ?? 0;
  // Only compliance/approval-related or enterprise actions get the full boost;
  // other action types get half to avoid over-surfacing unrelated actions.
  return (action.type === 'enterprise' || action.requiresApproval || action.type === 'compliance')
    ? raw
    : Math.round(raw * 0.5);
}

function buildExplanation(action: SuggestedAction, breakdown: ScoreBreakdown): string {
  const parts: string[] = [];

  if (breakdown.complianceWeight > 0) parts.push('scadenza normativa');
  if (breakdown.urgency >= 25)        parts.push('segnale critico attivo');
  else if (breakdown.urgency > 0)     parts.push('segnale di attenzione');
  if (breakdown.userAffinity > 0)     parts.push('preferenza utente');
  if (breakdown.userAffinity < 0)     parts.push('azione spesso ignorata');
  if (breakdown.recencyBoost > 0)     parts.push('non eseguita di recente');

  if (breakdown.adaptiveBoost > 0) parts.push('flusso UC in degrado — scrutinio aumentato');

  if (parts.length === 0) {
    return `Priorità ${action.priority}: azione suggerita dal motore di raccomandazione.`;
  }

  const PRIORITY_LABELS: Record<SuggestedAction['priority'], string> = {
    high:   'Alta',
    medium: 'Media',
    low:    'Bassa',
  };
  return `Priorità ${PRIORITY_LABELS[action.priority]}: ${parts.join(' + ')}.`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Re-rank a set of SuggestedActions using the multi-factor scoring formula.
 *
 * @param candidates - Actions to rank (typically from getCopilotPrimaryAction + secondaries).
 * @param factors    - Context: user profile, signals, compliance, recency.
 * @returns Sorted RankedAction[] (highest score first), capped at 5 entries.
 *
 * @example
 * const ranked = rankActions([primary, ...secondaries], {
 *   activeSignals:    dmState.signals.map(s => ({ type: s.type, severity: s.severity })),
 *   complianceNonOk:  dmState.complianceStatus.gdpr !== 'ok' || dmState.complianceStatus.agid !== 'ok',
 *   recentlyExecuted: new Set(),
 *   userProfile:      useUserBehaviorStore.getState().getProfile(),
 * });
 */
export function rankActions(
  candidates: SuggestedAction[],
  factors: ScoringFactors,
): RankedAction[] {
  const ranked: RankedAction[] = candidates.map((action) => {
    const breakdown: ScoreBreakdown = {
      basePriority:     computeBasePriority(action),
      userAffinity:     computeUserAffinity(action, factors.userProfile),
      urgency:          computeUrgency(action, factors.activeSignals),
      complianceWeight: computeComplianceWeight(action, factors.complianceNonOk),
      recencyBoost:     computeRecencyBoost(action, factors.recentlyExecuted),
      adaptiveBoost:    computeAdaptiveBoost(action, factors.ucAdaptiveBoosts),
    };

    let finalScore =
      breakdown.basePriority +
      breakdown.userAffinity +
      breakdown.urgency +
      breakdown.complianceWeight +
      breakdown.recencyBoost +
      breakdown.adaptiveBoost;

    // Critical actions: floor score at 100 so they are never suppressed
    if (action.priority === 'high') {
      finalScore = Math.max(finalScore, 100);
    }

    // Cap at 200
    finalScore = Math.min(finalScore, 200);

    return {
      ...action,
      finalScore,
      scoreBreakdown: breakdown,
      explanation:    buildExplanation(action, breakdown),
    };
  });

  return ranked
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 5);
}

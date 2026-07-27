/**
 * userBehaviorModel.ts — Sprint 13: User Behavior Model.
 *
 * Pure model + immutable update functions that track how a teacher interacts
 * with CopilotBrain suggestions. No side-effects; callers (store, tests) own
 * mutation. Persisted via useUserBehaviorStore (localStorage).
 *
 * Exported types:
 *   - UserBehaviorProfile          — persistent state shape
 *
 * Exported functions:
 *   - createEmptyProfile()         — zeroed starting profile
 *   - onActionExecuted(p, id, ra?) — increment freq, refresh preferred/risk
 *   - onActionIgnored(p, id, ra?)  — penalize; add to ignored after 2 rejects
 *   - onApprovalDelay(p, ms)       — derive approvalSpeed from ms
 *
 * Learning rules:
 *   - freq > 3  → action enters preferredActions (top 3 desc)
 *   - rejects ≥ 2 → action enters ignoredActions
 *   - riskTolerance = approvalAccepts / (approvalAccepts + approvalRejects)
 *       ≥ 0.6 → 'high' | ≤ 0.3 → 'low' | else → 'medium' (min 3 samples)
 *   - approvalSpeed: ms < 30s → 'fast' | ms < 5min → 'normal' | else → 'slow'
 */

// ─── Public types ─────────────────────────────────────────────────────────────

export interface UserBehaviorProfile {
  /** actionId → total executed count */
  actionFrequency:  Record<string, number>;
  /** actionId → times the user dismissed / declined */
  rejectionCount:   Record<string, number>;
  /** Top 3 actionIds by frequency where freq > 3 */
  preferredActions: string[];
  /** ActionIds rejected 2+ times (suppressed unless critical) */
  ignoredActions:   string[];
  /** Count of approval-required actions the user executed */
  approvalAccepts:  number;
  /** Count of approval-required actions the user ignored */
  approvalRejects:  number;
  /** Derived from last measured approval turnaround time */
  approvalSpeed:    'fast' | 'normal' | 'slow';
  /** Derived from approvalAccepts / (approvalAccepts + approvalRejects) ratio */
  riskTolerance:    'low' | 'medium' | 'high';
  /** ISO 8601 timestamp of last update */
  lastUpdated:      string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computePreferred(freq: Record<string, number>): string[] {
  return Object.entries(freq)
    .filter(([, count]) => count > 3)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([id]) => id);
}

function computeRiskTolerance(accepts: number, rejects: number): 'low' | 'medium' | 'high' {
  const total = accepts + rejects;
  if (total < 3) return 'medium'; // insufficient data — neutral default
  const rate = accepts / total;
  if (rate >= 0.6) return 'high';
  if (rate <= 0.3) return 'low';
  return 'medium';
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns a zeroed UserBehaviorProfile with safe defaults.
 */
export function createEmptyProfile(): UserBehaviorProfile {
  return {
    actionFrequency:  {},
    rejectionCount:   {},
    preferredActions: [],
    ignoredActions:   [],
    approvalAccepts:  0,
    approvalRejects:  0,
    approvalSpeed:    'normal',
    riskTolerance:    'medium',
    lastUpdated:      new Date().toISOString(),
  };
}

/**
 * Record a successful action execution.
 *
 * @param profile          - Current profile (not mutated).
 * @param actionId         - ID of the executed SuggestedAction.
 * @param requiresApproval - Whether the action required HITL approval.
 * @returns New profile with updated frequency, preferred, and risk data.
 */
export function onActionExecuted(
  profile: UserBehaviorProfile,
  actionId: string,
  requiresApproval = false,
): UserBehaviorProfile {
  const nextFreq = {
    ...profile.actionFrequency,
    [actionId]: (profile.actionFrequency[actionId] ?? 0) + 1,
  };

  const nextAccepts = requiresApproval
    ? profile.approvalAccepts + 1
    : profile.approvalAccepts;

  // If user executes an action they once ignored, remove it from ignored list
  const nextIgnored = profile.ignoredActions.filter((id) => id !== actionId);

  return {
    ...profile,
    actionFrequency:  nextFreq,
    preferredActions: computePreferred(nextFreq),
    ignoredActions:   nextIgnored,
    approvalAccepts:  nextAccepts,
    riskTolerance:    computeRiskTolerance(nextAccepts, profile.approvalRejects),
    lastUpdated:      new Date().toISOString(),
  };
}

/**
 * Record that a suggestion was dismissed / ignored by the user.
 *
 * First rejection: tracked internally.
 * Second rejection: actionId promoted to ignoredActions list.
 *
 * @param profile          - Current profile (not mutated).
 * @param actionId         - ID of the dismissed SuggestedAction.
 * @param requiresApproval - Whether the action required HITL approval.
 * @returns New profile with updated rejection tracking and risk data.
 */
export function onActionIgnored(
  profile: UserBehaviorProfile,
  actionId: string,
  requiresApproval = false,
): UserBehaviorProfile {
  const nextCount = (profile.rejectionCount[actionId] ?? 0) + 1;
  const nextRejectionCount = { ...profile.rejectionCount, [actionId]: nextCount };

  const alreadyIgnored = profile.ignoredActions.includes(actionId);
  const nextIgnored =
    !alreadyIgnored && nextCount >= 2
      ? [...profile.ignoredActions, actionId]
      : profile.ignoredActions;

  const nextRejects = requiresApproval
    ? profile.approvalRejects + 1
    : profile.approvalRejects;

  return {
    ...profile,
    rejectionCount:  nextRejectionCount,
    ignoredActions:  nextIgnored,
    approvalRejects: nextRejects,
    riskTolerance:   computeRiskTolerance(profile.approvalAccepts, nextRejects),
    lastUpdated:     new Date().toISOString(),
  };
}

/**
 * Update approvalSpeed from the latest measured approval turnaround time.
 *
 * Thresholds:
 *   - fast   : ms < 30_000   (under 30 seconds)
 *   - normal : ms < 300_000  (under 5 minutes)
 *   - slow   : ms ≥ 300_000
 *
 * @param profile - Current profile (not mutated).
 * @param ms      - Milliseconds between approval request and resolution.
 * @returns New profile with updated approvalSpeed.
 */
export function onApprovalDelay(
  profile: UserBehaviorProfile,
  ms: number,
): UserBehaviorProfile {
  let approvalSpeed: UserBehaviorProfile['approvalSpeed'];
  if (ms < 30_000)       approvalSpeed = 'fast';
  else if (ms < 300_000) approvalSpeed = 'normal';
  else                   approvalSpeed = 'slow';

  return {
    ...profile,
    approvalSpeed,
    lastUpdated: new Date().toISOString(),
  };
}

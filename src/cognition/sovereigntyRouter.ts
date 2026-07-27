/**
 * sovereigntyRouter.ts — AI action gate based on UserSovereigntyConfig.
 *
 * Implements the "Execution Router" from the Sovereignty Layer Zero architecture:
 *
 *   offline_only   → blocks all AI-type actions (returns null)
 *   assistive_ai   → forces requiresApproval=true on AI-type actions
 *   autonomous_ai  → pass-through (no modification)
 *
 * AI-type actions are those whose SuggestedAction.type matches AI_ACTION_TYPES.
 * Non-AI administrative actions pass through in any mode.
 *
 * Compliance:
 *   GDPR Art. 22  — no automated decision without human oversight option
 *   AI Act Art. 14 — human oversight must be technically implementable
 *   AgID           — continuità operativa: system must work without AI
 */

import type { SuggestedAction } from './copilotBrain';
import type { UserSovereigntyConfig, SystemMode } from '../types/sovereignty.types';

// ─── AI action classification ─────────────────────────────────────────────────

/**
 * Action types that involve AI processing and are therefore subject to the
 * sovereignty gate.  Non-AI actions (e.g. local navigation) pass through.
 */
const AI_ACTION_TYPES = new Set([
  'enterprise',
  'compliance',
  'copilot',
  'approval',
  'general',
]);

/** Returns true if the action involves AI processing. */
export function isAiAction(action: SuggestedAction): boolean {
  return AI_ACTION_TYPES.has(action.type);
}

// ─── Effective mode resolution ────────────────────────────────────────────────

/**
 * Resolves the effective operational mode, honouring the master AI kill-switch.
 *
 * If `aiEnabled === false`, the effective mode is always 'offline_only'
 * regardless of the `mode` field value.
 */
export function getEffectiveMode(config: UserSovereigntyConfig): SystemMode {
  if (!config.aiEnabled) return 'offline_only';
  return config.mode;
}

/** Returns true if the effective mode allows AI processing. */
export function isModeAICapable(mode: SystemMode): boolean {
  return mode !== 'offline_only';
}

// ─── Gate ─────────────────────────────────────────────────────────────────────

/**
 * Applies the sovereignty gate to a SuggestedAction.
 *
 * @returns
 *   - `null` if the action is blocked (offline_only mode for AI-type actions)
 *   - action with `requiresApproval: true` in assistive_ai mode for AI actions
 *   - original action unchanged in autonomous_ai mode or for non-AI actions
 *
 * @example
 *   const gated = applySovereigntyGate(action, sovConfig);
 *   if (!gated) return { status: 'blocked', ... };
 *   // gated.requiresApproval may now be true even if action.requiresApproval was false
 */
export function applySovereigntyGate(
  action: SuggestedAction,
  config: UserSovereigntyConfig,
): SuggestedAction | null {
  const mode = getEffectiveMode(config);

  if (mode === 'offline_only' && isAiAction(action)) {
    return null;
  }

  if (mode === 'assistive_ai' && isAiAction(action) && !action.requiresApproval) {
    return { ...action, requiresApproval: true };
  }

  return action;
}

/**
 * modules/system/APIGatekeeper.ts  —  P22 Stabilization Layer
 *
 * Single decision point that determines whether an AI API call should proceed.
 * Combines privacy policy, token budget, and task complexity checks.
 *
 * Usage:
 *   const { allowed, safePayload } = evaluateAPICall({ input, complexity, estimatedTokens });
 *   if (allowed) {
 *     consumeTokens(estimatedTokens);
 *     const result = await callAPI(safePayload);
 *   }
 */

import { canUseTokens, consumeTokens }  from './TokenController';
import { canSendToCloud, sanitizeInput } from './PrivacyGuard';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskComplexity = 'low' | 'medium' | 'high';

export interface APICallParams {
  input:           string;
  complexity:      TaskComplexity;
  estimatedTokens: number;
}

export interface APICallDecision {
  /** Whether the API call is permitted under current constraints. */
  allowed:     boolean;
  /** Sanitized input safe for transmission (always present). */
  safePayload: string;
  /** Human-readable reason when allowed = false. */
  reason?:     string;
}

// ─── Gatekeeper ───────────────────────────────────────────────────────────────

/**
 * Evaluates whether an AI API call should proceed given the current
 * privacy mode, token budget, and task complexity.
 *
 * Does NOT consume tokens — call `consumeTokens(estimated)` after successful use.
 */
export function evaluateAPICall(params: APICallParams): APICallDecision {
  const safePayload = sanitizeInput(params.input);

  if (!canSendToCloud()) {
    return { allowed: false, safePayload, reason: 'Privacy mode: strict — cloud calls disabled' };
  }

  if (params.complexity !== 'high') {
    return { allowed: false, safePayload, reason: 'Task complexity too low for API call' };
  }

  if (!canUseTokens(params.estimatedTokens)) {
    return { allowed: false, safePayload, reason: 'Token budget exceeded for this session' };
  }

  return { allowed: true, safePayload };
}

/**
 * Convenience helper: records token consumption for a completed API call.
 * Call this after a successful API response.
 */
export function recordAPIUsage(tokensUsed: number): void {
  consumeTokens(tokensUsed);
}

/**
 * Estimates the token count for a text string (approximation: 1 token ≈ 4 chars).
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

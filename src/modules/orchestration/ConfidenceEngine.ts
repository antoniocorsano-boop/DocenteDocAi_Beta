/**
 * modules/orchestration/ConfidenceEngine.ts — P41
 *
 * Produces a user-facing confidence score and a list of transparent factor strings
 * for each assistant turn.
 *
 * Design:
 *   - Score is derived from OrchestratorResult.confidence (primary signal) plus
 *     contextual penalties/bonuses from state and input quality.
 *   - Factors are concise Italian sentences surfaced in the ConfidenceBlock UI.
 *   - `shouldShow` is conservative — only surfaces when the information adds value
 *     (low/medium confidence, critical emotional state, or guidance === 'lead').
 *
 * Invariants:
 *   - Score is always in [0.10, 0.95].
 *   - At most 4 factors.
 *   - Never surfaces when state is 'focused' AND score ≥ 0.75 (no noise for smooth runs).
 */

import type { EmotionalState, EmotionalStrategy } from './EmotionalEngine';
import type { OrchestratorResult }                 from './CognitiveOrchestrator';

// ── Public API ────────────────────────────────────────────────────────────────

export interface ConfidenceInput {
  userText: string;
  result:   OrchestratorResult;
  state:    EmotionalState;
  strategy: EmotionalStrategy;
}

export interface ConfidenceOutput {
  /** Adjusted confidence score in [0.10, 0.95] */
  score:      number;
  /** Human-readable Italian factor strings (max 4) */
  factors:    string[];
  /** Whether to inject the block at all */
  shouldShow: boolean;
  /**
   * P42 — confidence-driven label for the primary action CTA.
   * 'Raffina richiesta' when score < 0.50 (low confidence → guide user to refine).
   * 'Applica subito'    when score ≥ 0.80 (high confidence → immediate action).
   * undefined otherwise (use primary action's natural label).
   */
  nextAction?: string;
}

// ── Score computation ─────────────────────────────────────────────────────────

function computeScore(result: OrchestratorResult, state: EmotionalState): number {
  let score = result.confidence;

  // Emotional-state penalties: blocked/overloaded increase uncertainty
  if (state === 'blocked')    score -= 0.10;
  if (state === 'overloaded') score -= 0.05;

  return Math.max(0.10, Math.min(0.95, score));
}

// ── Factor generation ─────────────────────────────────────────────────────────

const MAX_FACTORS = 3;

function buildFactors(
  userText: string,
  result:   OrchestratorResult,
  state:    EmotionalState,
  score:    number,
): string[] {
  const factors: string[] = [];
  const wordCount = userText.trim().split(/\s+/).filter(Boolean).length;

  // ── Positive signals ──────────────────────────────────────────────────────
  if (score >= 0.80) {
    factors.push('Input chiaro e contesto sufficiente per una risposta precisa.');
  } else if (score >= 0.65) {
    factors.push('Contesto abbastanza chiaro, risposta prevalentemente affidabile.');
  }

  if (result.memoryUsed) {
    factors.push('Ho usato il contesto di sessioni precedenti per aumentare la pertinenza.');
  }

  const successfulSteps = result.steps.filter(s => s.success);
  if (successfulSteps.length > 1 && successfulSteps.length === result.steps.length) {
    factors.push(`Analisi multi-step completata (${successfulSteps.length} passaggi).`);
  }

  // ── Negative / warning signals ────────────────────────────────────────────
  if (result.confidence < 0.40) {
    factors.push('Contesto insufficiente — questa risposta potrebbe essere parziale.');
  } else if (result.confidence < 0.60) {
    factors.push('Alcune ambiguità rilevate nella richiesta.');
  }

  if (wordCount < 6) {
    factors.push('Input breve: ho interpretato il contesto — possibile ambiguità.');
  }

  if (state === 'blocked') {
    factors.push('Ho rilevato un blocco: risposta calibrata con guida aggiuntiva.');
  } else if (state === 'overloaded') {
    factors.push('Ho rilevato sovraccarico: risposta semplificata per chiarezza.');
  }

  if (result.intentType === 'unknown' || result.intentType === '') {
    factors.push('Tipo di richiesta non completamente identificato.');
  }

  // Failed steps
  const failedSteps = result.steps.filter(s => !s.success);
  if (failedSteps.length > 0) {
    factors.push(`${failedSteps.length} step ${failedSteps.length === 1 ? 'fallito' : 'falliti'} durante l'elaborazione.`);
  }

  return factors.slice(0, MAX_FACTORS);
}

// ── Show gate ─────────────────────────────────────────────────────────────────

function shouldShow(
  score:    number,
  state:    EmotionalState,
  strategy: EmotionalStrategy,
): boolean {
  // Always show if system is guiding — user needs to know the reliability ceiling
  if (strategy.guidance === 'lead') return true;

  // Critical states: show so user understands why the response is shaped differently
  if (state === 'blocked' || state === 'overloaded') return true;

  // Low/medium confidence: transparency prevents misplaced trust
  if (score < 0.65) return true;

  // Focused + high confidence = no noise
  return false;
}

// ── Entry point ───────────────────────────────────────────────────────────────

/**
 * Compute confidence metadata for the current turn.
 *
 * @returns ConfidenceOutput — caller injects `{ type: 'confidence', score, factors }`
 *          into rawBlocks when `shouldShow === true`.
 */
export function buildConfidenceBlock(input: ConfidenceInput): ConfidenceOutput {
  const { userText, result, state, strategy } = input;

  const score   = computeScore(result, state);
  const factors = buildFactors(userText, result, state, score);
  const show    = shouldShow(score, state, strategy);

  // P42.5 — human-first CTA labels (contextual, not AI-sounding)
  let nextAction: string | undefined;
  if      (score > 0.85) nextAction = 'Usa questa soluzione';
  else if (score > 0.70) nextAction = 'Prova questa versione';
  else if (score < 0.50) nextAction = 'Migliora la richiesta';
  // 0.50–0.70 → undefined: use the action's own natural label

  return { score, factors, shouldShow: show, nextAction };
}

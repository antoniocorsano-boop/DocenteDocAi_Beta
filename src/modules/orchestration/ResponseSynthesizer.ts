/**
 * modules/orchestration/ResponseSynthesizer.ts — P33 Cognitive Orchestration Layer
 *
 * Combines the outputs of one or more agent steps (plus optional memory context)
 * into a single coherent response string, accompanied by confidence metadata.
 *
 * Design:
 *   - Pure function — no side effects, fully testable
 *   - Deterministic formatting — section order is stable and predictable
 *   - Graceful about empty / null / non-string step data (never throws)
 *   - Confidence formula: successRate × intentConfidence — conservative on purpose
 *     so the orchestrator's reflection loop triggers appropriately
 *
 * P34 upgrade path: replace text joining with a summarisation LLM call
 * (send all step outputs as context, ask for a single synthesis — 1 API call).
 */

import type { IntentResult }      from './IntentEngine';
import type { MemorySearchResult } from '@/services/agentApiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StepResult {
  stepId:     string;
  agent:      string;
  success:    boolean;
  data?:      unknown;
  error?:     string;
  tokensUsed: number;
  durationMs: number;
  simulated?: boolean;
}

export interface SynthesisInput {
  steps:         StepResult[];
  memoryContext: MemorySearchResult[];
  intent:        IntentResult;
}

export interface SynthesisOutput {
  output:     string;
  confidence: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert an agent's `data` field (unknown type) to a displayable string.
 * Tries common object patterns from both local and remote agents before
 * falling back to full JSON serialisation.
 */
function dataToString(data: unknown): string {
  if (!data)                       return '';
  if (typeof data === 'string')    return data;
  if (typeof data === 'number')    return String(data);
  if (typeof data === 'boolean')   return String(data);

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    // Common patterns across built-in and custom agents
    for (const key of ['message', 'output', 'text', 'result', 'content', 'summary']) {
      if (typeof obj[key] === 'string' && obj[key]) return obj[key] as string;
    }
  }

  try {
    const json = JSON.stringify(data);
    return json === '{}' || json === 'null' ? '' : json;
  } catch {
    return '';
  }
}

// ── Synthesizer ───────────────────────────────────────────────────────────────

/**
 * Synthesise all step outputs (and optional memory context) into a final response.
 *
 * Output sections (only non-empty sections are included):
 *   1. [Contesto memorizzato] — top-2 memory matches, 150 chars each
 *   2. Per successful step: the step's data rendered as text
 *   3. [Errori] — failed step errors (if any) for transparency
 */
export function synthesize(input: SynthesisInput): SynthesisOutput {
  const { steps, memoryContext, intent } = input;
  const parts: string[] = [];

  // ── Memory context preamble ─────────────────────────────────────────────────
  if (memoryContext.length > 0) {
    const snippets = memoryContext
      .slice(0, 2)
      .map(m => `  • ${m.content.slice(0, 150).replace(/\n/g, ' ')}`)
      .join('\n');
    parts.push(`[Contesto memorizzato rilevante]\n${snippets}`);
  }

  // ── Successful step outputs ─────────────────────────────────────────────────
  const successfulSteps = steps.filter(s => s.success);
  for (const step of successfulSteps) {
    const text = dataToString(step.data);
    if (text) parts.push(text.slice(0, 2_000));
  }

  // ── Failed step errors (transparent fallback) ────────────────────────────────
  const failedSteps = steps.filter(s => !s.success && s.error);
  if (failedSteps.length > 0 && successfulSteps.length === 0) {
    // Only show errors when there's no good output at all
    const errText = failedSteps.map(s => `[${s.agent}]: ${s.error}`).join('\n');
    parts.push(`[Errore elaborazione]\n${errText}`);
  }

  // ── Empty guard ─────────────────────────────────────────────────────────────
  if (parts.length === 0) {
    parts.push('Elaborazione completata.');
  }

  const output     = parts.join('\n\n---\n\n');
  const successRate = steps.length > 0 ? successfulSteps.length / steps.length : 0;
  const confidence  = Math.min(0.95, successRate * intent.confidence);

  return { output, confidence };
}

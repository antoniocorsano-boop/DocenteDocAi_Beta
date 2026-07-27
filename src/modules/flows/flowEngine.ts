/**
 * flows/flowEngine.ts
 *
 * Flow Engine runtime — build flows from patterns and execute them.
 *
 * Design:
 *   - buildFlowFromPattern(): pure function — no side-effects, returns OrbitFlow | null
 *   - executeFlow(): async; iterates over steps, calls executeAction() for each
 *   - Integrates with existing orchestration + trust pipeline
 *   - flowTrust is managed in useFlowStore; engine reads it but doesn't write it
 */

import { nanoid }             from 'nanoid';
import { executeAction }      from '../orchestration/orchestrationService';
import { getActionLog }       from '../orchestration/patternDetector';
import { skillRegistry }      from '../orchestration/skillRegistry';
import type { CognitiveSuggestion, CognitiveDomain } from '../cognitiveLayer/types';
import type { OrchestrationOptions } from '../orchestration/types';
import type {
  OrbitFlow,
  FlowStep,
  FlowStepResult,
  FlowExecutionResult,
} from './orbitFlow';
import {
  FLOW_PATTERN_MIN_FREQUENCY,
  FLOW_MAX_AUTO_STEPS,
} from './orbitFlow';

// ─── Pattern window ───────────────────────────────────────────────────────────

/** Sequence analysis window — how far back in the log we look for co-occurrences */
const SEQUENCE_WINDOW_MS = 30 * 60 * 1_000; // 30 minutes

/** Minimum co-occurrence count for a ctaType pair to be included in a flow */
const SEQUENCE_MIN_COOCCURRENCE = FLOW_PATTERN_MIN_FREQUENCY;

// ─── buildFlowFromPattern ─────────────────────────────────────────────────────

/**
 * Analyses the in-memory action log to detect a repeating multi-step sequence.
 *
 * Algorithm:
 *   1. Filter log entries within SEQUENCE_WINDOW_MS
 *   2. Detect the most frequent ordered pair (A → B) of distinct ctaTypes
 *   3. Extend the pair to a sequence by chaining: A → B → C if C follows B often
 *   4. If the sequence meets FLOW_PATTERN_MIN_FREQUENCY, produce an OrbitFlow
 *
 * Returns null if no qualifying sequence is found.
 */
export function buildFlowFromPattern(): OrbitFlow | null {
  const log  = getActionLog();
  const now  = Date.now();
  const cutoff = now - SEQUENCE_WINDOW_MS;
  const recent = log.filter(e => e.timestamp >= cutoff);

  if (recent.length < SEQUENCE_MIN_COOCCURRENCE * 2) return null;

  // Build ordered-pair frequency map: "A->B" => count
  const pairFreq = new Map<string, number>();
  for (let i = 0; i < recent.length - 1; i++) {
    const a = recent[i].ctaType;
    const b = recent[i + 1].ctaType;
    if (a === b) continue; // skip self-loops
    if (a.startsWith('DYNAMIC_SKILL::') || b.startsWith('DYNAMIC_SKILL::')) continue;
    const key = `${a}->${b}`;
    pairFreq.set(key, (pairFreq.get(key) ?? 0) + 1);
  }

  // Find the most frequent pair
  let bestPair: string | null = null;
  let bestCount = 0;
  for (const [pair, count] of pairFreq) {
    if (count > bestCount) { bestCount = count; bestPair = pair; }
  }

  if (!bestPair || bestCount < SEQUENCE_MIN_COOCCURRENCE) return null;

  const [startCta, secondCta] = bestPair.split('->');

  // Extend the sequence: find what follows secondCta most frequently
  const sequence: string[] = [startCta, secondCta];
  let tail = secondCta;
  while (sequence.length < FLOW_MAX_AUTO_STEPS) {
    let nextBest: string | null = null;
    let nextBestCount = 0;
    for (const [pair, count] of pairFreq) {
      const [a, b] = pair.split('->');
      if (a === tail && !sequence.includes(b) && count >= SEQUENCE_MIN_COOCCURRENCE) {
        if (count > nextBestCount) { nextBestCount = count; nextBest = b; }
      }
    }
    if (!nextBest) break;
    sequence.push(nextBest);
    tail = nextBest;
  }

  if (sequence.length < 2) return null;

  // Build FlowStep[] from sequence — resolve labels via skillRegistry
  const steps: FlowStep[] = sequence.map((ctaType, i): FlowStep => {
    const skill = skillRegistry.resolve(ctaType);
    // Infer domain from recent log entries for this ctaType
    const domainEntries = recent.filter(e => e.ctaType === ctaType && e.domain);
    const domain: CognitiveDomain =
      (domainEntries[0]?.domain as CognitiveDomain | undefined) ?? 'operational';

    return {
      stepId:        `step_${i}_${ctaType.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      ctaType,
      label:         skill?.label ?? ctaType,
      domain,
      executionMode: i === 0 ? 'explicit' : 'ambient', // first step always explicit
    };
  });

  // Infer trigger domain from the log
  const allDomains = recent.map(e => e.domain).filter(Boolean) as CognitiveDomain[];
  const domainFreq = new Map<string, number>();
  for (const d of allDomains) domainFreq.set(d, (domainFreq.get(d) ?? 0) + 1);

  const flowName = steps
    .slice(0, 2)
    .map(s => s.label)
    .join(' → ');

  const flow: OrbitFlow = {
    id:             nanoid(10),
    name:           flowName,
    description:    `Sequenza rilevata automaticamente (${bestCount}× nella sessione)`,
    steps,
    trigger: {
      originPattern: startCta,
      manualOnly:    false,
    },
    trustScore:     0.65, // initial trust for auto-generated flows
    executionCount: 0,
    lastRunAt:      0,
    createdAt:      now,
    active:         true,
  };

  return flow;
}

// ─── executeFlow ──────────────────────────────────────────────────────────────

/**
 * Executes an OrbitFlow step by step.
 *
 * - Stops on first failed step (unless the step is optional — future extension)
 * - Waits `delayMs` between steps if specified
 * - Uses a synthetic CognitiveSuggestion to call the shared executeAction pipeline
 */
export async function executeFlow(
  flow:    OrbitFlow,
  opts:    OrchestrationOptions,
): Promise<FlowExecutionResult> {
  const stepResults: FlowStepResult[] = [];
  let stepsRun = 0;

  for (const step of flow.steps) {
    // Build a minimal synthetic suggestion to satisfy executeAction's signature
    const syntheticSuggestion: CognitiveSuggestion = {
      id:            `flow_${flow.id}_${step.stepId}`,
      type:          'ACTION',
      priority:      'medium',
      domain:        step.domain,
      title:         step.label,
      description:   `Flow step — ${flow.name}`,
      cta:           step.label,
      ctaType:       step.ctaType,
      sourceEntryId: `flow_${flow.id}`,
      generatedAt:   Date.now(),
    };

    let result: FlowStepResult;
    try {
      const execResult = await executeAction(step.ctaType, syntheticSuggestion, opts);
      result = {
        stepId:        step.stepId,
        ctaType:       step.ctaType,
        success:       execResult.success,
        reason:        execResult.reason,
        trustRecordId: execResult.trustRecordId,
      };
    } catch (err) {
      result = {
        stepId:  step.stepId,
        ctaType: step.ctaType,
        success: false,
        reason:  err instanceof Error ? err.message : 'Errore imprevisto nello step',
      };
    }

    stepResults.push(result);
    stepsRun++;

    if (!result.success) {
      // Halt on first failure
      return {
        flowId:         flow.id,
        success:        false,
        stepsRun,
        stepsTotal:     flow.steps.length,
        stepResults,
        completedFully: false,
      };
    }

    // Inter-step delay
    if (step.delayMs && step.delayMs > 0) {
      await new Promise<void>(resolve => setTimeout(resolve, step.delayMs));
    }
  }

  return {
    flowId:         flow.id,
    success:        true,
    stepsRun,
    stepsTotal:     flow.steps.length,
    stepResults,
    completedFully: true,
  };
}

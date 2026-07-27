/**
 * modules/orchestration/CognitiveOrchestrator.ts — P33 Cognitive Orchestration Layer
 *
 * The top-level orchestration engine. Sits ABOVE AgentManager and transforms
 * a raw user string into a fully synthesised multi-agent response.
 *
 * ┌──────────────┐     ┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
 * │ classifyIntent│────▶│  searchMemory│────▶│ TaskPlanner  │────▶│ executeSteps()   │
 * │ (IntentEngine)│     │ (optional)  │     │ (plan steps) │     │ parallel/seq     │
 * └──────────────┘     └─────────────┘     └──────────────┘     └────────┬─────────┘
 *                                                                          │
 *                                                                          ▼
 *                                                              ┌───────────────────────┐
 *                                                              │ ResponseSynthesizer   │
 *                                                              │ + reflection loop     │
 *                                                              └───────────────────────┘
 *
 * Guards:
 *   - NEVER bypasses AgentManager.executeRemote() gates (Simulation/Privacy/Token)
 *   - Memory retrieval is non-fatal (continues without context if it fails)
 *   - Each step failure is isolated (other steps still run)
 *   - Reflection loop retries ONCE at most with agent.cognitive
 *
 * Observability:
 *   All events flow through `observe()` from @/utils/observability (same pattern
 *   as AgentManager). Events: orchestrator.start / .intent / .step /
 *   .reflection / .complete / .error
 *
 * Export:
 *   `CognitiveOrchestrator` — singleton, call `CognitiveOrchestrator.run(input)`
 */

import { observe }         from '@/utils/observability';
import { executeRemote }   from '@/modules/agents/AgentManager';
import { searchMemory }    from '@/services/agentApiClient';
import type { MemorySearchResult, AgentScore } from '@/services/agentApiClient';
import { classifyIntent }  from './IntentEngine';
import { plan }            from './TaskPlanner';
import type { TaskStep }   from './TaskPlanner';
import { synthesize }      from './ResponseSynthesizer';
import type { StepResult } from './ResponseSynthesizer';
import { getModeConfig }   from './ModeEngine';
import type { Mode }       from './ModeEngine';

// Re-export so consumers can import from one place
export type { StepResult } from './ResponseSynthesizer';
export type { IntentResult, IntentType } from './IntentEngine';
export type { TaskStep } from './TaskPlanner';
export type { AgentScore } from '@/services/agentApiClient';
export type { Mode } from './ModeEngine';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OrchestratorResult {
  /** Final synthesised response text */
  output:          string;
  /** Detailed per-step execution records */
  steps:           StepResult[];
  /** True when at least one memory entry was retrieved and injected */
  memoryUsed:      boolean;
  /** Composite confidence [0, 1] — see ResponseSynthesizer */
  confidence:      number;
  /** IntentType detected by the IntentEngine */
  intentType:      string;
  /** Wall-clock duration of the full run (ms) */
  durationMs:      number;
  /** True when ALL steps were intercepted by SimulationGuard */
  simulated:       boolean;
  /** Agent scores used for adaptive routing in this run (may be empty) */
  agentScoresUsed: AgentScore[];
}

/** Optional per-call configuration for adaptive behaviour (P34/P35/P36.5). */
export interface OrchestratorOptions {
  /** Pre-fetched agent scores — injected by useAdaptiveOrchestrator for adaptive routing */
  agentScores?: AgentScore[];
  /**
   * Runtime parameter overrides per agent (P35).
   * Key: agentId  Value: param map (e.g. { reliabilityThreshold: 0.35 })
   * Fetched from GET /adaptive/params by useAdaptiveOrchestrator when the
   * feedback loop is active.
   */
  agentParams?: Record<string, Record<string, unknown>>;
  /**
   * Execution mode (P36.5 ModeEngine).
   * Controls maxSteps, memory usage, retry behaviour and concurrency.
   * Defaults to 'balanced' when not provided.
   */
  mode?: Mode;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const REFLECTION_THRESHOLD    = 0.40;
const RELIABILITY_THRESHOLD   = 0.40;
const MEMORY_SEARCH_LIMIT     = 3;

/**
 * When an agent's reliability falls below RELIABILITY_THRESHOLD, we try to
 * substitute it with the first entry from this map. Falls back to agent.cognitive
 * if the primary fallback also has a low score or is unregistered.
 */
const AGENT_FALLBACK_MAP: Record<string, string> = {
  'agent.compliance': 'agent.cognitive',
  'agent.monitoring': 'agent.cognitive',
};

// ── P34 Adaptive helpers ──────────────────────────────────────────────────────

/**
 * Replace agent assignments on steps whose agent has reliability below threshold.
 * Falls back to the value in AGENT_FALLBACK_MAP, or to agent.cognitive as last resort.
 * Emits adaptive.reroute events (info level) for each substitution made.
 */
export function rerouteStepsBasedOnScores(
  steps:       TaskStep[],
  agentScores: AgentScore[],
  agentParams?: Record<string, Record<string, unknown>>,
): TaskStep[] {
  if (agentScores.length === 0) return steps;

  const scoreMap = new Map<string, AgentScore>(agentScores.map(s => [s.agentId, s]));

  return steps.map(step => {
    const score = scoreMap.get(step.agent);
    // Use per-agent threshold override if available (P35 feedback loop)
    const threshold = (agentParams?.[step.agent]?.reliabilityThreshold as number | undefined)
      ?? RELIABILITY_THRESHOLD;
    // Leave unchanged when no score data is available or agent is reliable
    if (!score || score.reliability >= threshold) return step;

    const candidateFallback  = AGENT_FALLBACK_MAP[step.agent] ?? 'agent.cognitive';
    const fallbackScore      = scoreMap.get(candidateFallback);
    // Only reroute when the fallback has better (or unknown) reliability
    if (fallbackScore && fallbackScore.reliability <= score.reliability) return step;

    observe(
      'adaptive.reroute',
      { stepId: step.agent, original: step.agent, fallback: candidateFallback, reliability: score.reliability },
      'info',
    );
    return { ...step, agent: candidateFallback };
  });
}

/**
 * Force serialization for parallel steps whose agent has low reliability.
 * Each unreliable step that would run in parallel (dependsOn: []) gets a
 * dependency on the immediately preceding step, preventing blast-radius expansion.
 */
export function adjustParallelism(
  steps:       TaskStep[],
  agentScores: AgentScore[],
  agentParams?: Record<string, Record<string, unknown>>,
): TaskStep[] {
  if (agentScores.length === 0) return steps;

  const unreliableAgents = new Set(
    agentScores
      .filter(s => {
        const threshold = (agentParams?.[s.agentId]?.reliabilityThreshold as number | undefined)
          ?? RELIABILITY_THRESHOLD;
        return s.reliability < threshold;
      })
      .map(s => s.agentId),
  );
  if (unreliableAgents.size === 0) return steps;

  let lastId: string | null = null;
  return steps.map(step => {
    const isUnreliableParallel =
      unreliableAgents.has(step.agent) &&
      (!step.dependsOn || step.dependsOn.length === 0);

    const result: TaskStep = isUnreliableParallel && lastId
      ? { ...step, dependsOn: [lastId] }
      : step;

    lastId = step.id;
    return result;
  });
}

/**
 * Decide whether a post-execution reflection retry is warranted.
 *
 * Returns true when:
 *   - the last outcome was a failure, OR
 *   - the agent's reliability is below threshold even on success
 *     (proactive reflection for consistently weak agents)
 */
export function retryPolicy(
  agentId:     string,
  lastOutcome: { success: boolean },
  agentScores: AgentScore[],
  agentParams?: Record<string, Record<string, unknown>>,
): boolean {
  if (!lastOutcome.success) return true;
  const score     = agentScores.find(s => s.agentId === agentId);
  const threshold = (agentParams?.[agentId]?.reliabilityThreshold as number | undefined)
    ?? RELIABILITY_THRESHOLD;
  return !!score && score.reliability < threshold;
}

// ── Input helpers ─────────────────────────────────────────────────────────────

function memoryContextToText(ctx: MemorySearchResult[]): string {
  if (ctx.length === 0) return '';
  return ctx
    .slice(0, MEMORY_SEARCH_LIMIT)
    .map(m => `  • ${m.content.slice(0, 120).replace(/\n/g, ' ')}`)
    .join('\n');
}

/**
 * Build the string input for a step execution, enriching the original input
 * with optional memory context and the text outputs of prior completed steps.
 */
function buildStepInput(
  originalInput: string,
  memoryContext: MemorySearchResult[],
  priorResults:  StepResult[],
): string {
  let enriched = originalInput;

  const ctxText = memoryContextToText(memoryContext);
  if (ctxText) {
    enriched = `[Contesto da memoria]\n${ctxText}\n\n[Richiesta]\n${enriched}`;
  }

  const priorOutputs = priorResults
    .filter(r => r.success && r.data)
    .map(r => {
      const d = r.data;
      const text = typeof d === 'string' ? d : JSON.stringify(d);
      return text.slice(0, 400);
    });

  if (priorOutputs.length > 0) {
    enriched += `\n\n[Analisi precedente]\n${priorOutputs.join('\n')}`;
  }

  return enriched;
}

// ── Step execution ────────────────────────────────────────────────────────────

async function executeSingleStep(step: TaskStep, input: string): Promise<StepResult> {
  observe('orchestrator.step', { stepId: step.id, agent: step.agent, status: 'start' }, 'debug');
  const t0 = performance.now();

  try {
    const result     = await executeRemote(step.agent, input);
    const durationMs = performance.now() - t0;

    observe(
      'orchestrator.step',
      { stepId: step.id, agent: step.agent, status: result.success ? 'success' : 'error' },
      result.success ? 'info' : 'warn',
    );

    return {
      stepId:     step.id,
      agent:      step.agent,
      success:    result.success,
      data:       result.data,
      error:      result.error,
      tokensUsed: result.tokensUsed,
      durationMs,
      simulated:  result.simulated,
    };
  } catch (err) {
    const durationMs = performance.now() - t0;
    const error      = err instanceof Error ? err.message : String(err);
    observe('orchestrator.step', { stepId: step.id, agent: step.agent, status: 'error', error }, 'error');
    return {
      stepId:    step.id,
      agent:     step.agent,
      success:   false,
      error,
      tokensUsed: 0,
      durationMs,
      simulated:  false,
    };
  }
}

/**
 * Execute all steps in topological order.
 *
 * Algorithm:
 *   Round 1 → all steps with empty dependsOn run in parallel (Promise.all)
 *   Round 2+ → steps whose deps are all satisfied run next (also in parallel per round)
 *   Loop terminates when no more ready steps remain or a cycle is detected.
 *
 * Each round passes the enriched input that includes outputs from all prior rounds.
 */
async function executeSteps(
  steps:         TaskStep[],
  originalInput: string,
  memoryContext: MemorySearchResult[],
): Promise<StepResult[]> {
  const completed  = new Map<string, StepResult>();
  const remaining  = [...steps];
  let   safetyExit = 0;

  while (remaining.length > 0 && safetyExit < 10) {
    safetyExit++;

    // Find steps whose dependencies are all complete
    const ready = remaining.filter(step =>
      (step.dependsOn ?? []).every(dep => completed.has(dep)),
    );
    if (ready.length === 0) break; // cycle or unreachable deps — bail out

    // Build enriched input using outputs of ALL completed steps so far
    const priorResults = Array.from(completed.values());
    const stepInput    = buildStepInput(originalInput, memoryContext, priorResults);

    // Execute the ready batch in parallel
    const roundResults = await Promise.all(ready.map(s => executeSingleStep(s, stepInput)));

    // Register results and remove from remaining
    for (const result of roundResults) {
      completed.set(result.stepId, result);
      const idx = remaining.findIndex(s => s.id === result.stepId);
      if (idx !== -1) remaining.splice(idx, 1);
    }
  }

  return Array.from(completed.values());
}

// ── Orchestrator class ────────────────────────────────────────────────────────

class _CognitiveOrchestrator {
  /**
   * Execute a full orchestration run for the given user input.
   *
   * Accepts an optional `options.agentScores` array (from useAdaptiveOrchestrator)
   * to enable P34 adaptive routing. When omitted the orchestrator runs in
   * standard P33 mode with no routing changes.
   *
   * Never throws — all error conditions are captured as returned `OrchestratorResult`
   * with `confidence: 0` and an error message in `output`.
   */
  async run(input: string, options: OrchestratorOptions = {}): Promise<OrchestratorResult> {
    const t0          = performance.now();
    const agentScores = options.agentScores ?? [];
    const agentParams = options.agentParams;
    const modeConfig  = getModeConfig(options.mode ?? 'balanced');
    observe('orchestrator.start', { inputLength: input.length, adaptiveScores: agentScores.length, mode: options.mode ?? 'balanced' }, 'info');

    try {
      // ── 1. Intent classification ──────────────────────────────────────────
      const intent = classifyIntent(input);
      observe('orchestrator.intent', { type: intent.type, confidence: intent.confidence }, 'debug');

      // ── 2. Memory retrieval (non-fatal, skipped in fast mode) ─────────────
      let memoryContext: MemorySearchResult[] = [];
      let memoryUsed = false;

      if (intent.useMemory && modeConfig.useMemory) {
        try {
          memoryContext = await searchMemory(input, MEMORY_SEARCH_LIMIT);
          memoryUsed    = memoryContext.length > 0;
        } catch {
          // Non-fatal: log silently, continue without memory
          observe('orchestrator.memory.unavailable', {}, 'warn');
        }
      }

      // ── 3. Task planning ──────────────────────────────────────────────────
      const rawSteps = plan(intent, input);

      // ── 3b. P34/P35 Adaptive routing ─────────────────────────────────────
      const routedSteps   = rerouteStepsBasedOnScores(rawSteps, agentScores, agentParams);
      const adjustedSteps = adjustParallelism(routedSteps, agentScores, agentParams);

      // ── 3c. P36.5 Mode constraints (cap steps to mode.maxSteps) ──────────
      const modeLimitedSteps = adjustedSteps.slice(0, modeConfig.maxSteps);

      if (agentScores.length > 0) {
        observe('adaptive.agentScored', { scoresCount: agentScores.length }, 'debug');
      }

      // Safety: never run with empty plan
      const safePlan: TaskStep[] = modeLimitedSteps.length > 0 ? modeLimitedSteps : [
        { id: 'step-1', description: 'Elaborazione fallback', agent: 'agent.cognitive', dependsOn: [] },
      ];

      // ── 4. Multi-step execution ───────────────────────────────────────────
      const stepResults = await executeSteps(safePlan, input, memoryContext);

      // ── 5. Synthesise ─────────────────────────────────────────────────────
      const { output, confidence } = synthesize({ steps: stepResults, memoryContext, intent });

      // ── 6. Reflection loop (skipped in fast mode) ─────────────────────────
      const anyFailed = stepResults.some(s => !s.success);
      const primaryAgent = safePlan[0]?.agent ?? 'agent.cognitive';
      const adaptiveRetry = retryPolicy(primaryAgent, { success: !anyFailed }, agentScores, agentParams);
      const shouldReflect = modeConfig.retry && (confidence < REFLECTION_THRESHOLD || anyFailed || adaptiveRetry);

      if (shouldReflect) {
        const reflectionReason = anyFailed
          ? 'step_failure'
          : adaptiveRetry ? 'adaptive_low_reliability' : 'low_confidence';
        observe(
          'orchestrator.reflection',
          { reason: reflectionReason, confidence, adaptiveRetry },
          'info',
        );

        const retryStep: TaskStep = {
          id:          'reflection',
          description: 'Retry via agente cognitivo (reflection loop)',
          agent:       'agent.cognitive',
          dependsOn:   [],
        };
        const retryInput  = buildStepInput(input, memoryContext, stepResults);
        const retryResult = await executeSingleStep(retryStep, retryInput);

        if (retryResult.success) {
          const allResults    = [...stepResults, retryResult];
          const retried       = synthesize({ steps: allResults, memoryContext, intent });
          const finalDuration = performance.now() - t0;

          observe('orchestrator.complete', {
            stepsCount: allResults.length,
            durationMs: finalDuration,
            memoryUsed,
            confidence: retried.confidence,
            reflected:  true,
          }, 'info');

          return {
            output:          retried.output,
            steps:           allResults,
            memoryUsed,
            confidence:      retried.confidence,
            intentType:      intent.type,
            durationMs:      finalDuration,
            simulated:       allResults.every(s => s.simulated === true),
            agentScoresUsed: agentScores,
          };
        }
      }

      // ── 7. Return final result ────────────────────────────────────────────
      const durationMs = performance.now() - t0;
      observe('orchestrator.complete', {
        stepsCount: stepResults.length,
        durationMs,
        memoryUsed,
        confidence,
      }, 'info');

      return {
        output,
        steps:           stepResults,
        memoryUsed,
        confidence,
        intentType:      intent.type,
        durationMs,
        simulated:       stepResults.every(s => s.simulated === true),
        agentScoresUsed: agentScores,
      };

    } catch (err) {
      const error      = err instanceof Error ? err.message : String(err);
      const durationMs = performance.now() - t0;
      observe('orchestrator.error', { error, durationMs }, 'error');

      return {
        output:          `Errore orchestratore: ${error}`,
        steps:           [],
        memoryUsed:      false,
        confidence:      0,
        intentType:      'simple',
        durationMs,
        simulated:       false,
        agentScoresUsed: agentScores,
      };
    }
  }
}

// ── Singleton export ──────────────────────────────────────────────────────────

/**
 * The global CognitiveOrchestrator instance.
 *
 * Usage:
 *   import { CognitiveOrchestrator } from '@/modules/orchestration/CognitiveOrchestrator';
 *   const result = await CognitiveOrchestrator.run(userInput);
 *
 * Or use the hook:
 *   import { useOrchestrator } from '@/hooks/useOrchestrator';
 *   const { run, loading, result } = useOrchestrator();
 */
export const CognitiveOrchestrator = new _CognitiveOrchestrator();

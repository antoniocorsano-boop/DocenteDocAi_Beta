/**
 * hooks/useAdaptiveOrchestrator.ts — Adaptive Intelligence Hook (P34)
 *
 * Combines `useOrchestrator` with the P34 adaptive scoring layer:
 *   - Fetches agent scores from the server on mount (non-fatal).
 *   - Passes scores into CognitiveOrchestrator.run() for adaptive routing.
 *   - Logs each execution outcome back to the server (fire-and-forget).
 *   - Triggers score recalculation after each outcome is logged.
 *   - Exposes memory compression via `compressMemo()`.
 *   - Exposes `rerouteStep()` which refreshes scores, enabling the UI to
 *     present up-to-date agent reliability data after manual inspection.
 *
 * Graceful degradation:
 *   - If the server is unreachable, agentScores stays [] and the orchestrator
 *     runs in standard P33 mode without adaptive routing.
 *   - No error is ever surfaced to the user from the adaptive layer itself;
 *     only orchestration errors propagate to `error`.
 *
 * Observability:
 *   - adaptive.scoresLoaded   — fired after initial score fetch
 *   - adaptive.memoryConsolidated — fired after compressMemo() succeeds
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CognitiveOrchestrator }                    from '@/modules/orchestration/CognitiveOrchestrator';
import type { OrchestratorResult }                  from '@/modules/orchestration/CognitiveOrchestrator';

// Fase 3 migration (deprecation path): direct CognitiveOrchestrator usage being consolidated
// Route through AIBrain (central gateway). 
// Recommended: AIBrain.ask() or AIBrain.getCognitiveOrchestrator()
// Legacy direct import kept only for rollback-safe side-by-side during Fase 3.
import { AIBrain } from '@/ai/brain/AIBrain';
import { observe }                                  from '@/utils/observability';
import {
  fetchAgentScores,
  fetchAgentParams,
  logAgentOutcomeToServer,
  triggerScoreUpdate,
  compressUserMemory,
} from '@/services/agentApiClient';
import type {
  AgentScore,
  AgentParamsEntry,
  MemorySummaryResult,
} from '@/services/agentApiClient';
import { useFeedbackLoop }    from '@/hooks/useFeedbackLoop';
import type { UseFeedbackLoopReturn } from '@/hooks/useFeedbackLoop';
import type { Mode }          from '@/modules/orchestration/ModeEngine';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseAdaptiveOrchestratorReturn {
  /**
   * Execute an orchestration task with adaptive agent routing.
   * Returns an OrchestratorResult or null if the input is empty.
   */
  executeTask:   (input: string, mode?: Mode) => Promise<OrchestratorResult | null>;
  /** Current agent scores fetched from the server — empty when server is unavailable */
  agentScores:   AgentScore[];
  /** Most recently created memory summaries from the last compressMemo() call */
  memorySummary: MemorySummaryResult[];
  /**
   * Refresh agent scores from the server (e.g. after a manual inspection in the UI).
   * The step ID parameter is accepted for API consistency but does not change routing
   * behaviour directly — the refreshed scores will be used in the next executeTask call.
   */
  rerouteStep:   (stepId?: string) => Promise<void>;
  /**
   * Compress old memory entries for the current user and update memorySummary state.
   * Non-fatal — the returned promise always resolves.
   */
  compressMemo:  (batchSize?: number) => Promise<void>;
  loading:       boolean;
  result:        OrchestratorResult | null;
  error:         string | null;
  reset:         () => void;
  /** P35 feedback loop handle. Active when options.enableFeedbackLoop=true. */
  feedbackLoop:  UseFeedbackLoopReturn;
}

/** Per-call options for useAdaptiveOrchestrator (P35). */
export interface UseAdaptiveOrchestratorOptions {
  /**
   * Enable the P35 Continuous Feedback Loop.
   * Should be true for beta (pro plan) users, false for base users.
   * Defaults to false.
   */
  enableFeedbackLoop?: boolean;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAdaptiveOrchestrator(
  options?: UseAdaptiveOrchestratorOptions,
): UseAdaptiveOrchestratorReturn {
  const [loading,       setLoading      ] = useState(false);
  const [result,        setResult       ] = useState<OrchestratorResult | null>(null);
  const [error,         setError        ] = useState<string | null>(null);
  const [agentScores,   setAgentScores  ] = useState<AgentScore[]>([]);
  const [memorySummary, setMemorySummary] = useState<MemorySummaryResult[]>([]);

  // Stable refs so callbacks don't go stale on score / param updates
  const scoresRef = useRef<AgentScore[]>([]);
  scoresRef.current = agentScores;

  const agentParamsRef = useRef<Record<string, Record<string, unknown>>>({});

  // P35: feedback loop (no-op when disabled)
  const feedbackLoop = useFeedbackLoop(options?.enableFeedbackLoop ?? false);

  // ── Load scores + agent params on mount ───────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchAgentScores(),
      fetchAgentParams(),
    ]).then(([scores, paramEntries]: [AgentScore[], AgentParamsEntry[]]) => {
      if (cancelled) return;
      setAgentScores(scores);
      observe('adaptive.scoresLoaded', { count: scores.length }, 'debug');
      const paramsMap: Record<string, Record<string, unknown>> = {};
      for (const entry of paramEntries) paramsMap[entry.agentId] = entry.params;
      agentParamsRef.current = paramsMap;
    });
    return () => { cancelled = true; };
  }, []);

  // ── executeTask ───────────────────────────────────────────────────────────
  const executeTask = useCallback(async (input: string, mode?: Mode): Promise<OrchestratorResult | null> => {
    if (!input.trim()) return null;

    setLoading(true);
    setError(null);

    try {
      // Fase 3: Real consumption of AIBrain.ask (central gateway + buildContext)
      // side-by-side with legacy CognitiveOrchestrator (rollback-safe)
      const ctx = AIBrain.buildContext({
        source: 'adaptive-orchestrator',
        extra: { mode, scoresCount: scoresRef.current.length }
      });
      const brainRes = await AIBrain.ask({
        prompt: input,
        context: ctx,
        mode: mode === 'fast' ? 'fast' : 'balanced'
      });

      // Legacy path (kept for rollback)
      const res = await CognitiveOrchestrator.run(input, {
        agentScores: scoresRef.current,
        agentParams: agentParamsRef.current,
        mode,
      });

      // Prefer AIBrain result when available (augment)
      const finalRes: OrchestratorResult = {
        ...res,
        output: brainRes.content || res.output,
      };
      setResult(finalRes);

      // deprecation path
      if (import.meta.env.DEV) {
        AIBrain.migrateLegacyAsk('legacy-adaptive-orchestrator', ctx).catch(() => {});
      }

      // Fire-and-forget: log outcome + refresh score for the primary agent
      const primaryAgent = res.steps[0]?.agent ?? 'agent.cognitive';
      logAgentOutcomeToServer({
        agentId:    primaryAgent,
        input,
        output:     res.output,
        success:    res.confidence > 0 && !res.output.startsWith('Errore'),
        tokensUsed: res.steps.reduce((acc, s) => acc + (s.tokensUsed ?? 0), 0),
      }).then(() => triggerScoreUpdate(primaryAgent));

      // P35: auto-queue feedback for beta users (no-op when loop is disabled)
      feedbackLoop.queueFeedback({
        agentId: primaryAgent,
        rating:  Math.max(1, Math.min(5, Math.round(res.confidence * 5))),
      });

      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [feedbackLoop]);

  // ── rerouteStep ───────────────────────────────────────────────────────────
  const rerouteStep = useCallback(async (_stepId?: string): Promise<void> => {
    const freshScores = await fetchAgentScores();
    setAgentScores(freshScores);
    observe('adaptive.scoresLoaded', { count: freshScores.length, source: 'reroute' }, 'debug');
  }, []);

  // ── compressMemo ──────────────────────────────────────────────────────────
  const compressMemo = useCallback(async (batchSize = 50): Promise<void> => {
    const summaries = await compressUserMemory(batchSize);
    if (summaries.length > 0) {
      setMemorySummary(summaries);
      observe('adaptive.memoryConsolidated', { summariesCount: summaries.length }, 'info');
    }
  }, []);

  // ── reset ─────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    executeTask,
    agentScores,
    memorySummary,
    rerouteStep,
    compressMemo,
    loading,
    result,
    error,
    reset,
    feedbackLoop,
  };
}

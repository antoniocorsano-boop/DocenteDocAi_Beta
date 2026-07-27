/**
 * useOrbitPipeline.ts  —  P22 Stabilization Layer: memoized cognitive pipeline
 *
 * Encapsulates the full P16–P21 computation chain so UserWorkspace no longer
 * recomputes it on every render.  All outputs are stable references: they only
 * change when their actual inputs change.
 *
 * Usage:
 *   const pipeline = useOrbitPipeline({ behaviorSignals, activeFlows, flowTrust });
 *
 * Prerequisites (caller's responsibility):
 *   - `behaviorSignals` must be a memoized value (wrap in useMemo in the caller)
 *   - `activeFlows` and `flowTrust` come directly from Zustand (already stable)
 */

import { useMemo }                      from 'react';
import type { OrbitBehaviorSignals }    from '../theme/orbitStates';
import type { CognitiveLoadLevel,
              CognitiveLoadSignals }    from '../theme/cognitiveLoad';
import { computeCognitiveLoad }         from '../theme/cognitiveLoad';
import { AGENT_PERSONALITIES }          from '../theme/agentPersonality';
import { getRecentInteractionCount }    from '../modules/orchestration/patternDetector';
import { flowsToAgents }                from '../modules/orbit/agentMapper';
import { resolveAttention }             from '../modules/orbit/attentionRouter';
import type { AttentionMap }            from '../modules/orbit/attentionRouter';
import { coordinateAgents }             from '../modules/orbit/coordinationEngine';
import type { AgentAction }             from '../modules/orbit/coordinationEngine';
import { generateRichNarrative }        from '../modules/orbit/narrativeLayer';
import type { ActiveAgent }             from '../theme/agentPersonality';
import type { OrbitFlow }               from '../modules/flows/orbitFlow';
import { observe }                      from '../utils/observability';

// ─── Input / Output shapes ───────────────────────────────────────────────────

export interface UseOrbitPipelineInput {
  /** Combined behavior signals — MUST be memoized by the caller. */
  behaviorSignals: OrbitBehaviorSignals;
  /** Live active flows from useFlowStore(selectActiveFlows). */
  activeFlows: OrbitFlow[];
  /** Trust scores map from useFlowStore(s => s.flowTrust). */
  flowTrust: Record<string, number>;
}

export interface OrbitPipelineOutput {
  /** Agents derived from active flows + trust scores. */
  sessionAgents: ActiveAgent[];
  /** Cognitive load signals for the current session. */
  cognitiveSignals: CognitiveLoadSignals;
  /** Computed cognitive load level (low | medium | high | critical). */
  cognitiveLoad: CognitiveLoadLevel;
  /** Attention level per agent id. */
  attentionMap: AttentionMap;
  /** Sorted coordination actions from P19. */
  coordinationActions: AgentAction[];
  /** Italian narrative string from P21 (undefined when no agents). */
  narrative: string | undefined;
  /**
   * P29: per-stage health report.
   * Each entry records whether that pipeline stage completed without errors.
   * A stage failure triggers graceful degradation to a safe default value;
   * the rest of the pipeline continues unaffected.
   */
  pipelineHealth: Array<{ stage: string; ok: boolean; error?: string }>;
}

// ─── P29: stage result type ──────────────────────────────────────────────────

interface StageResult<T> { value: T; ok: boolean; error?: string }

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useOrbitPipeline({
  behaviorSignals,
  activeFlows,
  flowTrust,
}: UseOrbitPipelineInput): OrbitPipelineOutput {

  // ── P17: active agents derived from flows ──────────────────────────────────
  const agentsResult: StageResult<ActiveAgent[]> = useMemo(() => {
    try {
      return { value: flowsToAgents(activeFlows, flowTrust), ok: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      observe('pipeline.stage.error', { stage: 'flowsToAgents', error }, 'error');
      return { value: [], ok: false, error };
    }
  }, [activeFlows, flowTrust]);
  const sessionAgents = agentsResult.value;

  // ── P17a: cognitive load signals ───────────────────────────────────────────
  const cogSignalsResult: StageResult<CognitiveLoadSignals> = useMemo(() => {
    const fallback: CognitiveLoadSignals = {
      viewportWidth: 1280, ambientFiredCount: 0,
      activeAgentsCount: 0, recentInteractions: 0,
      taskComplexity: 'low',
    };
    try {
      return {
        value: {
          viewportWidth:       behaviorSignals.viewportWidth,
          ambientFiredCount:   behaviorSignals.ambientFiredCount,
          activeAgentsCount:   behaviorSignals.activeAgentsCount ?? 0,
          recentInteractions:  getRecentInteractionCount(),
          taskComplexity:      behaviorSignals.taskComplexity,
        },
        ok: true,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      observe('pipeline.stage.error', { stage: 'cognitiveSignals', error }, 'error');
      return { value: fallback, ok: false, error };
    }
  }, [
    behaviorSignals.viewportWidth,
    behaviorSignals.ambientFiredCount,
    behaviorSignals.activeAgentsCount,
    behaviorSignals.taskComplexity,
  ]);
  const cognitiveSignals = cogSignalsResult.value;

  // ── P17a: cognitive load level ────────────────────────────────────────────
  const cogLoadResult: StageResult<CognitiveLoadLevel> = useMemo(() => {
    try {
      return { value: computeCognitiveLoad(cognitiveSignals), ok: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      observe('pipeline.stage.error', { stage: 'cognitiveLoad', error }, 'error');
      return { value: 'low', ok: false, error };
    }
  }, [cognitiveSignals]);
  const cognitiveLoad = cogLoadResult.value;

  // ── Flow-by-id lookup (for lastActiveTs enrichment) ───────────────────────
  const flowByIdResult: StageResult<Map<string, OrbitFlow>> = useMemo(() => {
    try {
      return { value: new Map(activeFlows.map(f => [f.id, f])), ok: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      observe('pipeline.stage.error', { stage: 'flowById', error }, 'error');
      return { value: new Map(), ok: false, error };
    }
  }, [activeFlows]);
  const flowById = flowByIdResult.value;

  // ── P18: attention routing ─────────────────────────────────────────────────
  const attentionResult: StageResult<AttentionMap> = useMemo(() => {
    try {
      if (sessionAgents.length === 0) return { value: {}, ok: true };
      return {
        value: resolveAttention({
          agents: sessionAgents.map(agent => ({
            ...agent,
            priority:     AGENT_PERSONALITIES[agent.personality].priority,
            confidence:   behaviorSignals.agentConfidence,
            lastActiveTs: flowById.get(agent.id)?.lastRunAt ?? Date.now() - 300_000,
          })),
          userIntent:    behaviorSignals.userIntent,
          cognitiveLoad,
          now:           Date.now(),
        }),
        ok: true,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      observe('pipeline.stage.error', { stage: 'resolveAttention', error }, 'error');
      return { value: {}, ok: false, error };
    }
  }, [
    sessionAgents,
    flowById,
    behaviorSignals.agentConfidence,
    behaviorSignals.userIntent,
    cognitiveLoad,
  ]);
  const attentionMap = attentionResult.value;

  // ── P19: multi-agent coordination ─────────────────────────────────────────
  const coordResult: StageResult<AgentAction[]> = useMemo(() => {
    try {
      if (sessionAgents.length === 0) return { value: [], ok: true };
      return {
        value: coordinateAgents({
          agents: sessionAgents.map(a => ({
            ...a,
            attention:  attentionMap[a.id] ?? 'background',
            confidence: behaviorSignals.agentConfidence ?? 0.5,
          })),
          userIntent:     behaviorSignals.userIntent,
          taskComplexity: behaviorSignals.taskComplexity,
        }),
        ok: true,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      observe('pipeline.stage.error', { stage: 'coordinateAgents', error }, 'error');
      return { value: [], ok: false, error };
    }
  }, [
    sessionAgents,
    attentionMap,
    behaviorSignals.agentConfidence,
    behaviorSignals.userIntent,
    behaviorSignals.taskComplexity,
  ]);
  const coordinationActions = coordResult.value;

  // ── P21: narrative label ───────────────────────────────────────────────────
  const narrativeResult: StageResult<string | undefined> = useMemo(() => {
    try {
      return { value: generateRichNarrative(coordinationActions, sessionAgents) ?? undefined, ok: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      observe('pipeline.stage.error', { stage: 'generateRichNarrative', error }, 'error');
      return { value: undefined, ok: false, error };
    }
  }, [coordinationActions, sessionAgents]);
  const narrative = narrativeResult.value;

  // ── P29: pipeline health report ────────────────────────────────────────────
  const pipelineHealth = useMemo(() => [
    { stage: 'flowsToAgents',         ok: agentsResult.ok,      error: agentsResult.error },
    { stage: 'cognitiveSignals',      ok: cogSignalsResult.ok,  error: cogSignalsResult.error },
    { stage: 'cognitiveLoad',         ok: cogLoadResult.ok,     error: cogLoadResult.error },
    { stage: 'flowById',              ok: flowByIdResult.ok,    error: flowByIdResult.error },
    { stage: 'resolveAttention',      ok: attentionResult.ok,   error: attentionResult.error },
    { stage: 'coordinateAgents',      ok: coordResult.ok,       error: coordResult.error },
    { stage: 'generateRichNarrative', ok: narrativeResult.ok,   error: narrativeResult.error },
  ], [
    agentsResult.ok, agentsResult.error,
    cogSignalsResult.ok, cogSignalsResult.error,
    cogLoadResult.ok, cogLoadResult.error,
    flowByIdResult.ok, flowByIdResult.error,
    attentionResult.ok, attentionResult.error,
    coordResult.ok, coordResult.error,
    narrativeResult.ok, narrativeResult.error,
  ]);

  return {
    sessionAgents,
    cognitiveSignals,
    cognitiveLoad,
    attentionMap,
    coordinationActions,
    narrative,
    pipelineHealth,
  };
}

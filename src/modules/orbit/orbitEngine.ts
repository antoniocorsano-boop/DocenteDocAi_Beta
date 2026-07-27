/**
 * modules/orbit/orbitEngine.ts
 *
 * Orbit Engine — single public API surface for the entire Orbit/Jarvis presence system.
 *
 * Consumers should import from here rather than directly from the theme modules:
 *
 *   ✅  import { resolveFinalPresence, computeCognitiveLoad } from '@/modules/orbit/orbitEngine'
 *   ❌  import { resolveFinalPresence } from '@/theme/presenceEngine'
 *
 * This barrel:
 *   1. Re-exports all public functions in one place (no implementation here)
 *   2. Makes tree-shaking trivial — unused functions are excluded at build time
 *   3. Isolates the theme layer behind a module boundary
 *   4. Provides a stable import path that won't move if internals are refactored
 */

// ─── Presence resolution ─────────────────────────────────────────────────────

export { resolveFinalPresence }         from '../../theme/presenceEngine';
export type { FinalPresenceInput }      from '../../theme/presenceEngine';

/** P16 adaptive layer — exposed for tests and direct overrides */
export { resolveAdaptivePresence,
         resolvePresenceLevel,
         getMacroState }                from '../../theme/orbitStates';

// ─── Cognitive load ───────────────────────────────────────────────────────────

export { computeCognitiveLoad,
         balancePresenceWithLoad,
         LOAD_THRESHOLD_LOW,
         LOAD_THRESHOLD_MEDIUM,
         LOAD_THRESHOLD_HIGH }           from '../../theme/cognitiveLoad';

// ─── Agent personality ────────────────────────────────────────────────────────

export { resolveDominantPersonality,
         applyMotionMultiplier,
         AGENT_PERSONALITIES }           from '../../theme/agentPersonality';

// ─── Types (re-exported for consumers who want a single import) ───────────────

export type { JarvisPresenceLevel,
              OrbitBehaviorSignals,
              OrbitMacroState }          from '../../theme/orbitStates';

export type { CognitiveLoadLevel,
              CognitiveLoadSignals }     from '../../theme/cognitiveLoad';

export type { AgentPersonality,
              AgentPersonalityProfile,
              ActiveAgent }              from '../../theme/agentPersonality';

// ─── Pattern detector signals (Fase 2.1 + 2.3) ───────────────────────────────

export { getBehaviorSignals,
         recordInteraction,
         getRecentInteractionCount }    from '../orchestration/patternDetector';

// ─── Agent mapper (Fase 2.2) ─────────────────────────────────────────────────

export { flowsToAgents }               from './agentMapper';

// ─── Attention router (P18) ───────────────────────────────────────────────────

export { resolveAttention,
         shouldProcessEvent,
         resetEventThrottle,
         enqueueEvent,
         attentionOpacity,
         attentionScale }              from './attentionRouter';

export type { AgentAttentionState,
              AttentionMap,
              AttentionAgentInput,
              AttentionSignals,
              QueuedEvent }            from './attentionRouter';

// ─── Coordination engine (P19) ────────────────────────────────────────────────

export { coordinateAgents,
         getPrimaryActionLabel,
         AGENT_CAPABILITIES,
         ACTION_LABELS_IT }            from './coordinationEngine';

export type { AgentActionType,
              AgentAction,
              CoordinationAgent,
              CoordinationSignals }    from './coordinationEngine';

// ─── Execution engine (P20) ───────────────────────────────────────────────────

export { runExecutionPipeline,
         dedupeActions,
         ACTION_HANDLERS }             from './executionEngine';

export type { ExecutionContext,
              TaskState }              from './executionEngine';

// ─── Narrative layer (P21) ────────────────────────────────────────────────────

export { generateNarrative,
         generateRichNarrative,
         NARRATIVE_LABELS_IT,
         PERSONALITY_LABEL_IT }        from './narrativeLayer';

export type { NarrativeAgent }        from './narrativeLayer';

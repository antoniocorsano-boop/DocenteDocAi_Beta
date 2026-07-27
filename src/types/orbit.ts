/**
 * types/orbit.ts
 *
 * Shared Orbit type barrel — prevents type drift between modules.
 *
 * Import rule:
 *   • For React components + hooks → import from '@/types/orbit' (here)
 *   • For pure logic modules inside theme/ → import directly from source file
 *     (avoids cycles through components/ui/JarvisNexus)
 *
 * This file only re-exports — it never defines new types.
 */

// Presence levels + macro states
export type {
  JarvisPresenceLevel,
  OrbitBehaviorSignals,
  OrbitMacroState,
} from '../theme/orbitStates';

// Cognitive load
export type {
  CognitiveLoadLevel,
  CognitiveLoadSignals,
} from '../theme/cognitiveLoad';

// Agent personality
export type {
  AgentPersonality,
  AgentPersonalityProfile,
  ActiveAgent,
} from '../theme/agentPersonality';

// Presence engine input
export type { FinalPresenceInput } from '../theme/presenceEngine';

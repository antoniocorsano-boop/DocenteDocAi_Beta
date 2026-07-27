/**
 * src/ai/orchestrator/index.ts — barrel export for the AI orchestrator layer.
 *
 * Consumers should import from here:
 *   import { runUnifiedAnalysis, streamAI, PipelineRegistry } from '@/ai/orchestrator';
 */
export { runUnifiedAnalysis } from './unifiedOrchestrator';
export type { UnifiedAIResult, UnifiedAIOptions, AIRunStats } from './types';
export { AI_SCHEMA_VERSION } from './types';
export { resolveModel, classifyTier } from './ModelRouter';
export type { ModelTier } from './ModelRouter';
export { PipelineRegistry } from './PipelineRegistry';
export type { PipelineDefinition } from './PipelineRegistry';
export { streamAI, streamAIToString } from './StreamingManager';
export type { StreamRequest } from './StreamingManager';

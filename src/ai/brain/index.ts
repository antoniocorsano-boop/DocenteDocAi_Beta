/**
 * AIBrain barrel — POST-PHASE 4
 * 
 * Canonical export for the single unified AI gateway.
 * 
 * Usage (recommended):
 *   import { AIBrain } from '@/ai/brain';
 * 
 *   const result = await AIBrain.ask({ prompt, context });
 *   const { prompt } = AIBrain.buildPrompt('situazione-partenza', { classe: '1A', ... });
 *   const plan = await AIBrain.generateWithCentralPrompt('class-planning', data, aiSettings);
 * 
 * Post-Fase 4 additions:
 *   - buildPrompt (central prompt builder)
 *   - generateWithCentralPrompt (internal smart routing + prompt centralization)
 */

export { AIBrain } from './AIBrain';
export type {
  AskOptions,
  AskResult,
  UnifiedRecommendation,
  AIAnalysisResult,
} from './AIBrain';

// Re-exports + aliases (Fase 4 + Post-Fase 4)
export {
  AIBrain as default,
} from './AIBrain';

// Convenience
export const getAIBrain = () => import('./AIBrain').then(m => m.AIBrain);
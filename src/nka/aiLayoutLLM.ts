/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
// LLM integration for AI-driven neural map layout (async, ready for Gemini/OpenAI)
import { NKANode } from './types';
import { NodePosition } from './aiLayout';
import { buildLayoutPrompt } from './aiPromptTemplates';
// Fase 4: FULL routing for NKA layout via AIBrain (no direct aiService)
import { AIBrain } from '../ai/brain/AIBrain';
import { logger } from '../utils/logger';

/**
 * Call an LLM to get optimal node positions for the neural map.
 * Replace fetch logic with your preferred AI service (Gemini, OpenAI, etc).
 */
export async function getLLMNeuralLayout(nodes: readonly NKANode[], width: number, height: number, userContext: any): Promise<NodePosition[]> {
  const prompt = buildLayoutPrompt(nodes, userContext);
  try {
    // Fase 4: wrap with AIBrain buildContext + migrateLegacyAsk
    const ctx = AIBrain.buildContext({ source: 'nka-ai-layout', extra: { nodeCount: nodes.length } });
    await AIBrain.migrateLegacyAsk(`NKA neural layout for ${nodes.length} nodes`, ctx);

    // Post-Fase 4: central prompt path for nka-layout
    const { prompt: nkaLayoutP } = AIBrain.buildPrompt('nka-layout', { nodeCount: nodes.length, userContext });
    const response = await AIBrain.generateWithCentralPrompt('nka-layout', { nodeCount: nodes.length, userContext, prompt: nkaLayoutP }, {} as any);
    const positions = JSON.parse(response.content.trim());
    // Merge positions with node data
    return nodes.map(node => {
      const pos = positions.find((p: any) => p.id === node.id);
      return {
        ...node,
        x: pos ? Math.max(0, Math.min(width, pos.x)) : width / 2,
        y: pos ? Math.max(0, Math.min(height, pos.y)) : height / 2,
      };
    });
  } catch (error) {
    logger.warn('[NKA] LLM layout generation failed, using fallback spiral:', error);
    // Fallback to spiral demo with safe positioning
    const angleStep = (2 * Math.PI) / Math.max(nodes.length, 1);
    const radius = Math.min(width, height) / 3;
    return nodes.map((node, i) => {
      const angle = i * angleStep;
      return {
        ...node,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
      };
    });
  }
}


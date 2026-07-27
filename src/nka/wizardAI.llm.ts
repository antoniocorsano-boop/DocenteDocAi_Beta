/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
// LLM integration for AI-generated wizard steps (Gemini/OpenAI ready)
import { NKANode } from './types';
import { NKAWizardStep } from './wizardAI';
import { buildWizardPrompt } from './wizardAIPromptTemplates';
// Fase 4: FULL routing for NKA wizard via AIBrain (no direct aiService)
import { AIBrain } from '../ai/brain/AIBrain';
// Fase 4: AIBrain routing for NKA wizard (internal daily gesture)
import { AIBrain } from '../ai/brain/AIBrain';

export async function generateWizardForNodeLLM(node: NKANode, userContext: any): Promise<NKAWizardStep[]> {
  const prompt = buildWizardPrompt(node, userContext);
  // Fase 4: wrap with AIBrain buildContext + migrateLegacyAsk
  const ctx = AIBrain.buildContext({ source: 'nka-wizard-llm', extra: { nodeId: node.id } });
  await AIBrain.migrateLegacyAsk(`NKA wizard for node ${node.label}`, ctx);

  // Post-Fase 4: central prompt path for nka-wizard
  const { prompt: nkaWizP } = AIBrain.buildPrompt('nka-wizard', { nodeLabel: node.label });
  const response = await AIBrain.generateWithCentralPrompt('nka-wizard', { nodeLabel: node.label, prompt: nkaWizP }, { temperature: 0.5, maxTokens: 900 } as any);
  try {
    return JSON.parse(response.content) as NKAWizardStep[];
  } catch {
    // Fallback: single step
    return [{
      id: node.id + '-fallback',
      title: `Esplora ${node.label}`,
      description: 'Step generato automaticamente. (Parsing fallito)',
      actions: node.actions
    }];
  }
}


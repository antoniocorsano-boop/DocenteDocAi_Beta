/**
 * artisticCulturalAgent.ts — Artistic-Cultural Agent.
 *
 * Suggests creative and interdisciplinary activities.
 * Delegates heavy AI generation to ArtisticConsilium; this agent provides
 * lightweight synchronous suggestions when the AI service is not available.
 *
 * Activates only at capabilityLevel >= 2 AND when a UDA context is present.
 */

import type { AgentContext, AgentSuggestion } from './types';
import { getQuickArtisticHint } from '../../services/ArtisticConsilium';

export const AGENT_ID = 'artistic';

export function runArtisticCulturalAgent(ctx: AgentContext): AgentSuggestion[] {
  // Gate: praticante+ AND at least one UDA
  if (ctx.capabilityLevel < 2 || ctx.uda.length === 0) return [];

  // Use the most recent UDA as context
  const latestUda = ctx.uda[ctx.uda.length - 1];
  const udaTitle = (latestUda as { titolo?: string }).titolo ?? undefined;

  const hint = getQuickArtisticHint(udaTitle);

  return [
    {
      id: 'art-quick-hint',
      agentId: AGENT_ID,
      label: hint.label,
      description: hint.description ?? hint.label,
      reason: 'Hai raggiunto il livello praticante — il Consilium Artistico suggerisce attività creative e interdisciplinari.',
      priority: hint.priority * 20, // scale from 0–5 to 0–100
      icon: 'palette',
      actionKey: hint.actionKey,
      targetView: 'copilot',
    },
  ];
}

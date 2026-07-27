/**
 * agentOrchestrator.ts — Runs all agents and merges results.
 *
 * Responsibilities:
 *   - Call each agent with the shared AgentContext
 *   - Deduplicate by actionKey (first occurrence wins)
 *   - Sort by priority descending
 *   - Cap output at DecisionContract.MAX_SUGGESTIONS to avoid cognitive overload
 *
 * Architecture: pure function — no side effects, no store reads.
 * All context is passed in by the caller (useAgentSuggestions hook).
 *
 * Conflict resolution rules:
 *   1. `getNextAction()` is the authoritative primary action — it always wins
 *   2. Agents provide secondary contextual suggestions only
 *   3. Multiple agents producing the same actionKey → first (highest-priority agent) wins
 *   4. Total visible suggestions capped at DecisionContract.MAX_SUGGESTIONS
 */

import type { AgentContext, AgentSuggestion } from './types';
import { DecisionContract }              from '../decisionContract';
import { runRegulatoryAgent }            from './regulatoryAgent';
import { runFinancialAgent }             from './financialAgent';
import { runIntegrationAgent }           from './integrationAgent';
import { runOnboardingAgent }            from './onboardingAgent';
import { runAnalyticsAgent }             from './analyticsAgent';
import { runArtisticCulturalAgent }      from './artisticCulturalAgent';

/**
 * Run all agents and return merged, deduplicated, priority-sorted suggestions.
 * Capped at DecisionContract.MAX_SUGGESTIONS to minimise cognitive load.
 *
 * NOTE: these are SECONDARY contextual suggestions.
 * The PRIMARY next action always comes from getNextAction() (via useNextAction).
 */
export function runAllAgents(ctx: AgentContext): AgentSuggestion[] {
  const raw: AgentSuggestion[] = [
    ...runOnboardingAgent(ctx),       // highest priority — setup first
    ...runRegulatoryAgent(ctx),
    ...runIntegrationAgent(ctx),
    ...runFinancialAgent(ctx),
    ...runAnalyticsAgent(ctx),
    ...runArtisticCulturalAgent(ctx), // lowest gate — needs praticante+
  ];

  // Deduplicate by actionKey — first occurrence wins (agents ordered by importance)
  const seenActionKeys = new Set<string>();
  const deduped = raw.filter((s) => {
    if (seenActionKeys.has(s.actionKey)) return false;
    seenActionKeys.add(s.actionKey);
    return true;
  });

  // Sort by priority descending
  deduped.sort((a, b) => b.priority - a.priority);

  return deduped.slice(0, DecisionContract.MAX_SUGGESTIONS);
}

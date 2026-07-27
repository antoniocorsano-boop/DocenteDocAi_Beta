/**
 * modules/orbit/agentMapper.ts
 *
 * Maps active OrbitFlows → ActiveAgent[] for the Jarvis presence engine.
 *
 * Replaces the placeholder `orbitSession.agents ?? []` with a live derivation
 * that reflects what flows are actually running and how trusted they are.
 *
 * Mapping rules (in priority order):
 *   1. Proven high-trust flows (executionCount > 3 AND trust > 0.75) → 'executor'
 *   2. Dominant domain 'pedagogical' → 'mentor'
 *   3. Dominant domain 'compliance' | 'administrative' → 'analyst'
 *   4. Cold/untrusted flow (executionCount ≤ 1 OR trust < 0.60) → 'observer'
 *   5. Fallback → 'analyst'
 *
 * At most MAX_AGENTS agents are returned (presence engine caps meaningful signal at 3).
 */

import type { OrbitFlow } from '../flows/orbitFlow';
import type { CognitiveDomain } from '../cognitiveLayer/types';
import type { ActiveAgent, AgentPersonality } from '../../theme/agentPersonality';

// Fallback trust when the store has no entry yet for a flow that passed selectActiveFlows.
// selectActiveFlows already requires >= 0.50, so this is only a safety net.
const FLOW_TRUST_FALLBACK = 0.65;

/** Maximum active agents surfaced to the presence engine at once. */
const MAX_AGENTS = 3;

// ─── Domain inference ─────────────────────────────────────────────────────────

/**
 * Returns the most frequently occurring domain across all steps.
 * If all steps have the same domain the result is that domain.
 * Undefined if the flow has no steps.
 */
function dominantDomain(flow: OrbitFlow): CognitiveDomain | undefined {
  if (flow.steps.length === 0) return undefined;
  const freq = new Map<CognitiveDomain, number>();
  for (const step of flow.steps) {
    freq.set(step.domain, (freq.get(step.domain) ?? 0) + 1);
  }
  let best: CognitiveDomain | undefined;
  let bestCount = 0;
  for (const [domain, count] of freq) {
    if (count > bestCount) {
      bestCount = count;
      best = domain;
    }
  }
  return best;
}

// ─── Personality derivation ───────────────────────────────────────────────────

function personalityFromFlow(flow: OrbitFlow, trust: number): AgentPersonality {
  // Rule 1: proven executor — repeatedly run, high trust → fast executor role
  if (flow.executionCount > 3 && trust > 0.75) return 'executor';

  const domain = dominantDomain(flow);

  // Rule 2: pedagogical content → guide/explain role
  if (domain === 'pedagogical') return 'mentor';

  // Rule 3: compliance / administrative → systematic analyst role
  if (domain === 'compliance' || domain === 'administrative') return 'analyst';

  // Rule 4: cold or barely-trusted flow → passive observer
  if (flow.executionCount <= 1 || trust < 0.60) return 'observer';

  // Rule 5: structured fallback
  return 'analyst';
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Converts active OrbitFlows to the ActiveAgent[] format consumed by
 * `resolveDominantPersonality` and `resolveFinalPresence`.
 *
 * @param flows      Active flows (already filtered by trust ≥ 0.50 via selectActiveFlows)
 * @param flowTrust  Store's flowTrust map — authoritative trust scores per flow id
 */
export function flowsToAgents(
  flows: OrbitFlow[],
  flowTrust: Record<string, number>,
): ActiveAgent[] {
  return flows.slice(0, MAX_AGENTS).map((flow): ActiveAgent => ({
    id:          flow.id,
    personality: personalityFromFlow(flow, flowTrust[flow.id] ?? FLOW_TRUST_FALLBACK),
  }));
}

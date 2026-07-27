/**
 * modules/agents/builtInAgents.ts — P29/P30 Integration Hub
 *
 * registerBuiltInAgents() — registers platform agents locally (called at boot from main.tsx)
 * syncAgentsFromServer()  — fetches /agents and re-registers each server agent with an
 *                           execute function that routes to POST /agents/:id/run (P30)
 *
 * The sync is best-effort: if the backend is unavailable the local registrations remain active.
 */

import { registerAgent }                  from './AgentManager';
import type { AgentType }                 from './AgentManager';
import { sanitizeInput, getPrivacyMode }  from '../system/PrivacyGuard';
import { getTokenState }                  from '../system/TokenController';
import { fetchAgents, runAgentOnServer }  from '@/services/agentApiClient';

export function registerBuiltInAgents(): void {

  // ── Compliance agent ───────────────────────────────────────────────────────
  registerAgent({
    id:              'agent.compliance',
    name:            'Compliance',
    type:            'compliance',
    description:     'Verifica la conformità del testo alla policy privacy corrente.',
    estimatedTokens: 10,
    execute: async (input: string) => {
      const mode    = getPrivacyMode();
      const cleaned = sanitizeInput(input);
      return {
        mode,
        inputLength:   input.length,
        cleanedLength: cleaned.length,
        redacted:      input.length - cleaned.length > 0,
        ok:            true,
      };
    },
  });

  // ── Monitoring agent ───────────────────────────────────────────────────────
  registerAgent({
    id:              'agent.monitoring',
    name:            'Monitoraggio',
    type:            'monitoring',
    description:     'Restituisce uno snapshot del budget token e dello stato del sistema.',
    estimatedTokens: 5,
    execute: async (_input: string) => {
      const tokens = getTokenState();
      return {
        tokenBudget: tokens,
        timestamp:   Date.now(),
        healthy:     tokens.remaining > 0,
      };
    },
  });

  // ── Cognitive stub agent ───────────────────────────────────────────────────
  registerAgent({
    id:              'agent.cognitive',
    name:            'Analisi Cognitiva',
    type:            'ai',
    description:     'Analisi del carico cognitivo e dei pattern comportamentali.',
    estimatedTokens: 80,
    execute: async (input: string) => ({
      input: input.slice(0, 50),
      status: 'stub — integrazione cognitiveService in P31',
    }),
  });
}

/**
 * Fetches the server's agent registry and re-registers each active agent so that
 * `executeRemote()` calls are routed to the server.
 *
 * This is best-effort: network failures leave the local registrations intact.
 * Call after `registerBuiltInAgents()` from main.tsx.
 */
export async function syncAgentsFromServer(): Promise<void> {
  try {
    const agents = await fetchAgents();
    for (const agent of agents) {
      const agentId = agent.id;
      registerAgent({
        id:              agentId,
        name:            agent.name,
        type:            agent.type as AgentType,
        description:     (agent.config['description'] as string | undefined) ?? agent.name,
        estimatedTokens: agent.estimated_tokens,
        // execute delegates to the server — used by executeAgent() local path
        execute: async (input: string) => {
          const result = await runAgentOnServer(agentId, input);
          if (!result.success) throw new Error(result.error ?? 'Errore server');
          return result.data;
        },
      });
    }
  } catch {
    // Silent — local registrations remain active
  }
}

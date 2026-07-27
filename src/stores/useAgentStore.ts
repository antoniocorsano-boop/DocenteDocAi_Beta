/**
 * stores/useAgentStore.ts — P29 Integration Hub
 *
 * Zustand store that mirrors AgentManager's registry into reactive UI state.
 * Automatically refreshes whenever an `agent.*` observability event fires,
 * so components always display the latest status without polling.
 *
 * Usage:
 *   const { agents, runAgent } = useAgentStore();
 */

import { create } from 'zustand';
import { registerObserver }         from '@/utils/observability';
import {
  getAllAgentStatuses,
  executeAgent,
}                                   from '../modules/agents/AgentManager';
import type {
  AgentStatus,
  AgentExecutionResult,
}                                   from '../modules/agents/AgentManager';

// ─── Interface ────────────────────────────────────────────────────────────────

interface AgentStoreState {
  /** Live snapshot of all registered agents' statuses. */
  agents: AgentStatus[];
  /** Pull the latest state from AgentManager into the store. */
  refreshAgents(): void;
  /** Execute an agent by id, refreshing state before and after. */
  runAgent(id: string, input: string): Promise<AgentExecutionResult>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAgentStore = create<AgentStoreState>((set) => {
  // Subscribe to observability events once at store creation time (module-level).
  // Uses the P29 multi-subscriber API — does not displace monitoring.ts's observer.
  registerObserver((payload) => {
    if (payload.event.startsWith('agent.')) {
      set({ agents: getAllAgentStatuses() });
    }
  });

  return {
    agents: getAllAgentStatuses(),

    refreshAgents: () => {
      set({ agents: getAllAgentStatuses() });
    },

    runAgent: async (id, input) => {
      // Optimistic refresh to show 'running' state immediately
      set({ agents: getAllAgentStatuses() });
      const result = await executeAgent(id, input);
      set({ agents: getAllAgentStatuses() });
      return result;
    },
  };
});

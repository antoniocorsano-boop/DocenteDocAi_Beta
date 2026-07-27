/**
 * modules/agents/index.ts — P29/P30 barrel
 *
 * Single import surface for the agent orchestration layer.
 *
 *   import { registerAgent, executeAgent, executeRemote } from '@/modules/agents';
 */

export {
  registerAgent,
  unregisterAgent,
  getAllAgentStatuses,
  getAgentStatus,
  executeAgent,
  executeRemote,
} from './AgentManager';

export type {
  AgentType,
  AgentRunStatus,
  AgentDefinition,
  AgentStatus,
  AgentExecutionResult,
} from './AgentManager';

/**
 * modules/agents/AgentManager.ts — P29 Integration Hub & Device Layer
 *
 * Central agent orchestration singleton.
 *
 * Every agent execution passes through three mandatory gates in order:
 *   1. SimulationGuard  — returns a local synthetic result in demo/simulation mode
 *   2. PrivacyGuard     — sanitizes input; blocks cloud calls in 'strict' mode
 *   3. TokenController  — enforces the per-session token budget
 *
 * Execution metrics are emitted via the observability bus so Sentry and
 * Prometheus automatically capture every agent call without extra wiring.
 *
 * Usage:
 *   registerAgent({ id: 'narrative', name: 'Narrativa', type: 'ai',
 *                   description: '...', execute: async (input) => generateNarrative(input) });
 *   const result = await executeAgent('narrative', rawInput);
 */

import { observe }                        from '@/utils/observability';
import { isSimulation, localFallback }    from '../system/SimulationGuard';
import { sanitizeInput, canSendToCloud }  from '../system/PrivacyGuard';
import { canUseTokens, consumeTokens,
         getTokenState }                  from '../system/TokenController';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgentType = 'ai' | 'compliance' | 'monitoring' | 'integration';

export type AgentRunStatus = 'idle' | 'running' | 'success' | 'error';

export interface AgentDefinition<TInput = string, TOutput = unknown> {
  id:               string;
  name:             string;
  type:             AgentType;
  description:      string;
  /** Estimated token cost per execution (default: 50). */
  estimatedTokens?: number;
  execute:          (input: TInput) => Promise<TOutput>;
}

export interface AgentStatus {
  id:           string;
  name:         string;
  type:         AgentType;
  description:  string;
  status:       AgentRunStatus;
  lastRunAt?:   number;
  /** Last error message, present only when status === 'error'. */
  lastError?:   string;
  totalRuns:    number;
  totalTokens:  number;
}

export interface AgentExecutionResult<TOutput = unknown> {
  success:    boolean;
  data?:      TOutput;
  error?:     string;
  tokensUsed: number;
  durationMs: number;
  /** True when SimulationGuard intercepted the call (no real API cost). */
  simulated:  boolean;
}

// ─── Internal registry ────────────────────────────────────────────────────────

const _registry = new Map<string, AgentDefinition>();
const _status   = new Map<string, AgentStatus>();

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Registers an agent definition.
 * Re-registering with the same id replaces the execute function but preserves
 * existing run statistics.
 */
export function registerAgent(agent: AgentDefinition): void {
  _registry.set(agent.id, agent);
  if (!_status.has(agent.id)) {
    _status.set(agent.id, {
      id:          agent.id,
      name:        agent.name,
      type:        agent.type,
      description: agent.description,
      status:      'idle',
      totalRuns:   0,
      totalTokens: 0,
    });
  }
  observe('agent.registered', { id: agent.id, type: agent.type }, 'debug');
}

/**
 * Removes an agent from the registry and clears its status entry.
 */
export function unregisterAgent(id: string): void {
  _registry.delete(id);
  _status.delete(id);
  observe('agent.unregistered', { id }, 'debug');
}

/**
 * Returns a snapshot array of all registered agents' current statuses.
 * Creates new array and new status objects on each call — safe to store in state.
 */
export function getAllAgentStatuses(): AgentStatus[] {
  return Array.from(_status.values()).map(s => ({ ...s }));
}

/**
 * Returns the status snapshot for a single agent, or undefined if not registered.
 */
export function getAgentStatus(id: string): AgentStatus | undefined {
  const s = _status.get(id);
  return s ? { ...s } : undefined;
}

/**
 * Executes a registered agent by id.
 *
 * The raw input string passes through each gate before reaching `agent.execute()`:
 *   - SimulationGuard: returns `localFallback()` without calling `agent.execute()`
 *   - PrivacyGuard: sanitizes the input; blocks if privacy mode is 'strict'
 *   - TokenController: blocks if the session token budget is exhausted
 *
 * This function never throws. All outcomes are captured in the return value.
 */
export async function executeAgent<TOutput = unknown>(
  id: string,
  input: string,
): Promise<AgentExecutionResult<TOutput>> {
  const agent = _registry.get(id);
  if (!agent) {
    observe('agent.execute.notfound', { id }, 'warn');
    return { success: false, error: `Agente "${id}" non registrato`, tokensUsed: 0, durationMs: 0, simulated: false };
  }

  const estimatedTokens = agent.estimatedTokens ?? 50;
  const t0     = performance.now();
  const status = _status.get(id)!;

  status.status = 'running';
  observe('agent.execute.start', { id, name: agent.name, estimatedTokens }, 'debug');

  // ── Gate 1: SimulationGuard ─────────────────────────────────────────────────
  if (isSimulation()) {
    const fallback   = localFallback(input);
    const durationMs = performance.now() - t0;
    status.status    = 'success';
    status.lastRunAt = Date.now();
    status.lastError = undefined;
    status.totalRuns++;
    observe('agent.execute.simulated', { id, durationMs }, 'info');
    return { success: true, data: fallback as unknown as TOutput, tokensUsed: 0, durationMs, simulated: true };
  }

  // ── Gate 2: PrivacyGuard ────────────────────────────────────────────────────
  const safeInput = sanitizeInput(input);
  if (!canSendToCloud()) {
    const durationMs = performance.now() - t0;
    const errorMsg   = 'Modalità privacy strict: chiamate cloud disabilitate';
    status.status    = 'error';
    status.lastError = errorMsg;
    status.lastRunAt = Date.now();
    status.totalRuns++;
    observe('agent.execute.blocked.privacy', { id }, 'warn');
    return { success: false, error: errorMsg, tokensUsed: 0, durationMs, simulated: false };
  }

  // ── Gate 3: TokenController ─────────────────────────────────────────────────
  if (!canUseTokens(estimatedTokens)) {
    const durationMs   = performance.now() - t0;
    const { used, limit } = getTokenState();
    const errorMsg     = `Budget token esaurito (${used}/${limit})`;
    status.status      = 'error';
    status.lastError   = errorMsg;
    status.lastRunAt   = Date.now();
    status.totalRuns++;
    observe('agent.execute.blocked.tokens', { id, used, limit }, 'warn');
    return { success: false, error: errorMsg, tokensUsed: 0, durationMs, simulated: false };
  }

  // ── Execute ─────────────────────────────────────────────────────────────────
  try {
    const data       = await (agent.execute as (input: string) => Promise<TOutput>)(safeInput);
    const durationMs = performance.now() - t0;
    consumeTokens(estimatedTokens);
    status.status      = 'success';
    status.lastRunAt   = Date.now();
    status.lastError   = undefined;
    status.totalRuns++;
    status.totalTokens += estimatedTokens;
    observe('agent.execute.success', { id, durationMs, tokensUsed: estimatedTokens }, 'info');
    return { success: true, data, tokensUsed: estimatedTokens, durationMs, simulated: false };
  } catch (err) {
    const durationMs = performance.now() - t0;
    const errorMsg   = err instanceof Error ? err.message : String(err);
    status.status    = 'error';
    status.lastError = errorMsg;
    status.lastRunAt = Date.now();
    status.totalRuns++;
    observe('agent.execute.error', { id, error: errorMsg, durationMs }, 'error');
    return { success: false, error: errorMsg, tokensUsed: 0, durationMs, simulated: false };
  }
}

/**
 * Executes an agent on the **server** via POST /agents/:id/run.
 *
 * Falls back to the local `executeAgent()` when:
 *   - VITE_BACKEND_URL is not configured
 *   - The network request fails (offline / server down)
 *   - The server returns 404 for the agent id
 *
 * Use this as the primary execution path in production.
 * The local path runs as a safety net and in simulation/privacy-strict mode.
 */
export async function executeRemote<TOutput = unknown>(
  id: string,
  input: string,
): Promise<AgentExecutionResult<TOutput>> {
  // Import lazily to avoid circular deps at module init time
  const { runAgentOnServer } = await import('@/services/agentApiClient');

  const t0     = performance.now();
  const status = _status.get(id);

  if (status) {
    status.status = 'running';
    observe('agent.remote.start', { id }, 'debug');
  }

  const serverResult = await runAgentOnServer(id, input);

  const durationMs = performance.now() - t0;

  if (!serverResult.success && (serverResult.error?.includes('non trovato') || serverResult.error?.includes('non configurato'))) {
    // Server unavailable or agent unknown — fall back to local execution
    observe('agent.remote.fallback', { id, reason: serverResult.error }, 'warn');
    return executeAgent<TOutput>(id, input);
  }

  if (status) {
    status.status    = serverResult.success ? 'success' : 'error';
    status.lastRunAt = Date.now();
    status.lastError = serverResult.success ? undefined : (serverResult.error ?? undefined);
    status.totalRuns++;
    if (serverResult.success) status.totalTokens += serverResult.tokensUsed;
  }

  observe(
    serverResult.success ? 'agent.remote.success' : 'agent.remote.error',
    { id, durationMs: serverResult.durationMs, tokensUsed: serverResult.tokensUsed },
    serverResult.success ? 'info' : 'warn',
  );

  return {
    success:    serverResult.success,
    data:       serverResult.data as TOutput | undefined,
    error:      serverResult.error ?? undefined,
    tokensUsed: serverResult.tokensUsed,
    durationMs: serverResult.durationMs || durationMs,
    simulated:  serverResult.simulated,
  };
}

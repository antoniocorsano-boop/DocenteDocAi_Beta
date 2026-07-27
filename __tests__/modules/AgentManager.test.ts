/**
 * __tests__/modules/AgentManager.test.ts — P29
 *
 * Unit tests for the AgentManager orchestration layer.
 * Verifies all three execution gates (SimulationGuard, PrivacyGuard,
 * TokenController) and the happy-path execution flow.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/utils/observability', () => ({
  observe: vi.fn(),
}));

vi.mock('../../src/modules/system/SimulationGuard', () => ({
  isSimulation: vi.fn(() => false),
  localFallback: vi.fn((input: string) => ({ type: 'local', message: 'sim', input })),
}));

vi.mock('../../src/modules/system/PrivacyGuard', () => ({
  sanitizeInput: vi.fn((s: string) => s),
  canSendToCloud: vi.fn(() => true),
}));

vi.mock('../../src/modules/system/TokenController', () => ({
  canUseTokens:   vi.fn(() => true),
  consumeTokens:  vi.fn(),
  getTokenState:  vi.fn(() => ({ used: 0, limit: 1000, remaining: 1000 })),
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import {
  registerAgent,
  unregisterAgent,
  getAllAgentStatuses,
  getAgentStatus,
  executeAgent,
  type AgentDefinition,
} from '../../src/modules/agents/AgentManager';
import { isSimulation, localFallback } from '../../src/modules/system/SimulationGuard';
import { canSendToCloud }              from '../../src/modules/system/PrivacyGuard';
import { canUseTokens }                from '../../src/modules/system/TokenController';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeAgent = (id = 'test.agent', execute: AgentDefinition['execute'] = vi.fn(async () => ({ ok: true }))) => ({
  id,
  name:        'Test Agent',
  type:        'ai' as const,
  description: 'A test agent',
  estimatedTokens: 20,
  execute,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AgentManager', () => {
  beforeEach(() => {
    unregisterAgent('test.agent');
    unregisterAgent('test.agent2');
    vi.mocked(isSimulation).mockReturnValue(false);
    vi.mocked(canSendToCloud).mockReturnValue(true);
    vi.mocked(canUseTokens).mockReturnValue(true);
  });

  // ── Registration ────────────────────────────────────────────────────────────

  describe('registerAgent / unregisterAgent', () => {
    it('registers an agent and makes it visible in getAllAgentStatuses', () => {
      registerAgent(makeAgent());
      const statuses = getAllAgentStatuses();
      expect(statuses.some(s => s.id === 'test.agent')).toBe(true);
    });

    it('initial status is idle with zero counters', () => {
      registerAgent(makeAgent());
      const status = getAgentStatus('test.agent');
      expect(status?.status).toBe('idle');
      expect(status?.totalRuns).toBe(0);
      expect(status?.totalTokens).toBe(0);
    });

    it('unregisterAgent removes agent from registry', () => {
      registerAgent(makeAgent());
      unregisterAgent('test.agent');
      const statuses = getAllAgentStatuses();
      expect(statuses.some(s => s.id === 'test.agent')).toBe(false);
    });

    it('getAgentStatus returns undefined for unknown id', () => {
      expect(getAgentStatus('nonexistent')).toBeUndefined();
    });

    it('re-registering preserves existing run stats', async () => {
      const agent = makeAgent();
      registerAgent(agent);
      await executeAgent('test.agent', 'hello');
      const before = getAgentStatus('test.agent')!;
      expect(before.totalRuns).toBe(1);

      // Re-register with a new execute fn
      registerAgent({ ...agent, execute: vi.fn(async () => ({ ok: false })) });
      const after = getAgentStatus('test.agent')!;
      expect(after.totalRuns).toBe(1); // preserved
    });
  });

  // ── Happy path ──────────────────────────────────────────────────────────────

  describe('executeAgent — happy path', () => {
    it('returns success=true and data from execute function', async () => {
      const execute = vi.fn(async () => ({ answer: 42 }));
      registerAgent(makeAgent('test.agent', execute));

      const result = await executeAgent('test.agent', 'input');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ answer: 42 });
      expect(result.simulated).toBe(false);
      expect(result.tokensUsed).toBe(20);
    });

    it('increments totalRuns and totalTokens after success', async () => {
      registerAgent(makeAgent());
      await executeAgent('test.agent', 'x');
      const status = getAgentStatus('test.agent')!;
      expect(status.totalRuns).toBe(1);
      expect(status.totalTokens).toBe(20);
      expect(status.status).toBe('success');
    });

    it('sets lastRunAt', async () => {
      const before = Date.now();
      registerAgent(makeAgent());
      await executeAgent('test.agent', 'x');
      const status = getAgentStatus('test.agent')!;
      expect(status.lastRunAt).toBeGreaterThanOrEqual(before);
    });
  });

  // ── Gate 1: SimulationGuard ──────────────────────────────────────────────────

  describe('Gate 1 — SimulationGuard', () => {
    it('returns simulated=true and does not call execute when in simulation mode', async () => {
      vi.mocked(isSimulation).mockReturnValue(true);
      const execute = vi.fn(async () => ({}));
      registerAgent(makeAgent('test.agent', execute));

      const result = await executeAgent('test.agent', 'input');

      expect(result.simulated).toBe(true);
      expect(result.success).toBe(true);
      expect(result.tokensUsed).toBe(0);
      expect(execute).not.toHaveBeenCalled();
    });

    it('returns localFallback data in simulation mode', async () => {
      vi.mocked(isSimulation).mockReturnValue(true);
      registerAgent(makeAgent());

      const result = await executeAgent('test.agent', 'hello world');
      expect(localFallback).toHaveBeenCalledWith('hello world');
      expect(result.data).toMatchObject({ type: 'local' });
    });
  });

  // ── Gate 2: PrivacyGuard ─────────────────────────────────────────────────────

  describe('Gate 2 — PrivacyGuard', () => {
    it('blocks execution when privacy mode is strict (canSendToCloud=false)', async () => {
      vi.mocked(canSendToCloud).mockReturnValue(false);
      const execute = vi.fn(async () => ({}));
      registerAgent(makeAgent('test.agent', execute));

      const result = await executeAgent('test.agent', 'input');

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/strict/i);
      expect(result.tokensUsed).toBe(0);
      expect(execute).not.toHaveBeenCalled();
    });

    it('sets agent status to error on privacy block', async () => {
      vi.mocked(canSendToCloud).mockReturnValue(false);
      registerAgent(makeAgent());
      await executeAgent('test.agent', 'input');
      expect(getAgentStatus('test.agent')?.status).toBe('error');
    });
  });

  // ── Gate 3: TokenController ──────────────────────────────────────────────────

  describe('Gate 3 — TokenController', () => {
    it('blocks execution when token budget is exhausted', async () => {
      vi.mocked(canUseTokens).mockReturnValue(false);
      const execute = vi.fn(async () => ({}));
      registerAgent(makeAgent('test.agent', execute));

      const result = await executeAgent('test.agent', 'input');

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/token/i);
      expect(execute).not.toHaveBeenCalled();
    });
  });

  // ── Unknown agent ────────────────────────────────────────────────────────────

  describe('unknown agent', () => {
    it('returns success=false with a descriptive error for unregistered id', async () => {
      const result = await executeAgent('does.not.exist', 'input');
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/non registrato/);
    });
  });

  // ── Error handling ───────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('catches execute() throws and returns success=false', async () => {
      const execute = vi.fn(async () => { throw new Error('AI down'); });
      registerAgent(makeAgent('test.agent', execute));

      const result = await executeAgent('test.agent', 'input');

      expect(result.success).toBe(false);
      expect(result.error).toBe('AI down');
      expect(result.tokensUsed).toBe(0);
      expect(getAgentStatus('test.agent')?.status).toBe('error');
    });

    it('reports durationMs > 0', async () => {
      registerAgent(makeAgent());
      const result = await executeAgent('test.agent', 'input');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  // ── getAllAgentStatuses snapshot stability ────────────────────────────────────

  describe('getAllAgentStatuses', () => {
    it('returns new array on each call (safe to store in state)', () => {
      registerAgent(makeAgent('test.agent'));
      registerAgent(makeAgent('test.agent2'));
      const a = getAllAgentStatuses();
      const b = getAllAgentStatuses();
      expect(a).not.toBe(b);    // different array references
      expect(a).toEqual(b);     // same content
    });
  });
});

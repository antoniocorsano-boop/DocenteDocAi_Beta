/**
 * __tests__/modules/orchestration/CognitiveOrchestrator.test.ts
 *
 * Tests for the P33 Cognitive Orchestration Layer.
 *
 * Mocked dependencies:
 *   @/utils/observability         → observe() silenced
 *   @/services/agentApiClient     → searchMemory() returns []
 *   @/modules/agents/AgentManager → executeRemote() returns success
 *
 * Cases covered:
 *   1. Happy path — simple input → 1 step, truthy output, confidence > 0
 *   2. Compliance routing — "verifica conformità GDPR" → agent.compliance, intentType = 'compliance'
 *   3. Memory search triggered — input > 30 chars → searchMemory() called
 *   4. Failure + reflection — first call fails, retry succeeds → result returned (no throw)
 *   5. Memory unavailable — searchMemory throws → memoryUsed = false, run still succeeds
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks (must be hoisted before imports) ───────────────────────────────────

vi.mock('@/utils/observability', () => ({
  observe: vi.fn(),
}));

vi.mock('@/services/agentApiClient', () => ({
  searchMemory: vi.fn(async () => []),
}));

vi.mock('@/modules/agents/AgentManager', () => ({
  executeRemote: vi.fn(async (agentId: string) => ({
    success:    true,
    data:       `${agentId}: ok`,
    tokensUsed: 10,
    durationMs: 2,
    simulated:  false,
    error:      undefined,
  })),
}));

// ── Subject under test (imported AFTER mocks) ─────────────────────────────────

import { CognitiveOrchestrator } from '../../../src/modules/orchestration/CognitiveOrchestrator';

// ── Helpers ───────────────────────────────────────────────────────────────────

type MockFn = ReturnType<typeof vi.fn>;

async function getMock(moduleId: string, exportName: string): Promise<MockFn> {
  const m = await import(moduleId) as Record<string, unknown>;
  return m[exportName] as MockFn;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CognitiveOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Happy path — simple one-shot request
  // ─────────────────────────────────────────────────────────────────────────
  it('returns a valid result for a simple input', async () => {
    const result = await CognitiveOrchestrator.run('ciao');

    expect(result).toBeDefined();
    expect(typeof result.output).toBe('string');
    expect(result.output.length).toBeGreaterThan(0);
    expect(result.steps.length).toBeGreaterThanOrEqual(1);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.intentType).toBe('simple');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Compliance routing
  // ─────────────────────────────────────────────────────────────────────────
  it('routes compliance requests to agent.compliance', async () => {
    const result = await CognitiveOrchestrator.run('verifica conformità GDPR');

    expect(result.intentType).toBe('compliance');
    // First step must use the compliance agent
    expect(result.steps[0].agent).toBe('agent.compliance');
    expect(result.steps.length).toBe(1);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Memory search is triggered when input is long enough (> 30 chars)
  // ─────────────────────────────────────────────────────────────────────────
  it('calls searchMemory when input exceeds 30 characters', async () => {
    const searchMemory = await getMock('@/services/agentApiClient', 'searchMemory');

    // 41 chars — above MEMORY_MIN_LENGTH threshold
    await CognitiveOrchestrator.run('analizza questa situazione importante');

    expect(searchMemory).toHaveBeenCalledOnce();
    expect(searchMemory).toHaveBeenCalledWith(
      'analizza questa situazione importante',
      3,
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Step failure → reflection loop → result still returned (no throw)
  // ─────────────────────────────────────────────────────────────────────────
  it('retries via reflection when a step fails, and does not throw', async () => {
    const executeRemote = await getMock('@/modules/agents/AgentManager', 'executeRemote');

    // First call fails (the planned step)
    executeRemote.mockResolvedValueOnce({
      success:    false,
      data:       undefined,
      error:      'agent unavailable',
      tokensUsed: 0,
      durationMs: 1,
      simulated:  false,
    });

    // Second call succeeds (the reflection retry)
    executeRemote.mockResolvedValueOnce({
      success:    true,
      data:       'risposta di fallback',
      tokensUsed: 8,
      durationMs: 3,
      simulated:  false,
      error:      undefined,
    });

    const result = await CognitiveOrchestrator.run('ciao', { mode: 'deep' });

    expect(result).toBeDefined();
    expect(typeof result.output).toBe('string');
    // Should have at least the original step + the reflection step
    expect(result.steps.length).toBeGreaterThanOrEqual(2);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Graceful degradation: memory service throws → still executes correctly
  // ─────────────────────────────────────────────────────────────────────────
  it('continues without memory when searchMemory throws', async () => {
    const searchMemory = await getMock('@/services/agentApiClient', 'searchMemory');

    searchMemory.mockRejectedValueOnce(new Error('network error'));

    // Input is long enough to trigger memory lookup
    const result = await CognitiveOrchestrator.run(
      'analizza il profilo dello studente con difficoltà',
    );

    expect(result).toBeDefined();
    expect(result.memoryUsed).toBe(false);
    expect(typeof result.output).toBe('string');
    expect(result.confidence).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Analysis intent creates a 2-step sequential plan
  // ─────────────────────────────────────────────────────────────────────────
  it('creates a 2-step plan for analysis intents', async () => {
    const result = await CognitiveOrchestrator.run(
      'analizza il pattern cognitivo degli studenti in dettaglio',
    );

    expect(result.intentType).toBe('analysis');
    // analysis plan = 2 steps (step-1 + step-2 sequential)
    expect(result.steps.length).toBe(2);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Catastrophic failure: unexpected exception → returns error result (no throw)
  // ─────────────────────────────────────────────────────────────────────────
  it('never throws — returns error result on catastrophic failure', async () => {
    const executeRemote = await getMock('@/modules/agents/AgentManager', 'executeRemote');

    // All calls throw — executeSingleStep catches each one and returns a failed StepResult
    executeRemote.mockRejectedValue(new Error('fatal crash'));

    const result = await CognitiveOrchestrator.run('test');

    expect(result).toBeDefined();
    expect(typeof result.output).toBe('string');
    // confidence is 0 because successRate = 0 (no successful steps)
    expect(result.confidence).toBe(0);
    // Steps array contains the captured failed step(s) — not empty
    expect(result.steps.length).toBeGreaterThanOrEqual(1);
    expect(result.steps.every(s => !s.success)).toBe(true);
  });
});

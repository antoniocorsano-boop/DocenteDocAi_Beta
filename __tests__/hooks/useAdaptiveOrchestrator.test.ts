/**
 * __tests__/hooks/useAdaptiveOrchestrator.test.ts — P34 Adaptive Hook
 *
 * Tests for the useAdaptiveOrchestrator React hook.
 *
 * Mocked dependencies:
 *   @/modules/orchestration/CognitiveOrchestrator → run() returns success
 *   @/services/agentApiClient                     → all adaptive functions stubbed
 *   @/utils/observability                         → observe() silenced
 *
 * Cases covered:
 *   1. executeTask — returns OrchestratorResult, sets loading/result state
 *   2. executeTask — empty input returns null, no loading state change
 *   3. agentScores — loaded on mount via fetchAgentScores
 *   4. rerouteStep — refreshes agent scores from the server
 *   5. compressMemo — calls compressUserMemory + updates memorySummary
 *   6. Error handling — orchestrator throws → error state, no crash
 *   7. reset — clears result and error state
 *   8. Outcome logging — logAgentOutcomeToServer called after executeTask
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Mocks (hoisted) ───────────────────────────────────────────────────────────

vi.mock('@/utils/observability', () => ({
  observe: vi.fn(),
}));

vi.mock('@/hooks/useFeedbackLoop', () => ({
  useFeedbackLoop: vi.fn(() => ({
    queueFeedback: vi.fn(),
    flushFeedback: vi.fn(async () => undefined),
    pendingCount:  0,
    lastFlush:     null,
    enabled:       false,
  })),
}));

// Use vi.hoisted so the variable is available inside the factory (Vitest hoists
// vi.mock calls to the top of the file before other variable declarations).
const { mockRun, mockFetchScores, mockFetchParams, mockLogOutcome, mockTriggerUpdate, mockCompressMemory } = vi.hoisted(() => ({
  mockRun: vi.fn(async () => ({
    output:          'test output',
    steps:           [{ stepId: 'step-1', agent: 'agent.cognitive', success: true, tokensUsed: 10, durationMs: 5, simulated: false }],
    memoryUsed:      false,
    confidence:      0.85,
    intentType:      'simple',
    durationMs:      30,
    simulated:       false,
    agentScoresUsed: [],
  })),
  mockFetchScores:    vi.fn(async () => [
    { agentId: 'agent.cognitive', score: 0.88, reliability: 0.75, totalRuns: 10, updatedAt: new Date().toISOString() },
  ]),
  mockFetchParams:    vi.fn(async () => []),
  mockLogOutcome:     vi.fn(async () => undefined),
  mockTriggerUpdate:  vi.fn(async () => undefined),
  mockCompressMemory: vi.fn(async () => [
    { id: 'sum-1', userId: 'u1', summary: 'test summary', entryCount: 5, createdAt: new Date().toISOString() },
  ]),
}));

vi.mock('@/modules/orchestration/CognitiveOrchestrator', () => ({
  CognitiveOrchestrator: { run: mockRun },
}));

vi.mock('@/services/agentApiClient', () => ({
  fetchAgentScores:        () => mockFetchScores(),
  fetchAgentParams:        () => mockFetchParams(),
  logAgentOutcomeToServer: (...args: Parameters<typeof mockLogOutcome>) => mockLogOutcome(...args),
  triggerScoreUpdate:      (...args: Parameters<typeof mockTriggerUpdate>) => mockTriggerUpdate(...args),
  compressUserMemory:      (...args: Parameters<typeof mockCompressMemory>) => mockCompressMemory(...args),
}));

// ── Subject under test (imported AFTER mocks) ─────────────────────────────────

import { useAdaptiveOrchestrator } from '../../src/hooks/useAdaptiveOrchestrator';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAdaptiveOrchestrator', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─────────────────────────────────────────────────────────────────────────
  // 1. executeTask — happy path
  // ─────────────────────────────────────────────────────────────────────────
  it('executeTask returns result and updates state', async () => {
    const { result } = renderHook(() => useAdaptiveOrchestrator());

    let taskResult: Awaited<ReturnType<typeof result.current.executeTask>> = null;
    await act(async () => {
      taskResult = await result.current.executeTask('analizza questa UDA');
    });

    expect(taskResult).not.toBeNull();
    expect(taskResult!.output).toBe('test output');
    expect(result.current.result?.confidence).toBe(0.85);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. executeTask — empty input returns null immediately
  // ─────────────────────────────────────────────────────────────────────────
  it('executeTask returns null for empty input without running orchestrator', async () => {
    const { result } = renderHook(() => useAdaptiveOrchestrator());

    let taskResult: Awaited<ReturnType<typeof result.current.executeTask>> = null;
    await act(async () => {
      taskResult = await result.current.executeTask('   ');
    });

    expect(taskResult).toBeNull();
    expect(mockRun).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. agentScores — loaded on mount
  // ─────────────────────────────────────────────────────────────────────────
  it('loads agent scores on mount', async () => {
    const { result } = renderHook(() => useAdaptiveOrchestrator());

    // Wait for the effect to settle
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockFetchScores).toHaveBeenCalledOnce();
    expect(result.current.agentScores).toHaveLength(1);
    expect(result.current.agentScores[0].agentId).toBe('agent.cognitive');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. rerouteStep — refreshes scores
  // ─────────────────────────────────────────────────────────────────────────
  it('rerouteStep fetches fresh agent scores', async () => {
    const { result } = renderHook(() => useAdaptiveOrchestrator());

    await act(async () => {
      await result.current.rerouteStep('step-1');
    });

    // fetchAgentScores is called at least once for rerouteStep
    expect(mockFetchScores).toHaveBeenCalled();
    expect(result.current.agentScores).toHaveLength(1);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 5. compressMemo — calls compress and updates memorySummary
  // ─────────────────────────────────────────────────────────────────────────
  it('compressMemo calls compressUserMemory and updates memorySummary', async () => {
    const { result } = renderHook(() => useAdaptiveOrchestrator());

    await act(async () => {
      await result.current.compressMemo(30);
    });

    expect(mockCompressMemory).toHaveBeenCalledWith(30);
    expect(result.current.memorySummary).toHaveLength(1);
    expect(result.current.memorySummary[0].summary).toBe('test summary');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Error handling — orchestrator throws
  // ─────────────────────────────────────────────────────────────────────────
  it('sets error state when orchestrator throws, never crashes', async () => {
    mockRun.mockRejectedValueOnce(new Error('Orchestrator boom'));

    const { result } = renderHook(() => useAdaptiveOrchestrator());

    await act(async () => {
      await result.current.executeTask('questo fallirà');
    });

    expect(result.current.error).toBe('Orchestrator boom');
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeNull();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 7. reset — clears result and error
  // ─────────────────────────────────────────────────────────────────────────
  it('reset clears result and error state', async () => {
    const { result } = renderHook(() => useAdaptiveOrchestrator());

    await act(async () => {
      await result.current.executeTask('test');
    });
    expect(result.current.result).not.toBeNull();

    act(() => result.current.reset());

    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 8. Outcome logging — logAgentOutcomeToServer called after task
  // ─────────────────────────────────────────────────────────────────────────
  it('logs outcome to server after executing task', async () => {
    const { result } = renderHook(() => useAdaptiveOrchestrator());

    await act(async () => {
      await result.current.executeTask('verifica conformità GDPR');
      // Allow fire-and-forget promises to settle
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(mockLogOutcome).toHaveBeenCalledOnce();
    const payload = (mockLogOutcome.mock.calls[0] as unknown[])[0] as { agentId: string; success: boolean };
    expect(payload).toMatchObject({ agentId: 'agent.cognitive', success: true });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 9. Scores injected into CognitiveOrchestrator.run()
  // ─────────────────────────────────────────────────────────────────────────
  it('passes agentScores to CognitiveOrchestrator.run via options', async () => {
    const { result } = renderHook(() => useAdaptiveOrchestrator());

    // Wait for scores to load on mount
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.executeTask('analisi multi-step');
    });

    // run() was called with the options object containing agentScores
    expect(mockRun).toHaveBeenCalledWith(
      'analisi multi-step',
      expect.objectContaining({ agentScores: expect.any(Array) }),
    );
  });
});

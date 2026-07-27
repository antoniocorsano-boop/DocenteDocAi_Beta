/**
 * __tests__/hooks/useSmartChat.test.ts — P36.5
 *
 * Tests for the useSmartChat React hook.
 *
 * Mocked dependencies:
 *   @/hooks/useAdaptiveOrchestrator → executeTask() returns a fixed OrchestratorResult
 *   @/modules/agents/AgentManager   → executeAgent() returns success or error
 *   @/services/agentApiClient       → submitUserFeedback() stub
 *   @/utils/observability           → observe() silenced
 *
 * Cases covered:
 *   1.  sendMessage appends a user bubble immediately
 *   2.  sendMessage appends an assistant message after the task resolves
 *   3.  loading is true while running, false afterwards
 *   4.  error from executeTask surfaces in error state
 *   5.  clearMessages empties the messages array
 *   6.  setMode updates the mode state
 *   7.  empty input is a no-op (no messages appended)
 *   8.  assistant message contains an insight block
 *   9.  triggerAction appends an assistant message from agent output
 *   10. submitFeedback calls submitUserFeedback (fire-and-forget)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/utils/observability', () => ({
  observe: vi.fn(),
}));

const { mockExecuteTask, mockExecuteAgent, mockSubmitFeedback } = vi.hoisted(() => ({
  mockExecuteTask: vi.fn(async () => ({
    output:          'Risposta di test',
    steps:           [
      { stepId: 's1', agent: 'agent.cognitive', success: true, tokensUsed: 10, durationMs: 5, simulated: false, data: 'result' },
      { stepId: 's2', agent: 'agent.planning',  success: true, tokensUsed: 8,  durationMs: 4, simulated: false, data: 'plan' },
    ],
    memoryUsed:      false,
    confidence:      0.85,
    intentType:      'simple',
    durationMs:      30,
    simulated:       false,
    agentScoresUsed: [
      { agentId: 'agent.cognitive', score: 0.9, reliability: 0.88, totalRuns: 20, updatedAt: new Date().toISOString() },
    ],
  })),

  mockExecuteAgent: vi.fn(async (_id: string, _input: string) => ({
    success:    true,
    data:       'Documento generato',
    tokensUsed: 5,
    durationMs: 10,
    simulated:  false,
    error:      undefined,
  })),

  mockSubmitFeedback: vi.fn(async () => undefined),
}));

vi.mock('@/hooks/useAdaptiveOrchestrator', () => ({
  useAdaptiveOrchestrator: vi.fn(() => ({
    executeTask: mockExecuteTask,
    loading:     false,
    error:       null,
    result:      null,
  })),
}));

vi.mock('@/modules/agents/AgentManager', () => ({
  executeAgent: (...args: Parameters<typeof mockExecuteAgent>) => mockExecuteAgent(...args),
}));

vi.mock('@/services/agentApiClient', () => ({
  submitUserFeedback: (...args: Parameters<typeof mockSubmitFeedback>) => mockSubmitFeedback(...args),
  fetchAgentScores:   vi.fn(async () => []),
  fetchAgentParams:   vi.fn(async () => []),
}));

// ── Subject under test (imported AFTER mocks) ─────────────────────────────────

import { useSmartChat } from '../../src/hooks/useSmartChat';
import { useConversationStore } from '../../src/stores/useConversationStore';

// ── Default orchestrator factory (used in beforeEach to restore after test 4) ─

const makeDefaultOrchestrator = () => ({
  executeTask: mockExecuteTask,
  loading:     false,
  error:       null as string | null,
  result:      null,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function setup() {
  return renderHook(() => useSmartChat());
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useSmartChat', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset conversation store so each test starts with a clean slate
    useConversationStore.setState({ conversations: [], activeId: null, activeConversation: null });
    // Restore the mock to its default factory after tests that override it
    const mod = await import('@/hooks/useAdaptiveOrchestrator');
    (mod.useAdaptiveOrchestrator as ReturnType<typeof vi.fn>).mockImplementation(makeDefaultOrchestrator);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 1. User message appended immediately
  // ─────────────────────────────────────────────────────────────────────────
  it('sendMessage appends a user message immediately', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.sendMessage('Ciao AI');
    });

    const userMsg = result.current.messages[0];
    expect(userMsg).toBeDefined();
    expect(userMsg.role).toBe('user');
    expect(userMsg.content).toBe('Ciao AI');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Assistant message appended after task resolves
  // ─────────────────────────────────────────────────────────────────────────
  it('sendMessage appends an assistant message after task resolves', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.sendMessage('Analizza questa UDA');
    });

    expect(result.current.messages).toHaveLength(2);
    const assistant = result.current.messages[1];
    expect(assistant.role).toBe('assistant');
    expect(assistant.content).toBe('Risposta di test');
    expect(assistant.blocks).toBeDefined();
    expect(assistant.blocks!.length).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Loading state (delegated to orchestrator mock)
  // ─────────────────────────────────────────────────────────────────────────
  it('loading is false after task resolves', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.sendMessage('test');
    });

    expect(result.current.loading).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Error state surfaced
  // ─────────────────────────────────────────────────────────────────────────
  it('error from executeTask surfaces in error state', async () => {
    const { useAdaptiveOrchestrator } = await import('@/hooks/useAdaptiveOrchestrator');
    (useAdaptiveOrchestrator as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      executeTask: vi.fn(async () => null),
      loading:     false,
      error:       'Orchestratore non disponibile',
      result:      null,
    }));

    const { result } = renderHook(() => useSmartChat());

    await act(async () => {
      await result.current.sendMessage('ciao');
    });

    expect(result.current.error).toBe('Orchestratore non disponibile');
    // No assistant message when result is null
    const assistantMessages = result.current.messages.filter(m => m.role === 'assistant');
    expect(assistantMessages).toHaveLength(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 5. clearMessages empties the list
  // ─────────────────────────────────────────────────────────────────────────
  it('clearMessages empties the messages array', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.sendMessage('Primo messaggio');
    });

    expect(result.current.messages.length).toBeGreaterThan(0);

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toHaveLength(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 6. setMode updates the mode state
  // ─────────────────────────────────────────────────────────────────────────
  it('setMode updates the mode', () => {
    const { result } = setup();

    expect(result.current.mode).toBe('balanced');

    act(() => {
      result.current.setMode('fast');
    });

    expect(result.current.mode).toBe('fast');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Empty input is a no-op
  // ─────────────────────────────────────────────────────────────────────────
  it('sendMessage with empty/whitespace input is a no-op', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.sendMessage('   ');
    });

    expect(result.current.messages).toHaveLength(0);
    expect(mockExecuteTask).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 8. Assistant message contains an insight block
  // ─────────────────────────────────────────────────────────────────────────
  it('assistant message blocks include an insight block', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.sendMessage('Genera un piano didattico');
    });

    const assistant = result.current.messages.find(m => m.role === 'assistant');
    expect(assistant).toBeDefined();

    const insightBlock = assistant!.blocks!.find(b => b.type === 'insight');
    expect(insightBlock).toBeDefined();
    expect(insightBlock!.type).toBe('insight');

    const data = (insightBlock as Extract<typeof insightBlock, { type: 'insight' }>)!.data;
    expect(data.agentsUsed.length).toBeGreaterThan(0);
    expect(data.confidence).toBe(0.85);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 9. triggerAction appends an agent action result
  // ─────────────────────────────────────────────────────────────────────────
  it('triggerAction appends an assistant message from agent output', async () => {
    const { result } = setup();

    // First send a message to populate lastInputRef
    await act(async () => {
      await result.current.sendMessage('Testo di input');
    });

    const countBefore = result.current.messages.length;

    await act(async () => {
      await result.current.triggerAction('agent.document', 'Testo di input');
    });

    expect(result.current.messages.length).toBe(countBefore + 1);
    const lastMsg = result.current.messages[result.current.messages.length - 1];
    expect(lastMsg.role).toBe('assistant');
    expect(lastMsg.content).toBe('Documento generato');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 10. submitFeedback calls submitUserFeedback
  // ─────────────────────────────────────────────────────────────────────────
  it('submitFeedback calls submitUserFeedback with correct rating', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.sendMessage('Test feedback');
    });

    const msgId = result.current.messages.find(m => m.role === 'assistant')!.id;

    act(() => {
      result.current.submitFeedback(msgId, 5);
    });

    // Allow the fire-and-forget microtask to flush
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockSubmitFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ rating: 5 }),
    );
  });
});

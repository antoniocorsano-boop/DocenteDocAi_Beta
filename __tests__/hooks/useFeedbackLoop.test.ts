/**
 * __tests__/hooks/useFeedbackLoop.test.ts — P35 useFeedbackLoop hook
 *
 * Tests queue/flush/periodic-flush behaviour and disabled-mode no-ops.
 *
 * Mocked dependencies:
 *   @/services/agentApiClient → submitUserFeedback stubbed
 *   @/utils/observability     → observe() silenced
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Hoisted mock variables ────────────────────────────────────────────────────

const { mockSubmitFeedback } = vi.hoisted(() => ({
  mockSubmitFeedback: vi.fn(async () => undefined),
}));

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/utils/observability', () => ({
  observe: vi.fn(),
}));

vi.mock('@/services/agentApiClient', () => ({
  submitUserFeedback: (...args: Parameters<typeof mockSubmitFeedback>) =>
    mockSubmitFeedback(...args),
}));

// ── Subject under test ────────────────────────────────────────────────────────

import { useFeedbackLoop } from '../../src/hooks/useFeedbackLoop';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useFeedbackLoop(disabled)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('queueFeedback is a no-op: pendingCount stays 0', () => {
    const { result } = renderHook(() => useFeedbackLoop(false));
    act(() => result.current.queueFeedback({ rating: 5 }));
    expect(result.current.pendingCount).toBe(0);
  });

  it('flushFeedback is a no-op: submitUserFeedback never called', async () => {
    const { result } = renderHook(() => useFeedbackLoop(false));
    await act(async () => { await result.current.flushFeedback(); });
    expect(mockSubmitFeedback).not.toHaveBeenCalled();
  });

  it('lastFlush is null initially', () => {
    const { result } = renderHook(() => useFeedbackLoop(false));
    expect(result.current.lastFlush).toBeNull();
  });

  it('enabled is false', () => {
    const { result } = renderHook(() => useFeedbackLoop(false));
    expect(result.current.enabled).toBe(false);
  });
});

describe('useFeedbackLoop(enabled)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('queueFeedback increments pendingCount', () => {
    const { result } = renderHook(() => useFeedbackLoop(true));
    act(() => {
      result.current.queueFeedback({ agentId: 'ag1', rating: 4 });
      result.current.queueFeedback({ agentId: 'ag1', rating: 3 });
    });
    expect(result.current.pendingCount).toBe(2);
  });

  it('flushFeedback sends batch and resets pendingCount', async () => {
    const { result } = renderHook(() => useFeedbackLoop(true));
    act(() => result.current.queueFeedback({ rating: 5 }));
    expect(result.current.pendingCount).toBe(1);

    await act(async () => { await result.current.flushFeedback(); });

    expect(mockSubmitFeedback).toHaveBeenCalledOnce();
    expect(result.current.pendingCount).toBe(0);
  });

  it('flushFeedback updates lastFlush after successful send', async () => {
    const { result } = renderHook(() => useFeedbackLoop(true));
    act(() => result.current.queueFeedback({ rating: 3 }));
    await act(async () => { await result.current.flushFeedback(); });
    expect(result.current.lastFlush).not.toBeNull();
    expect(typeof result.current.lastFlush).toBe('string');
  });

  it('flushFeedback is a no-op when queue is empty', async () => {
    const { result } = renderHook(() => useFeedbackLoop(true));
    await act(async () => { await result.current.flushFeedback(); });
    expect(mockSubmitFeedback).not.toHaveBeenCalled();
    expect(result.current.pendingCount).toBe(0);
  });

  it('auto-flushes when MAX_BATCH (10) items are queued', async () => {
    const { result } = renderHook(() => useFeedbackLoop(true));

    // Queue 10 items — 10th triggers auto-flush
    await act(async () => {
      for (let i = 0; i < 10; i++) {
        result.current.queueFeedback({ rating: (i % 5) + 1 });
      }
      // Flush the auto-triggered promise
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockSubmitFeedback).toHaveBeenCalledTimes(10);
    expect(result.current.pendingCount).toBe(0);
  });

  it('periodic flush fires via setInterval', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useFeedbackLoop(true));
    act(() => result.current.queueFeedback({ rating: 2 }));

    expect(mockSubmitFeedback).not.toHaveBeenCalled();

    // Advance past the 30s interval
    await act(async () => {
      vi.advanceTimersByTime(31_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockSubmitFeedback).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it('flushFeedback is non-fatal on network error: resolves without throwing', async () => {
    // All individual errors are caught per-item inside Promise.all, so the
    // flush resolves successfully and pendingCount is reset to 0.
    mockSubmitFeedback.mockRejectedValueOnce(new Error('network'));
    const { result } = renderHook(() => useFeedbackLoop(true));
    act(() => result.current.queueFeedback({ rating: 4 }));

    await expect(
      act(async () => { await result.current.flushFeedback(); }),
    ).resolves.toBeUndefined();
  });

  it('enabled is true', () => {
    const { result } = renderHook(() => useFeedbackLoop(true));
    expect(result.current.enabled).toBe(true);
  });
});

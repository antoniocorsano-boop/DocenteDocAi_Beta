/**
 * ActionBridge.test.ts — P37
 *
 * Tests for the singleton ActionBridge dispatcher.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  registerChatHandler,
  dispatchAction,
} from '@/modules/orchestration/ActionBridge';

// ── Mock observability so tests don't need a real OTEL setup ────────────────
vi.mock('@/utils/observability', () => ({
  observe: vi.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function freshHandler() {
  const calls: { content: string }[] = [];
  const handler = vi.fn(async (msg: { content: string }) => {
    calls.push(msg);
  });
  return { handler, calls };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('ActionBridge', () => {
  // Unregister any leftover handler before each test
  let unregister: (() => void) | null = null;

  beforeEach(() => {
    unregister?.();
    unregister = null;
  });

  // ── registerChatHandler ──────────────────────────────────────────────────

  it('registers a handler and returns an unregister function', () => {
    const { handler } = freshHandler();
    const off = registerChatHandler(handler);
    expect(typeof off).toBe('function');
    off(); // cleanup
  });

  it('replaces the previous handler when called twice', async () => {
    const first  = freshHandler();
    const second = freshHandler();

    const off1 = registerChatHandler(first.handler);
    const off2 = registerChatHandler(second.handler);

    await dispatchAction({ type: 'click', id: 'btn-test' });

    expect(first.calls).toHaveLength(0);   // replaced
    expect(second.calls).toHaveLength(1);

    off1();
    off2();
  });

  it('returns an unregister that removes the handler', async () => {
    const { handler } = freshHandler();
    const off = registerChatHandler(handler);
    off();

    // Should not throw; handler is NOT called
    await expect(
      dispatchAction({ type: 'click', id: 'some-btn' })
    ).resolves.toBeUndefined();

    expect(handler).not.toHaveBeenCalled();
  });

  // ── dispatchAction — click ───────────────────────────────────────────────

  it('maps a click action to a natural-language message', async () => {
    const { handler, calls } = freshHandler();
    unregister = registerChatHandler(handler);

    await dispatchAction({ type: 'click', id: 'create-uda' });

    expect(calls).toHaveLength(1);
    expect(calls[0].content).toMatch(/UDA/i);
  });

  it('passes click metadata with source=ui', async () => {
    const { handler, calls } = freshHandler();
    unregister = registerChatHandler(handler);

    await dispatchAction({ type: 'click', id: 'analyze-classes' });

    const meta = (calls[0] as { metadata?: { source: string } }).metadata;
    expect(meta?.source).toBe('ui');
  });

  it('uses unknown-click fallback for unrecognised id', async () => {
    const { handler, calls } = freshHandler();
    unregister = registerChatHandler(handler);

    await dispatchAction({ type: 'click', id: 'totally-unknown-xyz' });

    expect(calls).toHaveLength(1);
    expect(calls[0].content).toBeTruthy();
  });

  // ── dispatchAction — form_submit ─────────────────────────────────────────

  it('maps a form_submit action to a structured message', async () => {
    const { handler, calls } = freshHandler();
    unregister = registerChatHandler(handler);

    await dispatchAction({
      type: 'form_submit',
      id:   'create-uda-form',
      data: { title: 'Fotosintesi', subject: 'Scienze', duration: '4h' },
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].content).toMatch(/Fotosintesi|Scienze/i);
  });

  // ── dispatchAction — system_event ────────────────────────────────────────

  it('handles a system_event action', async () => {
    const { handler } = freshHandler();
    unregister = registerChatHandler(handler);

    await dispatchAction({ type: 'system_event', name: 'app.ready' });

    expect(handler).toHaveBeenCalled();
  });

  // ── dispatchAction — no handler ──────────────────────────────────────────

  it('resolves without throwing when there is no handler', async () => {
    // Ensure no handler is registered
    unregister?.();
    unregister = null;

    await expect(
      dispatchAction({ type: 'click', id: 'create-uda' })
    ).resolves.toBeUndefined();
  });

  // ── dispatchAction — error resilience ────────────────────────────────────

  it('resolves without throwing even if the handler throws', async () => {
    const errorHandler = vi.fn(async () => { throw new Error('handler fail'); });
    unregister = registerChatHandler(errorHandler);

    await expect(
      dispatchAction({ type: 'click', id: 'create-uda' })
    ).resolves.toBeUndefined();
  });
});

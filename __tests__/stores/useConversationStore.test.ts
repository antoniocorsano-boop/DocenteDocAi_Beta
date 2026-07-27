/**
 * useConversationStore.test.ts — P37
 *
 * Unit tests for the Zustand conversation store.
 * localStorage is mocked via vitest setup (globalThis.localStorage).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  useConversationStore,
  titleFromFirstMessage,
} from '@/stores/useConversationStore';
import type { ChatMessage } from '@/types/uiBlocks';

// ── Mock observability ────────────────────────────────────────────────────────
vi.mock('@/utils/observability', () => ({
  observe: vi.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeUserMsg(content: string): ChatMessage {
  return { id: `m-${Date.now()}`, role: 'user', content, timestamp: Date.now() };
}

function makeAssistantMsg(content: string): ChatMessage {
  return { id: `m-${Date.now()}-a`, role: 'assistant', content, timestamp: Date.now() };
}

// ── Reset store between tests ─────────────────────────────────────────────────

beforeEach(() => {
  // Reset Zustand to initial empty state
  useConversationStore.setState({
    conversations:      [],
    activeId:           null,
    activeConversation: null,
  });
  localStorage.clear();
});

// ── titleFromFirstMessage ─────────────────────────────────────────────────────

describe('titleFromFirstMessage', () => {
  it('returns a short title from the first user message', () => {
    const msgs: ChatMessage[] = [
      makeAssistantMsg('Ciao!'),
      makeUserMsg('Crea una UDA su fotosintesi'),
    ];
    expect(titleFromFirstMessage(msgs)).toBe('Crea una UDA su fotosintesi');
  });

  it('truncates long messages with ellipsis', () => {
    const long = 'A'.repeat(60);
    const title = titleFromFirstMessage([makeUserMsg(long)]);
    expect(title.endsWith('…')).toBe(true);
    expect(title.length).toBeLessThanOrEqual(52); // 50 chars + '…'
  });

  it('falls back to a timestamp-based title when there are no user messages', () => {
    const title = titleFromFirstMessage([makeAssistantMsg('Ciao')]);
    expect(title).toMatch(/Chat/i);
  });

  it('returns default title for empty array', () => {
    const title = titleFromFirstMessage([]);
    expect(title).toMatch(/Chat/i);
  });
});

// ── createConversation ────────────────────────────────────────────────────────

describe('createConversation', () => {
  it('creates a conversation and sets it as active', () => {
    const { result } = renderHook(() => useConversationStore());

    act(() => { result.current.createConversation(); });

    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.activeId).toBe(result.current.conversations[0].id);
    expect(result.current.activeConversation).not.toBeNull();
  });

  it('returns the new conversation id', () => {
    const { result } = renderHook(() => useConversationStore());
    let id = '';

    act(() => { id = result.current.createConversation(); });

    expect(id).toBeTruthy();
    expect(result.current.activeId).toBe(id);
  });

  it('supports multiple conversations', () => {
    const { result } = renderHook(() => useConversationStore());

    act(() => {
      result.current.createConversation();
      result.current.createConversation();
    });

    expect(result.current.conversations).toHaveLength(2);
  });
});

// ── switchConversation ────────────────────────────────────────────────────────

describe('switchConversation', () => {
  it('switches the active conversation', () => {
    const { result } = renderHook(() => useConversationStore());
    let id1 = '', id2 = '';

    act(() => {
      id1 = result.current.createConversation();
      id2 = result.current.createConversation();
    });

    act(() => { result.current.switchConversation(id1); });

    expect(result.current.activeId).toBe(id1);
    expect(result.current.activeConversation?.id).toBe(id1);

    // Switch back
    act(() => { result.current.switchConversation(id2); });
    expect(result.current.activeId).toBe(id2);
  });
});

// ── addMessage ────────────────────────────────────────────────────────────────

describe('addMessage', () => {
  it('appends a message to the active conversation', () => {
    const { result } = renderHook(() => useConversationStore());

    act(() => { result.current.createConversation(); });
    act(() => { result.current.addMessage(makeUserMsg('Ciao!')); });

    expect(result.current.activeConversation?.messages).toHaveLength(1);
    expect(result.current.activeConversation?.messages[0].content).toBe('Ciao!');
  });

  it('auto-titles the conversation after the first user message', () => {
    const { result } = renderHook(() => useConversationStore());

    act(() => { result.current.createConversation(); });
    // First message sets title
    act(() => { result.current.addMessage(makeUserMsg('UDA fotosintesi')); });

    const conv = result.current.activeConversation;
    expect(conv?.title).toContain('UDA fotosintesi');
  });

  it('does nothing when there is no active conversation', () => {
    const { result } = renderHook(() => useConversationStore());
    // No createConversation() called

    act(() => {
      // Should not throw
      result.current.addMessage(makeUserMsg('test'));
    });

    expect(result.current.conversations).toHaveLength(0);
  });
});

// ── getMessages ───────────────────────────────────────────────────────────────

describe('getMessages', () => {
  it('returns messages of the active conversation', () => {
    const { result } = renderHook(() => useConversationStore());

    act(() => { result.current.createConversation(); });
    act(() => {
      result.current.addMessage(makeUserMsg('A'));
      result.current.addMessage(makeAssistantMsg('B'));
    });

    const msgs = result.current.getMessages();
    expect(msgs).toHaveLength(2);
  });

  it('returns empty array when no active conversation', () => {
    const { result } = renderHook(() => useConversationStore());
    expect(result.current.getMessages()).toEqual([]);
  });
});

// ── deleteConversation ────────────────────────────────────────────────────────

describe('deleteConversation', () => {
  it('removes the specified conversation', () => {
    const { result } = renderHook(() => useConversationStore());
    let id1 = '', id2 = '';

    act(() => {
      id1 = result.current.createConversation();
      id2 = result.current.createConversation();
    });

    act(() => { result.current.deleteConversation(id2); });

    expect(result.current.conversations.find(c => c.id === id2)).toBeUndefined();
    expect(result.current.conversations).toHaveLength(1);
    // auto-switched to remaining
    expect(result.current.activeId).toBe(id1);
  });

  it('leaves no active conversation after deleting the last one', () => {
    const { result } = renderHook(() => useConversationStore());
    let id = '';

    act(() => { id = result.current.createConversation(); });
    act(() => { result.current.deleteConversation(id); });

    expect(result.current.conversations).toHaveLength(0);
    expect(result.current.activeId).toBeNull();
    expect(result.current.activeConversation).toBeNull();
  });
});

// ── renameConversation ────────────────────────────────────────────────────────

describe('renameConversation', () => {
  it('updates the title of the specified conversation', () => {
    const { result } = renderHook(() => useConversationStore());
    let id = '';

    act(() => { id = result.current.createConversation(); });
    act(() => { result.current.renameConversation(id, 'Nuovo titolo'); });

    const conv = result.current.conversations.find(c => c.id === id);
    expect(conv?.title).toBe('Nuovo titolo');
  });
});

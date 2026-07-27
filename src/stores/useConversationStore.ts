/**
 * stores/useConversationStore.ts — P37 Multi-Thread Conversation Store
 *
 * Zustand store for managing multiple conversation threads (ChatGPT style).
 * Persists all threads to localStorage so sessions survive page refreshes.
 *
 * API:
 *   conversations[]         — ordered list (newest first)
 *   activeId                — ID of the selected conversation
 *   activeConversation      — shortcut (null when no conversations exist)
 *   createConversation()    → new ID, sets as active
 *   switchConversation(id)  → updates activeId + activeConversation
 *   addMessage(msg)         → appends to active conversation
 *   deleteConversation(id)  → removes, auto-switches if it was active
 *   renameConversation(id, title) → inline rename
 *
 * Observability:
 *   conversation.created / conversation.switched emitted for every event.
 */

import { create }                  from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ChatMessage }        from '@/types/uiBlocks';
import { observe }                 from '@/utils/observability';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Conversation {
  id:        string;
  title:     string;
  messages:  ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// ── ID + title helpers ─────────────────────────────────────────────────────────

let _counter = 0;

function newConvId(): string {
  return `conv-${Date.now()}-${++_counter}`;
}

function defaultTitle(): string {
  const d = new Date();
  return `Chat ${d.toLocaleDateString('it-IT')} ${d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
}

/**
 * Derive a short title from the first user message in a thread.
 * Falls back to the timestamp-based default.
 */
export function titleFromFirstMessage(messages: ChatMessage[]): string {
  const first = messages.find(m => m.role === 'user');
  if (!first) return defaultTitle();
  const text = first.content.slice(0, 50);
  return text.length < first.content.length ? `${text}…` : text;
}

// ── Store interface ────────────────────────────────────────────────────────────

export interface ConversationStoreState {
  conversations:      Conversation[];
  activeId:           string | null;
  activeConversation: Conversation | null;

  /** Create a new empty conversation and switch to it. Returns the new ID. */
  createConversation(): string;

  /** Switch the active thread. */
  switchConversation(id: string): void;

  /** Append a message to the currently active conversation. */
  addMessage(message: ChatMessage): void;

  /** Remove a conversation. Auto-switches to the next available if needed. */
  deleteConversation(id: string): void;

  /** Update the display title of a conversation. */
  renameConversation(id: string, title: string): void;

  /** Return messages of the active conversation (empty array if no active). */
  getMessages(): ChatMessage[];

  /** Delete ALL conversations and reset to empty state. */
  clearAll(): void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useConversationStore = create<ConversationStoreState>()(
  persist(
    (set, get) => ({
      conversations:      [],
      activeId:           null,
      activeConversation: null,

      // ── createConversation ──────────────────────────────────────────────────
      createConversation() {
        const id   = newConvId();
        const conv: Conversation = {
          id,
          title:     defaultTitle(),
          messages:  [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set(state => {
          const conversations = [conv, ...state.conversations];
          observe('conversation.created', { id }, 'info');
          return { conversations, activeId: id, activeConversation: conv };
        });
        return id;
      },

      // ── switchConversation ──────────────────────────────────────────────────
      switchConversation(id: string) {
        set(state => {
          const conv = state.conversations.find(c => c.id === id) ?? null;
          observe('conversation.switched', { id }, 'info');
          return { activeId: id, activeConversation: conv };
        });
      },

      // ── addMessage ──────────────────────────────────────────────────────────
      addMessage(message: ChatMessage) {
        set(state => {
          const { activeId } = state;
          if (!activeId) return {};

          const conversations = state.conversations.map(conv =>
            conv.id !== activeId ? conv : {
              ...conv,
              messages:  [...conv.messages, message],
              updatedAt: Date.now(),
              // Auto-title from the first user message
              title:
                conv.messages.length === 0 && message.role === 'user'
                  ? titleFromFirstMessage([message])
                  : conv.title,
            },
          );
          const activeConversation = conversations.find(c => c.id === activeId) ?? null;
          return { conversations, activeConversation };
        });
      },

      // ── deleteConversation ──────────────────────────────────────────────────
      deleteConversation(id: string) {
        set(state => {
          const conversations = state.conversations.filter(c => c.id !== id);
          const wasActive     = state.activeId === id;
          const activeId      = wasActive ? (conversations[0]?.id ?? null) : state.activeId;
          const activeConversation = conversations.find(c => c.id === activeId) ?? null;
          return { conversations, activeId, activeConversation };
        });
      },

      // ── renameConversation ──────────────────────────────────────────────────
      renameConversation(id: string, title: string) {
        set(state => {
          const conversations = state.conversations.map(c =>
            c.id === id ? { ...c, title } : c,
          );
          const activeConversation = conversations.find(c => c.id === state.activeId) ?? null;
          return { conversations, activeConversation };
        });
      },

      // ── getMessages ─────────────────────────────────────────────────────────
      getMessages() {
        return get().activeConversation?.messages ?? [];
      },

      // ── clearAll ────────────────────────────────────────────────────────────
      clearAll() {
        set({ conversations: [], activeId: null, activeConversation: null });
      },
    }),

    // ── Persistence config ────────────────────────────────────────────────────
    {
      name:    'docente-conversations-v1',
      storage: createJSONStorage(() => localStorage),

      // Only persist the raw data — not derived reactive state
      partialize: (state) => ({
        conversations: state.conversations,
        activeId:      state.activeId,
      }),

      // Re-derive activeConversation after localStorage rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.activeConversation =
            state.conversations.find(c => c.id === state.activeId) ?? null;
        }
      },
    },
  ),
);

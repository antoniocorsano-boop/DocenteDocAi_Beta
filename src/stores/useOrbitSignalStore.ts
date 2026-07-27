/**
 * useOrbitSignalStore — lightweight ephemeral signal bus for OrbitDock → Chat bridge.
 *
 * Stores a pending prompt that OrbitChatFAB consumes: when `pendingPrompt` is
 * set, OrbitChatFAB opens the drawer and fires `triggerPrompt`, then clears
 * the value.
 *
 * Also tracks which suggestion IDs the user triggered in the current session
 * via `usedActionIds` so OrbitSuggestionEngine can suppress duplicates.
 *
 * NOT persisted: this is all in-memory state, never written to localStorage.
 */
import { create } from 'zustand';

interface OrbitSignalState {
  /** Prompt queued by OrbitDock. Null = nothing pending. */
  pendingPrompt: string | null;
  /** Set a prompt to trigger. Pass null to clear. */
  setPendingPrompt: (prompt: string | null) => void;

  /** Suggestion IDs fired this session — used for deduplication. */
  usedActionIds: string[];
  /** Append a suggestion id to the used list. */
  recordAction: (id: string) => void;
}

export const useOrbitSignalStore = create<OrbitSignalState>(set => ({
  pendingPrompt:    null,
  setPendingPrompt: (pendingPrompt) => set({ pendingPrompt }),

  usedActionIds: [],
  recordAction:  (id) => set(s => ({ usedActionIds: [...s.usedActionIds, id] })),
}));


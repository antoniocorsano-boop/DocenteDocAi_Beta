// Zustand store for NKA state, nodes, settings, and local persistence
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NKANode, NKASettings } from './types';

interface NKAState {
  enabled: boolean;
  nodes: readonly NKANode[];
  settings: NKASettings;
  setEnabled: (enabled: boolean) => void;
  setNodes: (nodes: readonly NKANode[]) => void;
  setSettings: (settings: NKASettings) => void;
}

export const useNKAStore = create<NKAState>()(
  persist(
    (set) => ({
      enabled: false,
      nodes: [],
      settings: { sound: true, reducedMotion: false },
      setEnabled: (enabled) => set({ enabled }),
      setNodes: (nodes) => set({ nodes }),
      setSettings: (settings) => set({ settings }),
    }),
    { name: 'nka-store' }
  )
);


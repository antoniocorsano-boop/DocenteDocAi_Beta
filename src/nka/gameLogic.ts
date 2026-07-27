// Game logic for NKA: unlock neurons, track progress, award badges
import { NKANode } from './types';

export interface GameState {
  unlocked: string[]; // node ids
  progress: number; // 0-1
  badges: string[];
}

export function getInitialGameState(nodes: readonly NKANode[]): GameState {
  void nodes;
  return {
    unlocked: [],
    progress: 0,
    badges: [],
  };
}

export function unlockNode(state: GameState, nodeId: string): GameState {
  if (state.unlocked.includes(nodeId)) return state;
  const unlocked = [...state.unlocked, nodeId];
  const progress = unlocked.length / Math.max(1, state.unlocked.length + 1);
  const badges = unlocked.length % 3 === 0 ? [...state.badges, `Badge${unlocked.length}`] : state.badges;
  return { unlocked, progress, badges };
}


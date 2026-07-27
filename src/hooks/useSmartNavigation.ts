/**
 * useSmartNavigation — learns user navigation patterns and predicts the next view.
 *
 * Stores an in-memory + localStorage frequency map of view transitions
 * (from → to). After a warm-up period (≥ WARMUP_TRANSITIONS) the hook returns
 * the statistically most likely next view for the current one.
 *
 * The prediction is fed back into usePrefetch so the predicted chunk is
 * requested BEFORE the staggered adjacency list, improving perceived speed.
 *
 * Roadmap: #17 — Smart Navigation: anticipa prossima pagina in base a pattern utente
 */
import { useEffect, useRef, useCallback } from 'react';
import type { View } from '../types';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

/** Edge in the navigation graph: from → to with occurrence count */
interface NavEdge {
  from: View;
  to: View;
  count: number;
}

/** Persisted structure in localStorage */
interface NavPatternStore {
  /** Schema version — bump to invalidate old data */
  v: 1;
  transitions: NavEdge[];
  /** Total recorded transitions (used for warm-up check) */
  total: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'dd_nav_patterns';
/** Minimum recorded transitions before making a prediction */
const WARMUP_TRANSITIONS = 5;
/** Maximum edges stored (prunes least-used when exceeded) */
const MAX_EDGES = 200;

// ──────────────────────────────────────────────────────────────────────────────
// Storage helpers (safe read/write)
// ──────────────────────────────────────────────────────────────────────────────

function loadStore(): NavPatternStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { v: 1, transitions: [], total: 0 };
    const parsed = JSON.parse(raw) as NavPatternStore;
    if (parsed.v !== 1) return { v: 1, transitions: [], total: 0 };
    return parsed;
  } catch {
    return { v: 1, transitions: [], total: 0 };
  }
}

function saveStore(store: NavPatternStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Quota exceeded or private mode — degrade silently
  }
}

function pruneEdges(edges: NavEdge[]): NavEdge[] {
  if (edges.length <= MAX_EDGES) return edges;
  // Keep the most-used edges
  return [...edges].sort((a, b) => b.count - a.count).slice(0, MAX_EDGES);
}

// ──────────────────────────────────────────────────────────────────────────────
// Core: record a transition
// ──────────────────────────────────────────────────────────────────────────────

function recordTransition(from: View, to: View): void {
  if (from === to) return;
  const store = loadStore();
  const existing = store.transitions.find((e) => e.from === from && e.to === to);
  if (existing) {
    existing.count += 1;
  } else {
    store.transitions.push({ from, to, count: 1 });
  }
  store.transitions = pruneEdges(store.transitions);
  store.total += 1;
  saveStore(store);
}

// ──────────────────────────────────────────────────────────────────────────────
// Core: predict the most likely next view
// ──────────────────────────────────────────────────────────────────────────────

function predictNextView(currentView: View): View | null {
  const store = loadStore();
  if (store.total < WARMUP_TRANSITIONS) return null;

  const candidates = store.transitions
    .filter((e) => e.from === currentView)
    .sort((a, b) => b.count - a.count);

  return candidates[0]?.to ?? null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────────────────────────────────────

export interface SmartNavigationResult {
  /** Most likely next view, or null during warm-up */
  predictedNextView: View | null;
  /** Manually record a transition (called automatically by the hook) */
  recordNavigation: (from: View, to: View) => void;
}

/**
 * Tracks navigation history and predicts the most likely next view.
 *
 * @param currentView Currently active view
 * @returns `predictedNextView` after warm-up, plus a manual `recordNavigation` helper
 *
 * @example
 * ```tsx
 * const { predictedNextView } = useSmartNavigation(view);
 * usePrefetch(view, predictedNextView); // prioritise predicted chunk
 * ```
 */
export function useSmartNavigation(currentView: View): SmartNavigationResult {
  const previousView = useRef<View | null>(null);

  useEffect(() => {
    const prev = previousView.current;
    if (prev !== null && prev !== currentView) {
      recordTransition(prev, currentView);
    }
    previousView.current = currentView;
  }, [currentView]);

  const recordNavigation = useCallback((from: View, to: View) => {
    recordTransition(from, to);
  }, []);

  const predictedNextView = predictNextView(currentView);

  return { predictedNextView, recordNavigation };
}

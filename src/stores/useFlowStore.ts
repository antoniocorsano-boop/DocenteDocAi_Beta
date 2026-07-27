/**
 * stores/useFlowStore.ts
 *
 * Zustand persist store for OrbitFlow management.
 *
 * Persists to localStorage under key: 'orbit_flows_v1'
 *
 * Design:
 *   - flows[]: the ordered list of defined flows (manual + auto-generated)
 *   - flowTrust: Record<flowId, score> — decays / updates on execution events
 *   - Trust mechanics mirror skillTrust (same delta, same decay rate)
 *   - Actions nested under .actions (consistent with store conventions)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OrbitFlow } from '../modules/flows/orbitFlow';

// ─── Trust constants ──────────────────────────────────────────────────────────

const FLOW_TRUST_INITIAL    = 0.65;
const FLOW_TRUST_SUCCESS    = +0.10; // on successful full execution
const FLOW_TRUST_REVERSAL   = -0.20; // on user reversal / cancel
const FLOW_TRUST_DECAY      =  -0.05; // per decay tick
const FLOW_TRUST_MIN        = 0.00;
const FLOW_TRUST_MAX        = 1.00;

function clamp(v: number): number {
  return Math.min(FLOW_TRUST_MAX, Math.max(FLOW_TRUST_MIN, v));
}

// ─── State shape ──────────────────────────────────────────────────────────────

interface FlowState {
  /** Ordered list of all defined flows */
  flows: OrbitFlow[];
  /** Trust score per flow ID — updated on execution outcomes */
  flowTrust: Record<string, number>;

  actions: {
    /** Add a new flow (from pattern or user creation) */
    addFlow:       (flow: OrbitFlow) => void;
    /** Remove a flow by ID */
    removeFlow:    (flowId: string)  => void;
    /** Toggle the active/archived status of a flow */
    toggleActive:  (flowId: string)  => void;
    /** Record a successful execution — increments count + applies trust reward */
    onSuccess:     (flowId: string)  => void;
    /** Record a user-reversed execution — applies trust penalty */
    onReversal:    (flowId: string)  => void;
    /** Decay trust for a specific flow (called periodically by the trust loop) */
    decayFlow:     (flowId: string)  => void;
    /** Replace all flows (used by backup restore) */
    setFlows:      (flows: OrbitFlow[]) => void;
    /** Reset store to initial state */
    reset:         () => void;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function updateFlowTrust(
  trust: Record<string, number>,
  flowId: string,
  delta: number,
): Record<string, number> {
  const current = trust[flowId] ?? FLOW_TRUST_INITIAL;
  return { ...trust, [flowId]: clamp(current + delta) };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useFlowStore = create<FlowState>()(
  persist(
    (set) => ({
      flows:     [],
      flowTrust: {},

      actions: {
        addFlow: (flow) =>
          set((s) => {
            // Deduplication: replace if same ID already exists
            const filtered = s.flows.filter(f => f.id !== flow.id);
            return {
              flows:     [...filtered, flow],
              flowTrust: {
                ...s.flowTrust,
                [flow.id]: s.flowTrust[flow.id] ?? FLOW_TRUST_INITIAL,
              },
            };
          }),

        removeFlow: (flowId) =>
          set((s) => {
            const { [flowId]: _removed, ...rest } = s.flowTrust;
            return {
              flows:     s.flows.filter(f => f.id !== flowId),
              flowTrust: rest,
            };
          }),

        toggleActive: (flowId) =>
          set((s) => ({
            flows: s.flows.map(f =>
              f.id === flowId ? { ...f, active: !f.active } : f,
            ),
          })),

        onSuccess: (flowId) =>
          set((s) => ({
            flows: s.flows.map(f =>
              f.id === flowId
                ? { ...f, executionCount: f.executionCount + 1, lastRunAt: Date.now() }
                : f,
            ),
            flowTrust: updateFlowTrust(s.flowTrust, flowId, FLOW_TRUST_SUCCESS),
          })),

        onReversal: (flowId) =>
          set((s) => ({
            flowTrust: updateFlowTrust(s.flowTrust, flowId, FLOW_TRUST_REVERSAL),
          })),

        decayFlow: (flowId) =>
          set((s) => ({
            flowTrust: updateFlowTrust(s.flowTrust, flowId, FLOW_TRUST_DECAY),
          })),

        setFlows: (flows) => set({ flows }),

        reset: () => set({ flows: [], flowTrust: {} }),
      },
    }),
    {
      name: 'orbit_flows_v1',
      // Only persist data fields, not actions (standard Zustand pattern)
      partialize: (s) => ({ flows: s.flows, flowTrust: s.flowTrust }),
    },
  ),
);

// ─── Selectors ────────────────────────────────────────────────────────────────

/** Returns flows that are active and have sufficient trust to show */
export function selectActiveFlows(state: FlowState): OrbitFlow[] {
  return state.flows.filter(f => f.active && (state.flowTrust[f.id] ?? FLOW_TRUST_INITIAL) >= 0.50);
}

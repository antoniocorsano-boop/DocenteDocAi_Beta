/**
 * useApprovalQueueStore.ts
 *
 * Zustand store for Enterprise HITL approval queue UI state.
 *
 * Subscribes to approvalGate events so that UI components (panels, banners)
 * can react to new approval requests and resolutions without polling.
 *
 * Persistence: synced from approvalGate (which owns the localStorage truth).
 * This store is the reactive read-layer; writes go through approvalGate directly.
 */

import { create } from 'zustand';
import { approvalGate } from '../services/enterprise/approvalGate';
import type { ApprovalRequest } from '../types/enterprise.types';
import { useUserBehaviorStore } from './useUserBehaviorStore';

interface ApprovalQueueState {
  pending: ApprovalRequest[];
  /** Last resolved request ID, used to trigger UI feedback */
  lastResolvedId: string | null;
  /** Refresh pending list from approvalGate */
  refresh: () => void;
  /** Convenience: total pending count */
  pendingCount: number;
}

export const useApprovalQueueStore = create<ApprovalQueueState>((set) => {
  // Bootstrap from persisted gate state
  const initialPending = approvalGate.getPending();

  // Subscribe to new approvals
  approvalGate.onApprovalRequired(() => {
    set({ pending: approvalGate.getPending(), pendingCount: approvalGate.getPendingCount() });
  });

  // Subscribe to resolutions
  approvalGate.onResolution((_resolution, _request) => {
    // Track approval turnaround speed for UserBehaviorModel
    const delayMs =
      new Date(_resolution.resolvedAt).getTime() -
      new Date(_request.createdAt).getTime();
    useUserBehaviorStore.getState().onApprovalDelay(delayMs);

    set({
      pending:        approvalGate.getPending(),
      pendingCount:   approvalGate.getPendingCount(),
      lastResolvedId: _request.id,
    });
  });

  return {
    pending:        initialPending,
    pendingCount:   initialPending.length,
    lastResolvedId: null,
    refresh: () => set({
      pending:      approvalGate.getPending(),
      pendingCount: approvalGate.getPendingCount(),
    }),
  };
});

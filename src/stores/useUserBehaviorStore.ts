/**
 * useUserBehaviorStore.ts — Sprint 13: Zustand store for UserBehaviorProfile.
 *
 * Persisted to localStorage under key 'user_behavior_profile_v1'.
 * All mutations delegate to pure functions in userBehaviorModel.ts.
 *
 * Actions:
 *   onActionExecuted(actionId, requiresApproval?) — call after successful execution
 *   onActionIgnored(actionId, requiresApproval?)  — call when user dismisses a suggestion
 *   onApprovalDelay(ms)                           — call when an approval request resolves
 *
 * Getter:
 *   getProfile() — returns current UserBehaviorProfile (for ranking / notification engine)
 */

import { create }               from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  createEmptyProfile,
  onActionExecuted  as modelExecuted,
  onActionIgnored   as modelIgnored,
  onApprovalDelay   as modelDelay,
} from '../cognition/userBehaviorModel';
import type { UserBehaviorProfile } from '../cognition/userBehaviorModel';

// ─── Store shape ──────────────────────────────────────────────────────────────

interface UserBehaviorState {
  profile: UserBehaviorProfile;
  /** Call after a SuggestedAction reaches 'executed' status. */
  onActionExecuted: (actionId: string, requiresApproval?: boolean) => void;
  /** Call when the user dismisses a suggestion without acting on it. */
  onActionIgnored:  (actionId: string, requiresApproval?: boolean) => void;
  /** Call when an approval request resolves — pass turnaround time in ms. */
  onApprovalDelay:  (ms: number) => void;
  /** Read the current profile (non-reactive — for use outside React). */
  getProfile:       () => UserBehaviorProfile;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useUserBehaviorStore = create<UserBehaviorState>()(
  persist(
    (set, get) => ({
      profile: createEmptyProfile(),

      onActionExecuted(actionId, requiresApproval = false) {
        set((state) => ({
          profile: modelExecuted(state.profile, actionId, requiresApproval),
        }));
      },

      onActionIgnored(actionId, requiresApproval = false) {
        set((state) => ({
          profile: modelIgnored(state.profile, actionId, requiresApproval),
        }));
      },

      onApprovalDelay(ms) {
        set((state) => ({
          profile: modelDelay(state.profile, ms),
        }));
      },

      getProfile() {
        return get().profile;
      },
    }),
    {
      name:    'user_behavior_profile_v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

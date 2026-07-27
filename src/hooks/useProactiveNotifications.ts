/**
 * useProactiveNotifications — Sprint 11: React bridge for the notification engine.
 *
 * Subscribes to decisionMemory signal stream via onSignal().
 * For each new signal:
 *   1. Calls notificationEngine.decide() with pending approval IDs
 *   2. If decision → fires app-level toast (via UIStore) for ephemeral feedback
 *   3. Enqueues decision into local state for the NotificationToast component
 *
 * Consumers receive:
 *   - notifications  : queued NotificationDecision[] (newest first, max 5)
 *   - dismiss        : remove a single notification by actionId
 *   - dismissAll     : clear all queued notifications
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { decisionMemory }          from '../cognition/decisionMemory';
import { approvalGate }            from '../services/enterprise/approvalGate';
import { decide }                  from '../cognition/notificationEngine';
import type { NotificationDecision } from '../cognition/notificationEngine';
import { useUIStore }              from '../stores/useUIStore';
import { useUserBehaviorStore }    from '../stores/useUserBehaviorStore';
import type { SystemSignal }       from '../cognition/signals';

// ── Re-export so consumers avoid a second deep import ─────────────────────────
export type { NotificationDecision };

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_QUEUE = 5;

/** Map notification type → UIStore toast type */
const TOAST_LEVEL: Record<NotificationDecision['type'], 'success' | 'error' | 'info'> = {
  critical:   'error',
  warning:    'info',
  suggestion: 'info',
  info:       'success',
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export interface ProactiveNotificationsState {
  /** Queued decisions, newest first (max 5). */
  notifications: NotificationDecision[];
  /** Remove one notification by its actionId. */
  dismiss:       (actionId: string) => void;
  /** Clear all queued notifications. */
  dismissAll:    () => void;
}

export function useProactiveNotifications(): ProactiveNotificationsState {
  const [notifications, setNotifications] = useState<NotificationDecision[]>([]);
  const showToast = useUIStore((s) => s.actions.showToast);

  // Keep a stable ref to the current queue so the signal handler can read it
  // without being re-subscribed on every state change.
  const queueRef = useRef<NotificationDecision[]>(notifications);
  useEffect(() => { queueRef.current = notifications; }, [notifications]);

  const handleSignal = useCallback((signal: SystemSignal) => {
    // Gather pending approval IDs to skip duplicate notifications
    const pendingIds = approvalGate.getPending().map((r) => r.id);

    // Also skip if signal.id already queued in the UI
    const alreadyQueued = queueRef.current.map((n) => n.actionId);

    const decision = decide(signal, [...pendingIds, ...alreadyQueued]);
    if (!decision) return;

    // Ephemeral app-level toast (disappears automatically)
    showToast(decision.title, TOAST_LEVEL[decision.type]);

    // Enqueue into persistent NotificationToast panel (deduped, newest first)
    setNotifications((prev) => {
      const deduped = prev.filter((n) => n.actionId !== decision.actionId);
      return [decision, ...deduped].slice(0, MAX_QUEUE);
    });
  }, [showToast]);

  useEffect(() => {
    const unsub = decisionMemory.onSignal(handleSignal);
    return unsub;
  }, [handleSignal]);

  const dismiss = useCallback((actionId: string) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n.actionId === actionId);
      // Treat explicit dismiss as an "ignored" signal for behavior learning
      if (target?.actionId) {
        useUserBehaviorStore.getState().onActionIgnored(target.actionId);
      }
      return prev.filter((n) => n.actionId !== actionId);
    });
  }, []);

  const dismissAll = useCallback(() => setNotifications([]), []);

  return { notifications, dismiss, dismissAll };
}

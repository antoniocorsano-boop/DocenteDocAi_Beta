/**
 * hooks/useFeedbackLoop.ts — Continuous Feedback Loop hook (P35)
 *
 * Collects per-outcome user feedback items locally and sends them to the server
 * as asynchronous batches (fire-and-forget).
 *
 * Enabled/disabled via the `enabled` parameter:
 *   false (base users)  → queueFeedback is a no-op; nothing is sent.
 *   true  (beta users)  → items accumulate; auto-flush when MAX_BATCH is
 *                         reached or every FLUSH_INTERVAL_MS; explicit
 *                         flushFeedback() for immediate send.
 *
 * Observability events (via observe()):
 *   adaptive.loop.start    — batch send initiated (debug)
 *   adaptive.loop.complete — batch sent successfully (info)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { observe }                                   from '@/utils/observability';
import { submitUserFeedback }                        from '@/services/agentApiClient';
import type { FeedbackPayload }                      from '@/services/agentApiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FeedbackItem {
  outcomeId?: number;
  agentId?:   string;
  rating:     number;     // 1-5
  notes?:     string;
  tags?:      string[];
}

export interface UseFeedbackLoopReturn {
  /** Add a feedback item to the pending queue. No-op when disabled. */
  queueFeedback:  (item: FeedbackItem) => void;
  /** Flush all pending items to the server. No-op when disabled or queue empty. */
  flushFeedback:  () => Promise<void>;
  /** Number of items waiting in the local queue. */
  pendingCount:   number;
  /** ISO timestamp of the last successful flush, or null if never flushed. */
  lastFlush:      string | null;
  /** Whether the feedback loop is active for this user tier. */
  enabled:        boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_BATCH         = 10;
const FLUSH_INTERVAL_MS = 30_000;

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFeedbackLoop(enabled: boolean): UseFeedbackLoopReturn {
  const [pendingCount, setPendingCount] = useState(0);
  const [lastFlush,    setLastFlush   ] = useState<string | null>(null);

  // Mutable queue — stored in a ref to avoid stale closure issues
  const queueRef = useRef<FeedbackItem[]>([]);

  // ── flushFeedback ───────────────────────────────────────────────────────────
  const flushFeedback = useCallback(async (): Promise<void> => {
    if (!enabled || queueRef.current.length === 0) return;

    const batch       = [...queueRef.current];
    queueRef.current  = [];
    setPendingCount(0);

    observe('adaptive.loop.start', { count: batch.length }, 'debug');

    try {
      await Promise.all(
        batch.map(item =>
          submitUserFeedback(item as FeedbackPayload).catch(() => {
            // Non-fatal: continue with remaining items on individual failure
          }),
        ),
      );
      const now = new Date().toISOString();
      setLastFlush(now);
      observe('adaptive.loop.complete', { count: batch.length, at: now }, 'info');
    } catch {
      // Entire batch failed — non-fatal; items already removed from queue
    }
  }, [enabled]);

  // ── queueFeedback ───────────────────────────────────────────────────────────
  const queueFeedback = useCallback((item: FeedbackItem): void => {
    if (!enabled) return;
    queueRef.current.push(item);
    const newCount = queueRef.current.length;
    setPendingCount(newCount);
    if (newCount >= MAX_BATCH) {
      // MAX_BATCH reached: trigger flush asynchronously
      void flushFeedback();
    }
  }, [enabled, flushFeedback]);

  // ── Periodic auto-flush ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => { void flushFeedback(); }, FLUSH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [enabled, flushFeedback]);

  return { queueFeedback, flushFeedback, pendingCount, lastFlush, enabled };
}

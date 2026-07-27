/**
 * useIdleDetection.ts  —  P22 Stabilization Layer
 *
 * Replaces the inline idle timer in UserWorkspace with a self-contained hook.
 *
 * Key improvements over the previous inline implementation:
 *   - 200 ms throttle on mousemove (was 60 fps raw)
 *   - useCallback has zero React deps (uses refs) → doesn't re-attach listeners
 *     when entries.length or open changes
 *   - configurable idleMs and enabled flag
 *   - forceIdle() exposes manual override for context-takeover logic
 *
 * Usage:
 *   const { isIdle, resetIdle, forceIdle } = useIdleDetection({
 *     enabled: entries.length > 0 && !open,
 *     idleMs:  4_000,
 *   });
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseIdleDetectionOptions {
  /** When false the idle timer is not armed (e.g. nothing to suggest yet). */
  enabled: boolean;
  /** Milliseconds of inactivity before isIdle becomes true. Default: 4 000. */
  idleMs?:  number;
}

export interface UseIdleDetectionResult {
  isIdle:    boolean;
  resetIdle: () => void;
  forceIdle: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useIdleDetection({
  enabled,
  idleMs = 4_000,
}: UseIdleDetectionOptions): UseIdleDetectionResult {

  const [isIdle, setIsIdle] = useState(false);

  // Refs allow zero-dep useCallback (avoids listener re-attachment)
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMoveRef = useRef(0);
  const enabledRef  = useRef(enabled);
  const idleMsRef   = useRef(idleMs);

  // Keep refs in sync with current values
  enabledRef.current = enabled;
  idleMsRef.current  = idleMs;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * Called on any user interaction event.
   * Throttled to at most 1 call per 200 ms to avoid 60-fps re-renders on mousemove.
   */
  const resetIdle = useCallback(() => {
    const now = Date.now();
    if (now - lastMoveRef.current < 200) return; // 5 fps max
    lastMoveRef.current = now;

    setIsIdle(false);
    clearTimer();

    if (enabledRef.current) {
      timerRef.current = setTimeout(() => setIsIdle(true), idleMsRef.current);
    }
  }, [clearTimer]);

  /**
   * Manual override that immediately marks the user as idle.
   * Used by context-takeover logic in UserWorkspace.
   */
  const forceIdle = useCallback(() => {
    clearTimer();
    setIsIdle(true);
  }, [clearTimer]);

  // Arm/disarm the timer when `enabled` changes
  useEffect(() => {
    if (enabled) {
      // Arm the timer now (treat mount / enable as a "reset" event)
      clearTimer();
      timerRef.current = setTimeout(() => setIsIdle(true), idleMs);
    } else {
      clearTimer();
      setIsIdle(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]); // idleMs intentionally excluded: only re-arm on enabled toggle

  // Attach document-level interaction listeners (zero deps → only once)
  useEffect(() => {
    const EVENTS = ['mousemove', 'keydown', 'click', 'touchstart'] as const;
    EVENTS.forEach(ev => document.addEventListener(ev, resetIdle, { passive: true }));
    return () => {
      EVENTS.forEach(ev => document.removeEventListener(ev, resetIdle));
      clearTimer();
    };
  }, [resetIdle, clearTimer]);

  return { isIdle, resetIdle, forceIdle };
}

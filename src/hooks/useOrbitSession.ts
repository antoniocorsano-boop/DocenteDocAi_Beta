/**
 * hooks/useOrbitSession.ts
 *
 * React hook that derives and keeps updated the current OrbitSession.
 *
 * Design:
 *   - Polls every 60 s (school-day granularity is sufficient)
 *   - Reads useAcademicStore + useSettingsStore one-shot (no subscription)
 *   - Manual override via setManualOverride() / clearOverride()
 *   - Zero external deps beyond Zustand stores + pure session engine
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { deriveSession }             from '../modules/session/orbitSession';
import type { OrbitSession }         from '../modules/session/orbitSession';
import { useAcademicStore }          from '../stores/useAcademicStore';
import { useSettingsStore }          from '../stores/useSettingsStore';
import { useCognitiveStore }         from '../modules/cognitiveLayer/cognitiveStore';
import type { ScheduleContext }      from '../modules/orchestration/types';

// ─── Poll interval ────────────────────────────────────────────────────────────
const POLL_MS = 60_000; // 60 seconds

// ─── Schedule context builder (one-shot, no subscription) ────────────────────

function buildScheduleContext(): ScheduleContext {
  const { lessons } = useAcademicStore.getState();
  const { settings } = useSettingsStore.getState();

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLessons = Object.values(lessons).filter(
    l => l.data === todayStr && !l.svolta,
  );
  if (todayLessons.length === 0) return {};

  const next = todayLessons[0];
  const [h = 8, m = 0] = (settings.orarioInizio ?? '08:00').split(':').map(Number);
  const now = new Date();
  const startMs = new Date(
    now.getFullYear(), now.getMonth(), now.getDate(), h, m,
  ).getTime();
  const minsToLesson = Math.floor((startMs - Date.now()) / 60_000);

  return {
    currentLessonId: next.id,
    activeClassId:   next.classe,
    nextLessonAt:    startMs,
    lessonType:      next.tipoLezione,
    minsToLesson,
  };
}

// ─── Recent domains helper ────────────────────────────────────────────────────

function getRecentDomains(): string[] {
  return useCognitiveStore
    .getState()
    .entries
    .slice(0, 5)
    .map(e => e.domain);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseOrbitSessionReturn {
  /** Derived (or manually overridden) session */
  session:           OrbitSession;
  /** Override the derived session — persists until clearOverride() */
  setManualOverride: (s: OrbitSession) => void;
  /** Remove manual override, resume automatic derivation */
  clearOverride:     () => void;
}

export function useOrbitSession(): UseOrbitSessionReturn {
  const overrideRef = useRef<OrbitSession | null>(null);

  const derive = useCallback((): OrbitSession => {
    if (overrideRef.current) return overrideRef.current;
    const sched   = buildScheduleContext();
    const domains = getRecentDomains();
    return deriveSession(new Date(), sched, domains);
  }, []);

  const [session, setSession] = useState<OrbitSession>(derive);

  useEffect(() => {
    // Initial derive
    setSession(derive());

    const id = setInterval(() => {
      setSession(derive());
    }, POLL_MS);

    return () => clearInterval(id);
  }, [derive]);

  const setManualOverride = useCallback((s: OrbitSession) => {
    overrideRef.current = s;
    setSession(s);
  }, []);

  const clearOverride = useCallback(() => {
    overrideRef.current = null;
    setSession(derive());
  }, [derive]);

  return { session, setManualOverride, clearOverride };
}

/**
 * useNextAction.ts — React hook bridging stores → Decision Engine.
 *
 * Architecture:
 *   - Reads TeacherModel store (persistent usage state, capability level)
 *   - Reads EventLogger session log (in-session event names)
 *   - Feeds both into `getNextAction(ctx)` — the pure decision function
 *   - Result is memoized: only recomputes when inputs change
 *
 * All UI components that need to know "what to do next" MUST use this hook.
 * No component may contain its own "next step" logic.
 *
 * @example
 * function MyBanner() {
 *   const action = useNextAction();
 *   if (!action) return null;
 *   return <Box>{action.label}</Box>;
 * }
 */

import { useMemo } from 'react';
import { useTeacherModelStore } from '../stores/useTeacherModelStore';
import { useStudentStore }      from '../stores/useStudentStore';
import { getSessionLog } from '../cognition/EventLogger';
import { getNextAction } from '../cognition/decisionEngine/getNextAction';
import type { NextAction, NextActionContext } from '../cognition/decisionEngine/types';
import type { CapabilityLevel } from '../types/teacherModel.types';
import { decisionMemory } from '../cognition/decisionMemory';
import { approvalGate }   from '../services/enterprise/approvalGate';

export function useNextAction(): NextAction {
  // ── Persistent model state ──────────────────────────────────────────────
  const capabilityLevel = useTeacherModelStore((s) => s.capabilityLevel) as CapabilityLevel;
  const usageProfile    = useTeacherModelStore((s) => s.usageProfile);

  // ── Actual student presence (fixes hasStudents computation) ─────────────
  // BUG-FIX: previously derived from lessonsCreated || udaCreated which
  // prevented rule L1-1 ("Aggiungi la tua classe") from activating correctly.
  const students = useStudentStore((s) => s.students);

  // ── Session event names (in-memory, not persisted) ──────────────────────
  // getSessionLog() is synchronous and cheap — returns the current in-memory log.
  // We call it inside useMemo so React re-renders only when model state changes
  // (since EventLogger is not a React store, new events won't trigger re-renders
  //  on their own — the TeacherModel update will co-occur with events that matter).
  const action = useMemo((): NextAction => {
    const sessionLog = getSessionLog();
    const eventNames = new Set(sessionLog.map((e) => e.event as string));

    // Enterprise context — decisionMemory and approvalGate are singletons, not Zustand stores.
    // Their changes don't trigger React re-renders on their own; however, the
    // TeacherModel or Student store updates that co-occur with meaningful signals
    // will cause this memo to recompute, picking up the latest enterprise state.
    const dmState      = decisionMemory.getState();
    const pendingCount = approvalGate.getPendingCount();

    const ctx: NextActionContext = {
      eventNames,
      capabilityLevel,
      usage: {
        lessonsCreated:      usageProfile.lessonsCreated,
        udaCreated:          usageProfile.udaCreated,
        copilotRequests:     usageProfile.copilotRequests,
        driveConnected:      usageProfile.driveConnected,
        bookServicesLinked:  usageProfile.bookServicesLinked,
        analyticsViews:      usageProfile.analyticsViews,
        workspaceConfigured: usageProfile.workspaceConfigured,
      },
      hasStudents:      (students ?? []).filter((s) => !s.isArchived).length > 0,
      pendingApprovals: pendingCount,
      signals:          dmState.signals.map((s) => ({ type: s.type, severity: s.severity })),
      complianceStatus: dmState.complianceStatus,
    };

    return getNextAction(ctx);
  }, [capabilityLevel, usageProfile, students]);

  return action;
}

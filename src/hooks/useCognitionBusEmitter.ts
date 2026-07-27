/**
 * useCognitionBusEmitter — React bridge that:
 *   1. Initialises UsageTracker and WorkflowPatternDetector once at mount.
 *   2. Calls syncFromAnalytics() once at mount for migration of existing users.
 *   3. Emits app.session.started on load.
 *
 * Call this hook ONCE in useAppEngine (it is idempotent).
 */

import { useEffect, useRef } from 'react';
import { useTeacherModelStore } from '../stores/useTeacherModelStore';
import { useSystemStore } from '../stores/useSystemStore';
import { initUsageTracker } from '../cognition/UsageTracker';
import { initWorkflowPatternDetector } from '../cognition/WorkflowPatternDetector';
import { cognitionBus } from '../cognition/CognitionBus';

export function useCognitionBusEmitter(): void {
  const syncFromAnalytics = useTeacherModelStore((s) => s.syncFromAnalytics);
  const analyticsMetrics = useSystemStore((s) => s.analyticsMetrics);

  const initialised = useRef(false);
  const syncedRef = useRef(false);

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;

    const s = useTeacherModelStore.getState();
    initUsageTracker({
      updateUsageProfile: s.updateUsageProfile,
      updateCopilotProfile: s.updateCopilotProfile,
      getUsageProfile: s.getUsageProfile,
      getCopilotProfile: s.getCopilotProfile,
    });
    initWorkflowPatternDetector({
      addWorkflowPattern: s.addWorkflowPattern,
      getWorkflowPatterns: s.getWorkflowPatterns,
    });

    cognitionBus.emit('app.session.started', {});
  }, []);  

  // Migration: sync from analytics once when metrics load
  useEffect(() => {
    if (syncedRef.current) return;
    if (!analyticsMetrics) return;
    syncedRef.current = true;
    syncFromAnalytics(analyticsMetrics);
  }, [analyticsMetrics, syncFromAnalytics]);
}

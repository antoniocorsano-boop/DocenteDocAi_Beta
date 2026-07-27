/**
 * useAgentSuggestions.ts — React hook bridging stores → Agent System.
 *
 * Builds AgentContext from existing Zustand stores and delegates
 * to runAllAgents(). Returns a memoized array of AgentSuggestion.
 *
 * Used by:
 *   - FloatingSatelliteCopilot (alternative suggestions)
 *   - CopilotRecommendationPanel (enriched suggestion list)
 *   - Any component needing contextual, dynamic agent output
 *
 * @example
 *   const agentSuggestions = useAgentSuggestions();
 */

import { useMemo } from 'react';
import { useTeacherModelStore }  from '../stores/useTeacherModelStore';
import { useStudentStore }        from '../stores/useStudentStore';
import { useAcademicStore }       from '../stores/useAcademicStore';
import { useIntegrationStore }    from '../stores/useIntegrationStore';
import { useSystemStore }         from '../stores/useSystemStore';
import { runAllAgents }           from '../cognition/agents';
import type { AgentContext, AgentSuggestion } from '../cognition/agents';

export function useAgentSuggestions(): AgentSuggestion[] {
  // ── Store selectors ─────────────────────────────────────────────────────
  const capabilityLevel  = useTeacherModelStore((s) => s.capabilityLevel);
  const students         = useStudentStore((s) => s.students);
  const evaluations      = useStudentStore((s) => s.evaluations);
  const uda              = useAcademicStore((s) => s.uda);
  const lessonsRecord    = useAcademicStore((s) => s.lessons);
  const integrations     = useIntegrationStore((s) => s.integrations);
  const events           = useIntegrationStore((s) => s.events);
  const analyticsMetrics = useSystemStore((s) => s.analyticsMetrics);
  const user             = useSystemStore((s) => s.user);

  return useMemo((): AgentSuggestion[] => {
    // Flatten lessons record to array for agents
    const lessons = Object.values(lessonsRecord);

    // Count recent (last 24h) unacknowledged events as activity signal
    const oneDayAgo = Date.now() - 86_400_000;
    const recentEventCount = events.filter(
      (e) => !e.acknowledged && new Date(e.timestamp).getTime() > oneDayAgo,
    ).length;

    const ctx: AgentContext = {
      capabilityLevel,
      students,
      evaluations,
      uda,
      lessons,
      integrations,
      analyticsMetrics,
      user,
      recentEventCount,
    };

    return runAllAgents(ctx);
  }, [
    capabilityLevel,
    students,
    evaluations,
    uda,
    lessonsRecord,
    integrations,
    events,
    analyticsMetrics,
    user,
  ]);
}

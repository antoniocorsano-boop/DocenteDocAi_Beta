/**
 * useAdaptiveDashboard — React hook for the UC Analytics Dashboard.
 *
 * Aggregates all adaptive-intelligence data into a single memoised snapshot:
 *   - AdaptiveProfiles for all 13 UCs (scrutiny level, boost, autoRemediate)
 *   - Degrading UCs (scrutiny = 'high')
 *   - UC telemetry summaries (events, completions, compliance failures, avgDelta)
 *   - Compliance hotspots (UCs with ≥1 compliance_fail event, sorted desc)
 *   - Top-5 most-used UCs
 *   - Cumulative compliance delta across all events
 *
 * Data sources:
 *   adaptiveAssistant.ts  → profiles, degrading
 *   useCaseTelemetry.ts   → summaries, hotspots, topUsed, cumulativeDelta
 *
 * Reactive model: computed eagerly on every render from localStorage.
 * For real-time updates, combine with a polling interval in the consumer.
 */

import { useMemo } from 'react';
import {
  getAllAdaptiveProfiles,
  getDegradingUseCases,
} from '../cognition/adaptiveAssistant';
import {
  buildUseCaseSummaries,
  getComplianceHotspots,
  getCumulativeComplianceDelta,
  getTopUsedCases,
} from '../cognition/useCaseTelemetry';
import type { AdaptiveProfile } from '../cognition/adaptiveAssistant';
import type { UseCaseSummary }  from '../cognition/useCaseTelemetry';

export interface AdaptiveDashboardData {
  /** Adaptive profiles for all 13 use cases */
  profiles:        AdaptiveProfile[];
  /** Subset of profiles where scrutinyLevel === 'high' */
  degrading:       AdaptiveProfile[];
  /** Telemetry summary for every UC (includes zero-event UCs) */
  summaries:       UseCaseSummary[];
  /** UCs with ≥1 compliance_fail event, sorted by failure count descending */
  hotspots:        UseCaseSummary[];
  /** Top-5 most-executed UCs by totalEvents */
  topUsed:         UseCaseSummary[];
  /** Net compliance delta across all telemetry events */
  cumulativeDelta: number;
  /** Total events across all UCs */
  totalEvents:     number;
  /** Total compliance failures across all UCs */
  totalFailures:   number;
}

export function useAdaptiveDashboard(): AdaptiveDashboardData {
  return useMemo<AdaptiveDashboardData>(() => {
    const profiles  = getAllAdaptiveProfiles();
    const summaries = buildUseCaseSummaries();
    const totalEvents   = summaries.reduce((acc, s) => acc + s.totalEvents, 0);
    const totalFailures = summaries.reduce((acc, s) => acc + s.complianceFailures, 0);

    return {
      profiles,
      degrading:       getDegradingUseCases(),
      summaries,
      hotspots:        getComplianceHotspots(),
      topUsed:         getTopUsedCases(5),
      cumulativeDelta: getCumulativeComplianceDelta(),
      totalEvents,
      totalFailures,
    };
  }, []);
}

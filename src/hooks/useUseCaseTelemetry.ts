/**
 * useUseCaseTelemetry — React hook wrapping the useCaseTelemetry module.
 *
 * Exposes read + write access to the Use Case Telemetry Layer so UI
 * components can display analytics (`IntelligentDashboard`, `AuditPAPanel`)
 * and fire manual tracking calls without importing the module directly.
 *
 * Usage:
 *   const { summaries, hotspots, topUsed, track } = useUseCaseTelemetry();
 *   track('UC-V1', 'completed', 5, { sourcePanel: 'live-compliance' });
 */
import { useCallback, useMemo } from 'react';
import {
  trackUseCase,
  buildUseCaseSummaries,
  getComplianceHotspots,
  getTopUsedCases,
  getCumulativeComplianceDelta,
} from '../cognition/useCaseTelemetry';
import type { UseCaseId, UseCaseOutcome, UseCaseSummary } from '../cognition/useCaseTelemetry';

export interface UseCaseTelemetryHook {
  /** All 13 UC summaries (empty UCs included with zero counts). */
  summaries: UseCaseSummary[];
  /** UCs with at least one compliance_fail event, sorted by failure count desc. */
  hotspots: UseCaseSummary[];
  /** Top N most-executed UCs (default: 5). */
  topUsed: UseCaseSummary[];
  /** Net compliance delta across all events (positive = improving). */
  cumulativeDelta: number;
  /**
   * Fire a use case telemetry event.
   * Stable reference — safe to include in dependency arrays.
   */
  track: (
    useCaseId: UseCaseId,
    outcome: UseCaseOutcome,
    complianceDelta?: number,
    details?: Record<string, unknown>,
  ) => void;
}

/**
 * Returns UC telemetry data computed eagerly on every render.
 * Data is read directly from localStorage on each call — no subscription.
 * For a reactive version, combine with `useSyncExternalStore` or poll via `useInterval`.
 */
export function useUseCaseTelemetry(topN = 5): UseCaseTelemetryHook {
  const summaries        = useMemo(() => buildUseCaseSummaries(),           []);
  const hotspots         = useMemo(() => getComplianceHotspots(),           []);
  const topUsed          = useMemo(() => getTopUsedCases(topN),             [topN]);
  const cumulativeDelta  = useMemo(() => getCumulativeComplianceDelta(),    []);

  const track = useCallback<UseCaseTelemetryHook['track']>(
    (useCaseId, outcome, complianceDelta = 0, details = {}) =>
      trackUseCase(useCaseId, outcome, complianceDelta, details),
    [],
  );

  return { summaries, hotspots, topUsed, cumulativeDelta, track };
}

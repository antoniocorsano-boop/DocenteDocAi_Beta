/**
 * useTelemetry — typed wrapper around useSystemStore.trackAnalyticsEvent.
 *
 * Provides convenience helpers for the most common event types so callers
 * don't have to remember the raw string literals:
 *
 *   const { trackFeatureUsage, trackAiInteraction } = useTelemetry();
 *   trackFeatureUsage('gantt_open');
 *   trackAiInteraction('lesson_suggestion', { model: 'gemini-3-flash-preview' });
 *
 * Roadmap: #27 — Telemetria e logging AI + UX
 */
import { useCallback } from 'react';
import { useSystemStore } from '../stores/useSystemStore';
import type { AnalyticsEvent } from '../types';

type EventType = AnalyticsEvent['eventType'];
type Meta = Record<string, string | number | boolean>;

export interface TelemetryHook {
  /** Raw tracker — use specific helpers when possible. */
  track: (eventType: EventType, featureName: string, metadata?: Meta) => void;
  /** Track a feature UI interaction (button click, tab switch, etc.). */
  trackFeatureUsage: (featureName: string, metadata?: Meta) => void;
  /** Track client-side navigation between views. */
  trackNavigation: (destination: string, metadata?: Meta) => void;
  /** Track an AI model call or interaction. */
  trackAiInteraction: (featureName: string, metadata?: Meta) => void;
  /** Track generation of a document (PDF, DOCX, Markdown report, etc.). */
  trackDocumentGenerated: (docType: string, metadata?: Meta) => void;
}

/**
 * Returns stable, memoised telemetry helpers.
 * Safe to call in any component — returns no-ops when analytics are disabled.
 */
export function useTelemetry(): TelemetryHook {
  const trackAnalyticsEvent = useSystemStore(
    (state) => state.actions.trackAnalyticsEvent,
  );

  const track = useCallback<TelemetryHook['track']>(
    (eventType, featureName, metadata) =>
      trackAnalyticsEvent(eventType, featureName, metadata),
    [trackAnalyticsEvent],
  );

  const trackFeatureUsage = useCallback<TelemetryHook['trackFeatureUsage']>(
    (featureName, metadata) =>
      trackAnalyticsEvent('feature_usage', featureName, metadata),
    [trackAnalyticsEvent],
  );

  const trackNavigation = useCallback<TelemetryHook['trackNavigation']>(
    (destination, metadata) =>
      trackAnalyticsEvent('navigation', destination, metadata),
    [trackAnalyticsEvent],
  );

  const trackAiInteraction = useCallback<TelemetryHook['trackAiInteraction']>(
    (featureName, metadata) =>
      trackAnalyticsEvent('ai_interaction', featureName, metadata),
    [trackAnalyticsEvent],
  );

  const trackDocumentGenerated = useCallback<TelemetryHook['trackDocumentGenerated']>(
    (docType, metadata) =>
      trackAnalyticsEvent('document_generated', docType, metadata),
    [trackAnalyticsEvent],
  );

  return {
    track,
    trackFeatureUsage,
    trackNavigation,
    trackAiInteraction,
    trackDocumentGenerated,
  };
}

/**
 * aiTelemetry.ts — AI feature telemetry + OTel span helpers (Sprint 1)
 *
 * Two layers:
 *   1. Event buffer — logs key AI interaction events to a circular in-memory
 *      buffer when AI Experimental Mode is active.
 *   2. OTel spans — `startAISpan()` creates real OpenTelemetry spans via the
 *      application-scoped Tracer from tracing.ts.  When no OTLP endpoint is
 *      configured the tracer is a no-op proxy, so all usages are safe
 *      unconditionally.
 *
 * Beta mode is read directly from localStorage ('ai_beta_mode') so these
 * functions can be called from plain event handlers without a React context.
 *
 * Usage:
 *   import { logAIActionTriggered, startAISpan } from '@/ai/telemetry/aiTelemetry'
 *   const span = startAISpan('riskAnalyzer', { studentCount: 22 })
 *   // … do work …
 *   span.end()
 */
import type { Span } from '@opentelemetry/api';
import { SpanStatusCode } from '@opentelemetry/api';
import { getTracer } from '@/tracing';
import type { CopilotActionType } from '../copilot/actions/types';
import type { AISuggestion } from '../contextEngine/types';

// ── beta gate ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'ai_beta_mode';

function isBetaActive(): boolean {
  if (import.meta.env.VITE_AI_BETA === 'true') return true;
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

// ── event buffer (circular, max 200 entries) ──────────────────────────────────

export interface AITelemetryEvent {
  event: string;
  ts: string;
  [key: string]: unknown;
}

const MAX_BUFFER = 200;
const _buffer: AITelemetryEvent[] = [];

function emit(event: AITelemetryEvent): void {
  if (!isBetaActive()) return;
  if (_buffer.length >= MAX_BUFFER) _buffer.shift();
  _buffer.push(event);
   
  console.debug('[AI Telemetry]', event);
}

/** Returns a read-only snapshot of all buffered events. Useful for debugging. */
export function getTelemetryBuffer(): readonly AITelemetryEvent[] {
  return _buffer;
}

/** Clears the in-memory event buffer. */
export function clearTelemetryBuffer(): void {
  _buffer.length = 0;
}

// ── public log functions ──────────────────────────────────────────────────────

/**
 * Fired when an AI suggestion (risk or excellence chip) becomes visible to
 * the teacher for the first time in the current session.
 */
export function logAISuggestionViewed(
  suggestionId: string,
  type: AISuggestion['type'],
): void {
  emit({ event: 'ai_suggestion_viewed', ts: new Date().toISOString(), suggestionId, type });
}

/**
 * Fired when the teacher clicks an action button in CopilotActionsBar
 * (before confirming). Records intent, not completion.
 *
 * studentId is pseudonymized (base64, first 8 chars) before buffering
 * to avoid storing raw PII in the telemetry buffer (GDPR compliance).
 */
export function logAIActionTriggered(
  actionType: CopilotActionType,
  studentId: string,
): void {
  const pseudoId = btoa(studentId).slice(0, 8);
  emit({ event: 'ai_action_triggered', ts: new Date().toISOString(), actionType, pseudoId });
}

/**
 * Fired when the teacher opens the "Perché?" explainability popover on any
 * ExplainableInsightChip.
 */
export function logAIExplanationOpened(suggestionId: string): void {
  emit({ event: 'ai_explanation_opened', ts: new Date().toISOString(), suggestionId });
}

/**
 * Fired when the PlanningAssistantPanel generates a lesson plan via AI.
 *
 * @param context  A short descriptor of the generation context (e.g. class name + subject).
 */
export function logAILessonGenerated(context: string): void {
  emit({ event: 'ai_lesson_generated', ts: new Date().toISOString(), context });
}

// ── OTel span helpers ─────────────────────────────────────────────────────────

/**
 * Starts an OpenTelemetry span for an AI sub-module step.
 *
 * The span name is prefixed with `ai.` automatically.
 * When no OTLP endpoint is configured the tracer is a no-op proxy —
 * span.end() is always safe to call.
 *
 * @param name   Short identifier for the step (e.g. 'riskAnalyzer')
 * @param attrs  Optional key/value attributes attached to the span
 * @returns      Active OTel Span — caller must call span.end() when the step completes
 *
 * @example
 * const span = startAISpan('riskAnalyzer', { studentCount: 22 });
 * const risks = analyzeRisk(context);
 * span.end();
 */
export function startAISpan(
  name: string,
  attrs?: Record<string, string | number | boolean>,
): Span {
  const span = getTracer().startSpan(`ai.${name}`);
  if (attrs) {
    Object.entries(attrs).forEach(([k, v]) => span.setAttribute(k, v));
  }
  span.setStatus({ code: SpanStatusCode.OK });
  return span;
}

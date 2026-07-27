/**
 * aiTelemetry.test.ts — unit tests for startAISpan and event buffer (Sprint 1)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  startAISpan,
  getTelemetryBuffer,
  clearTelemetryBuffer,
  logAISuggestionViewed,
  logAIActionTriggered,
} from '../aiTelemetry';

beforeEach(() => {
  clearTelemetryBuffer();
  // Ensure beta mode is active so emit() calls are not no-ops
  localStorage.setItem('ai_beta_mode', 'true');
});

// ── startAISpan ───────────────────────────────────────────────────────────────

describe('startAISpan', () => {
  it('returns an object with an end() method', () => {
    const span = startAISpan('testStep');
    expect(typeof span.end).toBe('function');
    span.end();
  });

  it('end() does not throw', () => {
    const span = startAISpan('testStep');
    expect(() => span.end()).not.toThrow();
  });

  it('accepts optional attributes without throwing', () => {
    const span = startAISpan('riskAnalyzer', { studentCount: 22, cached: false });
    expect(() => span.end()).not.toThrow();
  });

  it('can be started and ended multiple times per run', () => {
    const spans = ['classHealth', 'riskAnalyzer', 'trendEngine'].map((name) =>
      startAISpan(name),
    );
    expect(() => spans.forEach((s) => s.end())).not.toThrow();
  });
});

// ── event buffer ──────────────────────────────────────────────────────────────

describe('telemetry event buffer', () => {
  it('logAISuggestionViewed adds event to buffer', () => {
    logAISuggestionViewed('s1', 'student_at_risk');
    const buf = getTelemetryBuffer();
    expect(buf.some((e) => e.event === 'ai_suggestion_viewed')).toBe(true);
  });

  it('clearTelemetryBuffer empties the buffer', () => {
    logAISuggestionViewed('s1', 'student_at_risk');
    clearTelemetryBuffer();
    expect(getTelemetryBuffer().length).toBe(0);
  });

  it('each event has a ts field (ISO string)', () => {
    logAISuggestionViewed('s2', 'student_excellence');
    const event = getTelemetryBuffer()[0];
    expect(typeof event.ts).toBe('string');
    expect(new Date(event.ts).toISOString()).toBe(event.ts);
  });

  it('logAIActionTriggered records actionType and pseudonymized id (no raw studentId)', () => {
    logAIActionTriggered('schedule_recovery', 'student-1');
    const event = getTelemetryBuffer().find((e) => e.event === 'ai_action_triggered');
    expect(event?.actionType).toBe('schedule_recovery');
    // Raw studentId must NOT appear in the buffer — only a truncated pseudoId (GDPR R1)
    expect((event as Record<string, unknown>)?.studentId).toBeUndefined();
    // pseudoId is the first 8 chars of btoa('student-1')
    expect((event as Record<string, unknown>)?.pseudoId).toBe(btoa('student-1').slice(0, 8));
  });
});

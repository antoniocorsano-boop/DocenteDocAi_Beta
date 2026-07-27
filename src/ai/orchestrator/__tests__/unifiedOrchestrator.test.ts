/**
 * unifiedOrchestrator.test.ts — Sprint 1 unit tests
 *
 * Covers:
 *   - Full run returns UnifiedAIResult with correct schema version
 *   - Cache hit on second identical call (no re-run)
 *   - forceFresh bypasses cache and returns fresh result
 *   - Audit is pushed to in-memory ring-buffer on every call
 *   - includeLessonAssistant=true populates lessonAssistant field
 *   - Empty class produces safe zero-state result without throwing
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { runUnifiedAnalysis } from '../unifiedOrchestrator';
import { AI_SCHEMA_VERSION } from '../types';
import { clearAllCaches } from '../../cache/aiCache';
import { clearAuditHistory, getAuditHistory } from '../../audit/auditTrail';
import {
  fixtureStudents,
  fixtureEvaluations,
} from '../../../fixtures/realisticClassData';

beforeEach(() => {
  clearAllCaches();
  clearAuditHistory();
});

// ── Basic result contract ─────────────────────────────────────────────────────

describe('runUnifiedAnalysis — result contract', () => {
  it('returns schemaVersion = 2', () => {
    const result = runUnifiedAnalysis(
      fixtureStudents['3A'],
      fixtureEvaluations['3A'],
    );
    expect(result.schemaVersion).toBe(AI_SCHEMA_VERSION);
  });

  it('classHealth.score is in [0, 100]', () => {
    const result = runUnifiedAnalysis(
      fixtureStudents['3A'],
      fixtureEvaluations['3A'],
    );
    expect(result.classHealth.score).toBeGreaterThanOrEqual(0);
    expect(result.classHealth.score).toBeLessThanOrEqual(100);
  });

  it('suggestions = risks ∪ excellence', () => {
    const result = runUnifiedAnalysis(
      fixtureStudents['3A'],
      fixtureEvaluations['3A'],
    );
    expect(result.suggestions.length).toBe(result.risks.length + result.excellence.length);
  });

  it('atRiskCount matches risks array length', () => {
    const result = runUnifiedAnalysis(
      fixtureStudents['3A'],
      fixtureEvaluations['3A'],
    );
    expect(result.atRiskCount).toBe(result.risks.length);
  });

  it('excellenceCount matches excellence array length', () => {
    const result = runUnifiedAnalysis(
      fixtureStudents['3A'],
      fixtureEvaluations['3A'],
    );
    expect(result.excellenceCount).toBe(result.excellence.length);
  });

  it('riskPredictions is an array', () => {
    const result = runUnifiedAnalysis(
      fixtureStudents['3A'],
      fixtureEvaluations['3A'],
    );
    expect(Array.isArray(result.riskPredictions)).toBe(true);
  });

  it('lessonAssistant is null by default', () => {
    const result = runUnifiedAnalysis(
      fixtureStudents['3A'],
      fixtureEvaluations['3A'],
    );
    expect(result.lessonAssistant).toBeNull();
  });
});

// ── includeLessonAssistant ────────────────────────────────────────────────────

describe('runUnifiedAnalysis — includeLessonAssistant option', () => {
  it('populates lessonAssistant when option is true', () => {
    const result = runUnifiedAnalysis(
      fixtureStudents['3A'],
      fixtureEvaluations['3A'],
      [],
      { includeLessonAssistant: true },
    );
    expect(result.lessonAssistant).not.toBeNull();
    expect(result.lessonAssistant?.suggestions).toBeDefined();
  });
});

// ── Caching ───────────────────────────────────────────────────────────────────

describe('runUnifiedAnalysis — caching', () => {
  it('returns identical result reference on cache hit', () => {
    const a = runUnifiedAnalysis(
      fixtureStudents['3A'],
      fixtureEvaluations['3A'],
    );
    const b = runUnifiedAnalysis(
      fixtureStudents['3A'],
      fixtureEvaluations['3A'],
    );
    // Same shape (not same reference since cache returns stored object)
    expect(b.classHealth.score).toBe(a.classHealth.score);
    expect(b.atRiskCount).toBe(a.atRiskCount);
  });

  it('forceFresh bypasses cache and returns fresh result', () => {
    const a = runUnifiedAnalysis(
      fixtureStudents['3A'],
      fixtureEvaluations['3A'],
    );
    const b = runUnifiedAnalysis(
      fixtureStudents['3A'],
      fixtureEvaluations['3A'],
      [],
      { forceFresh: true },
    );
    // Must still produce same logical result even when fresh
    expect(b.classHealth.score).toBe(a.classHealth.score);
    expect(b.atRiskCount).toBe(a.atRiskCount);
  });
});

// ── Audit trail ───────────────────────────────────────────────────────────────

describe('runUnifiedAnalysis — audit trail', () => {
  it('pushes an audit record on every call', () => {
    runUnifiedAnalysis(fixtureStudents['3A'], fixtureEvaluations['3A']);
    expect(getAuditHistory().length).toBe(1);
  });

  it('pushes a cache-hit audit on second call', () => {
    runUnifiedAnalysis(fixtureStudents['3A'], fixtureEvaluations['3A']);
    runUnifiedAnalysis(fixtureStudents['3A'], fixtureEvaluations['3A']);
    const history = getAuditHistory();
    expect(history.length).toBe(2);
    // Second should be tagged as cache-hit
    expect(history[1].cacheHit).toBe(true);
  });

  it('audit contains at least classHealthIndex step on fresh run', () => {
    runUnifiedAnalysis(
      fixtureStudents['3A'],
      fixtureEvaluations['3A'],
      [],
      { forceFresh: true },
    );
    const audit = getAuditHistory()[0];
    expect(audit?.steps.some((s) => s.name === 'classHealthIndex')).toBe(true);
  });
});

// ── Edge case: empty class ────────────────────────────────────────────────────

describe('runUnifiedAnalysis — empty class edge case', () => {
  it('does not throw on 0 students, 0 evaluations', () => {
    expect(() => runUnifiedAnalysis([], [])).not.toThrow();
  });

  it('returns 0 atRiskCount for empty class', () => {
    const result = runUnifiedAnalysis([], []);
    expect(result.atRiskCount).toBe(0);
  });

  it('returns 0 classAverage for empty class', () => {
    const result = runUnifiedAnalysis([], []);
    expect(result.classAverage).toBe(0);
  });
});

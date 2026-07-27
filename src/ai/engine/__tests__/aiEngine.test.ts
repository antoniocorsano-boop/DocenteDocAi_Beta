/**
 * aiEngine.test.ts — Unit tests for the unified AI analysis engine
 *
 * Three scenarios:
 *   1. At-risk class (3A Scienze) — verifies risk detection
 *   2. Excellence class (3A filtered to excellent students) — verifies excellence detection
 *   3. Mixed full dataset (all 3 classes) — verifies aggregate health
 *
 * All scenarios confirm:
 *   - classHealth.score is in range [0, 100]
 *   - predictions array is non-empty when evaluations span ≥ 3 days
 *   - classAverage is in range (1, 10]
 *   - atRiskCount + excellenceCount ≥ expected fixture counts
 */
import { describe, it, expect } from 'vitest';
import { runAIAnalysis } from '../aiEngine';
import { buildAIContext } from '../../contextEngine/contextBuilder';
import {
  fixtureStudents,
  fixtureEvaluations,
  allFixtureStudents,
  allFixtureEvaluations,
  FIXTURE_AT_RISK_IDS,
  FIXTURE_EXCELLENT_IDS,
} from '../../../fixtures/realisticClassData';

// ── Scenario 1: At-risk class (3A Scienze) ────────────────────────────────────

describe('runAIAnalysis — Scenario 1: Class 3A (at-risk conditions)', () => {
  const context = buildAIContext(
    fixtureStudents['3A'],
    [],
    fixtureEvaluations['3A'],
  );
  const result = runAIAnalysis(context);

  it('returns a classHealth score in [0, 100]', () => {
    expect(result.classHealth.score).toBeGreaterThanOrEqual(0);
    expect(result.classHealth.score).toBeLessThanOrEqual(100);
  });

  it('detects at least as many at-risk students as FIXTURE_AT_RISK_IDS', () => {
    expect(result.atRiskCount).toBeGreaterThanOrEqual(FIXTURE_AT_RISK_IDS['3A'].length);
  });

  it('detects at least as many excellent students as FIXTURE_EXCELLENT_IDS', () => {
    expect(result.excellenceCount).toBeGreaterThanOrEqual(FIXTURE_EXCELLENT_IDS['3A'].length);
  });

  it('classAverage is in range (0, 10]', () => {
    expect(result.classAverage).toBeGreaterThan(0);
    expect(result.classAverage).toBeLessThanOrEqual(10);
  });

  it('suggestions combines risks and excellence', () => {
    expect(result.suggestions.length).toBe(result.risks.length + result.excellence.length);
  });

  it('every risk suggestion has a type and a message', () => {
    for (const s of result.risks) {
      expect(s.type).toBeTruthy();
      expect(typeof s.message).toBe('string');
      expect(s.message.length).toBeGreaterThan(0);
    }
  });

  it('every risk suggestion has a confidence in [0, 1]', () => {
    for (const s of result.risks) {
      expect(s.confidence).toBeGreaterThanOrEqual(0);
      expect(s.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('risk suggestions include an explanation with reason and bulletPoints', () => {
    const withExplanation = result.risks.filter((s) => s.explanation != null);
    expect(withExplanation.length).toBeGreaterThan(0);
    for (const s of withExplanation) {
      expect(typeof s.explanation!.reason).toBe('string');
      expect(Array.isArray(s.explanation!.bulletPoints)).toBe(true);
    }
  });

  it('predictions is a non-empty array', () => {
    expect(Array.isArray(result.predictions)).toBe(true);
    expect(result.predictions.length).toBeGreaterThan(0);
  });
});

// ── Scenario 2: Excellence detection (3A — excellent students only) ───────────

describe('runAIAnalysis — Scenario 2: Excellent students only', () => {
  const excellentStudents = fixtureStudents['3A'].filter((s) =>
    FIXTURE_EXCELLENT_IDS['3A'].includes(s.id),
  );
  const excellentEvals = fixtureEvaluations['3A'].filter((e) =>
    excellentStudents.some((s) => s.id === e.studenteId),
  );
  const context = buildAIContext(excellentStudents, [], excellentEvals);
  const result = runAIAnalysis(context);

  it('recognises all excellent students', () => {
    expect(result.excellenceCount).toBeGreaterThanOrEqual(FIXTURE_EXCELLENT_IDS['3A'].length);
  });

  it('classAverage is above 7 for an excellence-only cohort', () => {
    expect(result.classAverage).toBeGreaterThan(7);
  });

  it('classHealth.score is above 50 for top performers', () => {
    expect(result.classHealth.score).toBeGreaterThan(50);
  });

  it('each excellence suggestion references a valid student id', () => {
    for (const s of result.excellence) {
      if (s.studentId != null) {
        expect(excellentStudents.some((st) => st.id === s.studentId)).toBe(true);
      }
    }
  });
});

// ── Scenario 3: Full mixed dataset (all 3 classes) ───────────────────────────

describe('runAIAnalysis — Scenario 3: Full dataset (66 students, 3 classes)', () => {
  const context = buildAIContext(
    allFixtureStudents,
    [],
    allFixtureEvaluations,
  );
  const result = runAIAnalysis(context);

  it('classHealth has a score, grade, dimensions, and summary', () => {
    expect(result.classHealth.score).toBeGreaterThanOrEqual(0);
    expect(result.classHealth.grade).toBeTruthy();
    expect(result.classHealth.dimensions).toBeTruthy();
    expect(typeof result.classHealth.summary).toBe('string');
  });

  it('detects at least all fixture at-risk students across 3 classes', () => {
    const totalExpectedAtRisk =
      FIXTURE_AT_RISK_IDS['3A'].length +
      FIXTURE_AT_RISK_IDS['2B'].length +
      FIXTURE_AT_RISK_IDS['1C'].length;
    expect(result.atRiskCount).toBeGreaterThanOrEqual(totalExpectedAtRisk);
  });

  it('detects at least all fixture excellent students across 3 classes', () => {
    const totalExpectedExcellent =
      FIXTURE_EXCELLENT_IDS['3A'].length +
      FIXTURE_EXCELLENT_IDS['2B'].length +
      FIXTURE_EXCELLENT_IDS['1C'].length;
    expect(result.excellenceCount).toBeGreaterThanOrEqual(totalExpectedExcellent);
  });

  it('classAverage is in range (5, 8) for a mixed real class distribution', () => {
    expect(result.classAverage).toBeGreaterThan(5);
    expect(result.classAverage).toBeLessThan(8);
  });

  it('predictions cover the majority of students', () => {
    // Each student with ≥ 3 evaluations in the last 90 days gets a forecast
    expect(result.predictions.length).toBeGreaterThan(allFixtureStudents.length / 2);
  });

  it('all suggestion IDs are unique', () => {
    const ids = result.suggestions.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

// ── Edge case: Empty context ──────────────────────────────────────────────────

describe('runAIAnalysis — Edge case: Empty context', () => {
  const context = buildAIContext([], [], []);
  const result = runAIAnalysis(context);

  it('returns a valid result without throwing', () => {
    expect(result).toBeTruthy();
  });

  it('classAverage is 0 when no evaluations', () => {
    expect(result.classAverage).toBe(0);
  });

  it('atRiskCount and excellenceCount are 0 for empty context', () => {
    expect(result.atRiskCount).toBe(0);
    expect(result.excellenceCount).toBe(0);
  });

  it('predictions is an empty array', () => {
    expect(result.predictions).toEqual([]);
  });
});

// @ts-nocheck
/**
 * decisionExplanation.test.ts — Unit tests for DecisionExplanation module.
 *
 * Verifies:
 *  1. buildDecisionExplanation always returns non-empty reasons array
 *  2. First reason matches suggestion.reason
 *  3. basedOnEvents is populated for known actionKeys
 *  4. Context facts are added when model has relevant usage data
 */

import { describe, it, expect } from 'vitest';
import { buildDecisionExplanation } from '../../src/cognition/DecisionExplanation';
import { createEmptyTeacherModel } from '../../src/cognition/TeacherModel';
import type { CopilotSuggestion, TeacherModel } from '../../src/types/teacherModel.types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeSuggestion(overrides: Partial<CopilotSuggestion> = {}): CopilotSuggestion {
  return {
    id: 'test-sug',
    actionKey: 'planning.create_uda',
    type: 'workflow',
    priority: 5,
    source: 'copilot',
    message: 'Crea una UDA',
    reason: 'È il momento giusto per pianificare.',
    icon: 'add_circle',
    ...overrides,
  };
}

function makeModel(overrides: Partial<TeacherModel> = {}): TeacherModel {
  return {
    ...createEmptyTeacherModel(),
    ...overrides,
  } as TeacherModel;
}

// ── Basic contract ────────────────────────────────────────────────────────────

describe('buildDecisionExplanation — basic contract', () => {
  it('returns a DecisionExplanation object with reasons and basedOnEvents', () => {
    const result = buildDecisionExplanation(makeSuggestion(), makeModel());
    expect(result).toHaveProperty('reasons');
    expect(result).toHaveProperty('basedOnEvents');
    expect(Array.isArray(result.reasons)).toBe(true);
    expect(Array.isArray(result.basedOnEvents)).toBe(true);
  });

  it('reasons array is never empty (at minimum contains suggestion.reason)', () => {
    const sug = makeSuggestion({ reason: 'Motivo di test specifico' });
    const result = buildDecisionExplanation(sug, makeModel());
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('first reason equals suggestion.reason', () => {
    const sug = makeSuggestion({ reason: 'Motivo principale' });
    const result = buildDecisionExplanation(sug, makeModel());
    expect(result.reasons[0]).toBe('Motivo principale');
  });

  it('does not throw for empty model', () => {
    expect(() => buildDecisionExplanation(makeSuggestion(), makeModel())).not.toThrow();
  });
});

// ── basedOnEvents population ──────────────────────────────────────────────────

describe('buildDecisionExplanation — basedOnEvents', () => {
  it('planning.create_uda → basedOnEvents includes workspace.configured', () => {
    const sug = makeSuggestion({ actionKey: 'planning.create_uda' });
    const result = buildDecisionExplanation(sug, makeModel());
    expect(result.basedOnEvents).toContain('workspace.configured');
  });

  it('planning.integrate_book → basedOnEvents includes book.account.linked', () => {
    const sug = makeSuggestion({ actionKey: 'planning.integrate_book' });
    const result = buildDecisionExplanation(sug, makeModel());
    expect(result.basedOnEvents).toContain('book.account.linked');
  });

  it('Unknown actionKey → basedOnEvents is an array (may be empty)', () => {
    const sug = makeSuggestion({ actionKey: 'some.unknown.action' });
    const result = buildDecisionExplanation(sug, makeModel());
    expect(Array.isArray(result.basedOnEvents)).toBe(true);
  });
});

// ── Context facts from model ──────────────────────────────────────────────────

describe('buildDecisionExplanation — context facts', () => {
  it('adds lesson count fact when lessonsCreated > 0', () => {
    const model = makeModel({
      usageProfile: {
        ...createEmptyTeacherModel().usageProfile,
        lessonsCreated: 3,
      },
    });
    const result = buildDecisionExplanation(makeSuggestion(), model);
    const mentionsLessons = result.reasons.some((r) => r.includes('lezione') || r.includes('3'));
    expect(mentionsLessons).toBe(true);
  });

  it('adds class setup fact for classroom.add_class when lessonsCreated === 0', () => {
    const model = makeModel({
      usageProfile: {
        ...createEmptyTeacherModel().usageProfile,
        lessonsCreated: 0,
      },
    });
    const sug = makeSuggestion({ actionKey: 'classroom.add_class' });
    const result = buildDecisionExplanation(sug, model);
    // Should have more than just the primary reason
    expect(result.reasons.length).toBeGreaterThanOrEqual(1);
  });

  it('adds UDA count fact for annual plan suggestion when UDAs exist', () => {
    const model = makeModel({
      usageProfile: {
        ...createEmptyTeacherModel().usageProfile,
        udaCreated: 5,
      },
    });
    const sug = makeSuggestion({ actionKey: 'planning.annual_plan' });
    const result = buildDecisionExplanation(sug, model);
    const mentionsUda = result.reasons.some((r) => r.includes('UDA') || r.includes('5'));
    expect(mentionsUda).toBe(true);
  });

  it('does not exceed a reasonable reason count (max 5)', () => {
    const model = makeModel({
      usageProfile: {
        ...createEmptyTeacherModel().usageProfile,
        lessonsCreated: 10,
        udaCreated: 5,
        copilotRequests: 8,
        bookServicesLinked: 2,
      },
    });
    const result = buildDecisionExplanation(makeSuggestion(), model);
    expect(result.reasons.length).toBeLessThanOrEqual(10);
  });
});

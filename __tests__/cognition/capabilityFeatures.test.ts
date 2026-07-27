// @ts-nocheck
/**
 * capabilityFeatures.test.ts — Unit tests for CapabilityEngine v4 additions.
 *
 * Tests: getAvailableFeatures, computeCapabilityLevel, isFeatureAvailable
 */

import { describe, it, expect } from 'vitest';
import {
  getAvailableFeatures,
  computeCapabilityLevel,
} from '../../src/cognition/CapabilityEngine';
import { isFeatureAvailable } from '../../src/cognition/FeatureGate';

// ── getAvailableFeatures ──────────────────────────────────────────────────────

describe('getAvailableFeatures', () => {
  it('Level 1 → only ADD_STUDENT', () => {
    expect(getAvailableFeatures(1)).toEqual(['ADD_STUDENT']);
  });

  it('Level 2 → ADD_STUDENT + CREATE_LESSON', () => {
    const features = getAvailableFeatures(2);
    expect(features).toContain('ADD_STUDENT');
    expect(features).toContain('CREATE_LESSON');
    expect(features).not.toContain('CREATE_UDA');
  });

  it('Level 3 → includes CREATE_UDA and ARTISTIC_TOOLS', () => {
    const features = getAvailableFeatures(3);
    expect(features).toContain('ADD_STUDENT');
    expect(features).toContain('CREATE_LESSON');
    expect(features).toContain('CREATE_UDA');
    expect(features).toContain('ARTISTIC_TOOLS');
    expect(features).not.toContain('BOOK_INTEGRATION');
  });

  it('Level 4 → all 5 features unlocked', () => {
    const features = getAvailableFeatures(4);
    expect(features).toHaveLength(5);
    expect(features).toContain('ADD_STUDENT');
    expect(features).toContain('CREATE_LESSON');
    expect(features).toContain('CREATE_UDA');
    expect(features).toContain('ARTISTIC_TOOLS');
    expect(features).toContain('BOOK_INTEGRATION');
  });

  it('Level 1 → ADD_STUDENT count is exactly 1', () => {
    expect(getAvailableFeatures(1)).toHaveLength(1);
  });

  it('Unknown level → falls back to Level 1 feature set', () => {
    // @ts-expect-error intentionally invalid level
    expect(getAvailableFeatures(0)).toEqual(['ADD_STUDENT']);
  });

  it('Is deterministic — same input → same output', () => {
    expect(getAvailableFeatures(3)).toEqual(getAvailableFeatures(3));
  });
});

// ── computeCapabilityLevel ────────────────────────────────────────────────────

describe('computeCapabilityLevel', () => {
  it('Empty events → Level 1', () => {
    expect(computeCapabilityLevel([])).toBe(1);
  });

  it('class.first_student_added → Level 2', () => {
    const events = [{ name: 'class.first_student_added', ts: Date.now() }];
    expect(computeCapabilityLevel(events)).toBe(2);
  });

  it('workspace.configured → Level 3', () => {
    const events = [{ name: 'workspace.configured', ts: Date.now() }];
    expect(computeCapabilityLevel(events)).toBe(3);
  });

  it('book.service.interacted → Level 4', () => {
    const events = [{ name: 'book.service.interacted', ts: Date.now() }];
    expect(computeCapabilityLevel(events)).toBe(4);
  });

  it('book.service.interacted takes priority over workspace.configured', () => {
    const events = [
      { name: 'workspace.configured', ts: Date.now() },
      { name: 'book.service.interacted', ts: Date.now() },
    ];
    expect(computeCapabilityLevel(events)).toBe(4);
  });

  it('workspace.configured takes priority over class.first_student_added', () => {
    const events = [
      { name: 'class.first_student_added', ts: Date.now() },
      { name: 'workspace.configured', ts: Date.now() },
    ];
    expect(computeCapabilityLevel(events)).toBe(3);
  });

  it('Unrelated events → Level 1', () => {
    const events = [
      { name: 'some.unknown.event', ts: Date.now() },
      { name: 'another.event', ts: Date.now() },
    ];
    expect(computeCapabilityLevel(events)).toBe(1);
  });

  it('Is deterministic — same events same order → same level', () => {
    const events = [{ name: 'class.first_student_added', ts: 1000 }];
    expect(computeCapabilityLevel(events)).toBe(computeCapabilityLevel(events));
  });
});

// ── isFeatureAvailable (FeatureGate) ──────────────────────────────────────────

describe('isFeatureAvailable', () => {
  it('ADD_STUDENT available at every level', () => {
    expect(isFeatureAvailable('ADD_STUDENT', 1)).toBe(true);
    expect(isFeatureAvailable('ADD_STUDENT', 2)).toBe(true);
    expect(isFeatureAvailable('ADD_STUDENT', 3)).toBe(true);
    expect(isFeatureAvailable('ADD_STUDENT', 4)).toBe(true);
  });

  it('BOOK_INTEGRATION only available at Level 4', () => {
    expect(isFeatureAvailable('BOOK_INTEGRATION', 1)).toBe(false);
    expect(isFeatureAvailable('BOOK_INTEGRATION', 2)).toBe(false);
    expect(isFeatureAvailable('BOOK_INTEGRATION', 3)).toBe(false);
    expect(isFeatureAvailable('BOOK_INTEGRATION', 4)).toBe(true);
  });

  it('ARTISTIC_TOOLS available at Level 3 and 4', () => {
    expect(isFeatureAvailable('ARTISTIC_TOOLS', 1)).toBe(false);
    expect(isFeatureAvailable('ARTISTIC_TOOLS', 2)).toBe(false);
    expect(isFeatureAvailable('ARTISTIC_TOOLS', 3)).toBe(true);
    expect(isFeatureAvailable('ARTISTIC_TOOLS', 4)).toBe(true);
  });

  it('CREATE_UDA unavailable at Levels 1 and 2', () => {
    expect(isFeatureAvailable('CREATE_UDA', 1)).toBe(false);
    expect(isFeatureAvailable('CREATE_UDA', 2)).toBe(false);
  });
});

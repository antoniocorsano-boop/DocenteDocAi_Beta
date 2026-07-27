// @ts-nocheck
/**
 * getNextAction.test.ts — Unit tests for the Decision Engine.
 *
 * Verifies:
 *  1. Rule ordering: L1 rules fire before L2, L2 before L3…
 *  2. Each rule is satisfied by its specific precondition
 *  3. Fallback (DISCOVERY_ACTION) when all rules pass
 *  4. Output shape is always a valid NextAction
 *  5. Pure function guarantees (same input → same output)
 */

import { describe, it, expect } from 'vitest';
import { getNextAction } from '../../src/cognition/decisionEngine/getNextAction';
import type { NextActionContext } from '../../src/cognition/decisionEngine/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Fully satisfied context — no rules should fire, hits DISCOVERY fallback */
const COMPLETE_CTX: NextActionContext = {
  eventNames: new Set([
    'class.first_student_added',
    'lesson.created',
    'copilot.manual_prompt',
    'uda.created',
    'drive.connected',
    'annual.plan.created',
    'analytics.viewed',
    'book.account.linked',
    'copilot.automation.enabled',
  ]),
  capabilityLevel: 4,
  usage: {
    lessonsCreated: 5,
    udaCreated: 3,
    copilotRequests: 10,
    driveConnected: true,
    bookServicesLinked: 1,
    analyticsViews: 3,
    workspaceConfigured: true,
  },
  hasStudents: true,
};

function ctx(overrides: Partial<NextActionContext> = {}): NextActionContext {
  return { ...COMPLETE_CTX, ...overrides };
}

function usageWith(overrides: Partial<NextActionContext['usage']>): NextActionContext['usage'] {
  return { ...COMPLETE_CTX.usage, ...overrides };
}

// ── Output shape ──────────────────────────────────────────────────────────────

describe('getNextAction — output shape', () => {
  it('always returns a NextAction with required fields', () => {
    const action = getNextAction(ctx());
    expect(action.id).toBeTruthy();
    expect(action.label).toBeTruthy();
    expect(action.description).toBeTruthy();
    expect(action.cta).toBeTruthy();
    expect(action.reason).toBeTruthy();
    expect(action.icon).toBeTruthy();
  });

  it('never throws', () => {
    expect(() => getNextAction(ctx())).not.toThrow();
  });

  it('is deterministic — same input yields same output', () => {
    const a = getNextAction(ctx());
    const b = getNextAction(ctx());
    expect(a.id).toBe(b.id);
  });
});

// ── L1 rules ─────────────────────────────────────────────────────────────────

describe('getNextAction — L1 rules', () => {
  it('L1-1: no students → da-add-first-student', () => {
    const action = getNextAction(ctx({
      hasStudents: false,
      usage: usageWith({ workspaceConfigured: false }),
    }));
    expect(action.id).toBe('da-add-first-student');
  });

  it('L1-1: no students but workspace configured → skips to next rule', () => {
    const action = getNextAction(ctx({
      hasStudents: false,
      usage: usageWith({ workspaceConfigured: true, lessonsCreated: 0 }),
    }));
    // L1-1 skipped (workspaceConfigured=true), falls through to L1-2 (lessonsCreated < 3)
    expect(action.id).toBe('da-create-lesson');
  });

  it('L1-2: < 3 lessons → da-create-lesson', () => {
    const action = getNextAction(ctx({
      usage: usageWith({ lessonsCreated: 1 }),
    }));
    expect(action.id).toBe('da-create-lesson');
  });

  it('L1-2: exactly 0 lessons → da-create-lesson', () => {
    const action = getNextAction(ctx({
      usage: usageWith({ lessonsCreated: 0 }),
    }));
    expect(action.id).toBe('da-create-lesson');
  });

  it('L1-2: exactly 3 lessons → does NOT fire L1-2', () => {
    const action = getNextAction(ctx({
      usage: usageWith({ lessonsCreated: 3, copilotRequests: 0 }),
      capabilityLevel: 1,
    }));
    // L1-2 satisfied (>=3 lessons), L1-3 fires (copilotRequests=0 at level 1)
    expect(action.id).toBe('da-discover-copilot');
  });

  it('L1-3: copilot never used at level 1 → da-discover-copilot', () => {
    const action = getNextAction(ctx({
      usage: usageWith({ copilotRequests: 0 }),
      capabilityLevel: 1,
    }));
    expect(action.id).toBe('da-discover-copilot');
  });

  it('L1-3: copilot already used → does NOT fire L1-3', () => {
    const action = getNextAction(ctx({
      usage: usageWith({ copilotRequests: 3 }),
      capabilityLevel: 1,
    }));
    // At level 1 all L1 rules pass → hits L2 rule but level < 2 → DISCOVERY
    expect(action.id).toBe('da-explore');
  });
});

// ── L2 rules ─────────────────────────────────────────────────────────────────

describe('getNextAction — L2 rules', () => {
  it('L2-1: level 2, no UDA → da-create-uda', () => {
    const action = getNextAction(ctx({
      capabilityLevel: 2,
      usage: usageWith({ udaCreated: 0 }),
    }));
    expect(action.id).toBe('da-create-uda');
  });

  it('L2-1: level 1 → does NOT fire L2-1', () => {
    const action = getNextAction(ctx({
      capabilityLevel: 1,
      usage: usageWith({ udaCreated: 0, copilotRequests: 5, lessonsCreated: 5 }),
    }));
    // L2-1 requires capabilityLevel >= 2
    expect(action.id).toBe('da-explore');
  });

  it('L2-2: level 2, drive not connected → da-connect-drive', () => {
    const action = getNextAction(ctx({
      capabilityLevel: 2,
      eventNames: new Set(), // no drive.connected
      usage: usageWith({ driveConnected: false }),
    }));
    expect(action.id).toBe('da-connect-drive');
  });

  it('L2-3: level 2, drive ok, no annual plan → da-annual-plan', () => {
    const action = getNextAction(ctx({
      capabilityLevel: 2,
      eventNames: new Set(['drive.connected']), // has drive but not annual.plan
      usage: usageWith({ driveConnected: true }),
    }));
    expect(action.id).toBe('da-annual-plan');
  });
});

// ── L3 rules ─────────────────────────────────────────────────────────────────

describe('getNextAction — L3 rules', () => {
  it('L3-1: level 3, no analytics → da-view-analytics', () => {
    const action = getNextAction(ctx({
      capabilityLevel: 3,
      usage: usageWith({ analyticsViews: 0 }),
    }));
    expect(action.id).toBe('da-view-analytics');
  });

  it('L3-2: level 3, no book linked → da-link-book', () => {
    const action = getNextAction(ctx({
      capabilityLevel: 3,
      usage: usageWith({ bookServicesLinked: 0, analyticsViews: 5 }),
    }));
    expect(action.id).toBe('da-link-book');
  });

  it('L3: level 2 → does NOT fire L3 rules', () => {
    const action = getNextAction(ctx({
      capabilityLevel: 2,
      usage: usageWith({ analyticsViews: 0 }),
    }));
    // L3 rules require capabilityLevel >= 3
    expect(['da-create-uda', 'da-connect-drive', 'da-annual-plan', 'da-explore']).toContain(action.id);
  });
});

// ── L4 rules ─────────────────────────────────────────────────────────────────

describe('getNextAction — L4 rules', () => {
  it('L4-1: level 4, automation not enabled → da-enable-automation', () => {
    const action = getNextAction(ctx({
      capabilityLevel: 4,
      eventNames: new Set([ // all other events present but NOT automation
        'class.first_student_added',
        'lesson.created',
        'copilot.manual_prompt',
        'uda.created',
        'drive.connected',
        'annual.plan.created',
        'analytics.viewed',
        'book.account.linked',
      ]),
    }));
    expect(action.id).toBe('da-enable-automation');
  });
});

// ── Fallback (DISCOVERY) ─────────────────────────────────────────────────────

describe('getNextAction — fallback', () => {
  it('all rules satisfied → da-explore (discovery)', () => {
    const action = getNextAction(COMPLETE_CTX);
    expect(action.id).toBe('da-explore');
  });

  it('discovery action has icon, cta, targetView', () => {
    const action = getNextAction(COMPLETE_CTX);
    expect(action.icon).toBeTruthy();
    expect(action.cta).toBeTruthy();
    expect(action.targetView).toBeTruthy();
  });
});

// ── Rule priority / ordering ──────────────────────────────────────────────────

describe('getNextAction — rule priority', () => {
  it('L1 rules take precedence over L2 even when L2 conditions also apply', () => {
    const action = getNextAction(ctx({
      capabilityLevel: 2,
      usage: usageWith({ lessonsCreated: 0, udaCreated: 0 }),
    }));
    // L1-2 fires first (lessonsCreated < 3), not L2-1 (no UDA)
    expect(action.id).toBe('da-create-lesson');
  });

  it('L2 rules take precedence over L3 even when L3 also applies', () => {
    const action = getNextAction(ctx({
      capabilityLevel: 3,
      usage: usageWith({ udaCreated: 0, analyticsViews: 0 }),
    }));
    // L2-1 fires first (no UDA), not L3-1 (no analytics)
    expect(action.id).toBe('da-create-uda');
  });
});

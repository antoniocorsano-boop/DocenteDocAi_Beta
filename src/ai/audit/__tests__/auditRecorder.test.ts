/**
 * auditRecorder.test.ts — Unit tests for the AI Audit Trail system
 *
 * Covers:
 *   - createAuditTrail, recordAuditStep, finishAuditTrail (auditRecorder)
 *   - pushAudit, getAuditHistory, getLastAudit, clearAuditHistory (auditTrail)
 *   - Integration with runAIAnalysis — audit produced on each call
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createAuditTrail, recordAuditStep, finishAuditTrail } from '../auditRecorder';
import { pushAudit, getAuditHistory, getLastAudit, clearAuditHistory } from '../auditTrail';
import type { AIAuditTrail } from '../auditTypes';
import { runAIAnalysis } from '../../engine/aiEngine';
import { buildAIContext } from '../../contextEngine/contextBuilder';
import { fixtureStudents, fixtureEvaluations } from '../../../fixtures/realisticClassData';
import { clearCache, buildContextHash } from '../../cache/aiCache';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeTrail(cacheHit = false, steps = 2): AIAuditTrail {
  const audit = createAuditTrail('hash-test');
  for (let i = 0; i < steps; i++) {
    recordAuditStep(audit, `step${i}`, 1.5 + i, `input${i}`, `output${i}`);
  }
  return finishAuditTrail(audit, cacheHit);
}

// ── createAuditTrail ──────────────────────────────────────────────────────────

describe('createAuditTrail', () => {
  it('returns an ActiveAudit with the supplied contextHash', () => {
    const a = createAuditTrail('ctx-abc');
    expect(a.contextHash).toBe('ctx-abc');
  });

  it('starts with an empty steps array', () => {
    const a = createAuditTrail('x');
    expect(a.steps).toHaveLength(0);
  });

  it('id begins with "audit-"', () => {
    const a = createAuditTrail('x');
    expect(a.id).toMatch(/^audit-/);
  });

  it('startedAt is a valid ISO string', () => {
    const a = createAuditTrail('x');
    expect(() => new Date(a.startedAt)).not.toThrow();
    expect(new Date(a.startedAt).toISOString()).toBe(a.startedAt);
  });
});

// ── recordAuditStep ───────────────────────────────────────────────────────────

describe('recordAuditStep', () => {
  it('appends a step with the correct name', () => {
    const a = createAuditTrail('h');
    recordAuditStep(a, 'riskAnalyzer', 3.14);
    expect(a.steps).toHaveLength(1);
    expect(a.steps[0].name).toBe('riskAnalyzer');
  });

  it('rounds durationMs to 2 decimal places', () => {
    const a = createAuditTrail('h');
    recordAuditStep(a, 'x', 1.23456789);
    expect(a.steps[0].durationMs).toBe(1.23);
  });

  it('stores optional inputSummary and outputSummary when provided', () => {
    const a = createAuditTrail('h');
    recordAuditStep(a, 'x', 1, 'in-data', 'out-data');
    expect(a.steps[0].inputSummary).toBe('in-data');
    expect(a.steps[0].outputSummary).toBe('out-data');
  });

  it('omits inputSummary and outputSummary when not provided', () => {
    const a = createAuditTrail('h');
    recordAuditStep(a, 'x', 1);
    expect('inputSummary' in a.steps[0]).toBe(false);
    expect('outputSummary' in a.steps[0]).toBe(false);
  });

  it('completedAt is a valid ISO string', () => {
    const a = createAuditTrail('h');
    recordAuditStep(a, 'x', 1);
    expect(() => new Date(a.steps[0].completedAt)).not.toThrow();
  });

  it('accumulates multiple steps in order', () => {
    const a = createAuditTrail('h');
    recordAuditStep(a, 'alpha', 1);
    recordAuditStep(a, 'beta', 2);
    recordAuditStep(a, 'gamma', 3);
    expect(a.steps.map((s) => s.name)).toEqual(['alpha', 'beta', 'gamma']);
  });
});

// ── finishAuditTrail ──────────────────────────────────────────────────────────

describe('finishAuditTrail', () => {
  it('preserves id, startedAt and contextHash', () => {
    const a = createAuditTrail('ctx-xyz');
    const trail = finishAuditTrail(a, false);
    expect(trail.id).toBe(a.id);
    expect(trail.startedAt).toBe(a.startedAt);
    expect(trail.contextHash).toBe('ctx-xyz');
  });

  it('sets cacheHit correctly for non-cached run', () => {
    expect(makeTrail(false).cacheHit).toBe(false);
  });

  it('sets cacheHit correctly for cached run', () => {
    expect(makeTrail(true).cacheHit).toBe(true);
  });

  it('copies all recorded steps into the sealed trail', () => {
    const trail = makeTrail(false, 3);
    expect(trail.steps).toHaveLength(3);
    expect(trail.steps[0].name).toBe('step0');
    expect(trail.steps[2].name).toBe('step2');
  });

  it('totalMs is a non-negative number', () => {
    const trail = makeTrail(false);
    expect(trail.totalMs).toBeGreaterThanOrEqual(0);
  });

  it('finishedAt is a valid ISO string after startedAt', () => {
    const trail = makeTrail(false);
    const start = new Date(trail.startedAt).getTime();
    const finish = new Date(trail.finishedAt).getTime();
    expect(finish).toBeGreaterThanOrEqual(start);
  });

  it('the returned steps array is a copy — mutating builder does not affect it', () => {
    const a = createAuditTrail('h');
    recordAuditStep(a, 'alpha', 1);
    const trail = finishAuditTrail(a, false);
    // Mutate the builder after finalization — trail must be unaffected
    a.steps.push({ name: 'injected', durationMs: 0, completedAt: '' });
    expect(trail.steps).toHaveLength(1);
  });
});

// ── auditTrail history store ──────────────────────────────────────────────────

describe('auditTrail history', () => {
  beforeEach(() => clearAuditHistory());

  it('getAuditHistory returns empty array initially', () => {
    expect(getAuditHistory()).toHaveLength(0);
  });

  it('getLastAudit returns null when history is empty', () => {
    expect(getLastAudit()).toBeNull();
  });

  it('pushAudit adds an entry to history', () => {
    const trail = makeTrail();
    pushAudit(trail);
    expect(getAuditHistory()).toHaveLength(1);
  });

  it('getLastAudit returns the most recently pushed trail', () => {
    const t1 = makeTrail(false, 1);
    const t2 = makeTrail(false, 2);
    pushAudit(t1);
    pushAudit(t2);
    expect(getLastAudit()).toBe(t2);
  });

  it('history is ordered oldest first', () => {
    const t1 = makeTrail(false, 1);
    const t2 = makeTrail(false, 2);
    pushAudit(t1);
    pushAudit(t2);
    const h = getAuditHistory();
    expect(h[0]).toBe(t1);
    expect(h[1]).toBe(t2);
  });

  it('clearAuditHistory empties the buffer', () => {
    pushAudit(makeTrail());
    pushAudit(makeTrail());
    clearAuditHistory();
    expect(getAuditHistory()).toHaveLength(0);
    expect(getLastAudit()).toBeNull();
  });

  it('getAuditHistory returns a snapshot — external mutation does not corrupt the buffer', () => {
    pushAudit(makeTrail());
    const snapshot = getAuditHistory() as AIAuditTrail[];
    snapshot.push(makeTrail());
    // The internal buffer should still have only 1 entry
    expect(getAuditHistory()).toHaveLength(1);
  });

  it('circular buffer evicts oldest entry after 50 records', () => {
    for (let i = 0; i < 51; i++) {
      pushAudit({ ...makeTrail(), id: `audit-${i}` });
    }
    // Max is 50 — oldest (audit-0) should be gone
    expect(getAuditHistory()).toHaveLength(50);
    expect(getAuditHistory()[0].id).toBe('audit-1');
  });
});

// ── integration with runAIAnalysis ────────────────────────────────────────────

describe('runAIAnalysis — audit trail integration', () => {
  beforeEach(() => {
    clearAuditHistory();
    clearCache();
  });

  it('produces an audit trail after a fresh analysis run', () => {
    const ctx = buildAIContext(fixtureStudents['3A'], [], fixtureEvaluations['3A']);
    runAIAnalysis(ctx);
    expect(getLastAudit()).not.toBeNull();
  });

  it('non-cached audit records 4 steps (classHealth, risk, excellence, trend)', () => {
    const ctx = buildAIContext(fixtureStudents['3A'], [], fixtureEvaluations['3A']);
    runAIAnalysis(ctx);
    const audit = getLastAudit()!;
    expect(audit.cacheHit).toBe(false);
    expect(audit.steps).toHaveLength(4);
    const names = audit.steps.map((s) => s.name);
    expect(names).toContain('classHealthIndex');
    expect(names).toContain('riskAnalyzer');
    expect(names).toContain('excellenceAnalyzer');
    expect(names).toContain('trendEngine');
  });

  it('cached audit has cacheHit=true and zero steps', () => {
    const ctx = buildAIContext(fixtureStudents['3A'], [], fixtureEvaluations['3A']);
    runAIAnalysis(ctx); // warms cache
    clearAuditHistory();
    runAIAnalysis(ctx); // served from cache
    const audit = getLastAudit()!;
    expect(audit.cacheHit).toBe(true);
    expect(audit.steps).toHaveLength(0);
  });

  it('audit contextHash matches the cache hash for the same context', () => {
    const ctx = buildAIContext(fixtureStudents['3A'], [], fixtureEvaluations['3A']);
    runAIAnalysis(ctx);
    const audit = getLastAudit()!;
    expect(audit.contextHash).toBe(buildContextHash(ctx));
  });

  it('all step durationMs values are non-negative', () => {
    const ctx = buildAIContext(fixtureStudents['3A'], [], fixtureEvaluations['3A']);
    runAIAnalysis(ctx);
    for (const step of getLastAudit()!.steps) {
      expect(step.durationMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('each step has an outputSummary containing a count or value', () => {
    const ctx = buildAIContext(fixtureStudents['3A'], [], fixtureEvaluations['3A']);
    runAIAnalysis(ctx);
    for (const step of getLastAudit()!.steps) {
      expect(typeof step.outputSummary).toBe('string');
      expect((step.outputSummary ?? '').length).toBeGreaterThan(0);
    }
  });
});

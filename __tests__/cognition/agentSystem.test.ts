/**
 * agentSystem.test.ts — Unit tests for the Agent System (6 pure agents + orchestrator).
 *
 * Each agent is a pure function: (AgentContext) => AgentSuggestion[].
 * No mocks needed for the agents themselves — context is constructed inline.
 */

import { describe, it, expect } from 'vitest';

import { runRegulatoryAgent }        from '../../src/cognition/agents/regulatoryAgent';
import { runFinancialAgent }          from '../../src/cognition/agents/financialAgent';
import { runIntegrationAgent }        from '../../src/cognition/agents/integrationAgent';
import { runOnboardingAgent }         from '../../src/cognition/agents/onboardingAgent';
import { runAnalyticsAgent }          from '../../src/cognition/agents/analyticsAgent';
import { runAllAgents }               from '../../src/cognition/agents/agentOrchestrator';
import type { AgentContext }          from '../../src/cognition/agents/types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<AgentContext> = {}): AgentContext {
  return {
    capabilityLevel: 1,
    students: [],
    evaluations: [],
    uda: [],
    lessons: [],
    integrations: [],
    analyticsMetrics: {
      totalDocumentsGenerated: 0,
      documentsByType: {},
      featuresUsage: {},
      templatesCreated: 0,
      exportBatchesCount: 0,
      aiInteractionsCount: 0,
      averageSessionDuration: 0,
      lastUpdated: new Date().toISOString(),
    },
    user: null,
    recentEventCount: 0,
    ...overrides,
  };
}

const STUDENT = {
  id: 's1',
  nome: 'Mario',
  cognome: 'Rossi',
  classe: '3A',
  isArchived: false,
};

const STUDENT_NO_COGNOME = {
  id: 's2',
  nome: 'Lucia',
  cognome: '',
  classe: '3A',
  isArchived: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// RegulatoryAgent
// ─────────────────────────────────────────────────────────────────────────────

describe('RegulatoryAgent', () => {
  it('returns empty list when no students', () => {
    const result = runRegulatoryAgent(makeCtx());
    expect(result).toHaveLength(0);
  });

  it('R1: suggests recording evaluations when L2+ and students exist with no evals', () => {
    const ctx = makeCtx({ capabilityLevel: 2, students: [STUDENT] });
    const result = runRegulatoryAgent(ctx);
    const ids = result.map((s) => s.id);
    expect(ids).toContain('reg-missing-evaluations');
  });

  it('R1: does NOT fire at L1', () => {
    const ctx = makeCtx({ capabilityLevel: 1, students: [STUDENT] });
    const result = runRegulatoryAgent(ctx);
    expect(result.map((s) => s.id)).not.toContain('reg-missing-evaluations');
  });

  it('R2: suggests completing profiles when cognome is missing', () => {
    const ctx = makeCtx({ capabilityLevel: 1, students: [STUDENT_NO_COGNOME] });
    const result = runRegulatoryAgent(ctx);
    expect(result.map((s) => s.id)).toContain('reg-incomplete-profiles');
  });

  it('R2: skips complete profiles', () => {
    const ctx = makeCtx({ capabilityLevel: 1, students: [STUDENT] });
    expect(runRegulatoryAgent(ctx).map((s) => s.id)).not.toContain('reg-incomplete-profiles');
  });

  it('R1 does not fire when evaluations already exist', () => {
    const ctx = makeCtx({
      capabilityLevel: 2,
      students: [STUDENT],
      evaluations: [{ id: 'e1' } as never],
    });
    expect(runRegulatoryAgent(ctx).map((s) => s.id)).not.toContain('reg-missing-evaluations');
  });

  it('all suggestions have required fields', () => {
    const ctx = makeCtx({ capabilityLevel: 2, students: [STUDENT_NO_COGNOME] });
    for (const sug of runRegulatoryAgent(ctx)) {
      expect(sug.id).toBeTruthy();
      expect(sug.label).toBeTruthy();
      expect(sug.description).toBeTruthy();
      expect(sug.reason).toBeTruthy();
      expect(sug.actionKey).toBeTruthy();
      expect(typeof sug.priority).toBe('number');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FinancialAgent
// ─────────────────────────────────────────────────────────────────────────────

describe('FinancialAgent', () => {
  it('returns empty list at L1', () => {
    expect(runFinancialAgent(makeCtx({ capabilityLevel: 1 }))).toHaveLength(0);
  });

  it('F1: suggests analytics when evaluation density is high and analytics not visited', () => {
    const evals = Array.from({ length: 10 }, (_, i) => ({ id: `e${i}` }));
    const ctx = makeCtx({
      capabilityLevel: 2,
      students: [STUDENT],
      evaluations: evals as never[],
    });
    const result = runFinancialAgent(ctx);
    expect(result.map((s) => s.id)).toContain('fin-unlock-analytics');
  });

  it('F1: does NOT fire when analytics already visited', () => {
    const evals = Array.from({ length: 10 }, (_, i) => ({ id: `e${i}` }));
    const ctx = makeCtx({
      capabilityLevel: 2,
      students: [STUDENT],
      evaluations: evals as never[],
      analyticsMetrics: {
        totalDocumentsGenerated: 0,
        documentsByType: {},
        featuresUsage: { analytics: 3 },
        templatesCreated: 0,
        exportBatchesCount: 0,
        aiInteractionsCount: 0,
        averageSessionDuration: 0,
        lastUpdated: new Date().toISOString(),
      },
    });
    expect(runFinancialAgent(ctx).map((s) => s.id)).not.toContain('fin-unlock-analytics');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// IntegrationAgent
// ─────────────────────────────────────────────────────────────────────────────

describe('IntegrationAgent', () => {
  it('returns empty when no data and no integrations', () => {
    expect(runIntegrationAgent(makeCtx())).toHaveLength(0);
  });

  it('I1: suggests Drive backup when students exist and Drive not connected', () => {
    // Drive integration absent (not in ctx.integrations) → status !== 'connected'
    const ctx = makeCtx({ students: [STUDENT] });
    const result = runIntegrationAgent(ctx);
    expect(result.map((s) => s.id)).toContain('int-connect-drive');
  });

  it('I1: does NOT fire when Drive already connected', () => {
    const ctx = makeCtx({
      students: [STUDENT],
      integrations: [{ id: 'google_drive', status: 'connected' } as never],
    });
    expect(runIntegrationAgent(ctx).map((s) => s.id)).not.toContain('int-connect-drive');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// OnboardingAgent
// ─────────────────────────────────────────────────────────────────────────────

describe('OnboardingAgent', () => {
  it('always returns exactly one suggestion (next milestone)', () => {
    const result = runOnboardingAgent(makeCtx());
    expect(result).toHaveLength(1);
  });

  it('first milestone: complete profile when user has no displayName', () => {
    const ctx = makeCtx({ user: null });
    const [sug] = runOnboardingAgent(ctx);
    expect(sug.id).toBe('ob-profile');
  });

  it('second milestone: add first class when profile done but no students', () => {
    const ctx = makeCtx({
      user: { id: 'u1', displayName: 'Prof. Bianchi' },
      students: [],
    });
    const [sug] = runOnboardingAgent(ctx);
    expect(sug.id).toBe('ob-first-class');
  });

  it('third milestone: create first lesson when students exist but no lessons', () => {
    const ctx = makeCtx({
      user: { id: 'u1', displayName: 'Prof. Bianchi' },
      students: [STUDENT],
      lessons: [],
    });
    const [sug] = runOnboardingAgent(ctx);
    expect(sug.id).toBe('ob-first-lesson');
  });

  it('fourth milestone: create UDA when profile + students + lessons but no UDA', () => {
    const ctx = makeCtx({
      user: { id: 'u1', displayName: 'Prof. Bianchi' },
      students: [STUDENT],
      lessons: [{ id: 'l1' } as never],
      uda: [],
    });
    const [sug] = runOnboardingAgent(ctx);
    expect(sug.id).toBe('ob-first-uda');
  });

  it('returns empty when all milestones complete', () => {
    const ctx = makeCtx({
      user: { id: 'u1', displayName: 'Prof. Bianchi' },
      students: [STUDENT],
      lessons: [{ id: 'l1' } as never],
      uda: [{ id: 'u1' } as never],
    });
    expect(runOnboardingAgent(ctx)).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AnalyticsAgent
// ─────────────────────────────────────────────────────────────────────────────

describe('AnalyticsAgent', () => {
  it('returns empty at L1', () => {
    expect(runAnalyticsAgent(makeCtx({ capabilityLevel: 1 }))).toHaveLength(0);
  });

  it('A1: suggests first analytics visit when data-rich and never visited', () => {
    // totalFeatureUses >= 10 via non-analytics usage, evaluations.length >= 3, analytics never visited
    const ctx = makeCtx({
      capabilityLevel: 2,
      evaluations: Array.from({ length: 3 }, (_, i) => ({ id: `e${i}` })) as never[],
      analyticsMetrics: {
        totalDocumentsGenerated: 0,
        documentsByType: {},
        featuresUsage: { classroom: 6, planning: 5 }, // total=11, analytics absent=0
        templatesCreated: 0,
        exportBatchesCount: 0,
        aiInteractionsCount: 0,
        averageSessionDuration: 0,
        lastUpdated: new Date().toISOString(),
      },
    });
    expect(runAnalyticsAgent(ctx).map((s) => s.id)).toContain('an-first-visit');
  });

  it('A3: suggests weekly review when recentEventCount >= 8 at L2+', () => {
    const ctx = makeCtx({ capabilityLevel: 2, recentEventCount: 10 });
    expect(runAnalyticsAgent(ctx).map((s) => s.id)).toContain('an-weekly-review');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AgentOrchestrator (runAllAgents)
// ─────────────────────────────────────────────────────────────────────────────

describe('AgentOrchestrator', () => {
  it('returns at most 4 suggestions', () => {
    // Rich context to maximise agent output
    const ctx = makeCtx({
      capabilityLevel: 2,
      students: [STUDENT_NO_COGNOME],
      evaluations: [],
      recentEventCount: 10,
    });
    const result = runAllAgents(ctx);
    expect(result.length).toBeLessThanOrEqual(4);
  });

  it('deduplicates by actionKey', () => {
    const ctx = makeCtx({
      capabilityLevel: 2,
      students: [STUDENT_NO_COGNOME],
      evaluations: [],
    });
    const result = runAllAgents(ctx);
    const keys = result.map((s) => s.actionKey);
    const unique = new Set(keys);
    expect(keys.length).toBe(unique.size);
  });

  it('sorts by priority descending', () => {
    const ctx = makeCtx({ capabilityLevel: 2, students: [STUDENT], recentEventCount: 10 });
    const result = runAllAgents(ctx);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].priority).toBeGreaterThanOrEqual(result[i].priority);
    }
  });

  it('onboarding takes priority when profile is incomplete', () => {
    const ctx = makeCtx({ user: null });
    const result = runAllAgents(ctx);
    expect(result[0]?.id).toBe('ob-profile');
  });

  it('all returned suggestions have required fields', () => {
    const ctx = makeCtx({ capabilityLevel: 2, students: [STUDENT], recentEventCount: 10 });
    for (const sug of runAllAgents(ctx)) {
      expect(sug.id).toBeTruthy();
      expect(sug.label).toBeTruthy();
      expect(sug.actionKey).toBeTruthy();
      expect(typeof sug.priority).toBe('number');
      expect(sug.agentId).toBeTruthy();
    }
  });
});

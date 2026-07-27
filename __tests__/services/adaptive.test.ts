// @vitest-environment node
/**
 * __tests__/services/adaptive.test.ts — P34 Adaptive Intelligence Layer
 *
 * Server-side unit tests for services/adaptive.ts
 *
 * Mocked dependencies:
 *   pg Pool             → individual query mocks per test
 *   ../logger           → silenced
 *   ../services/ranking → temporalDecay returns fixed value
 *
 * Cases covered:
 *   1. logAgentOutcome  — with pool (DB insert)
 *   2. logAgentOutcome  — without pool (in-memory fallback, no throw)
 *   3. updateAgentScore — computes score and executes UPSERT
 *   4. updateAgentScore — no outcomes → early return, no UPSERT
 *   5. getAgentScores   — returns mapped AgentScore array
 *   6. getAgentScores   — without pool → synthesises from in-memory fallback
 *   7. Scoring formula  — verifies α/β/γ weights produce correct score range
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks (hoisted) ───────────────────────────────────────────────────────────

vi.mock('../../../server/src/logger', () => ({
  logger: {
    info:  vi.fn(),
    warn:  vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const { mockTemporalDecay } = vi.hoisted(() => ({
  mockTemporalDecay: vi.fn(() => 0.8),
}));

vi.mock('../../../server/src/services/ranking', () => ({
  // Fixed decay value so score assertions are deterministic
  temporalDecay: mockTemporalDecay,
}));

// ── Pg Pool factory helpers ───────────────────────────────────────────────────

function makePool(queryImpl: (sql: string, params?: unknown[]) => { rows: unknown[] }) {
  return { query: vi.fn(queryImpl) };
}

// ── Subjects under test (imported AFTER mocks) ────────────────────────────────

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — server/ is excluded from the client tsconfig; Vitest resolves this correctly at runtime
import { logAgentOutcome, updateAgentScore, getAgentScores } from '../../../server/src/services/adaptive';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('adaptive service', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─────────────────────────────────────────────────────────────────────────
  // 1. logAgentOutcome — with pool
  // ─────────────────────────────────────────────────────────────────────────
  it('inserts a row when pool is available', async () => {
    const pool = makePool(() => ({ rows: [] }));

    await logAgentOutcome(pool as never, {
      agentId:    'agent.cognitive',
      input:      { q: 'hello' },
      output:     { text: 'world' },
      success:    true,
      tokensUsed: 42,
    });

    expect(pool.query).toHaveBeenCalledOnce();
    const [sql, params] = pool.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('INSERT INTO agent_outcomes');
    expect(params[0]).toBe('agent.cognitive');
    expect(params[3]).toBe(true);   // success
    expect(params[4]).toBe(42);     // tokens_used
    expect(params[5]).toBeNull();   // cosine_score defaults to null
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. logAgentOutcome — no pool (in-memory, no throw)
  // ─────────────────────────────────────────────────────────────────────────
  it('does not throw when pool is null', async () => {
    await expect(
      logAgentOutcome(null, {
        agentId:    'agent.compliance',
        input:      'test',
        output:     'ok',
        success:    true,
        tokensUsed: 5,
      }),
    ).resolves.toBeUndefined();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. updateAgentScore — normal path
  // ─────────────────────────────────────────────────────────────────────────
  it('computes score and UPSERTs agent_scores', async () => {
    const fakeRows = [
      { success: true,  cosine_score: 0.9, created_at: new Date() },
      { success: true,  cosine_score: 0.7, created_at: new Date() },
      { success: false, cosine_score: null, created_at: new Date() },
    ];

    let callCount = 0;
    const pool = makePool(() => {
      callCount++;
      if (callCount === 1) return { rows: fakeRows }; // SELECT call
      return { rows: [] };                              // INSERT/UPSERT call
    });

    await updateAgentScore(pool as never, 'agent.cognitive');

    // First call = SELECT, second call = UPSERT
    expect(pool.query).toHaveBeenCalledTimes(2);
    const [upsertSql, upsertParams] = pool.query.mock.calls[1] as [string, number[]];
    expect(upsertSql).toContain('INSERT INTO agent_scores');
    expect(upsertSql).toContain('ON CONFLICT');

    // score must be in [0, 1]
    const score       = upsertParams[1] as number;
    const reliability = upsertParams[2] as number;
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
    expect(reliability).toBeGreaterThanOrEqual(0);
    expect(reliability).toBeLessThanOrEqual(1);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. updateAgentScore — no outcomes → early return
  // ─────────────────────────────────────────────────────────────────────────
  it('does not UPSERT when there are no outcomes for the agent', async () => {
    const pool = makePool(() => ({ rows: [] }));

    await updateAgentScore(pool as never, 'agent.unknown');

    // Only one query (the SELECT), no UPSERT
    expect(pool.query).toHaveBeenCalledOnce();
    const [sql] = pool.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('SELECT');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 5. getAgentScores — with pool
  // ─────────────────────────────────────────────────────────────────────────
  it('maps DB rows to AgentScore objects', async () => {
    const now = new Date();
    const fakeRows = [
      { agent_id: 'agent.cognitive',  score: 0.88, reliability: 0.75, total_runs: 10, updated_at: now },
      { agent_id: 'agent.compliance', score: 0.60, reliability: 0.55, total_runs:  4, updated_at: now },
    ];
    const pool = makePool(() => ({ rows: fakeRows }));

    const scores = await getAgentScores(pool as never);

    expect(scores).toHaveLength(2);
    expect(scores[0]).toMatchObject({
      agentId:     'agent.cognitive',
      score:       0.88,
      reliability: 0.75,
      totalRuns:   10,
    });
    expect(typeof scores[0].updatedAt).toBe('string');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 6. getAgentScores — without pool
  // ─────────────────────────────────────────────────────────────────────────
  it('returns in-memory scores when pool is null (after successful logAgentOutcome)', async () => {
    // First log some outcomes in-memory
    await logAgentOutcome(null, { agentId: 'agent.test', input: null, output: null, success: true,  tokensUsed: 1 });
    await logAgentOutcome(null, { agentId: 'agent.test', input: null, output: null, success: false, tokensUsed: 1 });

    const scores = await getAgentScores(null);
    const testScore = scores.find((s: { agentId: string }) => s.agentId === 'agent.test');
    expect(testScore).toBeDefined();
    expect(testScore!.totalRuns).toBeGreaterThanOrEqual(2);
    // 1 success out of 2 = 0.5 success rate
    expect(testScore!.score).toBe(0.5);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 7. getAgentScores — DB error → returns []
  // ─────────────────────────────────────────────────────────────────────────
  it('returns empty array when DB query throws', async () => {
    const pool = { query: vi.fn().mockRejectedValue(new Error('DB down')) };

    const scores = await getAgentScores(pool as never);
    expect(scores).toEqual([]);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 8. Scoring formula: α=0.60 success_rate + β=0.20 avg_cosine + γ=0.20 recency
  // ─────────────────────────────────────────────────────────────────────────
  it('scoring formula stays within [0, 1] for extreme inputs', async () => {
    // Use rows exactly one half-life (7 days) old so temporalDecay returns
    // Math.exp(-ln2) = 0.5 exactly, without relying on a mock.
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const allSuccessRows = Array.from({ length: 5 }, () => ({
      success: true, cosine_score: 1.0, created_at: sevenDaysAgo,
    }));

    let callCount = 0;
    const pool = makePool(() => {
      callCount++;
      return { rows: callCount === 1 ? allSuccessRows : [] };
    });

    await updateAgentScore(pool as never, 'agent.perfect');
    const [, upsertParams] = pool.query.mock.calls[1] as [string, number[]];
    const score = upsertParams[1] as number;

    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
    // With success_rate=1, avg_cosine=1, recency=0.5 (age = one half-life = 7 days):
    //   score = 0.60 * 1 + 0.20 * 1 + 0.20 * 0.5 = 0.90
    expect(score).toBeCloseTo(0.90, 2);
  });
});

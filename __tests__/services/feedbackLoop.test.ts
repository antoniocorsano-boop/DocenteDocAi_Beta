/**
 * __tests__/services/feedbackLoop.test.ts — P35 feedbackLoop service
 *
 * @vitest-environment node
 *
 * Tests all exported helpers and async functions from the server-side
 * feedbackLoop service.  The Pool dependency is replaced by a simple
 * mock object that captures queries for introspection.
 *
 * Mocked dependencies:
 *   server/src/logger          → logger.info / .warn / .error silenced
 *   server/src/services/ranking → temporalDecay returns a fixed value
 */

// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../../server/src/logger', () => ({
  logger: {
    info:  vi.fn(),
    warn:  vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ── Import SUT (after mocks) ──────────────────────────────────────────────────

// @ts-ignore — server/ is outside the browser tsconfig
import { jaccardSimilarity, computeExtendedScore, applyLearningRate, isBetaUser, recordFeedback, getAdaptiveSummary, getAgentParams, getAllAgentParams, applyAdaptiveUpdate, rollbackAdaptiveUpdate, ROLLBACK_THRESHOLD, MAX_UPDATES_PER_DAY } from '../../../server/src/services/feedbackLoop';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a minimal mock Pool whose query() function can be pre-configured
 * per-test.  Each call pops from the `responses` queue.
 */
function buildMockPool(responses: Array<{ rows: unknown[] }> = []) {
  const calls: Array<[string, unknown[]]> = [];
  const pool = {
    _calls:     calls,
    _responses: [...responses],
    query: vi.fn(async (sql: string, params: unknown[] = []) => {
      calls.push([sql, params]);
      const next = pool._responses.shift();
      return next ?? { rows: [] };
    }),
  };
  return pool as unknown as import('pg').Pool & {
    _calls:     Array<[string, unknown[]]>;
    _responses: Array<{ rows: unknown[] }>;
    query:      ReturnType<typeof vi.fn>;
  };
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

describe('jaccardSimilarity', () => {
  it('returns correct overlap', () => {
    expect(jaccardSimilarity(['a', 'b'], ['b', 'c'])).toBeCloseTo(1 / 3);
  });

  it('returns 0 when no overlap', () => {
    expect(jaccardSimilarity(['a'], ['b'])).toBe(0);
  });

  it('returns 0 when either array is empty', () => {
    expect(jaccardSimilarity([], ['a'])).toBe(0);
    expect(jaccardSimilarity(['a'], [])).toBe(0);
  });
});

describe('computeExtendedScore', () => {
  it('applies extended weights: 0.60×success + 0.20×cosine + 0.10×recency + 0.10×tagRelevance', () => {
    // Use a very recent date so temporalDecay ≈ 1.0 (within last half-life).
    // 0.60×1 + 0.20×1 + ~0.10×1 + 0.10×0 ≈ 0.90
    const score = computeExtendedScore({
      successRate:  1,
      avgCosine:    1,
      mostRecentAt: new Date(),
      tagRelevance: 0,
    });
    expect(score).toBeGreaterThan(0.85);
    expect(score).toBeLessThanOrEqual(1.0);
  });
});

describe('applyLearningRate', () => {
  it('nudges numeric fields by lr * delta', () => {
    const result = applyLearningRate({ threshold: 0.5 }, { threshold: 1.0 }, 0.10);
    expect((result.threshold as number)).toBeCloseTo(0.55);
  });

  it('replaces non-numeric fields directly', () => {
    const result = applyLearningRate({ mode: 'fast' }, { mode: 'slow' }, 0.10);
    expect(result.mode).toBe('slow');
  });
});

describe('isBetaUser', () => {
  it('returns true for pro plan', () => {
    expect(isBetaUser('pro')).toBe(true);
  });

  it('returns false for free plan', () => {
    expect(isBetaUser('free')).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isBetaUser(undefined)).toBe(false);
  });
});

describe('ROLLBACK_THRESHOLD and MAX_UPDATES_PER_DAY constants', () => {
  it('ROLLBACK_THRESHOLD is 0.05', () => {
    expect(ROLLBACK_THRESHOLD).toBe(0.05);
  });

  it('MAX_UPDATES_PER_DAY is 3', () => {
    expect(MAX_UPDATES_PER_DAY).toBe(3);
  });
});

// ── recordFeedback ────────────────────────────────────────────────────────────

describe('recordFeedback', () => {
  it('inserts a row when pool is provided', async () => {
    const pool = buildMockPool([{ rows: [] }]);
    await recordFeedback(pool, { userId: 'u1', agentId: 'ag1', rating: 4 });
    expect(pool.query).toHaveBeenCalledOnce();
    const [sql, params] = pool._calls[0];
    expect(sql).toMatch(/INSERT INTO user_feedback/);
    expect(params).toContain('u1');
    expect(params).toContain('ag1');
    expect(params).toContain(4);
  });

  it('does not throw when pool is null', async () => {
    await expect(
      recordFeedback(null, { userId: 'u2', rating: 3 }),
    ).resolves.toBeUndefined();
  });
});

// ── getAdaptiveSummary ────────────────────────────────────────────────────────

describe('getAdaptiveSummary', () => {
  it('maps DB rows to AdaptiveSummary objects', async () => {
    const pool = buildMockPool([{
      rows: [{
        agent_id:     'ag1',
        avg_score:    '0.8',
        total_runs:   '10',
        avg_rating:   '4.5',
        last_updated: new Date('2025-01-01'),
      }],
    }]);
    const summary = await getAdaptiveSummary(pool);
    expect(summary).toHaveLength(1);
    expect(summary[0].agentId).toBe('ag1');
    expect(summary[0].avgScore).toBeCloseTo(0.8);
    expect(summary[0].avgRating).toBeCloseTo(4.5);
  });

  it('returns [] when query throws', async () => {
    const pool = buildMockPool();
    pool.query.mockRejectedValueOnce(new Error('db down'));
    const summary = await getAdaptiveSummary(pool);
    expect(summary).toEqual([]);
  });

  it('returns in-memory aggregation when pool is null', async () => {
    // First populate in-memory by calling recordFeedback(null, ...)
    await recordFeedback(null, { userId: 'u10', agentId: 'ag-mem', rating: 5 });
    const summary = await getAdaptiveSummary(null);
    const found = summary.find((s: { agentId: string; avgRating: number }) => s.agentId === 'ag-mem');
    expect(found).toBeDefined();
    expect(found!.avgRating).toBe(5);
  });
});

// ── getAgentParams ────────────────────────────────────────────────────────────

describe('getAgentParams', () => {
  it('returns params when row exists', async () => {
    const pool = buildMockPool([{ rows: [{ params: { threshold: 0.7 } }] }]);
    const p = await getAgentParams(pool, 'agX');
    expect(p).toEqual({ threshold: 0.7 });
  });

  it('returns {} when no row', async () => {
    const pool = buildMockPool([{ rows: [] }]);
    const p = await getAgentParams(pool, 'unknown');
    expect(p).toEqual({});
  });

  it('returns {} when pool is null', async () => {
    const p = await getAgentParams(null, 'any');
    expect(p).toEqual({});
  });
});

// ── getAllAgentParams ─────────────────────────────────────────────────────────

describe('getAllAgentParams', () => {
  it('maps DB rows to AgentParamRecord[]', async () => {
    const pool = buildMockPool([{
      rows: [{
        agent_id:   'ag1',
        params:     { x: 1 },
        version:    2,
        updated_at: new Date('2025-03-01'),
      }],
    }]);
    const result = await getAllAgentParams(pool);
    expect(result).toHaveLength(1);
    expect(result[0].agentId).toBe('ag1');
    expect(result[0].params).toEqual({ x: 1 });
  });

  it('returns [] when pool is null', async () => {
    expect(await getAllAgentParams(null)).toEqual([]);
  });
});

// ── applyAdaptiveUpdate ───────────────────────────────────────────────────────

describe('applyAdaptiveUpdate', () => {
  it('returns notBeta=true for base user (no pool needed)', async () => {
    const pool = buildMockPool();
    const result = await applyAdaptiveUpdate(pool, {
      agentId:     'ag1',
      newParams:   { x: 1 },
      triggeredBy: 'u1',
      userPlan:    'free',
    });
    expect(result.notBeta).toBe(true);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('returns limitExceeded=true when daily limit reached', async () => {
    const pool = buildMockPool([
      // rate-limit count query
      { rows: [{ cnt: String(MAX_UPDATES_PER_DAY) }] },
    ]);
    const result = await applyAdaptiveUpdate(pool, {
      agentId:     'ag1',
      newParams:   { x: 1 },
      triggeredBy: 'u1',
      userPlan:    'pro',
    });
    expect(result.limitExceeded).toBe(true);
  });

  it('applies update and returns updateId for beta user', async () => {
    const pool = buildMockPool([
      // 1. rate-limit count
      { rows: [{ cnt: '0' }] },
      // 2. fetch current score
      { rows: [{ score: 0.8 }] },
      // 3. last update check (none)
      { rows: [] },
      // 4. get current params
      { rows: [] },
      // 5. insert audit record
      { rows: [{ id: 42 }] },
      // 6. upsert agent_params
      { rows: [] },
    ]);
    const result = await applyAdaptiveUpdate(pool, {
      agentId:     'ag1',
      newParams:   { threshold: 0.9 },
      triggeredBy: 'u1',
      userPlan:    'pro',
    });
    expect(result.updateId).toBe(42);
    expect(result.notBeta).toBe(false);
    expect(result.limitExceeded).toBe(false);
  });

  it('returns noop when pool is null (beta user but no DB)', async () => {
    const result = await applyAdaptiveUpdate(null, {
      agentId:     'ag1',
      newParams:   {},
      triggeredBy: 'u1',
      userPlan:    'pro',
    });
    expect(result.updateId).toBe(-1);
    expect(result.notBeta).toBe(false);
  });
});

// ── rollbackAdaptiveUpdate ────────────────────────────────────────────────────

describe('rollbackAdaptiveUpdate', () => {
  it('returns false when pool is null', async () => {
    expect(await rollbackAdaptiveUpdate(null, 1)).toBe(false);
  });

  it('returns false for already rolled-back record', async () => {
    const pool = buildMockPool([
      { rows: [{ agent_id: 'ag1', old_params: {}, rolled_back: true }] },
    ]);
    expect(await rollbackAdaptiveUpdate(pool, 1)).toBe(false);
  });

  it('returns false when record not found', async () => {
    const pool = buildMockPool([{ rows: [] }]);
    expect(await rollbackAdaptiveUpdate(pool, 999)).toBe(false);
  });

  it('restores old params and marks record rolled back', async () => {
    const pool = buildMockPool([
      // select record
      { rows: [{ agent_id: 'ag1', old_params: { threshold: 0.5 }, rolled_back: false }] },
      // upsert agent_params
      { rows: [] },
      // update adaptive_updates
      { rows: [] },
    ]);
    const result = await rollbackAdaptiveUpdate(pool, 7);
    expect(result).toBe(true);
    // verify the UPDATE SET rolled_back call happened
    const sqlCalls = pool._calls.map(([sql]) => sql);
    expect(sqlCalls.some(s => /rolled_back/.test(s) && /UPDATE/.test(s))).toBe(true);
  });
});

/**
 * aiCache.test.ts — Unit tests for the AI cache module
 *
 * Tests cache operations, hit/miss counting, and CacheStats.
 * Lives here to avoid the vi.mock hoisting issues that arise when testing
 * aiCache from a component test file that also mocks it.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCachedAnalysis,
  setCachedAnalysis,
  clearCache,
  cacheSize,
  buildContextHash,
  getCacheStats,
} from '../aiCache';
import type { AIAnalysisResult } from '../../engine/aiEngine';

// Minimal stub for AIAnalysisResult — only needs to exist in the cache
const makeResult = (id = 'r'): AIAnalysisResult =>
  ({
    atRiskCount: 0,
    excellenceCount: 0,
    classAverage: 7,
    suggestions: [],
    classHealthIndex: 80,
    trends: [],
    _stub: id,
  }) as unknown as AIAnalysisResult;

describe('aiCache — basic operations', () => {
  beforeEach(() => clearCache());

  it('returns null for unknown key', () => {
    expect(getCachedAnalysis('nonexistent')).toBeNull();
  });

  it('returns stored result after setCachedAnalysis', () => {
    const r = makeResult();
    setCachedAnalysis('k1', r);
    expect(getCachedAnalysis('k1')).toBe(r);
  });

  it('cacheSize increases after set', () => {
    setCachedAnalysis('a', makeResult('a'));
    setCachedAnalysis('b', makeResult('b'));
    expect(cacheSize()).toBe(2);
  });

  it('clearCache empties the cache', () => {
    setCachedAnalysis('x', makeResult());
    clearCache();
    expect(cacheSize()).toBe(0);
    expect(getCachedAnalysis('x')).toBeNull();
  });
});

describe('aiCache — hit/miss counting', () => {
  beforeEach(() => clearCache());

  it('starts with zero counters', () => {
    const s = getCacheStats();
    expect(s.hits).toBe(0);
    expect(s.misses).toBe(0);
    expect(s.hitRate).toBe(0);
  });

  it('increments misses on cache miss', () => {
    getCachedAnalysis('missing-key');
    expect(getCacheStats().misses).toBe(1);
    expect(getCacheStats().hits).toBe(0);
  });

  it('increments hits on cache hit', () => {
    setCachedAnalysis('key', makeResult());
    getCachedAnalysis('key');
    expect(getCacheStats().hits).toBe(1);
    expect(getCacheStats().misses).toBe(0);
  });

  it('computes hitRate correctly', () => {
    setCachedAnalysis('key', makeResult());
    getCachedAnalysis('key');   // hit
    getCachedAnalysis('miss1'); // miss
    getCachedAnalysis('miss2'); // miss
    const s = getCacheStats();
    expect(s.hits).toBe(1);
    expect(s.misses).toBe(2);
    expect(s.hitRate).toBeCloseTo(1 / 3, 2);
  });

  it('clearCache resets hit/miss counters', () => {
    getCachedAnalysis('miss');
    setCachedAnalysis('key', makeResult());
    getCachedAnalysis('key'); // hit
    clearCache();
    const s = getCacheStats();
    expect(s.hits).toBe(0);
    expect(s.misses).toBe(0);
    expect(s.size).toBe(0);
  });
});

describe('buildContextHash', () => {
  it('is stable regardless of array order for same ids', () => {
    const ctx1 = {
      students: [{ id: 'b' }, { id: 'a' }],
      evaluations: [{ id: '2' }, { id: '1' }],
    };
    const ctx2 = {
      students: [{ id: 'a' }, { id: 'b' }],
      evaluations: [{ id: '1' }, { id: '2' }],
    };
    expect(buildContextHash(ctx1 as never)).toBe(buildContextHash(ctx2 as never));
  });

  it('differs when student sets differ', () => {
    const ctx1 = { students: [{ id: 'a' }], evaluations: [] };
    const ctx2 = { students: [{ id: 'b' }], evaluations: [] };
    expect(buildContextHash(ctx1 as never)).not.toBe(buildContextHash(ctx2 as never));
  });

  it('differs when evaluation sets differ', () => {
    const ctx1 = { students: [], evaluations: [{ id: 'e1' }] };
    const ctx2 = { students: [], evaluations: [{ id: 'e2' }] };
    expect(buildContextHash(ctx1 as never)).not.toBe(buildContextHash(ctx2 as never));
  });

  it('empty context hashes to a stable string', () => {
    const h1 = buildContextHash({ students: [], evaluations: [] } as never);
    const h2 = buildContextHash({ students: [], evaluations: [] } as never);
    expect(h1).toBe(h2);
    expect(typeof h1).toBe('string');
  });
});

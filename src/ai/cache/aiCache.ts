/**
 * aiCache.ts — In-memory result cache for AIAnalysisResult
 *
 * Provides a lightweight, deterministic cache keyed by a hash of the
 * analysis context (sorted student/evaluation IDs). Avoids redundant
 * recomputation when the same dataset is analysed multiple times within
 * the same browser session.
 *
 * Usage:
 *   import { buildContextHash, getCachedAnalysis, setCachedAnalysis } from './aiCache'
 *   const hash = buildContextHash(context)
 *   const cached = getCachedAnalysis(hash)
 *   if (cached) return cached
 *   const result = runAIAnalysis(context)
 *   setCachedAnalysis(hash, result)
 *   return result
 */
import type { AIContext } from '../contextEngine/contextBuilder';
import type { AIAnalysisResult } from '../engine/aiEngine';

// ── internal store ────────────────────────────────────────────────────────────

const _cache = new Map<string, AIAnalysisResult>();
let _hits = 0;
let _misses = 0;

// ── hash ──────────────────────────────────────────────────────────────────────

/**
 * Produces a stable, deterministic string key from an AIContext.
 *
 * The key encodes:
 *   - Sorted student IDs (class composition)
 *   - Sorted evaluation IDs (dataset identity)
 *
 * Two calls with the same students + evaluations (regardless of array order)
 * will always produce the same hash.
 */
export function buildContextHash(context: AIContext): string {
  const studentIds = context.students.map((s) => s.id).sort().join(',');
  const evalIds = context.evaluations.map((e) => e.id).sort().join(',');
  return `${studentIds}|${evalIds}`;
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Returns the cached AIAnalysisResult for the given hash, or null if not
 * present.
 */
export function getCachedAnalysis(hash: string): AIAnalysisResult | null {
  const result = _cache.get(hash) ?? null;
  if (result !== null) {
    _hits++;
  } else {
    _misses++;
  }
  return result;
}

/**
 * Stores an AIAnalysisResult in the cache under the given hash.
 */
export function setCachedAnalysis(hash: string, result: AIAnalysisResult): void {
  _cache.set(hash, result);
}

/**
 * Removes all entries from the analysis cache.
 * Useful in tests or when the user navigates away to a fresh class context.
 */
export function clearCache(): void {
  _cache.clear();
  _hits = 0;
  _misses = 0;
}

/** Number of entries currently held in the cache. Exposed for debugging. */
export function cacheSize(): number {
  return _cache.size;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

/** Returns the number of entries in the unified (orchestrator) result cache. */
export function getUnifiedCacheSize(): number {
  return _unifiedCache.size;
}

/** Returns cache performance stats for the dev tools panel. */
export function getCacheStats(): CacheStats {
  const total = _hits + _misses;
  return {
    size: _cache.size,
    hits: _hits,
    misses: _misses,
    hitRate: total > 0 ? parseFloat((_hits / total).toFixed(3)) : 0,
  };
}

// ── UnifiedAIResult cache (Sprint 1) ─────────────────────────────────────────
// Separate Map so legacy getCachedAnalysis / setCachedAnalysis are undisturbed.

import type { UnifiedAIResult } from '../orchestrator/types';

const _unifiedCache = new Map<string, UnifiedAIResult>();

/** Returns a cached UnifiedAIResult or null. */
export function getCachedUnifiedResult(hash: string): UnifiedAIResult | null {
  const result = _unifiedCache.get(hash) ?? null;
  if (result !== null) _hits++;
  else _misses++;
  return result;
}

/** Stores a UnifiedAIResult in the cache. */
export function setCachedUnifiedResult(hash: string, result: UnifiedAIResult): void {
  _unifiedCache.set(hash, result);
}

/** Clears both legacy and unified caches. */
export function clearAllCaches(): void {
  _cache.clear();
  _unifiedCache.clear();
  _hits = 0;
  _misses = 0;
}

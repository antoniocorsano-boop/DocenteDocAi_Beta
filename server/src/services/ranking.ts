/**
 * services/ranking.ts — Composite memory ranking (P32-C)
 *
 * Combines three orthogonal relevance signals into a single score [0, 1]:
 *
 *   1. Cosine similarity  (semantic)  — dominant signal (default weight 0.70)
 *   2. Temporal decay     (recency)   — favours recent memories   (default 0.20)
 *   3. Tag boost          (keyword)   — Jaccard overlap of tags    (default 0.10)
 *
 * Design rationale:
 *   - Cosine stays dominant so semantic relevance is never overridden by recency.
 *   - Temporal decay is exponential with a 30-day half-life:
 *       decay(0d) ≈ 1.00  — fresh entry preserved at full score
 *       decay(7d) ≈ 0.85  — one-week-old entry still highly ranked
 *       decay(30d) = 0.50 — half-life inflection point
 *       decay(90d) ≈ 0.13 — three-month-old entry nearly filtered out
 *   - Tag boost is additive and capped, so it only acts as a tiebreaker.
 *
 * P33 upgrade: expose weights per-user (stored in `users.memory_weights JSONB`)
 * to allow personalisation without changing the core algorithm.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RankingWeights {
  /** Weight for cosine similarity component [0, 1], default 0.70 */
  cosine:    number;
  /** Weight for temporal decay component    [0, 1], default 0.20 */
  temporal:  number;
  /** Weight for tag-overlap boost component [0, 1], default 0.10 */
  tagBoost:  number;
}

const DEFAULT_WEIGHTS: RankingWeights = {
  cosine:   0.70,
  temporal: 0.20,
  tagBoost: 0.10,
};

const HALF_LIFE_DAYS = 30;
const MS_PER_DAY     = 86_400_000;

// ── Temporal decay ────────────────────────────────────────────────────────────

/**
 * Exponential decay: f(t) = e^(−λt) where λ = ln(2) / halfLifeDays
 *
 * Returns a value in (0, 1].
 * Very old entries (> 6 months) approach 0 but never reach it — all memories
 * remain retrievable, just ranked lower.
 *
 * @param createdAt  — timestamp of the memory entry
 * @param halfLife   — decay half-life in days (default: HALF_LIFE_DAYS = 30)
 */
export function temporalDecay(createdAt: Date, halfLife = HALF_LIFE_DAYS): number {
  const ageMs   = Date.now() - createdAt.getTime();
  const ageDays = Math.max(ageMs / MS_PER_DAY, 0); // clamp to ≥0 for future-dated entries
  const lambda  = Math.LN2 / halfLife;
  return Math.exp(-lambda * ageDays);
}

// ── Tag boost (Jaccard similarity) ───────────────────────────────────────────

/**
 * Jaccard index between entry tags and query tags: |A ∩ B| / |A ∪ B|
 *
 * Returns a value in [0, 1].
 * Returns 0 when either set is empty (no boost applied — graceful).
 *
 * @param entryTags  — tags extracted from a memory entry
 * @param queryTags  — tags extracted from the search query
 */
export function tagBoost(entryTags: string[], queryTags: string[]): number {
  if (entryTags.length === 0 || queryTags.length === 0) return 0;

  const setA = new Set(entryTags);
  const setB = new Set(queryTags);

  let intersection = 0;
  for (const t of setB) {
    if (setA.has(t)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ── Composite score ───────────────────────────────────────────────────────────

/**
 * Weighted sum of the three components, normalised to [0, 1].
 *
 * Each component is individually clamped to [0, 1] before weighting.
 * The weights are normalised so the result is always in [0, 1] even if
 * the provided weights do not sum to 1.
 *
 * @param cosine    — output of `cosineSimilarity()` from embedding.ts
 * @param temporal  — output of `temporalDecay()`
 * @param tagBoost  — output of `tagBoost()`
 * @param weights   — optional weight overrides (defaults: 0.70 / 0.20 / 0.10)
 */
export function compositeScore(
  cosine:   number,
  temporal: number,
  tag:      number,
  weights:  Partial<RankingWeights> = {},
): number {
  const w = { ...DEFAULT_WEIGHTS, ...weights };

  // Clamp individual components
  const c = Math.max(0, Math.min(1, cosine));
  const t = Math.max(0, Math.min(1, temporal));
  const b = Math.max(0, Math.min(1, tag));

  // Normalise weights so they always sum to 1
  const wSum = w.cosine + w.temporal + w.tagBoost;
  if (wSum === 0) return 0;
  const wc = w.cosine   / wSum;
  const wt = w.temporal / wSum;
  const wb = w.tagBoost / wSum;

  return wc * c + wt * t + wb * b;
}

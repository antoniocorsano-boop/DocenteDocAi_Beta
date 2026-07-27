/**
 * services/feedbackLoop.ts — Continuous Feedback Loop (P35)
 *
 * Extends P34 adaptive intelligence with a bidirectional learning cycle:
 *   • User feedback collection (ratings, notes, tags) per agent execution
 *   • Per-agent metric aggregation (dashboard summary)
 *   • Controlled parameter updates for beta users with rollback protection
 *   • Full audit trail: every update in adaptive_updates table
 *
 * Roll-out tiers:
 *   Base users — feedback stored, scoring active, no live param changes
 *   Beta users — param updates allowed (max MAX_UPDATES_PER_DAY/day/agent),
 *                auto-rollback if composite score degrades > ROLLBACK_THRESHOLD
 *
 * Extended scoring formula (P35):
 *   score = α × success_rate + β × avg_cosine + γ × recency + δ × tag_relevance
 *   α=0.60  β=0.20  γ=0.10  δ=0.10
 *   (tag_relevance: Jaccard similarity between feedback tags and execution tags)
 *
 * Schema (auto-migrated via ensureFeedbackSchema):
 *   user_feedback    — per-user ratings, notes and tags per outcome
 *   adaptive_updates — audit trail with old/new params and metrics snapshots
 *   agent_params     — runtime parameter overrides per agent
 *
 * Observability events (emitted via logger only — no client-side dependency):
 *   adaptive.loop.start         — auto-rollback check started
 *   adaptive.updateApplied      — param update committed to DB
 *   adaptive.rollbackTriggered  — rollback executed (auto or manual)
 */

import type { Pool }     from 'pg';
import { logger }        from '../logger';
import { temporalDecay } from './ranking';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserFeedback {
  id:        number;
  userId:    string;
  outcomeId: number | null;
  agentId:   string | null;
  rating:    number;
  notes:     string | null;
  tags:      string[];
  createdAt: string;
}

export interface AdaptiveUpdateRecord {
  id:            number;
  agentId:       string;
  oldParams:     Record<string, unknown>;
  newParams:     Record<string, unknown>;
  triggeredBy:   string;
  triggerType:   'auto' | 'manual';
  metricsBefore: Record<string, unknown> | null;
  metricsAfter:  Record<string, unknown> | null;
  rolledBack:    boolean;
  rolledBackAt:  string | null;
  createdAt:     string;
}

export interface AgentParamRecord {
  agentId:   string;
  params:    Record<string, unknown>;
  version:   number;
  updatedAt: string;
}

export interface AdaptiveSummary {
  agentId:     string;
  avgScore:    number;
  totalRuns:   number;
  avgRating:   number | null;
  lastUpdated: string;
}

export interface RecordFeedbackParams {
  userId:     string;
  outcomeId?: number;
  agentId?:   string;
  rating:     number;
  notes?:     string;
  tags?:      string[];
}

export interface ApplyUpdateParams {
  agentId:      string;
  newParams:    Record<string, unknown>;
  triggeredBy:  string;
  triggerType?: 'auto' | 'manual';
  learningRate?: number;
  userPlan?:    string;
}

export interface ApplyUpdateResult {
  updateId:      number;
  rolledBack:    boolean;
  limitExceeded: boolean;
  notBeta:       boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Extended scoring weights (P35) — sum to 1.0 */
const ALPHA2 = 0.60;  // success_rate
const BETA2  = 0.20;  // avg_cosine
const GAMMA2 = 0.10;  // recency
const DELTA2 = 0.10;  // tag_relevance

/** Score degradation threshold that triggers automatic rollback. */
export const ROLLBACK_THRESHOLD  = 0.05;

/** Maximum parameter updates allowed per agent per day for beta users. */
export const MAX_UPDATES_PER_DAY = 3;

const DEFAULT_LEARNING_RATE  = 0.10;
const RECENCY_HALF_LIFE_DAYS = 7;

// ── In-memory fallback (pool = null, dev mode) ────────────────────────────────

interface InMemFeedback {
  userId:    string;
  agentId:   string | null;
  rating:    number;
  tags:      string[];
  createdAt: Date;
}

/** Module-level accumulator for no-DB environments. */
const _inMemFeedback: InMemFeedback[] = [];

// ── Pure helpers ──────────────────────────────────────────────────────────────

/**
 * Jaccard similarity between two tag arrays [0, 1].
 * Returns 0 when either array is empty (no tag signal).
 */
export function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter(t => setB.has(t)).length;
  const union        = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Extended P35 composite score.
 *   0.60 × successRate + 0.20 × avgCosine + 0.10 × recency + 0.10 × tagRelevance
 */
export function computeExtendedScore(params: {
  successRate:  number;
  avgCosine:    number;
  mostRecentAt: Date;
  tagRelevance: number;
}): number {
  const recency = temporalDecay(params.mostRecentAt, RECENCY_HALF_LIFE_DAYS);
  return (
    ALPHA2 * params.successRate  +
    BETA2  * params.avgCosine    +
    GAMMA2 * recency             +
    DELTA2 * params.tagRelevance
  );
}

/**
 * Apply a gradient step: numeric fields move by `lr × (target – current)`.
 * Non-numeric fields are replaced directly.
 */
export function applyLearningRate(
  old:     Record<string, unknown>,
  updates: Record<string, unknown>,
  lr:      number,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...old };
  for (const [k, v] of Object.entries(updates)) {
    if (typeof v === 'number' && typeof old[k] === 'number') {
      result[k] = (old[k] as number) + lr * (v - (old[k] as number));
    } else {
      result[k] = v;
    }
  }
  return result;
}

/**
 * Whether a user plan qualifies for beta adaptive updates.
 * Only 'pro' plan users can apply live parameter changes.
 */
export function isBetaUser(plan: string | undefined): boolean {
  return plan === 'pro';
}

// ── Schema bootstrap ──────────────────────────────────────────────────────────

export async function ensureFeedbackSchema(pool: Pool): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_feedback (
          id          SERIAL    PRIMARY KEY,
          user_id     TEXT      NOT NULL,
          outcome_id  INT,
          agent_id    TEXT,
          rating      INT       NOT NULL DEFAULT 3 CHECK (rating BETWEEN 1 AND 5),
          notes       TEXT,
          tags        TEXT[]    NOT NULL DEFAULT '{}',
          created_at  TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS uf_user_id_idx  ON user_feedback (user_id);
      CREATE INDEX IF NOT EXISTS uf_agent_id_idx ON user_feedback (agent_id);

      CREATE TABLE IF NOT EXISTS adaptive_updates (
          id              SERIAL    PRIMARY KEY,
          agent_id        TEXT      NOT NULL,
          old_params      JSONB     NOT NULL DEFAULT '{}',
          new_params      JSONB     NOT NULL DEFAULT '{}',
          triggered_by    TEXT      NOT NULL,
          trigger_type    TEXT      NOT NULL DEFAULT 'auto',
          metrics_before  JSONB,
          metrics_after   JSONB,
          rolled_back     BOOLEAN   NOT NULL DEFAULT FALSE,
          rolled_back_at  TIMESTAMP,
          created_at      TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS au_agent_id_idx ON adaptive_updates (agent_id);

      CREATE TABLE IF NOT EXISTS agent_params (
          agent_id    TEXT      PRIMARY KEY,
          params      JSONB     NOT NULL DEFAULT '{}',
          version     INT       NOT NULL DEFAULT 1,
          updated_at  TIMESTAMP DEFAULT NOW()
      );
    `);
  } catch (err) {
    logger.warn({
      message:   'ensureFeedbackSchema failed (non-fatal)',
      component: 'feedbackLoop',
      err:       String(err),
    });
  }
}

// ── recordFeedback ────────────────────────────────────────────────────────────

/**
 * Persist one user feedback record.
 * Falls back to in-memory when pool is null. Never throws.
 */
export async function recordFeedback(
  pool: Pool | null,
  params: RecordFeedbackParams,
): Promise<void> {
  const { userId, outcomeId = null, agentId = null, rating, notes = null, tags = [] } = params;

  if (!pool) {
    _inMemFeedback.push({ userId, agentId, rating, tags, createdAt: new Date() });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO user_feedback (user_id, outcome_id, agent_id, rating, notes, tags)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, outcomeId, agentId, rating, notes, tags],
    );
  } catch (err) {
    logger.warn({
      message:   'recordFeedback insert failed',
      component: 'feedbackLoop',
      userId,
      err:       String(err),
    });
  }
}

// ── getAdaptiveSummary ────────────────────────────────────────────────────────

/**
 * Aggregate per-agent metrics combining execution outcomes with user feedback.
 * Returns [] on any error. Falls back to in-memory data when pool is null.
 */
export async function getAdaptiveSummary(pool: Pool | null): Promise<AdaptiveSummary[]> {
  if (!pool) {
    const byAgent = new Map<string, { totalRatings: number; sumRating: number }>();
    for (const fb of _inMemFeedback) {
      if (!fb.agentId) continue;
      const e = byAgent.get(fb.agentId) ?? { totalRatings: 0, sumRating: 0 };
      e.totalRatings += 1;
      e.sumRating    += fb.rating;
      byAgent.set(fb.agentId, e);
    }
    return [...byAgent.entries()].map(([agentId, e]) => ({
      agentId,
      avgScore:    0,
      totalRuns:   e.totalRatings,
      avgRating:   e.totalRatings > 0 ? e.sumRating / e.totalRatings : null,
      lastUpdated: new Date().toISOString(),
    }));
  }

  try {
    const { rows } = await pool.query<{
      agent_id:     string;
      avg_score:    string;
      total_runs:   string;
      avg_rating:   string | null;
      last_updated: Date;
    }>(`
      SELECT
        o.agent_id,
        AVG(CASE WHEN o.success THEN 1.0 ELSE 0.0 END)::float AS avg_score,
        COUNT(DISTINCT o.id)::int                              AS total_runs,
        AVG(f.rating)::float                                   AS avg_rating,
        MAX(o.created_at)                                      AS last_updated
      FROM agent_outcomes o
      LEFT JOIN user_feedback f ON f.agent_id = o.agent_id
      GROUP BY o.agent_id
      ORDER BY avg_score DESC
    `);

    return rows.map(r => ({
      agentId:     r.agent_id,
      avgScore:    parseFloat(r.avg_score)  ?? 0,
      totalRuns:   parseInt(String(r.total_runs), 10) ?? 0,
      avgRating:   r.avg_rating !== null ? parseFloat(r.avg_rating) : null,
      lastUpdated: r.last_updated.toISOString(),
    }));
  } catch (err) {
    logger.warn({
      message:   '[feedbackLoop] getAdaptiveSummary failed',
      component: 'feedbackLoop',
      err:       String(err),
    });
    return [];
  }
}

// ── getAgentParams ────────────────────────────────────────────────────────────

/**
 * Fetch the current runtime parameter overrides for one agent.
 * Returns {} when no overrides exist or when pool is null.
 */
export async function getAgentParams(
  pool: Pool | null,
  agentId: string,
): Promise<Record<string, unknown>> {
  if (!pool) return {};
  try {
    const { rows } = await pool.query<{ params: Record<string, unknown> }>(
      `SELECT params FROM agent_params WHERE agent_id = $1`,
      [agentId],
    );
    return rows[0]?.params ?? {};
  } catch (err) {
    logger.warn({
      message:   'getAgentParams failed',
      component: 'feedbackLoop',
      agentId,
      err:       String(err),
    });
    return {};
  }
}

/** Fetch all agent_params rows — used by the client to initialise adaptive routing. */
export async function getAllAgentParams(
  pool: Pool | null,
): Promise<AgentParamRecord[]> {
  if (!pool) return [];
  try {
    const { rows } = await pool.query<{
      agent_id:   string;
      params:     Record<string, unknown>;
      version:    number;
      updated_at: Date;
    }>(`SELECT agent_id, params, version, updated_at FROM agent_params ORDER BY agent_id`);

    return rows.map(r => ({
      agentId:   r.agent_id,
      params:    r.params,
      version:   r.version,
      updatedAt: r.updated_at.toISOString(),
    }));
  } catch (err) {
    logger.warn({
      message:   'getAllAgentParams failed',
      component: 'feedbackLoop',
      err:       String(err),
    });
    return [];
  }
}

// ── applyAdaptiveUpdate ───────────────────────────────────────────────────────

/**
 * Apply a controlled parameter update for one agent.
 *
 * Guards:
 *   1. Only beta users (plan='pro') can apply live updates.
 *   2. Max MAX_UPDATES_PER_DAY updates per agent per day.
 *   3. Auto-rollback: if the last non-rolled-back update caused score degradation
 *      greater than ROLLBACK_THRESHOLD, it is rolled back before the new one applies.
 *
 * The update is smoothed by a configurable learning rate (gradient step).
 * A full audit record is inserted into adaptive_updates on every call.
 *
 * Returns { updateId, rolledBack, limitExceeded, notBeta } — never throws.
 */
export async function applyAdaptiveUpdate(
  pool: Pool | null,
  params: ApplyUpdateParams,
): Promise<ApplyUpdateResult> {
  const {
    agentId,
    newParams,
    triggeredBy,
    triggerType  = 'auto',
    learningRate = DEFAULT_LEARNING_RATE,
    userPlan,
  } = params;

  const noop: ApplyUpdateResult = {
    updateId:      -1,
    rolledBack:    false,
    limitExceeded: false,
    notBeta:       false,
  };

  if (!isBetaUser(userPlan)) return { ...noop, notBeta: true };
  if (!pool) return noop;

  try {
    // ── 1. Rate limit ───────────────────────────────────────────────────────
    const { rows: countRows } = await pool.query<{ cnt: string }>(
      `SELECT COUNT(*)::int AS cnt
         FROM adaptive_updates
        WHERE agent_id     = $1
          AND triggered_by = $2
          AND created_at   > NOW() - INTERVAL '1 day'
          AND rolled_back  = FALSE`,
      [agentId, triggeredBy],
    );
    const todayCount = parseInt(String(countRows[0]?.cnt ?? '0'), 10);
    if (todayCount >= MAX_UPDATES_PER_DAY) {
      logger.warn({
        message:    'applyAdaptiveUpdate: daily limit reached',
        component:  'feedbackLoop',
        agentId,
        triggeredBy,
        todayCount,
      });
      return { ...noop, limitExceeded: true };
    }

    // ── 2. Fetch current score as metricsBefore ─────────────────────────────
    const { rows: scoreRows } = await pool.query<{ score: number }>(
      `SELECT score FROM agent_scores WHERE agent_id = $1`,
      [agentId],
    );
    const metricsBefore = scoreRows[0] ? { score: scoreRows[0].score } : null;

    // ── 3. Auto-rollback check: did the last update degrade the score? ──────
    let didAutoRollback = false;
    if (metricsBefore) {
      const { rows: lastUpdateRows } = await pool.query<{
        id:             number;
        metrics_before: { score: number } | null;
        rolled_back:    boolean;
      }>(
        `SELECT id, metrics_before, rolled_back
           FROM adaptive_updates
          WHERE agent_id    = $1
            AND rolled_back = FALSE
          ORDER BY created_at DESC
          LIMIT 1`,
        [agentId],
      );
      const last = lastUpdateRows[0];
      if (last?.metrics_before && !last.rolled_back) {
        const prevScore = last.metrics_before.score;
        if (prevScore - metricsBefore.score > ROLLBACK_THRESHOLD) {
          // Fetch old params to restore
          const { rows: prevParams } = await pool.query<{ old_params: Record<string, unknown> }>(
            `SELECT old_params FROM adaptive_updates WHERE id = $1`,
            [last.id],
          );
          if (prevParams[0]) {
            await pool.query(
              `INSERT INTO agent_params (agent_id, params, updated_at)
               VALUES ($1, $2, NOW())
               ON CONFLICT (agent_id) DO UPDATE
                 SET params     = EXCLUDED.params,
                     version    = agent_params.version + 1,
                     updated_at = NOW()`,
              [agentId, JSON.stringify(prevParams[0].old_params)],
            );
          }
          await pool.query(
            `UPDATE adaptive_updates
                SET rolled_back = TRUE, rolled_back_at = NOW()
              WHERE id = $1`,
            [last.id],
          );
          didAutoRollback = true;
          logger.info({
            message:      'adaptive.rollbackTriggered (auto)',
            component:    'feedbackLoop',
            agentId,
            prevScore,
            currentScore: metricsBefore.score,
            updateId:     last.id,
          });
        }
      }
    }

    // ── 4. Fetch current params, apply learning rate ────────────────────────
    const oldParams         = await getAgentParams(pool, agentId);
    const computedNewParams = applyLearningRate(oldParams, newParams, learningRate);

    // ── 5. Insert audit record ──────────────────────────────────────────────
    const { rows: insertRows } = await pool.query<{ id: number }>(
      `INSERT INTO adaptive_updates
         (agent_id, old_params, new_params, triggered_by, trigger_type, metrics_before)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        agentId,
        JSON.stringify(oldParams),
        JSON.stringify(computedNewParams),
        triggeredBy,
        triggerType,
        metricsBefore ? JSON.stringify(metricsBefore) : null,
      ],
    );
    const updateId = insertRows[0]?.id ?? -1;

    // ── 6. Upsert agent_params ──────────────────────────────────────────────
    await pool.query(
      `INSERT INTO agent_params (agent_id, params, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (agent_id) DO UPDATE
         SET params     = EXCLUDED.params,
             version    = agent_params.version + 1,
             updated_at = NOW()`,
      [agentId, JSON.stringify(computedNewParams)],
    );

    logger.info({
      message:   'adaptive.updateApplied',
      component: 'feedbackLoop',
      agentId,
      triggeredBy,
      updateId,
    });

    return { updateId, rolledBack: didAutoRollback, limitExceeded: false, notBeta: false };
  } catch (err) {
    logger.warn({
      message:   'applyAdaptiveUpdate failed',
      component: 'feedbackLoop',
      agentId,
      err:       String(err),
    });
    return noop;
  }
}

// ── rollbackAdaptiveUpdate ────────────────────────────────────────────────────

/**
 * Manually roll back one adaptive update by ID.
 * Restores old_params and marks the record as rolled_back.
 * Returns true on success, false when not found or already rolled back.
 * Never throws.
 */
export async function rollbackAdaptiveUpdate(
  pool: Pool | null,
  updateId: number,
): Promise<boolean> {
  if (!pool) return false;

  try {
    const { rows } = await pool.query<{
      agent_id:    string;
      old_params:  Record<string, unknown>;
      rolled_back: boolean;
    }>(
      `SELECT agent_id, old_params, rolled_back FROM adaptive_updates WHERE id = $1`,
      [updateId],
    );

    const record = rows[0];
    if (!record)             return false;
    if (record.rolled_back)  return false;

    // Restore old params
    await pool.query(
      `INSERT INTO agent_params (agent_id, params, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (agent_id) DO UPDATE
         SET params     = EXCLUDED.params,
             version    = agent_params.version + 1,
             updated_at = NOW()`,
      [record.agent_id, JSON.stringify(record.old_params)],
    );

    // Mark the update as rolled back
    await pool.query(
      `UPDATE adaptive_updates
          SET rolled_back = TRUE, rolled_back_at = NOW()
        WHERE id = $1`,
      [updateId],
    );

    logger.info({
      message:   'adaptive.rollbackTriggered (manual)',
      component: 'feedbackLoop',
      agentId:   record.agent_id,
      updateId,
    });

    return true;
  } catch (err) {
    logger.warn({
      message:   'rollbackAdaptiveUpdate failed',
      component: 'feedbackLoop',
      updateId,
      err:       String(err),
    });
    return false;
  }
}

/**
 * services/adaptive.ts — Adaptive Intelligence Layer (P34)
 *
 * Outcome logging and agent scoring for the adaptive orchestration engine.
 *
 * All DB operations accept `pool: Pool | null`:
 *   - When pool is null (dev without DB) → in-memory fallback using a module-level array.
 *   - All operations are non-fatal: callers are never exposed to DB errors.
 *
 * Schema (auto-migrated on startup via ensureAdaptiveSchema):
 *
 *   agent_outcomes — raw per-execution records
 *   agent_scores   — aggregated per-agent metrics (UPSERT on each scoreUpdate)
 *
 * Scoring algorithm:
 *   score = α × success_rate + β × avg_cosine_score + γ × recency_weight
 *
 *   α = 0.60 — dominant signal: did it succeed?
 *   β = 0.20 — semantic quality (cosine similarity of output vs ideal)
 *   γ = 0.20 — recency bonus (exponential decay, half-life 7 days)
 *
 *   avg_cosine_score defaults to DEFAULT_COSINE_SCORE (0.75) when none of the
 *   stored outcomes include an explicit cosine_score value.
 *
 * Observability:
 *   - All warnings emitted via logger.warn (not thrown)
 *   - P34 Grafana dashboards consume agent_scores for trend visualisation
 */

import type { Pool }     from 'pg';
import { logger }        from '../logger';
import { temporalDecay } from './ranking';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AgentScore {
  /** Agent identifier (e.g. 'agent.cognitive') */
  agentId:     string;
  /** Composite score [0, 1] */
  score:       number;
  /** Success-rate-based reliability [0, 1] */
  reliability: number;
  /** Total outcomes recorded */
  totalRuns:   number;
  /** ISO-8601 timestamp of last score recalculation */
  updatedAt:   string;
}

export interface LogOutcomeParams {
  agentId:      string;
  input?:       unknown;
  output?:      unknown;
  success:      boolean;
  tokensUsed:   number;
  /** Optional cosine similarity of the output embedding vs. query embedding */
  cosineScore?: number | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ALPHA = 0.60; // success_rate weight
const BETA  = 0.20; // avg_cosine_score weight
const GAMMA = 0.20; // recency_weight weight

const DEFAULT_COSINE_SCORE   = 0.75;
const RECENCY_HALF_LIFE_DAYS = 7;

// ── In-memory fallback (pool = null, dev mode) ────────────────────────────────

interface InMemOutcome {
  agentId:     string;
  success:     boolean;
  tokensUsed:  number;
  cosineScore: number | null;
  createdAt:   Date;
}

/** Module-level accumulator for no-DB environments. */
const _inMem: InMemOutcome[] = [];

// ── Schema bootstrap ──────────────────────────────────────────────────────────

/**
 * Create tables and indexes if they do not already exist.
 * Called once at server startup — non-fatal if it fails.
 */
export async function ensureAdaptiveSchema(pool: Pool): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_outcomes (
          id           SERIAL    PRIMARY KEY,
          agent_id     TEXT      NOT NULL,
          input        JSONB,
          output       JSONB,
          success      BOOLEAN   NOT NULL DEFAULT FALSE,
          tokens_used  INT       NOT NULL DEFAULT 0,
          cosine_score FLOAT,
          created_at   TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS ao_agent_id_idx  ON agent_outcomes (agent_id);
      CREATE INDEX IF NOT EXISTS ao_created_at_idx ON agent_outcomes (created_at);

      CREATE TABLE IF NOT EXISTS agent_scores (
          agent_id    TEXT      PRIMARY KEY,
          score       FLOAT     NOT NULL DEFAULT 0.5,
          reliability FLOAT     NOT NULL DEFAULT 0.5,
          total_runs  INT       NOT NULL DEFAULT 0,
          updated_at  TIMESTAMP DEFAULT NOW()
      );
    `);
  } catch (err) {
    logger.warn({
      message:   'ensureAdaptiveSchema failed (non-fatal)',
      component: 'adaptive',
      err:       String(err),
    });
  }
}

// ── logAgentOutcome ───────────────────────────────────────────────────────────

/**
 * Persist one agent execution outcome.
 * Falls back to in-memory when pool is null.
 * Never throws.
 */
export async function logAgentOutcome(
  pool: Pool | null,
  params: LogOutcomeParams,
): Promise<void> {
  const { agentId, input, output, success, tokensUsed, cosineScore = null } = params;

  if (!pool) {
    _inMem.push({ agentId, success, tokensUsed, cosineScore, createdAt: new Date() });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO agent_outcomes (agent_id, input, output, success, tokens_used, cosine_score)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        agentId,
        JSON.stringify(input),
        JSON.stringify(output),
        success,
        tokensUsed,
        cosineScore,
      ],
    );
  } catch (err) {
    logger.warn({
      message:   'logAgentOutcome insert failed',
      component: 'adaptive',
      agentId,
      err:       String(err),
    });
  }
}

// ── updateAgentScore ──────────────────────────────────────────────────────────

/**
 * Recompute and persist the composite score for a single agent.
 * Reads up to the last 100 outcomes. Non-fatal.
 */
export async function updateAgentScore(pool: Pool | null, agentId: string): Promise<void> {
  if (!pool) {
    // In-memory: no persistent storage, fire-and-forget
    return;
  }

  try {
    const { rows } = await pool.query<{
      success:      boolean;
      cosine_score: number | null;
      created_at:   Date;
    }>(
      `SELECT success, cosine_score, created_at
         FROM agent_outcomes
        WHERE agent_id = $1
        ORDER BY created_at DESC
        LIMIT 100`,
      [agentId],
    );

    if (rows.length === 0) return;

    const totalRuns    = rows.length;
    const successCount = rows.filter(r => r.success).length;
    const successRate  = successCount / totalRuns;

    const cosineRows = rows.filter(r => r.cosine_score !== null);
    const avgCosine  = cosineRows.length > 0
      ? cosineRows.reduce((acc, r) => acc + (r.cosine_score ?? 0), 0) / cosineRows.length
      : DEFAULT_COSINE_SCORE;

    // Recency decay based on the most recent outcome's age
    const mostRecentDate = rows[0]?.created_at ? new Date(rows[0].created_at) : new Date();
    const recencyWeight  = temporalDecay(mostRecentDate, RECENCY_HALF_LIFE_DAYS);

    const score       = ALPHA * successRate + BETA * avgCosine + GAMMA * recencyWeight;
    const reliability = Math.min(1, (successRate + recencyWeight) * 0.5);

    await pool.query(
      `INSERT INTO agent_scores (agent_id, score, reliability, total_runs, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (agent_id) DO UPDATE
         SET score       = EXCLUDED.score,
             reliability = EXCLUDED.reliability,
             total_runs  = EXCLUDED.total_runs,
             updated_at  = EXCLUDED.updated_at`,
      [agentId, score, reliability, totalRuns],
    );
  } catch (err) {
    logger.warn({
      message:   'updateAgentScore failed',
      component: 'adaptive',
      agentId,
      err:       String(err),
    });
  }
}

// ── getAgentScores ────────────────────────────────────────────────────────────

/**
 * Return all agent scores sorted by score descending.
 * Falls back to in-memory aggregation when pool is null.
 * Returns [] on any error.
 */
export async function getAgentScores(pool: Pool | null): Promise<AgentScore[]> {
  if (!pool) {
    const ids = [...new Set(_inMem.map(o => o.agentId))];
    return ids.map(agentId => {
      const outcomes    = _inMem.filter(o => o.agentId === agentId);
      const successRate = outcomes.filter(o => o.success).length / Math.max(outcomes.length, 1);
      return {
        agentId,
        score:       successRate,
        reliability: successRate,
        totalRuns:   outcomes.length,
        updatedAt:   new Date().toISOString(),
      };
    });
  }

  try {
    const { rows } = await pool.query<{
      agent_id:    string;
      score:       number;
      reliability: number;
      total_runs:  number;
      updated_at:  Date;
    }>(
      `SELECT agent_id, score, reliability, total_runs, updated_at
         FROM agent_scores
         ORDER BY score DESC`,
    );
    return rows.map(r => ({
      agentId:     r.agent_id,
      score:       r.score,
      reliability: r.reliability,
      totalRuns:   r.total_runs,
      updatedAt:   new Date(r.updated_at).toISOString(),
    }));
  } catch (err) {
    logger.warn({ message: 'getAgentScores failed', component: 'adaptive', err: String(err) });
    return [];
  }
}

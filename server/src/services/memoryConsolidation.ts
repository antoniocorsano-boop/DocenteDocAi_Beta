/**
 * services/memoryConsolidation.ts — Memory Consolidation (P34)
 *
 * Compresses batches of old memory entries into synthetic summaries, reducing
 * active noise while preserving all content in an archive state.
 *
 * Strategy:
 *   1. Fetch the oldest `batchSize` non-archived entries for the user.
 *   2. Build a formatted summary string (date + truncated content per entry).
 *   3. Attempt OpenAI embedding on the summary — gracefully falls back to null.
 *   4. INSERT the summary row into `memory_summaries`.
 *   5. Mark source entries as archived = TRUE (they remain queryable but
 *      excluded from the active search index).
 *
 * Schema (auto-migrated via ensureMemoryConsolidationSchema):
 *
 *   CREATE TABLE IF NOT EXISTS memory_summaries (
 *       id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
 *       user_id     TEXT      NOT NULL,
 *       summary     TEXT      NOT NULL,
 *       embedding   JSONB,
 *       entry_count INT       NOT NULL DEFAULT 0,
 *       created_at  TIMESTAMP DEFAULT NOW()
 *   );
 *
 *   ALTER TABLE memory_entries
 *     ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;
 *
 * Graceful degradation:
 *   - pool = null → returns [] immediately (dev mode without DB).
 *   - No entries to compress → returns [] without touching the DB.
 *   - OpenAI unavailable → summary stored as plain text (embedding = null).
 *   - Any DB error → logged as warning, returns [].
 */

import type { Pool }        from 'pg';
import crypto               from 'crypto';
import { logger }           from '../logger';
import { createEmbedding }  from './embedding';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MemorySummary {
  id:         string;
  userId:     string;
  /** Formatted concatenation of the archived entries */
  summary:    string;
  /** 1 536-dim OpenAI embedding, or null when embedding was unavailable */
  embedding:  number[] | null;
  entryCount: number;
  createdAt:  string;
}

// ── Schema bootstrap ──────────────────────────────────────────────────────────

/**
 * Create memory_summaries table and add `archived` column to memory_entries.
 * Safe to call repeatedly — uses IF NOT EXISTS / IF NOT EXISTS guards.
 * Non-fatal: logs and returns on failure.
 */
export async function ensureMemoryConsolidationSchema(pool: Pool): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS memory_summaries (
          id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id     TEXT      NOT NULL,
          summary     TEXT      NOT NULL,
          embedding   JSONB,
          entry_count INT       NOT NULL DEFAULT 0,
          created_at  TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS ms_user_id_idx ON memory_summaries (user_id);
      ALTER TABLE memory_entries
        ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;
    `);
  } catch (err) {
    logger.warn({
      message:   'ensureMemoryConsolidationSchema failed (non-fatal)',
      component: 'memoryConsolidation',
      err:       String(err),
    });
  }
}

// ── compressMemory ────────────────────────────────────────────────────────────

/**
 * Compress the oldest non-archived memory entries for a user.
 *
 * @param pool       — Postgres pool. When null, returns [] immediately.
 * @param userId     — ID of the authenticated user whose entries to compress.
 * @param batchSize  — Maximum number of entries to consolidate in one call (default 50).
 * @returns          Array of newly created MemorySummary objects (usually length 1 or 0).
 */
export async function compressMemory(
  pool:      Pool | null,
  userId:    string,
  batchSize: number = 50,
): Promise<MemorySummary[]> {
  if (!pool) {
    logger.info({ message: 'compressMemory: no DB pool, skipping', component: 'memoryConsolidation', userId });
    return [];
  }

  try {
    // ── 1. Fetch oldest non-archived entries ──────────────────────────────
    const { rows: entries } = await pool.query<{
      id:         string;
      content:    string;
      created_at: Date;
    }>(
      `SELECT id, content, created_at
         FROM memory_entries
        WHERE user_id = $1
          AND (archived = FALSE OR archived IS NULL)
        ORDER BY created_at ASC
        LIMIT $2`,
      [userId, batchSize],
    );

    if (entries.length === 0) return [];

    // ── 2. Build summary text ─────────────────────────────────────────────
    const summaryText = entries
      .map(e => `[${new Date(e.created_at).toISOString().slice(0, 10)}] ${e.content.slice(0, 200)}`)
      .join('\n');

    // ── 3. Attempt embedding (graceful fallback to null) ──────────────────
    const embedding = await createEmbedding(summaryText).catch(() => null);

    // ── 4. Store summary ──────────────────────────────────────────────────
    const summaryId = crypto.randomUUID();

    await pool.query(
      `INSERT INTO memory_summaries (id, user_id, summary, embedding, entry_count)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        summaryId,
        userId,
        summaryText,
        embedding ? JSON.stringify(embedding) : null,
        entries.length,
      ],
    );

    // ── 5. Archive source entries ─────────────────────────────────────────
    const entryIds = entries.map(e => e.id);
    await pool.query(
      `UPDATE memory_entries SET archived = TRUE WHERE id = ANY($1::uuid[])`,
      [entryIds],
    );

    logger.info({
      message:      'compressMemory: entries consolidated',
      component:    'memoryConsolidation',
      userId,
      entryCount:   entries.length,
      summaryId,
      hasEmbedding: embedding !== null,
    });

    return [{
      id:         summaryId,
      userId,
      summary:    summaryText,
      embedding,
      entryCount: entries.length,
      createdAt:  new Date().toISOString(),
    }];
  } catch (err) {
    logger.warn({
      message:   'compressMemory failed',
      component: 'memoryConsolidation',
      userId,
      err:       String(err),
    });
    return [];
  }
}

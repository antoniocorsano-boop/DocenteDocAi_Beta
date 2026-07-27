/**
 * routes/memory.ts — Memory Layer (P31 — RAG Light)
 *
 * POST /memory          — save a memory entry for the authenticated user
 *                         (embedding generated automatically, stored as JSONB)
 * GET  /memory          — retrieve recent memory entries (query: ?limit=20)
 * POST /memory/search   — semantic similarity search over user's memory entries
 *                         (cosine similarity in JS; pgvector upgrade in P32)
 *
 * Memory entries capture user interactions, agent outputs and relevant events
 * to provide continuity across sessions.
 */

import { Router }               from 'express';
import crypto                   from 'crypto';
import { z }                    from 'zod';
import type { Pool }            from 'pg';
import type { RequestHandler }  from 'express';
import { requireAuth }          from '../middleware/requireAuth';
import { logger }               from '../logger';
import { createEmbedding, cosineSimilarity } from '../services/embedding';
import { extractTags }          from '../services/tagging';
import { compositeScore, temporalDecay, tagBoost } from '../services/ranking';

// ── Schemas ───────────────────────────────────────────────────────────────────

const SaveMemorySchema = z.object({
  content:  z.string().min(1).max(32_000),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const GetMemoryQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform(v => Math.min(Math.max(parseInt(v ?? '20', 10) || 20, 1), 100)),
});

const SearchMemorySchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(20).optional(),
});

// ── DB row types ──────────────────────────────────────────────────────────────

interface MemoryRow {
  id:         string;
  user_id:    string;
  content:    string;
  metadata:   Record<string, unknown>;
  created_at: string;
}

interface MemoryRowWithEmbedding extends MemoryRow {
  embedding:  number[] | null;
  tags:       string[];
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createMemoryRouter(pool: Pool | null): Router {
  const router = Router();

  // POST /memory — save entry (with embedding)
  const saveMemory: RequestHandler = async (req, res): Promise<void> => {
    const parsed = SaveMemorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Input non valido', issues: parsed.error.issues });
      return;
    }

    const { content, metadata } = parsed.data;
    const userId = req.session.userId!;
    const id     = crypto.randomUUID();

    if (!pool) {
      // Dev fallback — log and return OK without persisting
      logger.info({ message: 'memory_entry (no DB)', component: 'memory', userId, preview: content.slice(0, 80) });
      res.status(201).json({ id });
      return;
    }

    // Generate embedding + tags — both non-fatal if they fail
    const [embedding, tags] = await Promise.all([
      createEmbedding(content),
      Promise.resolve(extractTags(content)),
    ]);

    try {
      await pool.query(
        `INSERT INTO memory_entries (id, user_id, content, embedding, tags, metadata)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [id, userId, content, embedding ? JSON.stringify(embedding) : null, tags, JSON.stringify(metadata ?? {})],
      );
      res.status(201).json({ id });
    } catch (err) {
      logger.error({ message: 'memory:save failed', component: 'memory', err: String(err) });
      res.status(500).json({ error: 'Impossibile salvare memoria' });
    }
  };

  // GET /memory — retrieve history
  const getMemory: RequestHandler = async (req, res): Promise<void> => {
    const { data: query } = GetMemoryQuerySchema.safeParse(req.query);
    const limit  = query?.limit ?? 20;
    const userId = req.session.userId!;

    if (!pool) {
      res.json({ entries: [] });
      return;
    }

    try {
      const { rows } = await pool.query<MemoryRow>(
        `SELECT id, user_id, content, metadata, created_at
           FROM memory_entries
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT $2`,
        [userId, limit],
      );
      res.json({ entries: rows });
    } catch (err) {
      logger.error({ message: 'memory:get failed', component: 'memory', err: String(err) });
      res.status(500).json({ error: 'Impossibile recuperare la memoria' });
    }
  };

  // POST /memory/search — semantic similarity search
  const searchMemory: RequestHandler = async (req, res): Promise<void> => {
    const parsed = SearchMemorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Input non valido', issues: parsed.error.issues });
      return;
    }

    const { query, limit = 5 } = parsed.data;
    const userId               = req.session.userId!;

    if (!pool) {
      res.json([]);
      return;
    }

    // Generate query embedding
    const queryEmbedding = await createEmbedding(query);
    if (!queryEmbedding) {
      // No embedding available — return empty (graceful degradation)
      res.json([]);
      return;
    }

    // Extract tags from query for tag-boost computation
    const queryTags = extractTags(query);

    try {
      // Fetch last 200 entries that have an embedding for this user
      const { rows } = await pool.query<MemoryRowWithEmbedding>(
        `SELECT id, user_id, content, metadata, created_at, embedding, tags
           FROM memory_entries
          WHERE user_id = $1
            AND embedding IS NOT NULL
          ORDER BY created_at DESC
          LIMIT 200`,
        [userId],
      );

      // P32-C: composite ranking (cosine + temporal decay + tag boost)
      const scored = rows
        .map(row => {
          const cosineVal   = cosineSimilarity(queryEmbedding, row.embedding as number[]);
          const temporalVal = temporalDecay(new Date(row.created_at));
          const tagVal      = tagBoost(row.tags ?? [], queryTags);
          return {
            content:        row.content,
            tags:           row.tags ?? [],
            score:          compositeScore(cosineVal, temporalVal, tagVal),
            cosine_score:   Math.round(cosineVal   * 10_000) / 10_000,
            temporal_score: Math.round(temporalVal * 10_000) / 10_000,
            tag_score:      Math.round(tagVal      * 10_000) / 10_000,
          };
        })
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      res.json(scored);
    } catch (err) {
      logger.error({ message: 'memory:search failed', component: 'memory', err: String(err) });
      res.status(500).json({ error: 'Impossibile effettuare la ricerca in memoria' });
    }
  };

  // /search must be registered before the bare '/' routes to avoid ambiguity
  router.post('/search', requireAuth, searchMemory);
  router.post('/',       requireAuth, saveMemory);
  router.get('/',        requireAuth, getMemory);

  return router;
}

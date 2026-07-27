/**
 * routes/agentRun.ts — Agent Execution Endpoint (P30)
 *
 * POST /agents/:id/run
 *
 * Flow:
 *   1. Auth check (session)
 *   2. Load agent from DB (or in-memory fallback for built-ins)
 *   3. Token budget check (plan-based: free=100/day, pro=unlimited)
 *   4. Execute via server-side executor
 *   5. Save agent_run record
 *   6. Auto-save input+output to memory_entries
 *   7. Return result
 *
 * Rate limit: 30 runs/min per user (in-memory).
 */

import { Router }            from 'express';
import crypto                from 'crypto';
import { z }                 from 'zod';
import type { Pool }         from 'pg';
import type { RequestHandler } from 'express';
import { requireAuth }       from '../middleware/requireAuth';
import { getExecutor }       from '../agents/executors';
import { logger }            from '../logger';
import { createEmbedding, cosineSimilarity } from '../services/embedding';
import { extractTags }       from '../services/tagging';
import { compositeScore, temporalDecay, tagBoost } from '../services/ranking';

// ── Schemas ───────────────────────────────────────────────────────────────────

const RunInputSchema = z.object({
  input: z.unknown(),
});

// ── In-memory rate limit (30 run/min per userId) ──────────────────────────────

const runRateMap = new Map<string, { count: number; resetAt: number }>();

function checkRunRateLimit(userId: string): boolean {
  const now      = Date.now();
  const existing = runRateMap.get(userId);
  if (!existing || existing.resetAt < now) {
    runRateMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (existing.count >= 30) return false;
  existing.count += 1;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of runRateMap) {
    if (v.resetAt < now) runRateMap.delete(k);
  }
}, 5 * 60_000).unref();

// ── Token budget (daily, per user) ────────────────────────────────────────────

const TOKEN_BUDGET = { free: 10_000, pro: 500_000 } as const;

async function getDailyTokensUsed(pool: Pool, userId: string): Promise<number> {
  const { rows } = await pool.query<{ total: string }>(
    `SELECT COALESCE(SUM(tokens_used),0)::text AS total
       FROM agent_runs
      WHERE user_id = $1
        AND created_at > NOW() - INTERVAL '24 hours'
        AND status = 'success'`,
    [userId],
  );
  return parseInt(rows[0]?.total ?? '0', 10);
}

// ── DB row type ───────────────────────────────────────────────────────────────

interface AgentRow {
  id:               string;
  user_id:          string;
  name:             string;
  type:             string;
  config:           Record<string, unknown>;
  is_active:        boolean;
  estimated_tokens: number;
}

// ── Built-in agent definitions (fallback when no DB) ─────────────────────────

const BUILTIN_AGENTS: AgentRow[] = [
  { id: 'agent.compliance', user_id: 'system', name: 'Compliance',        type: 'compliance', config: {}, is_active: true, estimated_tokens: 10 },
  { id: 'agent.monitoring', user_id: 'system', name: 'Monitoraggio',      type: 'monitoring', config: {}, is_active: true, estimated_tokens: 5  },
  { id: 'agent.cognitive',  user_id: 'system', name: 'Analisi Cognitiva', type: 'cognitive',  config: {}, is_active: true, estimated_tokens: 80 },
];

async function lookupAgent(pool: Pool | null, id: string): Promise<AgentRow | null> {
  // Always check built-ins first (they also exist in DB when seeded)
  const builtin = BUILTIN_AGENTS.find(a => a.id === id);

  if (!pool) return builtin ?? null;

  try {
    const { rows } = await pool.query<AgentRow>(
      'SELECT * FROM agents WHERE id = $1 AND is_active = true',
      [id],
    );
    return rows[0] ?? builtin ?? null;
  } catch {
    return builtin ?? null;
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createAgentRunRouter(pool: Pool | null): Router {
  const router = Router();

  const runAgent: RequestHandler = async (req, res): Promise<void> => {
    const userId = req.session.userId!;
    const userPlan = (req.session.plan ?? 'free') as 'free' | 'pro';
    const { id }   = req.params;

    if (!id) { res.status(400).json({ error: 'agent id mancante' }); return; }

    // Rate limit
    if (!checkRunRateLimit(userId)) {
      res.status(429).json({ error: 'Troppe esecuzioni — riprova tra un minuto', blocked_by: 'rate_limit' });
      return;
    }

    // Validate input body
    const parsed = RunInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Input non valido', issues: parsed.error.issues });
      return;
    }
    const input = parsed.data.input;

    // Load agent
    const agent = await lookupAgent(pool, id);
    if (!agent) {
      res.status(404).json({ error: `Agente "${id}" non trovato`, blocked_by: null });
      return;
    }

    // Token budget check (only when DB is available)
    let blockedBy: string | null = null;
    if (pool) {
      try {
        const used   = await getDailyTokensUsed(pool, userId);
        const budget = TOKEN_BUDGET[userPlan] ?? TOKEN_BUDGET.free;
        if (used + agent.estimated_tokens > budget) {
          blockedBy = 'token';
          await saveRun(pool, { id: crypto.randomUUID(), agentId: agent.id, userId, input, output: null, status: 'blocked', blockedBy, durationMs: 0, tokensUsed: 0 });
          res.status(402).json({ error: 'Budget token esaurito per oggi', blocked_by: 'token' });
          return;
        }
      } catch (err) {
        // Non-fatal — continue execution
        logger.warn({ message: 'token budget check failed, continuing', component: 'agentRun', err: String(err) });
      }
    }

    // P31: Enrich input with relevant memory context (semantic search, non-fatal)
    let enrichedInput = input;
    if (pool) {
      try {
        const inputStr   = typeof input === 'string' ? input : JSON.stringify(input).slice(0, 500);
        const memContext = await fetchMemoryContext(pool, userId, inputStr);
        if (memContext.length > 0) {
          const base       = (typeof input === 'object' && input !== null && !Array.isArray(input))
            ? (input as Record<string, unknown>)
            : { value: input };
          enrichedInput = { ...base, memoryContext: memContext };
        }
      } catch (ctxErr) {
        logger.warn({ message: 'memory context fetch failed, continuing without', component: 'agentRun', err: String(ctxErr) });
      }
    }

    // Execute
    const t0 = Date.now();
    let output: unknown;
    let status: 'success' | 'error' = 'success';
    let errorMsg: string | undefined;

    try {
      const executor = getExecutor(agent.type);
      output = await executor(enrichedInput, agent.config);
    } catch (err) {
      status   = 'error';
      errorMsg = err instanceof Error ? err.message : String(err);
      output   = { error: errorMsg };
      logger.error({ message: 'agent execution failed', component: 'agentRun', agentId: id, err: errorMsg });
    }

    const durationMs  = Date.now() - t0;
    const tokensUsed  = status === 'success' ? agent.estimated_tokens : 0;
    const runId       = crypto.randomUUID();

    // Persist run + memory (best-effort, non-fatal)
    // NOTE: memory saved with original input (not enrichedInput) to avoid recursion
    if (pool) {
      await saveRun(pool, { id: runId, agentId: agent.id, userId, input, output, status, blockedBy: null, durationMs, tokensUsed });
      await saveMemoryEntry(pool, { userId, content: typeof input === 'string' ? input : JSON.stringify(input), metadata: { agentId: agent.id, runId, status } });
    }

    logger.info({ message: 'agent_run', component: 'agentRun', agentId: id, userId, status, durationMs, tokensUsed });

    res.json({
      success:    status === 'success',
      data:       output,
      error:      errorMsg ?? null,
      tokensUsed,
      durationMs,
      simulated:  false,
      blocked_by: blockedBy,
      run_id:     runId,
    });
  };

  router.post('/:id/run', requireAuth, runAgent);
  return router;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function saveRun(
  pool: Pool,
  r: {
    id: string; agentId: string; userId: string; input: unknown; output: unknown;
    status: string; blockedBy: string | null; durationMs: number; tokensUsed: number;
  },
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO agent_runs (id, agent_id, user_id, input, output, status, blocked_by, duration_ms, tokens_used)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [r.id, r.agentId, r.userId, JSON.stringify(r.input), JSON.stringify(r.output),
       r.status, r.blockedBy, r.durationMs, r.tokensUsed],
    );
  } catch (err) {
    logger.warn({ message: 'saveRun failed', component: 'agentRun', err: String(err) });
  }
}

async function saveMemoryEntry(
  pool: Pool,
  m: { userId: string; content: string; metadata: Record<string, unknown> },
): Promise<void> {
  try {
    // P31+P32-C: generate embedding + tags in parallel (both non-fatal)
    const [embedding, tags] = await Promise.all([
      createEmbedding(m.content),
      Promise.resolve(extractTags(m.content)),
    ]);
    await pool.query(
      `INSERT INTO memory_entries (id, user_id, content, embedding, tags, metadata)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [crypto.randomUUID(), m.userId, m.content, embedding ? JSON.stringify(embedding) : null, tags, JSON.stringify(m.metadata)],
    );
  } catch (err) {
    logger.warn({ message: 'saveMemoryEntry failed', component: 'agentRun', err: String(err) });
  }
}

/**
 * P31: Retrieve up to `limit` most semantically relevant memory entries for a user.
 * Used to enrich agent inputs with past context.
 * Returns an empty array if embeddings are unavailable or DB is unreachable.
 */
async function fetchMemoryContext(pool: Pool, userId: string, query: string, limit = 5): Promise<string[]> {
  const queryEmbedding = await createEmbedding(query);
  if (!queryEmbedding) return [];

  const { rows } = await pool.query<{ content: string; embedding: unknown; tags: string[]; created_at: string }>(
    `SELECT content, embedding, tags, created_at
       FROM memory_entries
      WHERE user_id = $1
        AND embedding IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 200`,
    [userId],
  );

  // P32-C: composite score (cosine + temporal decay + tag boost)
  const inputTags = extractTags(query);

  return rows
    .map(row => {
      const cosineVal   = cosineSimilarity(queryEmbedding, row.embedding as number[]);
      const temporalVal = temporalDecay(new Date(row.created_at));
      const tagVal      = tagBoost(row.tags ?? [], inputTags);
      return {
        content: row.content,
        score:   compositeScore(cosineVal, temporalVal, tagVal),
      };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(r => r.content);
}

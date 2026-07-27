/**
 * routes/agents.ts — Agent Registry CRUD (P30)
 *
 * GET    /agents          — list active agents
 * POST   /agents          — create agent (auth required)
 * PATCH  /agents/:id      — update name/config/is_active (auth required, owner only)
 *
 * All routes require session auth via requireAuth middleware.
 * Input validated with Zod v4.
 */

import { Router }            from 'express';
import crypto                from 'crypto';
import { z }                 from 'zod';
import type { Pool }         from 'pg';
import type { RequestHandler } from 'express';
import { requireAuth }       from '../middleware/requireAuth';
import { logger }            from '../logger';

// ── Zod schemas ───────────────────────────────────────────────────────────────

const CreateAgentSchema = z.object({
  name:             z.string().min(1).max(64),
  type:             z.enum(['compliance', 'cognitive', 'monitoring', 'custom']),
  config:           z.record(z.string(), z.unknown()).optional(),
  estimated_tokens: z.number().int().min(1).max(10_000).optional(),
});

const PatchAgentSchema = z.object({
  name:             z.string().min(1).max(64).optional(),
  config:           z.record(z.string(), z.unknown()).optional(),
  estimated_tokens: z.number().int().min(1).max(10_000).optional(),
  is_active:        z.boolean().optional(),
});

// ── DB row type ───────────────────────────────────────────────────────────────

interface AgentRow {
  id:               string;
  user_id:          string;
  name:             string;
  type:             string;
  config:           Record<string, unknown>;
  is_active:        boolean;
  estimated_tokens: number;
  created_at:       string;
  updated_at:       string;
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createAgentsRouter(pool: Pool | null): Router {
  const router = Router();

  // GET /agents — list active agents (public within auth)
  const listAgents: RequestHandler = async (req, res): Promise<void> => {
    if (!pool) {
      // No DB — return empty list gracefully
      res.json({ agents: [] });
      return;
    }
    try {
      const { rows } = await pool.query<AgentRow>(
        'SELECT * FROM agents WHERE is_active = true ORDER BY created_at ASC',
      );
      res.json({ agents: rows });
    } catch (err) {
      logger.error({ message: 'agents:list failed', component: 'agents', err: String(err) });
      res.status(500).json({ error: 'Impossibile recuperare la lista agenti' });
    }
  };

  // POST /agents — create agent
  const createAgent: RequestHandler = async (req, res): Promise<void> => {
    const parsed = CreateAgentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Input non valido', issues: parsed.error.issues });
      return;
    }

    const { name, type, config, estimated_tokens } = parsed.data;
    const id = crypto.randomUUID();

    if (!pool) {
      // dev fallback: return the id without persisting
      res.status(201).json({ id, name, type, config: config ?? {}, is_active: true });
      return;
    }

    try {
      await pool.query(
        `INSERT INTO agents (id, user_id, name, type, config, estimated_tokens, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)`,
        [id, req.session.userId, name, type, JSON.stringify(config ?? {}), estimated_tokens ?? 50],
      );
      logger.info({ message: 'agent_created', component: 'agents', id, name, type, userId: req.session.userId });
      res.status(201).json({ id });
    } catch (err) {
      logger.error({ message: 'agents:create failed', component: 'agents', err: String(err) });
      res.status(500).json({ error: 'Impossibile creare agente' });
    }
  };

  // PATCH /agents/:id — update agent config (owner only)
  const patchAgent: RequestHandler = async (req, res): Promise<void> => {
    const { id } = req.params;
    if (!id) { res.status(400).json({ error: 'id mancante' }); return; }

    const parsed = PatchAgentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Input non valido', issues: parsed.error.issues });
      return;
    }

    if (!pool) {
      res.status(503).json({ error: 'Database non configurato' });
      return;
    }

    try {
      // Verify ownership for non-system agents
      const existing = await pool.query<{ user_id: string }>(
        'SELECT user_id FROM agents WHERE id = $1',
        [id],
      );
      if (!existing.rows[0]) {
        res.status(404).json({ error: 'Agente non trovato' });
        return;
      }
      // System agents (user_id = 'system') can be updated by any authenticated user
      if (existing.rows[0].user_id !== 'system' && existing.rows[0].user_id !== req.session.userId) {
        res.status(403).json({ error: 'Non autorizzato' });
        return;
      }

      const { name, config, estimated_tokens, is_active } = parsed.data;

      // Build dynamic SET clause to only update provided fields
      const setClauses: string[] = ['updated_at = NOW()'];
      const values: unknown[]    = [];
      let   paramIdx             = 1;

      if (name !== undefined)             { setClauses.push(`name = $${paramIdx++}`);             values.push(name); }
      if (config !== undefined)           { setClauses.push(`config = $${paramIdx++}`);           values.push(JSON.stringify(config)); }
      if (estimated_tokens !== undefined) { setClauses.push(`estimated_tokens = $${paramIdx++}`); values.push(estimated_tokens); }
      if (is_active !== undefined)        { setClauses.push(`is_active = $${paramIdx++}`);        values.push(is_active); }

      values.push(id);
      await pool.query(
        `UPDATE agents SET ${setClauses.join(', ')} WHERE id = $${paramIdx}`,
        values,
      );

      logger.info({ message: 'agent_updated', component: 'agents', id, userId: req.session.userId });
      res.json({ ok: true });
    } catch (err) {
      logger.error({ message: 'agents:patch failed', component: 'agents', err: String(err) });
      res.status(500).json({ error: 'Impossibile aggiornare agente' });
    }
  };

  router.get('/',     requireAuth, listAgents);
  router.post('/',    requireAuth, createAgent);
  router.patch('/:id', requireAuth, patchAgent);

  return router;
}

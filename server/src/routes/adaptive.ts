/**
 * routes/adaptive.ts — Adaptive Intelligence Layer API (P34)
 *
 * POST /adaptive/outcomes          — log one agent execution outcome
 * POST /adaptive/scores/update     — recompute score for a single agent
 * GET  /adaptive/scores            — fetch all agent scores (desc by score)
 * POST /adaptive/memory/compress   — compress memory entries for the authenticated user
 *
 * All endpoints require an active session (requireAuth middleware).
 * DB errors are swallowed internally — clients always receive a response.
 */

import { Router }              from 'express';
import { z }                   from 'zod';
import type { Pool }           from 'pg';
import type { RequestHandler } from 'express';
import { requireAuth }         from '../middleware/requireAuth';
import { logger }              from '../logger';
import {
  logAgentOutcome,
  updateAgentScore,
  getAgentScores,
} from '../services/adaptive';
import { compressMemory } from '../services/memoryConsolidation';
import {
  getAdaptiveSummary,
  getAgentParams,
  getAllAgentParams,
  applyAdaptiveUpdate,
  rollbackAdaptiveUpdate,
  MAX_UPDATES_PER_DAY,
} from '../services/feedbackLoop';

// ── Validation schemas ────────────────────────────────────────────────────────

const LogOutcomeSchema = z.object({
  agentId:     z.string().min(1).max(100),
  input:       z.unknown().optional(),
  output:      z.unknown().optional(),
  success:     z.boolean(),
  tokensUsed:  z.number().int().min(0).max(1_000_000),
  cosineScore: z.number().min(-1).max(1).optional().nullable(),
});

const UpdateScoreSchema = z.object({
  agentId: z.string().min(1).max(100),
});

const CompressMemorySchema = z.object({
  batchSize: z.number().int().min(1).max(200).optional().default(50),
});

const UpdateParamsSchema = z.object({
  agentId:      z.string().min(1).max(100),
  newParams:    z.record(z.string(), z.unknown()),
  triggerType:  z.enum(['auto', 'manual']).optional().default('manual'),
  learningRate: z.number().min(0.01).max(1).optional(),
});

const RollbackSchema = z.object({
  updateId: z.number().int().positive(),
});

const GetParamsSchema = z.object({
  agentId: z.string().min(1).max(100).optional(),
});

// ── Router factory ────────────────────────────────────────────────────────────

export function createAdaptiveRouter(pool: Pool | null): Router {
  const router = Router();

  // ── POST /adaptive/outcomes ───────────────────────────────────────────────
  const logOutcomeHandler: RequestHandler = async (req, res): Promise<void> => {
    const parsed = LogOutcomeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Input non valido', issues: parsed.error.issues });
      return;
    }
    await logAgentOutcome(pool, parsed.data);
    logger.info({
      message:   'adaptive: outcome logged',
      component: 'adaptive-route',
      agentId:   parsed.data.agentId,
      success:   parsed.data.success,
    });
    res.status(201).json({ ok: true });
  };

  // ── POST /adaptive/scores/update ──────────────────────────────────────────
  const updateScoreHandler: RequestHandler = async (req, res): Promise<void> => {
    const parsed = UpdateScoreSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Input non valido', issues: parsed.error.issues });
      return;
    }
    await updateAgentScore(pool, parsed.data.agentId);
    res.json({ ok: true });
  };

  // ── GET /adaptive/scores ──────────────────────────────────────────────────
  const getScoresHandler: RequestHandler = async (_req, res): Promise<void> => {
    const scores = await getAgentScores(pool);
    res.json({ scores });
  };

  // ── POST /adaptive/memory/compress ────────────────────────────────────────
  const compressMemoryHandler: RequestHandler = async (req, res): Promise<void> => {
    const parsed    = CompressMemorySchema.safeParse(req.body);
    const batchSize = parsed.success ? parsed.data.batchSize : 50;
    const userId    = req.session.userId!;
    const summaries = await compressMemory(pool, userId, batchSize);
    res.json({ summaries, count: summaries.length });
  };

  // ── GET /adaptive/summary ────────────────────────────────────────────────
  const getSummaryHandler: RequestHandler = async (_req, res): Promise<void> => {
    const summary = await getAdaptiveSummary(pool);
    res.json({ summary });
  };

  // ── POST /adaptive/update — beta only ─────────────────────────────────────
  const updateParamsHandler: RequestHandler = async (req, res): Promise<void> => {
    const parsed = UpdateParamsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Input non valido', issues: parsed.error.issues });
      return;
    }
    const userId = req.session.userId!;
    const plan   = req.session.plan;
    const result = await applyAdaptiveUpdate(pool, {
      ...parsed.data,
      triggeredBy: userId,
      userPlan:    plan,
    });
    if (result.notBeta) {
      res.status(403).json({
        error: 'Aggiornamenti live disponibili solo per utenti beta (piano Pro)',
        code:  'NOT_BETA',
      });
      return;
    }
    if (result.limitExceeded) {
      res.status(429).json({
        error: `Limite giornaliero di ${MAX_UPDATES_PER_DAY} aggiornamenti per agente raggiunto`,
        code:  'LIMIT_EXCEEDED',
      });
      return;
    }
    logger.info({
      message:   'adaptive: params updated',
      component: 'adaptive-route',
      agentId:   parsed.data.agentId,
      userId,
      updateId:  result.updateId,
    });
    res.json({ ok: true, updateId: result.updateId, rolledBack: result.rolledBack });
  };

  // ── POST /adaptive/rollback ───────────────────────────────────────────────
  const rollbackHandler: RequestHandler = async (req, res): Promise<void> => {
    const parsed = RollbackSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Input non valido', issues: parsed.error.issues });
      return;
    }
    const success = await rollbackAdaptiveUpdate(pool, parsed.data.updateId);
    if (!success) {
      res.status(404).json({ error: 'Update non trovato o già rolled back', code: 'NOT_FOUND' });
      return;
    }
    res.json({ ok: true, rolledBack: true });
  };

  // ── GET /adaptive/params ──────────────────────────────────────────────────
  const getParamsHandler: RequestHandler = async (req, res): Promise<void> => {
    const parsed  = GetParamsSchema.safeParse(req.query);
    const agentId = parsed.success ? parsed.data.agentId : undefined;
    if (agentId) {
      const params = await getAgentParams(pool, agentId);
      res.json({ params: [{ agentId, params }] });
    } else {
      const params = await getAllAgentParams(pool);
      res.json({ params });
    }
  };

  router.post('/outcomes',         requireAuth, logOutcomeHandler);
  router.post('/scores/update',    requireAuth, updateScoreHandler);
  router.get( '/scores',           requireAuth, getScoresHandler);
  router.post('/memory/compress',  requireAuth, compressMemoryHandler);
  router.get( '/summary',          requireAuth, getSummaryHandler);
  router.post('/update',           requireAuth, updateParamsHandler);
  router.post('/rollback',         requireAuth, rollbackHandler);
  router.get( '/params',           requireAuth, getParamsHandler);

  return router;
}

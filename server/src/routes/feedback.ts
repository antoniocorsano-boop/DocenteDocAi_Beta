/**
 * routes/feedback.ts — Continuous Feedback Loop API (P35)
 *
 * POST /feedback — receive per-outcome user feedback (rating, notes, tags)
 *
 * Accessible by all authenticated users (base + beta).
 * Base users: data stored for offline analysis only.
 * Beta users (plan='pro'): data feeds the live adaptive update pipeline.
 */

import { Router }              from 'express';
import { z }                   from 'zod';
import type { Pool }           from 'pg';
import type { RequestHandler } from 'express';
import { requireAuth }         from '../middleware/requireAuth';
import { logger }              from '../logger';
import { recordFeedback }      from '../services/feedbackLoop';

// ── Validation schema ─────────────────────────────────────────────────────────

const FeedbackSchema = z.object({
  outcomeId: z.number().int().positive().optional(),
  agentId:   z.string().min(1).max(100).optional(),
  rating:    z.number().int().min(1).max(5),
  notes:     z.string().max(2000).optional(),
  tags:      z.array(z.string().max(50)).max(20).optional().default([]),
});

// ── Router factory ────────────────────────────────────────────────────────────

export function createFeedbackRouter(pool: Pool | null): Router {
  const router = Router();

  const submitFeedbackHandler: RequestHandler = async (req, res): Promise<void> => {
    const parsed = FeedbackSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Input non valido', issues: parsed.error.issues });
      return;
    }

    const userId = req.session.userId!;
    await recordFeedback(pool, { ...parsed.data, userId });

    logger.info({
      message:   'feedback: recorded',
      component: 'feedback-route',
      userId,
      agentId:   parsed.data.agentId,
      rating:    parsed.data.rating,
    });

    res.status(201).json({ ok: true });
  };

  router.post('/', requireAuth, submitFeedbackHandler);

  return router;
}

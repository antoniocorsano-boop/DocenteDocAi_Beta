/**
 * routes/audit.ts — Filterable Audit Log Read (P30)
 *
 * GET /audit — returns audit_log entries for the authenticated user
 *
 * Query parameters:
 *   limit  (default 50, max 200)
 *   action (filter by action substring)
 *   from   (ISO date string, inclusive)
 *   to     (ISO date string, inclusive)
 *
 * Existing POST /audit/log (write path) remains in index.ts.
 */

import { Router }          from 'express';
import { z }               from 'zod';
import type { Pool }       from 'pg';
import type { RequestHandler } from 'express';
import { requireAuth }     from '../middleware/requireAuth';
import { logger }          from '../logger';

// ── Schema ────────────────────────────────────────────────────────────────────

const AuditQuerySchema = z.object({
  limit:  z.string().optional().transform(v => Math.min(Math.max(parseInt(v ?? '50', 10) || 50, 1), 200)),
  action: z.string().max(128).optional(),
  from:   z.string().optional(),
  to:     z.string().optional(),
});

// ── DB row type ───────────────────────────────────────────────────────────────

interface AuditRow {
  id:         number;
  user_id:    string;
  action:     string;
  details:    Record<string, unknown> | null;
  created_at: string;
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createAuditRouter(pool: Pool | null): Router {
  const router = Router();

  const getAudit: RequestHandler = async (req, res): Promise<void> => {
    if (!pool) {
      res.json({ entries: [] });
      return;
    }

    const { data: query } = AuditQuerySchema.safeParse(req.query);
    const limit  = query?.limit ?? 50;
    const userId = req.session.userId!;

    // Build a safe parameterized query with optional filters
    const conditions: string[] = ['user_id = $1'];
    const values: unknown[]    = [userId];
    let   paramIdx             = 2;

    if (query?.action) {
      conditions.push(`action ILIKE $${paramIdx++}`);
      values.push(`%${query.action}%`);
    }
    if (query?.from) {
      const fromDate = new Date(query.from);
      if (!isNaN(fromDate.getTime())) {
        conditions.push(`created_at >= $${paramIdx++}`);
        values.push(fromDate.toISOString());
      }
    }
    if (query?.to) {
      const toDate = new Date(query.to);
      if (!isNaN(toDate.getTime())) {
        conditions.push(`created_at <= $${paramIdx++}`);
        values.push(toDate.toISOString());
      }
    }

    values.push(limit);
    const sql = `
      SELECT id, user_id, action, details, created_at
        FROM audit_log
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${paramIdx}
    `;

    try {
      const { rows } = await pool.query<AuditRow>(sql, values);
      res.json({ entries: rows });
    } catch (err) {
      logger.error({ message: 'audit:get failed', component: 'audit', err: String(err) });
      res.status(500).json({ error: 'Impossibile recuperare i log di audit' });
    }
  };

  router.get('/', requireAuth, getAudit);
  return router;
}

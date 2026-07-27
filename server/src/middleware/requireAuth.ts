/**
 * middleware/requireAuth.ts — session-based auth guard
 *
 * Usage: app.get('/protected', requireAuth, handler)
 */

import type { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

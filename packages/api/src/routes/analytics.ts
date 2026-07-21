import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// POST /v1/analytics/event — fire-and-forget event tracking
router.post('/analytics/event', async (req: Request, res: Response) => {
  const { event, props, timestamp } = req.body;

  if (!event || typeof event !== 'string') {
    res.status(400).json({ error: 'Missing event name' });
    return;
  }

  // Optional: extract userId from token
  let userId: string | undefined;
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = payload.userId;
    } catch {}
  }

  // Fire and forget — don't block response
  prisma.analyticsEvent.create({
    data: {
      event: event.slice(0, 100),
      props: props || undefined,
      userId: userId || undefined,
      sessionId: (req.headers['x-session-id'] as string)?.slice(0, 64) || undefined,
    },
  }).catch(() => {});

  res.json({ ok: true });
});

// GET /v1/analytics/summary — basic stats (protected, for admin)
router.get('/analytics/summary', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [todayCount, weekCount, topEvents] = await Promise.all([
    prisma.analyticsEvent.count({ where: { createdAt: { gte: today } } }),
    prisma.analyticsEvent.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.$queryRaw`SELECT event, COUNT(*)::int as count FROM analytics_events WHERE created_at >= ${weekAgo} GROUP BY event ORDER BY count DESC LIMIT 10` as Promise<any[]>,
  ]);

  res.json({ today: todayCount, week: weekCount, topEvents });
});

export default router;

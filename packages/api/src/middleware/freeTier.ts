import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export async function freeTierGuard(req: Request, _res: Response, next: NextFunction) {
  // Only apply to POST requests that create stories/chapters
  if (req.method !== 'POST') { next(); return; }
  if (!req.path.match(/\/stories$|\/stories\/[^/]+\/chapters$/)) { next(); return; }

  // Parse userId from token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { next(); return; }

  let userId: string;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    userId = payload.userId;
  } catch {
    next(); return;
  }

  // Check user credits — deduct upfront, refund on failure
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (user && user.credits > 0) {
    await prisma.user.update({ where: { id: userId }, data: { credits: { decrement: 1 } } });
    (req as any).skipPayment = true;
    (req as any).creditDeducted = true;
  }

  next();
}

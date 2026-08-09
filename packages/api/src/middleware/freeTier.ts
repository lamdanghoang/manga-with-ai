import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { verifyAccessToken } from '../lib/auth';

export async function freeTierGuard(req: Request, _res: Response, next: NextFunction) {
  // Only apply to POST requests that create stories/chapters
  if (req.method !== 'POST') { next(); return; }
  if (!req.path.match(/\/stories$|\/stories\/[^/]+\/chapters$/)) { next(); return; }

  // Parse userId from token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { next(); return; }

  let userId: string;
  let tokenVersion: number;
  try {
    const payload = verifyAccessToken(token);
    userId = payload.userId;
    tokenVersion = payload.tokenVersion;
  } catch {
    next(); return;
  }

  // Claim one credit atomically so concurrent requests cannot spend the same credit.
  const claimed = await prisma.user.updateMany({
    where: { id: userId, tokenVersion, credits: { gt: 0 } },
    data: { credits: { decrement: 1 } },
  });

  if (claimed.count === 1) {
    (req as any).skipPayment = true;
    (req as any).creditDeducted = true;
  }

  next();
}

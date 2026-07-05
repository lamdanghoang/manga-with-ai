import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export async function freeTierGuard(req: Request, _res: Response, next: NextFunction) {
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

  // Check user credits
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (user && user.credits > 0) {
    (req as any).skipPayment = true;
  }

  next();
}

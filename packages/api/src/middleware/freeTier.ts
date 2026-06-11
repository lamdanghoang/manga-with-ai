import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const FREE_GENERATIONS = 1; // First create story is free

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

  // Count total completed/running generations
  const jobCount = await prisma.generationJob.count({
    where: { userId, status: { in: ['completed', 'running', 'queued'] } },
  });

  if (jobCount < FREE_GENERATIONS) {
    (req as any).skipPayment = true;
  }

  next();
}

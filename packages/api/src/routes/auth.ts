import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyMessage } from 'viem';
import { prisma } from '../lib/prisma';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export interface AuthRequest extends Request {
  userId?: string;
}

export async function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { _res.status(401).json({ error: 'Unauthorized' }); return; }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    _res.status(401).json({ error: 'Invalid token' });
  }
}

router.post('/session/minipay', async (req: Request, res: Response) => {
  const { walletAddress, nonce, signature } = req.body;
  if (!walletAddress || !nonce || !signature) {
    res.status(400).json({ error: 'Missing walletAddress, nonce, or signature' });
    return;
  }

  try {
    const valid = await verifyMessage({
      address: walletAddress as `0x${string}`,
      message: nonce,
      signature: signature as `0x${string}`,
    });
    if (!valid) { res.status(401).json({ error: 'Invalid signature' }); return; }

    const user = await prisma.user.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      update: {},
      create: { walletAddress: walletAddress.toLowerCase() },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, walletAddress: user.walletAddress, displayName: user.displayName } });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

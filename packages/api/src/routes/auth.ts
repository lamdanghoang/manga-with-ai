import { Router, Request, Response, NextFunction } from 'express';
import { randomBytes } from 'node:crypto';
import { verifyMessage } from 'viem';
import { prisma } from '../lib/prisma';
import { signAccessToken, verifyAccessToken } from '../lib/auth';
import { rateLimit, requestIp } from '../middleware/rateLimit';

const router = Router();
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const AUTH_DOMAIN = process.env.AUTH_DOMAIN || 'MangaWithAI';

export interface AuthRequest extends Request {
  userId?: string;
}

export async function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { _res.status(401).json({ error: 'Unauthorized' }); return; }
  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { tokenVersion: true } });
    if (!user || user.tokenVersion !== payload.tokenVersion) { _res.status(401).json({ error: 'Invalid token' }); return; }
    req.userId = payload.userId;
    next();
  } catch {
    _res.status(401).json({ error: 'Invalid token' });
  }
}

router.post('/auth/challenge', rateLimit({ windowMs: 5 * 60_000, max: 5, key: (req) => `${requestIp(req)}:${String(req.body?.walletAddress || '').toLowerCase()}` }), async (req: Request, res: Response) => {
  const walletAddress = String(req.body?.walletAddress || '').toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(walletAddress)) {
    res.status(400).json({ error: 'Invalid wallet address' });
    return;
  }

  await prisma.authChallenge.deleteMany({ where: { OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }] } });
  const nonce = randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
  const message = `${AUTH_DOMAIN} wants you to sign in with your wallet:\n${walletAddress}\n\nNonce: ${nonce}\nExpires At: ${expiresAt.toISOString()}`;

  await prisma.authChallenge.create({ data: { walletAddress, nonce, message, expiresAt } });
  res.json({ nonce, message, expiresAt: expiresAt.toISOString() });
});

router.post('/session/minipay', async (req: Request, res: Response) => {
  const walletAddress = String(req.body?.walletAddress || '').toLowerCase();
  const { nonce, signature } = req.body;
  if (!/^0x[a-f0-9]{40}$/.test(walletAddress) || !nonce || !signature) {
    res.status(400).json({ error: 'Invalid walletAddress, nonce, or signature' });
    return;
  }

  try {
    const challenge = await prisma.authChallenge.findUnique({ where: { nonce } });
    if (!challenge || challenge.walletAddress !== walletAddress || challenge.usedAt || challenge.expiresAt <= new Date()) {
      res.status(401).json({ error: 'Invalid or expired challenge' }); return;
    }

    const valid = await verifyMessage({
      address: walletAddress as `0x${string}`,
      message: challenge.message,
      signature: signature as `0x${string}`,
    });
    if (!valid) { res.status(401).json({ error: 'Invalid signature' }); return; }

    const consumed = await prisma.authChallenge.updateMany({
      where: { id: challenge.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1) { res.status(401).json({ error: 'Challenge already used' }); return; }

    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: {},
      create: { walletAddress },
    });

    const token = signAccessToken(user.id, user.tokenVersion);
    res.json({ token, user: { id: user.id, walletAddress: user.walletAddress, displayName: user.displayName } });
  } catch (e: any) {
    console.error('[AUTH] Session creation failed:', e);
    res.status(500).json({ error: 'Unable to create session' });
  }
});

router.post('/auth/revoke', authMiddleware, async (req: AuthRequest, res: Response) => {
  await prisma.user.update({ where: { id: req.userId! }, data: { tokenVersion: { increment: 1 } } });
  res.status(204).end();
});

export default router;

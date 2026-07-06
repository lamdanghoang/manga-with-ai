import { Router, Response } from 'express';
import { createPublicClient, http, parseAbiItem, decodeEventLog } from 'viem';
import { celoAlfajores } from 'viem/chains';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from './auth';

const router = Router();

const USDC_ADDRESS = '0x01c5c0122039549ad1493b8220cabedd739bc44e';
const MERCHANT_ADDRESS = '0x792ca42f2c2f9d9fb56ddbbfe9a0916ae6e98dd8';

const PACKAGES = {
  starter: { credits: 5, priceRaw: 3000000n, tier: 'starter' },
  creator: { credits: 25, priceRaw: 5000000n, tier: 'creator' },
  pro: { credits: 70, priceRaw: 10000000n, tier: 'pro' },
} as const;

const TIER_RANK: Record<string, number> = { free: 0, starter: 1, creator: 2, pro: 3 };

const celoSepolia = {
  ...celoAlfajores,
  id: 11142220,
  name: 'Celo Sepolia',
  rpcUrls: {
    default: { http: ['https://forno.celo-sepolia.celo-testnet.org'] },
  },
} as const;

const client = createPublicClient({
  chain: celoSepolia as any,
  transport: http('https://forno.celo-sepolia.celo-testnet.org'),
});

const transferEvent = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

router.get('/user/credits', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { credits: true, tier: true },
  });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json({ credits: user.credits, tier: user.tier });
});

router.post('/user/buy-package', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { paymentTx, package: packageName } = req.body;

  if (!paymentTx || !packageName) {
    res.status(400).json({ error: 'Missing paymentTx or package' });
    return;
  }

  const pkg = PACKAGES[packageName as keyof typeof PACKAGES];
  if (!pkg) {
    res.status(400).json({ error: 'Invalid package. Must be starter, creator, or pro' });
    return;
  }

  // Check duplicate
  const existing = await prisma.creditPurchase.findFirst({
    where: { paymentTx },
  });
  if (existing) {
    res.status(409).json({ error: 'This transaction has already been used' });
    return;
  }

  // Verify on-chain
  let receipt;
  try {
    receipt = await client.getTransactionReceipt({ hash: paymentTx as `0x${string}` });
  } catch (err) {
    res.status(400).json({ error: 'Transaction not found on-chain' });
    return;
  }

  if (receipt.status !== 'success') {
    res.status(400).json({ error: 'Transaction failed on-chain' });
    return;
  }

  // Find USDC Transfer to merchant
  let transferAmount = 0n;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== USDC_ADDRESS) continue;
    try {
      const decoded = decodeEventLog({
        abi: [transferEvent],
        data: log.data,
        topics: log.topics,
      });
      if ((decoded.args as any).to.toLowerCase() === MERCHANT_ADDRESS) {
        transferAmount = (decoded.args as any).value as bigint;
        break;
      }
    } catch {
      continue;
    }
  }

  if (transferAmount < pkg.priceRaw) {
    res.status(400).json({ error: `Insufficient payment. Expected at least ${pkg.priceRaw.toString()} but got ${transferAmount.toString()}` });
    return;
  }

  // Determine new tier (never downgrade)
  const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { tier: true } });
  const currentTierRank = TIER_RANK[user?.tier || 'free'] || 0;
  const newTierRank = TIER_RANK[pkg.tier] || 0;
  const finalTier = newTierRank > currentTierRank ? pkg.tier : (user?.tier || 'free');

  // Update user credits and tier, record purchase
  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: req.userId! },
      data: {
        credits: { increment: pkg.credits },
        tier: finalTier,
      },
    }),
    prisma.creditPurchase.create({
      data: {
        userId: req.userId!,
        package: packageName,
        credits: pkg.credits,
        amountUsd: String(Number(pkg.priceRaw) / 1_000_000),
        paymentTx,
      },
    }),
  ]);

  res.json({
    success: true,
    credits: updatedUser.credits,
    tier: updatedUser.tier,
    added: pkg.credits,
  });
});

export default router;

import { Router, Response } from 'express';
import { createPublicClient, http, parseAbiItem, decodeEventLog, defineChain } from 'viem';
import { celo } from 'viem/chains';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from './auth';

const router = Router();

const IS_MAINNET = process.env.CHAIN === 'mainnet';

// Accepted payment tokens
const ACCEPTED_TOKENS = IS_MAINNET
  ? [
      { symbol: "USDC", address: "0xceba9300f2b948710d2653dd7b07f33a8b32118c", decimals: 6 },
      { symbol: "USDT", address: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e", decimals: 6 },
      { symbol: "cUSD", address: "0x765de816845861e75a25fca122bb6898b8b1282a", decimals: 18 },
    ]
  : [
      { symbol: "USDC", address: "0x01c5c0122039549ad1493b8220cabedd739bc44e", decimals: 6 },
      { symbol: "USDT", address: "0xd077a400968890eacc75cdc901f0356c943e4fdb", decimals: 6 },
      { symbol: "USDm", address: "0xde9e4c3ce781b4ba68120d6261cbad65ce0ab00b", decimals: 18 },
    ];

const ACCEPTED_TOKEN_ADDRESSES = ACCEPTED_TOKENS.map((t) => t.address);

const MERCHANT_ADDRESS = (process.env.MERCHANT_WALLET || '0x792cA42F2C2f9D9fB56dDBbfE9a0916AE6e98DD8').toLowerCase();

const PACKAGES = {
  starter: { credits: 5, priceUsd: 3, tier: 'starter' },
  creator: { credits: 25, priceUsd: 5, tier: 'creator' },
  pro: { credits: 70, priceUsd: 10, tier: 'pro' },
} as const;

// Get required amount based on token decimals
function getRequiredAmountForPackage(priceUsd: number, tokenAddress: string): bigint {
  const token = ACCEPTED_TOKENS.find((t) => t.address === tokenAddress);
  const decimals = token?.decimals || 6;
  return BigInt(priceUsd) * BigInt(10 ** decimals);
}

const TIER_RANK: Record<string, number> = { free: 0, starter: 1, creator: 2, pro: 3 };

const celoSepolia = defineChain({
  id: 11142220,
  name: 'Celo Sepolia',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  rpcUrls: { default: { http: ['https://forno.celo-sepolia.celo-testnet.org'] } },
  testnet: true,
});

const activeChain = IS_MAINNET ? celo : celoSepolia;

const client = createPublicClient({
  chain: activeChain,
  transport: http(),
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

  // Find Transfer to merchant from any accepted token
  let transferAmount = 0n;
  let transferTokenAddress = '';
  let transferTokenSymbol = '';
  for (const log of receipt.logs) {
    if (!ACCEPTED_TOKEN_ADDRESSES.includes(log.address.toLowerCase())) continue;
    try {
      const decoded = decodeEventLog({
        abi: [transferEvent],
        data: log.data,
        topics: log.topics,
      });
      if ((decoded.args as any).to.toLowerCase() === MERCHANT_ADDRESS) {
        transferAmount = (decoded.args as any).value as bigint;
        transferTokenAddress = log.address.toLowerCase();
        transferTokenSymbol = ACCEPTED_TOKENS.find((t) => t.address === transferTokenAddress)?.symbol || 'USDC';
        break;
      }
    } catch {
      continue;
    }
  }

  const requiredAmount = getRequiredAmountForPackage(pkg.priceUsd, transferTokenAddress);
  if (transferAmount < requiredAmount) {
    res.status(400).json({ error: `Insufficient payment. Expected $${pkg.priceUsd} equivalent but received less.` });
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
        amountUsd: String(pkg.priceUsd),
        paymentTx,
        paymentToken: transferTokenSymbol,
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

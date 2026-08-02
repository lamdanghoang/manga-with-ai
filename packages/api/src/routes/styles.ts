import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "./auth";

const router = Router();

/**
 * GET /v1/styles
 * List all available style templates.
 * Returns tier info so frontend can gate VIP styles.
 */
router.get("/styles", async (_req, res) => {
  const styles = await prisma.styleTemplate.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      previewUrl: true,
      category: true,
      tier: true,
    },
  });
  res.json({ items: styles });
});

/**
 * GET /v1/user/subscription
 * Get current user's subscription status.
 */
router.get(
  "/user/subscription",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const sub = await prisma.userSubscription.findFirst({
      where: { userId: req.userId!, isActive: true },
      orderBy: { createdAt: "desc" },
    });

    const isVip =
      sub && (sub.plan === "vip" || sub.plan === "vip_unlimited") &&
      (!sub.expiresAt || sub.expiresAt > new Date());

    // Count stories this month for quota
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyStories = await prisma.generationJob.count({
      where: {
        userId: req.userId!,
        status: { in: ["completed", "running", "queued"] },
        createdAt: { gte: monthStart },
      },
    });

    const quotas: Record<string, number> = { vip: 20, vip_unlimited: -1 };
    const quota = isVip ? (quotas[sub!.plan] || 0) : 0;
    const remaining = quota === -1 ? -1 : Math.max(0, quota - monthlyStories);

    res.json({
      plan: isVip ? sub!.plan : "free",
      expiresAt: sub?.expiresAt?.toISOString() || null,
      monthlyStories,
      quota,        // -1 = unlimited
      remaining,    // -1 = unlimited
    });
  },
);

/**
 * POST /v1/user/subscribe
 * Upgrade to VIP plan with payment.
 * Body: { paymentTx: string, plan: "vip" | "vip_unlimited" }
 */
router.post(
  "/user/subscribe",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const { paymentTx, plan } = req.body;
    const validPlans: Record<string, { amount: bigint; stories: number }> = {
      vip: { amount: BigInt(2000000), stories: 20 },           // $2 USDC
      vip_unlimited: { amount: BigInt(5000000), stories: -1 }, // $5 USDC, -1 = unlimited
    };

    if (!validPlans[plan]) {
      res.status(400).json({ error: "Invalid plan. Use 'vip' or 'vip_unlimited'" });
      return;
    }
    if (!paymentTx) {
      res.status(400).json({ error: "Payment transaction required" });
      return;
    }

    // Check for duplicate tx
    const existing = await prisma.userSubscription.findFirst({
      where: { paymentTx },
    });
    if (existing) {
      res.status(400).json({ error: "Payment already used" });
      return;
    }

    // Verify payment on-chain
    let paidTokenSymbol = "USDC";
    try {
      const { createPublicClient, http, defineChain } = await import("viem");
      const { celo } = await import("viem/chains");

      const IS_MAINNET = process.env.CHAIN === "mainnet";
      const celoSepolia = defineChain({
        id: 11142220,
        name: "Celo Sepolia",
        nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
        rpcUrls: { default: { http: ["https://forno.celo-sepolia.celo-testnet.org"] } },
        testnet: true,
      });

      const client = createPublicClient({ chain: IS_MAINNET ? celo : celoSepolia, transport: http() });
      const receipt = await client.getTransactionReceipt({ hash: paymentTx as `0x${string}` });

      if (!receipt || receipt.status !== "success") {
        res.status(400).json({ error: "Transaction failed or not found" });
        return;
      }

      // Verify payment with any accepted stablecoin
      const ACCEPTED = IS_MAINNET
        ? [
            "0xceba9300f2b948710d2653dd7b07f33a8b32118c", // USDC
            "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e", // USDT
            "0x765de816845861e75a25fca122bb6898b8b1282a", // cUSD
          ]
        : [
            "0x01c5c0122039549ad1493b8220cabedd739bc44e", // USDC
            "0xd077a400968890eacc75cdc901f0356c943e4fdb", // USDT
            "0xde9e4c3ce781b4ba68120d6261cbad65ce0ab00b", // USDm
          ];
      const MERCHANT = (process.env.MERCHANT_WALLET || "0x792cA42F2C2f9D9fB56dDBbfE9a0916AE6e98DD8").toLowerCase();
      const REQUIRED_6 = validPlans[plan].amount; // 6-decimal amount
      const REQUIRED_18 = validPlans[plan].amount * BigInt(1e12); // 18-decimal equivalent

      const transferLog = receipt.logs.find(
        (log) =>
          ACCEPTED.includes(log.address.toLowerCase()) &&
          log.topics[2]?.toLowerCase().includes(MERCHANT.slice(2)),
      );

      if (!transferLog) {
        res.status(400).json({ error: "No stablecoin transfer to merchant found" });
        return;
      }

      const amount = BigInt(transferLog.data);
      // Check against correct decimals (cUSD/USDm = 18 decimals, USDC/USDT = 6)
      const is18Decimals = transferLog.address.toLowerCase() === ACCEPTED[2];
      const required = is18Decimals ? REQUIRED_18 : REQUIRED_6;
      if (amount < required) {
        res.status(400).json({ error: `Insufficient payment for ${plan} plan` });
        return;
      }

      // Determine which token was used
      paidTokenSymbol = ACCEPTED.indexOf(transferLog.address.toLowerCase()) === 2
        ? (IS_MAINNET ? "cUSD" : "USDm")
        : ACCEPTED.indexOf(transferLog.address.toLowerCase()) === 1 ? "USDT" : "USDC";
    } catch (verifyErr: any) {
      res.status(400).json({ error: "Verify failed: " + (verifyErr.message || "").slice(0, 100) });
      return;
    }

    // Create subscription (30 days)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const sub = await prisma.userSubscription.create({
      data: {
        userId: req.userId!,
        plan,
        paymentTx,
        paymentToken: paidTokenSymbol,
        expiresAt,
      },
    });

    res.json({
      plan: "vip",
      expiresAt: sub.expiresAt?.toISOString(),
      message: "VIP unlocked for 30 days!",
    });
  },
);

export default router;

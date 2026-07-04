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
      sub?.plan === "vip" && (!sub.expiresAt || sub.expiresAt > new Date());

    res.json({
      plan: isVip ? "vip" : "free",
      expiresAt: sub?.expiresAt?.toISOString() || null,
    });
  },
);

/**
 * POST /v1/user/subscribe
 * Upgrade to VIP plan with payment.
 * Body: { paymentTx: string, plan: "vip" }
 */
router.post(
  "/user/subscribe",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const { paymentTx, plan } = req.body;
    if (plan !== "vip") {
      res.status(400).json({ error: "Invalid plan" });
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
    try {
      const { createPublicClient, http, defineChain } = await import("viem");
      const celoSepolia = defineChain({
        id: 11142220,
        name: "Celo Sepolia",
        nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
        rpcUrls: { default: { http: ["https://forno.celo-sepolia.celo-testnet.org"] } },
        testnet: true,
      });

      const client = createPublicClient({ chain: celoSepolia, transport: http() });
      const receipt = await client.getTransactionReceipt({ hash: paymentTx as `0x${string}` });

      if (!receipt || receipt.status !== "success") {
        res.status(400).json({ error: "Transaction failed or not found" });
        return;
      }

      // Verify it's a USDC transfer to merchant for >= $1
      const USDC = "0x01c5c0122039549ad1493b8220cabedd739bc44e";
      const MERCHANT = (process.env.MERCHANT_WALLET || "0x792cA42F2C2f9D9fB56dDBbfE9a0916AE6e98DD8").toLowerCase();
      const REQUIRED = BigInt(1000000); // $1 USDC (6 decimals)

      const transferLog = receipt.logs.find(
        (log) =>
          log.address.toLowerCase() === USDC &&
          log.topics[2]?.toLowerCase().includes(MERCHANT.slice(2)),
      );

      if (!transferLog) {
        res.status(400).json({ error: "No USDC transfer to merchant found in tx" });
        return;
      }

      const amount = BigInt(transferLog.data);
      if (amount < REQUIRED) {
        res.status(400).json({ error: `Insufficient amount: need $1 USDC, got ${Number(amount) / 1e6}` });
        return;
      }
    } catch (verifyErr: any) {
      // If verification fails due to network, reject
      res.status(400).json({ error: "Could not verify payment: " + (verifyErr.message || "").slice(0, 100) });
      return;
    }

    // Create subscription (30 days)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const sub = await prisma.userSubscription.create({
      data: {
        userId: req.userId!,
        plan: "vip",
        paymentTx,
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

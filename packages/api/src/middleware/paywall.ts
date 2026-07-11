import { Request, Response, NextFunction } from "express";
import { createPublicClient, http, parseAbi, defineChain } from "viem";
import { celo } from "viem/chains";
import { prisma } from "../lib/prisma";

// Chain config from env
const IS_MAINNET = process.env.CHAIN === "mainnet";

const MERCHANT_ADDRESS = (process.env.MERCHANT_WALLET || "0x792cA42F2C2f9D9fB56dDBbfE9a0916AE6e98DD8").toLowerCase();

const USDC_ADDRESS = IS_MAINNET
  ? "0xceba9300f2b948710d2653dd7b07f33a8b32118c" // Celo Mainnet USDC
  : "0x01c5c0122039549ad1493b8220cabedd739bc44e"; // Celo Sepolia USDC

const CHAIN_ID = IS_MAINNET ? 42220 : 11142220;
const NETWORK_NAME = IS_MAINNET ? "celo" : "celo-sepolia";

const REQUIRED_AMOUNT = BigInt(50000); // $0.05 USDC (6 decimals)

const celoSepolia = defineChain({
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://forno.celo-sepolia.celo-testnet.org"] },
  },
  testnet: true,
});

const activeChain = IS_MAINNET ? celo : celoSepolia;

const client = createPublicClient({
  chain: activeChain,
  transport: http(),
});

// Verify payment tx on-chain
async function verifyPaymentTx(txHash: string): Promise<boolean> {
  try {
    // Check replay: tx not used before
    const existing = await prisma.generationJob.findFirst({
      where: { inputPayload: { path: ["paymentTx"], equals: txHash } },
    });
    if (existing) return false;

    // Verify on-chain (always in production, optional in dev)
    if (IS_MAINNET || process.env.NODE_ENV === "production" || process.env.VERIFY_ONCHAIN === "1") {
      const receipt = await client.getTransactionReceipt({
        hash: txHash as `0x${string}`,
      });
      if (!receipt || receipt.status !== "success") return false;

      const transferLog = receipt.logs.find(
        (log) =>
          log.address.toLowerCase() === USDC_ADDRESS &&
          log.topics[2]?.toLowerCase().includes(MERCHANT_ADDRESS.slice(2)),
      );
      if (!transferLog) return false;

      const amount = BigInt(transferLog.data);
      if (amount < REQUIRED_AMOUNT) return false;
    }

    return true;
  } catch (err) {
    console.error("[PAY] Verify error:", (err as any).message?.slice(0, 80));
    // On mainnet always reject on error; on dev trust the hash
    if (IS_MAINNET) return false;
    if (!process.env.VERIFY_ONCHAIN) return true;
    return false;
  }
}

export async function paywall(req: Request, res: Response, next: NextFunction) {
  if (req.method !== "POST") return next();
  if (!req.path.match(/^\/stories(\/[^/]+\/chapters)?$/)) return next();

  const txHash = req.headers["x-payment-tx"] as string;
  if (txHash) {
    const valid = await verifyPaymentTx(txHash);
    if (valid) {
      (req as any).paymentTx = txHash;
      return next();
    }
    res.status(402).json({ error: "Invalid or already used payment transaction" });
    return;
  }

  res.status(402).json({
    error: "Payment Required",
    message: `This generation requires payment. $0.05 USDC on ${NETWORK_NAME}.`,
    payment: {
      amount: "50000",
      asset: "USDC",
      assetAddress: USDC_ADDRESS,
      network: NETWORK_NAME,
      chainId: CHAIN_ID,
      payTo: MERCHANT_ADDRESS,
    },
  });
}

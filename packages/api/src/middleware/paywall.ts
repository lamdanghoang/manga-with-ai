import { Request, Response, NextFunction } from "express";
import { createPublicClient, http, parseAbi, defineChain } from "viem";
import { celo } from "viem/chains";
import { prisma } from "../lib/prisma";

// Chain config from env
const IS_MAINNET = process.env.CHAIN === "mainnet";

const MERCHANT_ADDRESS = (process.env.MERCHANT_WALLET || "0x792cA42F2C2f9D9fB56dDBbfE9a0916AE6e98DD8").toLowerCase();

// Accepted payment tokens
const ACCEPTED_TOKENS: { symbol: string; address: string; decimals: number }[] = IS_MAINNET
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

// $0.05 equivalent per token (6 decimals for USDC/USDT, 18 for cUSD/USDm)
function getRequiredAmount(tokenAddress: string): bigint {
  const token = ACCEPTED_TOKENS.find((t) => t.address === tokenAddress);
  if (!token) return BigInt(50000); // fallback to 6 decimals
  if (token.decimals === 18) return BigInt("50000000000000000"); // 0.05 * 10^18
  return BigInt(50000); // 0.05 * 10^6
}

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
async function verifyPaymentTx(txHash: string): Promise<{ valid: boolean; tokenSymbol?: string }> {
  try {
    // Check replay: tx not used before
    const existing = await prisma.generationJob.findFirst({
      where: { inputPayload: { path: ["paymentTx"], equals: txHash } },
    });
    if (existing) return { valid: false };

    // Verify on-chain (always in production, optional in dev)
    if (IS_MAINNET || process.env.NODE_ENV === "production" || process.env.VERIFY_ONCHAIN === "1") {
      const receipt = await client.getTransactionReceipt({
        hash: txHash as `0x${string}`,
      });
      if (!receipt || receipt.status !== "success") return { valid: false };

      // Check transfer log for any accepted token to merchant
      const transferLog = receipt.logs.find(
        (log) =>
          ACCEPTED_TOKEN_ADDRESSES.includes(log.address.toLowerCase()) &&
          log.topics[2]?.toLowerCase().includes(MERCHANT_ADDRESS.slice(2)),
      );
      if (!transferLog) return { valid: false };

      const amount = BigInt(transferLog.data);
      const requiredAmount = getRequiredAmount(transferLog.address.toLowerCase());
      if (amount < requiredAmount) return { valid: false };

      const token = ACCEPTED_TOKENS.find((t) => t.address === transferLog.address.toLowerCase());
      return { valid: true, tokenSymbol: token?.symbol || "USDC" };
    }

    return { valid: true, tokenSymbol: "USDC" };
  } catch (err) {
    console.error("[PAY] Verify error:", (err as any).message?.slice(0, 80));
    // On mainnet always reject on error; on dev trust the hash
    if (IS_MAINNET) return { valid: false };
    if (!process.env.VERIFY_ONCHAIN) return { valid: true };
    return { valid: false };
  }
}

export async function paywall(req: Request, res: Response, next: NextFunction) {
  if (req.method !== "POST") return next();
  if (!req.path.match(/^\/stories(\/[^/]+\/chapters)?$/)) return next();

  const txHash = req.headers["x-payment-tx"] as string;
  if (txHash) {
    const result = await verifyPaymentTx(txHash);
    if (result.valid) {
      (req as any).paymentTx = txHash;
      (req as any).paymentToken = result.tokenSymbol || "USDC";
      return next();
    }
    res.status(402).json({ error: "Invalid or already used payment transaction" });
    return;
  }

  res.status(402).json({
    error: "Payment Required",
    message: `This generation requires payment. $0.05 in USDC, USDT, or ${IS_MAINNET ? "cUSD" : "USDm"} on ${IS_MAINNET ? "celo" : "celo-sepolia"}.`,
    payment: {
      amount: "0.05",
      acceptedTokens: ACCEPTED_TOKENS.map((t) => ({
        symbol: t.symbol,
        address: t.address,
        decimals: t.decimals,
      })),
      network: IS_MAINNET ? "celo" : "celo-sepolia",
      chainId: IS_MAINNET ? 42220 : 11142220,
      payTo: MERCHANT_ADDRESS,
    },
  });
}

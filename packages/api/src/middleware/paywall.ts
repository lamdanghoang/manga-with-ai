import { Request, Response, NextFunction } from "express";
import { createPublicClient, http, parseAbi, defineChain } from "viem";
import { prisma } from "../lib/prisma";

const MERCHANT_ADDRESS = process.env.MERCHANT_WALLET!.toLowerCase();
const USDC_ADDRESS = "0x01C5C0122039549AD1493B8220cABEdD739BC44E".toLowerCase();
const REQUIRED_AMOUNT = BigInt(50000); // $0.05 USDC (6 decimals)

const celoSepolia = defineChain({
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://forno.celo-sepolia.celo-testnet.org"] },
  },
  blockExplorers: {
    default: { name: "Celoscan", url: "https://sepolia.celoscan.io" },
  },
  testnet: true,
});

const client = createPublicClient({
  chain: celoSepolia,
  transport: http(),
});

const ERC20_TRANSFER_EVENT = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

// Verify payment tx - on production verifies on-chain, on dev trusts the hash
async function verifyPaymentTx(txHash: string): Promise<boolean> {
  try {
    // Check replay: tx not used before
    const existing = await prisma.generationJob.findFirst({
      where: { inputPayload: { path: ["paymentTx"], equals: txHash } },
    });
    if (existing) return false;

    // On production: verify on-chain
    if (
      process.env.NODE_ENV === "production" ||
      process.env.VERIFY_ONCHAIN === "1"
    ) {
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
    // If verification fails due to network, trust the hash in dev mode
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
    res
      .status(402)
      .json({ error: "Invalid or already used payment transaction" });
    return;
  }

  res.status(402).json({
    error: "Payment Required",
    message: "This generation requires payment. $0.05 USDC on Celo Sepolia.",
    payment: {
      amount: "50000",
      asset: "USDC",
      assetAddress: "0x01C5C0122039549AD1493B8220cABEdD739BC44E",
      network: "celo-sepolia",
      chainId: 11142220,
      payTo: MERCHANT_ADDRESS,
    },
  });
}

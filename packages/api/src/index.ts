import "dotenv/config";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// BigInt JSON serialization
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

// Suppress unhandled SSL errors from background connections
process.on("uncaughtException", (err) => {
  if (err.message?.includes("EPROTO") || err.message?.includes("ssl")) {
    console.warn("[WARN] Suppressed SSL error:", err.message.slice(0, 80));
    return;
  }
  console.error("Uncaught:", err);
  process.exit(1);
});

import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import storiesRouter from "./routes/stories";
import leaderboardRouter from "./routes/leaderboard";
import stylesRouter from "./routes/styles";
import { startJobPoller } from "./workers/poller";

import path from "path";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/uploads", express.static(path.resolve("uploads")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ERC-8004 agent discovery
app.get("/.well-known/agent.json", (_req, res) => {
  res.json({
    type: "Agent",
    name: "MangaWithAI",
    description:
      "AI-powered manga creation agent. Creates manga stories from prompts with character consistency via x402 payments on Celo.",
    erc8004: {
      registry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
      agentId: 9365,
      chainId: 42220,
    },
    endpoints: [
      { type: "a2a", url: "https://mangawithai.duckdns.org/v1/stories" },
      {
        type: "wallet",
        address: "0x792cA42F2C2f9D9fB56dDBbfE9a0916AE6e98DD8",
        chainId: 42220,
      },
    ],
    supportedTrust: ["reputation", "erc8004"],
    capabilities: [
      "manga-generation",
      "story-creation",
      "image-generation",
      "nft-minting",
      "marketplace",
    ],
    pricing: {
      createStory: "0.01 USDC",
      continueChapter: "0.01 USDC",
      vipSubscription: "1.00 USDC/month",
      protocol: "x402",
    },
    contracts: {
      mangaNFT: {
        address: "0xC92AA61585e955D6B12735b5D90bca49BcfFf8FA",
        chain: "celo-sepolia",
        chainId: 11142220,
      },
      marketplace: {
        address: "0xD7420dD58505E5cf10Bb9e91Bf4A0B96a8d7498d",
        chain: "celo-sepolia",
        chainId: 11142220,
      },
    },
  });
});

app.use("/v1", authRouter);

// Payment: free tier check + x402 paywall (only if MERCHANT_WALLET set)
if (process.env.MERCHANT_WALLET) {
  const { freeTierGuard } = require("./middleware/freeTier");
  const { paywall } = require("./middleware/paywall");
  app.use("/v1", freeTierGuard, (req: any, res: any, next: any) => {
    if (req.skipPayment) return next();
    if (req.method !== "POST") return next();
    if (req.path.startsWith("/public")) return next();
    console.log("[PAY] Paywall active for:", req.method, req.path);
    return paywall(req, res, next);
  });
}

app.use("/v1", storiesRouter);
app.use("/v1", leaderboardRouter);
app.use("/v1", stylesRouter);

const PORT = process.env.API_PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  startJobPoller();
});

export default app;

import "dotenv/config";
import "./instrument"; // Sentry must be imported before other modules
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
import creditsRouter from "./routes/credits";
import analyticsRouter from "./routes/analytics";
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
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: "MangaWithAI",
    description:
      "AI-powered manga creation agent. Creates manga stories from prompts with character consistency via x402 payments on Celo.",
    active: true,
    erc8004: {
      registry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
      agentId: 9365,
      chainId: 42220,
    },
    services: [
      {
        name: "A2A",
        endpoint: "https://mangawithai.duckdns.org/.well-known/agent.json",
        version: "0.3.0",
      },
      {
        name: "MCP",
        endpoint: "https://mangawithai.duckdns.org/v1/stories",
        version: "2025-06-18",
      },
      {
        name: "agentWallet",
        endpoint: "eip155:42220:0x792cA42F2C2f9D9fB56dDBbfE9a0916AE6e98DD8",
      },
    ],
    registrations: [
      {
        agentId: 9365,
        agentRegistry:
          "eip155:42220:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
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
        address: "0x8F7714bEb51Bb60d87Da6f9BD28874d0D7D341f1",
        chain: "celo",
        chainId: 42220,
      },
      marketplace: {
        address: "0x636C633a35FC5783eAD501AE99bA357368800a9F",
        chain: "celo",
        chainId: 42220,
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
app.use("/v1", creditsRouter);
app.use("/v1", analyticsRouter);

// Sentry error handler (must be after all routes, only if configured)
if (process.env.SENTRY_DSN) {
  import("@sentry/node").then((Sentry) => {
    if (Sentry.setupExpressErrorHandler) {
      Sentry.setupExpressErrorHandler(app);
    }
  }).catch(() => {});
}

const PORT = process.env.API_PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  startJobPoller();
});

export default app;

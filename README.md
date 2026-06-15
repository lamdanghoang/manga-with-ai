# MangaWithAI 🟡

**AI-Powered Manga Creation Agent on Celo**

An autonomous AI agent that generates manga from text prompts, handles stablecoin micropayments, operates an NFT marketplace, and serves 15M+ MiniPay users — all on Celo.

> 🏆 Built for the [Celo Onchain Agents Hackathon](https://celoplatform.notion.site) (May 22 – June 15, 2026)

## Agent Identity

| Field             | Value                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------ |
| ERC-8004 Registry | [Agent #9365](https://celoscan.io/token/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432?a=9365) |
| Agent Wallet      | `0x792cA42F2C2f9D9fB56dDBbfE9a0916AE6e98DD8`                                               |
| Chain             | Celo Mainnet (42220)                                                                       |
| Metadata          | [`/.well-known/agent.json`](https://mangawithai.duckdns.org/.well-known/agent.json)        |

## Live Demo

- **App**: [manga-with-ai-web.vercel.app](https://manga-with-ai-web.vercel.app)
- **API**: [mangawithai.duckdns.org](https://mangawithai.duckdns.org/health)
- **API Docs**: [/api-docs](https://manga-with-ai-web.vercel.app/api-docs)

## What It Does

```
User Prompt → AI Agent → Manga Page → NFT Mint → Marketplace
     ↑                                      ↓
  $0.01 USDC ←── x402 Payment ────── Celo On-Chain
```

1. **AI Generation Agent** — Receives prompt, generates full manga pages using Gemini AI (text planning + image generation)
2. **Payment Agent** — Handles x402 micropayments ($0.01 USDC per generation), first creation free
3. **NFT Agent** — Mints creations as ERC-721 with 5% creator royalties (ERC-2981)
4. **Marketplace Agent** — Facilitates buy/sell/like of manga NFTs with multi-asset support (USDC/USDT/USDm)
5. **Social Agent** — Leaderboard, comments, likes, shares — all tracked on-chain or via API

## Smart Contracts (Celo Sepolia)

| Contract                      | Address                                                                                                                        | Verified |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------- |
| MangaNFT (ERC-721 + ERC-2981) | [`0xC92AA61585e955D6B12735b5D90bca49BcfFf8FA`](https://sepolia.celoscan.io/address/0xC92AA61585e955D6B12735b5D90bca49BcfFf8FA) | ✅       |
| MangaMarketplace              | [`0xD7420dD58505E5cf10Bb9e91Bf4A0B96a8d7498d`](https://sepolia.celoscan.io/address/0xD7420dD58505E5cf10Bb9e91Bf4A0B96a8d7498d) | ✅       |

**Supported Payment Tokens**: USDC, USDT, USDm on Celo

## Onchain Activity

Every user interaction generates real on-chain transactions:

- ✅ Story creation → payment verification on-chain
- ✅ NFT minting → ERC-721 mint transaction
- ✅ Marketplace listing/buying → smart contract calls
- ✅ Likes → on-chain state update (marketplace contract)
- ✅ VIP subscription → USDC transfer

## Tech Stack

| Layer      | Technology                                            |
| ---------- | ----------------------------------------------------- |
| AI         | Google Gemini (gemini-2.5-pro + imagen-3)             |
| Blockchain | Celo L2, Solidity 0.8.27, ERC-721, ERC-2981, ERC-8004 |
| Payment    | x402 protocol, multi-asset (USDC/USDT/USDm)           |
| Frontend   | Next.js 15, wagmi, viem, Tailwind CSS 4               |
| Backend    | Express, Prisma, PostgreSQL                           |
| Storage    | Cloudflare R2                                         |
| Deploy     | Vercel (FE), AWS (API), Hardhat (contracts)           |

## Features

- **AI Manga Generation** — Text-to-manga with character consistency across chapters
- **Free Tier + x402 Payments** — First story free, then $0.01 USDC micropayments
- **NFT Minting** — One-click mint with ERC-2981 royalties (5% creator earnings)
- **Marketplace** — Buy/sell/like manga NFTs with USDC/USDT/USDm
- **Creator Leaderboard** — Weekly/monthly rankings by engagement score
- **Custom Styles** — 10 art styles (4 free + 6 VIP), custom prompt input for VIP
- **VIP Subscription** — $1/month unlocks premium styles + priority queue
- **Social Feed** — Like, comment, share stories publicly
- **MiniPay Optimized** — Mobile-first for Celo's 15M+ wallet users

## For AI Agents

```typescript
// Agent can create manga and pay automatically via x402
import { createPaymentClient } from "n-payment";

const client = createPaymentClient({
  chains: ["celo-sepolia"],
  ows: { wallet: "manga-agent", privateKey: process.env.CELO_KEY },
  celo: { payAsset: "USDC" },
});

const res = await client.fetchWithPayment(
  "https://mangawithai.duckdns.org/v1/stories",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "A ninja cat in a cyberpunk city",
      stylePreset: "manga-bw",
      panelCount: 4,
    }),
  },
);
```

## API Endpoints

| Method | Path                              | Auth          | Description          |
| ------ | --------------------------------- | ------------- | -------------------- |
| GET    | /health                           | No            | Health check         |
| GET    | /v1/public/feed                   | No            | Public story feed    |
| GET    | /v1/public/stories/:slug          | No            | Public story detail  |
| GET    | /v1/public/stories/:slug/comments | No            | Story comments       |
| POST   | /v1/public/stories/:slug/comments | Yes           | Post comment         |
| GET    | /v1/leaderboard/creators          | No            | Creator rankings     |
| GET    | /v1/leaderboard/stories           | No            | Story rankings       |
| GET    | /v1/styles                        | No            | Available art styles |
| POST   | /v1/stories                       | Yes + Payment | Create story (x402)  |
| POST   | /v1/stories/:id/chapters          | Yes + Payment | Continue story       |
| GET    | /v1/user/subscription             | Yes           | Check VIP status     |

## Quick Start

```bash
# Install
pnpm install

# Setup DB
docker compose up -d
cp .env.example packages/api/.env
pnpm --filter @manga-with-ai/api exec prisma migrate deploy

# Dev
pnpm run dev
```

## Project Structure

```
packages/
├── contracts/     # Solidity (MangaNFT + Marketplace)
├── api/           # Express backend + Prisma + Gemini AI
├── shared/        # Types + contract ABIs
└── web/           # Next.js frontend (MiniPay-optimized)
```

## Team

Built by [OverGuild](https://github.com/lamdanghoang) for the Celo Onchain Agents Hackathon 2026.

## License

MIT

# Network Manifest — MangaWithAI

All URLs, subdomains, and external origins used by the MangaWithAI Mini App.

## App Domains

| URL | Purpose |
|---|---|
| `https://www.mangawithai.site` | Frontend (Next.js on Vercel) |
| `https://mangawithai.duckdns.org` | Backend API (Express on AWS Lightsail) |

## Blockchain RPCs

| URL | Purpose |
|---|---|
| `https://forno.celo.org` | Celo Mainnet RPC |
| `https://forno.celo-sepolia.celo-testnet.org` | Celo Sepolia Testnet RPC |

## External APIs

| URL | Purpose |
|---|---|
| `https://generativelanguage.googleapis.com` | Google Gemini AI (text planning + image generation) |

## Storage / CDN

| URL | Purpose |
|---|---|
| `https://pub-3008a3c9754e4af7af6cb5f92a8b5283.r2.dev` | Cloudflare R2 public CDN (manga images) |
| `https://5841382692f5c2f48e08efb8cf9d68d4.r2.cloudflarestorage.com` | Cloudflare R2 S3 API (server-side upload only) |

## Third-Party Scripts/CSS

| URL | Purpose |
|---|---|
| `https://fonts.googleapis.com` | Google Fonts (Material Symbols) |
| `https://fonts.gstatic.com` | Google Fonts static assets |

## Smart Contracts (Celo Mainnet)

| Contract | Address |
|---|---|
| MangaNFT | `0x538A7786cAB0c825899CA7Dd95Aa3393C9251e54` |
| MangaMarketplace | `0xf2ce2c499ef172EE462aCBCf44632D0DaF0Ea0c8` |
| USDC | `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` |
| USDT | `0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e` |
| cUSD (USDm) | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |

## Smart Contracts (Celo Sepolia Testnet)

| Contract | Address |
|---|---|
| MangaNFT | `0x85b4d81175CD63d39E1964AFFF09efC2B824DdFF` |
| MangaMarketplace | `0x2555a1b93CFFBec10Af4E9685bA52Ec198032E05` |
| USDC | `0x01C5C0122039549AD1493B8220cABEdD739BC44E` |
| USDT | `0xd077A400968890Eacc75cdc901F0356c943e4fDb` |
| USDm | `0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b` |

## Wallet Interactions

| Method | Description |
|---|---|
| `eth_requestAccounts` | Connect wallet |
| `eth_sendTransaction` | Send payments (USDC/USDT/cUSD transfer) |
| `eth_call` | Read contract state (balances, listings) |
| `wallet_switchEthereumChain` | Switch to Celo (skipped in MiniPay) |

## Outbound Links (user-facing)

| URL | Purpose |
|---|---|
| `https://link.minipay.xyz/add_cash?tokens=USDC` | MiniPay deposit deeplink (mainnet) |
| `https://faucet.circle.com/` | USDC faucet (testnet) |
| `https://celoscan.io` | Block explorer links |
| `https://github.com/lamdanghoang` | Support/contact |

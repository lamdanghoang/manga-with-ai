"use client";
import { http, createConfig } from "wagmi";
import { celo, celoSepolia as celoSepoliaChain } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { toDataSuffix } from "@celo/attribution-tags";

export const ATTRIBUTION_TAG = toDataSuffix("mangawithai");

export const IS_MAINNET = process.env.NEXT_PUBLIC_CHAIN === "mainnet";

// Active chain used across the app
export const activeChain = IS_MAINNET ? celo : celoSepoliaChain;

// Keep backward-compatible export name
export const celoSepolia = activeChain;

export const config = createConfig({
  chains: [celoSepoliaChain, celo],
  connectors: [injected()],
  transports: {
    [celoSepoliaChain.id]: http(),
    [celo.id]: http(),
  },
});

// Register this config as the default for wagmi's hooks so TypeScript can
// infer chain-specific properties (e.g. Celo's `feeCurrency`) end-to-end.
declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}

// Active contracts based on network
import { CONTRACTS } from "@manga-with-ai/shared";
export const activeContracts = IS_MAINNET ? CONTRACTS.celo : CONTRACTS.celoSepolia;

// Payment config
export const USDC_ADDRESS = IS_MAINNET
  ? "0xcebA9300f2b948710d2653dD7B07f33A8B32118C" as `0x${string}`
  : "0x01C5C0122039549AD1493B8220cABEdD739BC44E" as `0x${string}`;

export const USDT_ADDRESS = IS_MAINNET
  ? "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" as `0x${string}`
  : "0xd077A400968890Eacc75cdc901F0356c943e4fDb" as `0x${string}`;

export const USDM_ADDRESS = IS_MAINNET
  ? "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`
  : "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b" as `0x${string}`;

export interface PaymentToken {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
}

export const PAYMENT_TOKENS: PaymentToken[] = [
  { symbol: "USDC", address: USDC_ADDRESS, decimals: 6 },
  { symbol: "USDT", address: USDT_ADDRESS, decimals: 6 },
  { symbol: IS_MAINNET ? "cUSD" : "USDm", address: USDM_ADDRESS, decimals: 18 },
];

export const MERCHANT_WALLET = "0x792cA42F2C2f9D9fB56dDBbfE9a0916AE6e98DD8" as `0x${string}`;

// Deposit link: mainnet = MiniPay deeplink, testnet = Circle faucet
export const DEPOSIT_LINK = IS_MAINNET
  ? "https://link.minipay.xyz/add_cash?tokens=USDC"
  : "https://faucet.circle.com/";

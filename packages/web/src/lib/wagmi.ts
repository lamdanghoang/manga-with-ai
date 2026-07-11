"use client";
import { http, createConfig } from "wagmi";
import { celo } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";

// Celo Sepolia Testnet (chain ID 11142220)
const celoSepoliaChain = defineChain({
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

// Active contracts based on network
import { CONTRACTS } from "@manga-with-ai/shared";
export const activeContracts = IS_MAINNET ? CONTRACTS.celo : CONTRACTS.celoSepolia;

// Payment config
export const USDC_ADDRESS = IS_MAINNET
  ? "0xcebA9300f2b948710d2653dD7B07f33A8B32118C" as `0x${string}`
  : "0x01C5C0122039549AD1493B8220cABEdD739BC44E" as `0x${string}`;

export const MERCHANT_WALLET = "0x792cA42F2C2f9D9fB56dDBbfE9a0916AE6e98DD8" as `0x${string}`;

// Deposit link: mainnet = MiniPay deeplink, testnet = Circle faucet
export const DEPOSIT_LINK = IS_MAINNET
  ? "https://link.minipay.xyz/add_cash?tokens=USDC"
  : "https://faucet.circle.com/";

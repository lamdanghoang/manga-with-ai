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

const IS_MAINNET = process.env.NEXT_PUBLIC_CHAIN === "mainnet";

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

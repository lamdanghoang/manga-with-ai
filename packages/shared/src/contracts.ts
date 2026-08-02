// Contract addresses - update after deployment
export const CONTRACTS = {
  // Celo Sepolia (testnet) - update after deploy
  celoSepolia: {
    mangaNFT: "0xA55C22e2f4bbfEaF3962eE9fd4D7100CCACaF010" as `0x${string}`,
    marketplace: "0x8CbC3acc834B47eAe10096c81DdFA2B09ccDEC18" as `0x${string}`,
    usdc: "0x01C5C0122039549AD1493B8220cABEdD739BC44E" as `0x${string}`,
    usdt: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e" as `0x${string}`,
    usdm: "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`,
  },
  // Celo mainnet
  celo: {
    mangaNFT: "0x538A7786cAB0c825899CA7Dd95Aa3393C9251e54" as `0x${string}`,
    marketplace: "0xf2ce2c499ef172EE462aCBCf44632D0DaF0Ea0c8" as `0x${string}`,
    usdc: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C" as `0x${string}`,
    usdt: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e" as `0x${string}`,
    usdm: "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`,
  },
} as const;

// MangaNFT ABI (relevant functions only)
export const MANGA_NFT_ABI = [
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "uri", type: "string" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "batchMint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "uris", type: "string[]" },
    ],
    outputs: [{ type: "uint256[]" }],
  },
  {
    name: "creators",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "address" }],
  },
  {
    name: "tokenURI",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "string" }],
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "address" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "setApprovalForAll",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
  {
    name: "isApprovedForAll",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "operator", type: "address" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "mintFee",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "feeToken",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    name: "feeRecipient",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  // Events
  {
    name: "Minted",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "tokenURI", type: "string", indexed: false },
    ],
  },
] as const;

// MangaMarketplace ABI (relevant functions only)
export const MARKETPLACE_ABI = [
  {
    name: "list",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "paymentToken", type: "address" },
      { name: "price", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "unlist",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "buy",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "like",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "unlike",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "listings",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "seller", type: "address" },
      { name: "paymentToken", type: "address" },
      { name: "price", type: "uint256" },
      { name: "active", type: "bool" },
    ],
  },
  {
    name: "likeCount",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "hasLiked",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "user", type: "address" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "allowedTokens",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  // Events
  {
    name: "Listed",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "seller", type: "address", indexed: true },
      { name: "paymentToken", type: "address", indexed: false },
      { name: "price", type: "uint256", indexed: false },
    ],
  },
  {
    name: "Sold",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "seller", type: "address", indexed: true },
      { name: "buyer", type: "address", indexed: true },
      { name: "price", type: "uint256", indexed: false },
      { name: "paymentToken", type: "address", indexed: false },
    ],
  },
  {
    name: "Liked",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: true },
    ],
  },
] as const;

// ERC-20 approval ABI (needed for marketplace buy)
export const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

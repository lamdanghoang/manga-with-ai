import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Network:", network.name);

  // Token addresses on Celo
  // Mainnet
  const MAINNET_TOKENS = {
    USDC: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
    USDT: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
    USDm: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  };

  // Sepolia (testnet)
  const SEPOLIA_TOKENS = {
    USDC: "0x01C5C0122039549AD1493B8220cABEdD739BC44E",
    USDT: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
    USDm: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  };

  const tokens = network.name === "celo" ? MAINNET_TOKENS : SEPOLIA_TOKENS;
  const allowedTokens = [tokens.USDC, tokens.USDT, tokens.USDm];

  // 1. Deploy MangaNFT
  console.log("\n1. Deploying MangaNFT...");
  const MangaNFT = await ethers.getContractFactory("MangaNFT");
  const nft = await MangaNFT.deploy(tokens.USDC, deployer.address);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("   MangaNFT deployed to:", nftAddress);
  console.log("   Fee token (USDC):", tokens.USDC);
  console.log("   Fee recipient:", deployer.address);

  // 2. Deploy MangaMarketplace
  console.log("\n2. Deploying MangaMarketplace...");
  const MangaMarketplace = await ethers.getContractFactory("MangaMarketplace");
  const marketplace = await MangaMarketplace.deploy(
    nftAddress,
    deployer.address, // feeRecipient = deployer for now
    allowedTokens,
  );
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("   MangaMarketplace deployed to:", marketplaceAddress);

  // Summary
  console.log("\n--- Deployment Summary ---");
  console.log("Network:          ", network.name);
  console.log("MangaNFT:         ", nftAddress);
  console.log("MangaMarketplace: ", marketplaceAddress);
  console.log("Fee Recipient:    ", deployer.address);
  console.log("Allowed Tokens:   ", allowedTokens);
  console.log("\nAdd these to your .env:");
  console.log(`NFT_CONTRACT_ADDRESS=${nftAddress}`);
  console.log(`MARKETPLACE_CONTRACT_ADDRESS=${marketplaceAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

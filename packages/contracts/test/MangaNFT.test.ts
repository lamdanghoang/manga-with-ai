import { expect } from "chai";
import { ethers } from "hardhat";
import { MangaNFT, MangaMarketplace } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-toolbox/node_modules/@nomicfoundation/hardhat-ethers/signers";

describe("MangaNFT + Marketplace", function () {
  let nft: MangaNFT;
  let marketplace: MangaMarketplace;
  let mockUSDC: any;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let buyer: SignerWithAddress;

  const TOKEN_URI = "ipfs://QmTest123/metadata.json";
  const PRICE = ethers.parseUnits("1", 6); // 1 USDC

  beforeEach(async function () {
    [owner, creator, buyer] = await ethers.getSigners();

    // Deploy mock ERC20 (USDC)
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("Mock USDC", "USDC", 6);
    await mockUSDC.waitForDeployment();

    // Deploy MangaNFT (fee token = mock USDC, fee recipient = owner)
    const MangaNFT = await ethers.getContractFactory("MangaNFT");
    nft = await MangaNFT.deploy(await mockUSDC.getAddress(), owner.address);
    await nft.waitForDeployment();

    // Deploy Marketplace
    const MangaMarketplace =
      await ethers.getContractFactory("MangaMarketplace");
    marketplace = await MangaMarketplace.deploy(
      await nft.getAddress(),
      owner.address,
      [await mockUSDC.getAddress()],
    );
    await marketplace.waitForDeployment();

    // Give buyer some USDC
    await mockUSDC.mint(buyer.address, ethers.parseUnits("1000", 6));
  });

  describe("MangaNFT", function () {
    it("should mint an NFT", async function () {
      const tx = await nft.connect(creator).mint(creator.address, TOKEN_URI);
      await tx.wait();

      expect(await nft.ownerOf(0)).to.equal(creator.address);
      expect(await nft.tokenURI(0)).to.equal(TOKEN_URI);
      expect(await nft.creators(0)).to.equal(creator.address);
      expect(await nft.totalSupply()).to.equal(1);
    });

    it("should batch mint NFTs", async function () {
      const uris = ["ipfs://1", "ipfs://2", "ipfs://3"];
      const tx = await nft.connect(creator).batchMint(creator.address, uris);
      await tx.wait();

      expect(await nft.totalSupply()).to.equal(3);
      expect(await nft.tokenURI(0)).to.equal("ipfs://1");
      expect(await nft.tokenURI(2)).to.equal("ipfs://3");
    });

    it("should set ERC-2981 royalty info", async function () {
      await nft.connect(creator).mint(creator.address, TOKEN_URI);

      const [receiver, amount] = await nft.royaltyInfo(
        0,
        ethers.parseUnits("100", 6),
      );
      expect(receiver).to.equal(creator.address);
      // 5% of 100 = 5
      expect(amount).to.equal(ethers.parseUnits("5", 6));
    });

    it("should enforce mint fee if set", async function () {
      const fee = ethers.parseUnits("1", 6); // 1 USDC
      await nft.connect(owner).setMintFee(fee);

      // No approval yet — SafeERC20 transferFrom should revert
      await expect(
        nft.connect(creator).mint(creator.address, TOKEN_URI),
      ).to.be.reverted;

      // Approve fee token, then mint should succeed and pull the fee
      await mockUSDC.mint(creator.address, fee);
      await mockUSDC.connect(creator).approve(await nft.getAddress(), fee);

      await nft.connect(creator).mint(creator.address, TOKEN_URI);
      expect(await nft.totalSupply()).to.equal(1);
      expect(await mockUSDC.balanceOf(owner.address)).to.equal(fee);
    });
  });

  describe("MangaMarketplace", function () {
    beforeEach(async function () {
      // Creator mints an NFT
      await nft.connect(creator).mint(creator.address, TOKEN_URI);
      // Approve marketplace
      await nft
        .connect(creator)
        .setApprovalForAll(await marketplace.getAddress(), true);
    });

    it("should list an NFT for sale", async function () {
      await marketplace
        .connect(creator)
        .list(0, await mockUSDC.getAddress(), PRICE);

      const listing = await marketplace.listings(0);
      expect(listing.seller).to.equal(creator.address);
      expect(listing.price).to.equal(PRICE);
      expect(listing.active).to.be.true;
    });

    it("should unlist an NFT", async function () {
      await marketplace
        .connect(creator)
        .list(0, await mockUSDC.getAddress(), PRICE);
      await marketplace.connect(creator).unlist(0);

      const listing = await marketplace.listings(0);
      expect(listing.active).to.be.false;
    });

    it("should allow buying an NFT with fee + royalty distribution", async function () {
      await marketplace
        .connect(creator)
        .list(0, await mockUSDC.getAddress(), PRICE);

      // Buyer approves marketplace to spend USDC
      await mockUSDC
        .connect(buyer)
        .approve(await marketplace.getAddress(), PRICE);

      // Buy
      await marketplace.connect(buyer).buy(0);

      // NFT transferred to buyer
      expect(await nft.ownerOf(0)).to.equal(buyer.address);

      // Check platform fee went to owner (2.5% of 1 USDC = 0.025 USDC = 25000)
      const platformFee = (PRICE * BigInt(250)) / BigInt(10000);
      expect(await mockUSDC.balanceOf(owner.address)).to.equal(platformFee);

      // Creator gets the rest (no royalty on primary since seller=creator)
      const creatorBalance = await mockUSDC.balanceOf(creator.address);
      expect(creatorBalance).to.equal(PRICE - platformFee);
    });

    it("should pay royalties on secondary sales", async function () {
      // First sale: creator lists, buyer buys
      await marketplace
        .connect(creator)
        .list(0, await mockUSDC.getAddress(), PRICE);
      await mockUSDC
        .connect(buyer)
        .approve(await marketplace.getAddress(), PRICE);
      await marketplace.connect(buyer).buy(0);

      // Secondary sale: buyer lists, owner buys
      await nft
        .connect(buyer)
        .setApprovalForAll(await marketplace.getAddress(), true);
      await marketplace
        .connect(buyer)
        .list(0, await mockUSDC.getAddress(), PRICE);

      await mockUSDC.mint(owner.address, PRICE);
      const ownerBalanceBefore = await mockUSDC.balanceOf(owner.address);
      await mockUSDC
        .connect(owner)
        .approve(await marketplace.getAddress(), PRICE);
      await marketplace.connect(owner).buy(0);

      // Creator should have received royalty (5%)
      const royalty = (PRICE * BigInt(500)) / BigInt(10000);
      const creatorBalance = await mockUSDC.balanceOf(creator.address);
      // Creator had (PRICE - platformFee) from first sale + royalty from second
      const firstSaleProceeds = PRICE - (PRICE * BigInt(250)) / BigInt(10000);
      expect(creatorBalance).to.equal(firstSaleProceeds + royalty);
    });

    it("should handle likes", async function () {
      await marketplace.connect(buyer).like(0);
      expect(await marketplace.likeCount(0)).to.equal(1);
      expect(await marketplace.hasLiked(0, buyer.address)).to.be.true;

      await marketplace.connect(buyer).unlike(0);
      expect(await marketplace.likeCount(0)).to.equal(0);
    });

    it("should not allow buying own NFT", async function () {
      await marketplace
        .connect(creator)
        .list(0, await mockUSDC.getAddress(), PRICE);
      await expect(marketplace.connect(creator).buy(0)).to.be.revertedWith(
        "Cannot buy own",
      );
    });

    it("should not allow unlisted token purchase", async function () {
      await expect(marketplace.connect(buyer).buy(0)).to.be.revertedWith(
        "Not listed",
      );
    });

    it("should reject disallowed payment tokens", async function () {
      const randomAddress = "0x0000000000000000000000000000000000000001";
      await expect(
        marketplace.connect(creator).list(0, randomAddress, PRICE),
      ).to.be.revertedWith("Token not allowed");
    });
  });
});

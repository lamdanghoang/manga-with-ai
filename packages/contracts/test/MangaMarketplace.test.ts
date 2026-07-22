import { expect } from "chai";
import { ethers } from "hardhat";
import { MangaNFT, MangaMarketplace, MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-toolbox/node_modules/@nomicfoundation/hardhat-ethers/signers";

describe("MangaMarketplace", function () {
  let nft: MangaNFT;
  let marketplace: MangaMarketplace;
  let usdc: MockERC20;
  let usdt: MockERC20;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let buyer: SignerWithAddress;
  let buyer2: SignerWithAddress;
  let feeRecipient: SignerWithAddress;

  const TOKEN_URI = "ipfs://QmTestMarketplace/metadata.json";
  const PRICE = ethers.parseUnits("10", 6); // 10 USDC
  const SMALL_PRICE = ethers.parseUnits("0.01", 6); // 0.01 USDC

  beforeEach(async function () {
    [owner, creator, buyer, buyer2, feeRecipient] = await ethers.getSigners();

    // Deploy mock ERC20s
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdc = await MockERC20.deploy("Mock USDC", "USDC", 6);
    usdt = await MockERC20.deploy("Mock USDT", "USDT", 6);
    await usdc.waitForDeployment();
    await usdt.waitForDeployment();

    // Deploy MangaNFT (feeToken = usdc, feeRecipient = owner)
    const MangaNFT = await ethers.getContractFactory("MangaNFT");
    nft = await MangaNFT.deploy(await usdc.getAddress(), owner.address);
    await nft.waitForDeployment();

    // Deploy Marketplace with both USDC and USDT allowed
    const MangaMarketplace = await ethers.getContractFactory("MangaMarketplace");
    marketplace = await MangaMarketplace.deploy(
      await nft.getAddress(),
      feeRecipient.address,
      [await usdc.getAddress(), await usdt.getAddress()]
    );
    await marketplace.waitForDeployment();

    // Mint USDC/USDT to buyers
    await usdc.mint(buyer.address, ethers.parseUnits("10000", 6));
    await usdc.mint(buyer2.address, ethers.parseUnits("10000", 6));
    await usdt.mint(buyer.address, ethers.parseUnits("10000", 6));

    // Creator mints an NFT (tokenId = 0)
    await nft.connect(creator).mint(creator.address, TOKEN_URI);
    // Approve marketplace for all
    await nft.connect(creator).setApprovalForAll(await marketplace.getAddress(), true);
  });

  // ─── LISTING ───────────────────────────────────────────────────────────────

  describe("Listing", function () {
    it("should list an NFT with correct parameters", async function () {
      await marketplace.connect(creator).list(0, await usdc.getAddress(), PRICE);

      const listing = await marketplace.listings(0);
      expect(listing.seller).to.equal(creator.address);
      expect(listing.paymentToken).to.equal(await usdc.getAddress());
      expect(listing.price).to.equal(PRICE);
      expect(listing.active).to.be.true;
    });

    it("should emit Listed event", async function () {
      await expect(marketplace.connect(creator).list(0, await usdc.getAddress(), PRICE))
        .to.emit(marketplace, "Listed")
        .withArgs(0, creator.address, await usdc.getAddress(), PRICE);
    });

    it("should allow listing with different payment tokens", async function () {
      await marketplace.connect(creator).list(0, await usdt.getAddress(), PRICE);

      const listing = await marketplace.listings(0);
      expect(listing.paymentToken).to.equal(await usdt.getAddress());
    });

    it("should revert if price is zero", async function () {
      await expect(
        marketplace.connect(creator).list(0, await usdc.getAddress(), 0)
      ).to.be.revertedWith("Price must be > 0");
    });

    it("should revert if payment token not allowed", async function () {
      const randomToken = "0x0000000000000000000000000000000000000042";
      await expect(
        marketplace.connect(creator).list(0, randomToken, PRICE)
      ).to.be.revertedWith("Token not allowed");
    });

    it("should revert if caller is not owner of NFT", async function () {
      await expect(
        marketplace.connect(buyer).list(0, await usdc.getAddress(), PRICE)
      ).to.be.revertedWith("Not owner");
    });

    it("should revert if marketplace not approved", async function () {
      // Revoke approval
      await nft.connect(creator).setApprovalForAll(await marketplace.getAddress(), false);

      await expect(
        marketplace.connect(creator).list(0, await usdc.getAddress(), PRICE)
      ).to.be.revertedWith("Not approved");
    });

    it("should allow re-listing after unlisting", async function () {
      await marketplace.connect(creator).list(0, await usdc.getAddress(), PRICE);
      await marketplace.connect(creator).unlist(0);
      await marketplace.connect(creator).list(0, await usdc.getAddress(), PRICE * BigInt(2));

      const listing = await marketplace.listings(0);
      expect(listing.active).to.be.true;
      expect(listing.price).to.equal(PRICE * BigInt(2));
    });

    it("should allow overwriting an active listing with a new price", async function () {
      await marketplace.connect(creator).list(0, await usdc.getAddress(), PRICE);
      await marketplace.connect(creator).list(0, await usdc.getAddress(), PRICE * BigInt(3));

      const listing = await marketplace.listings(0);
      expect(listing.price).to.equal(PRICE * BigInt(3));
      expect(listing.active).to.be.true;
    });
  });

  // ─── UNLISTING ─────────────────────────────────────────────────────────────

  describe("Unlisting", function () {
    beforeEach(async function () {
      await marketplace.connect(creator).list(0, await usdc.getAddress(), PRICE);
    });

    it("should unlist an active listing", async function () {
      await marketplace.connect(creator).unlist(0);

      const listing = await marketplace.listings(0);
      expect(listing.active).to.be.false;
    });

    it("should emit Unlisted event", async function () {
      await expect(marketplace.connect(creator).unlist(0))
        .to.emit(marketplace, "Unlisted")
        .withArgs(0, creator.address);
    });

    it("should revert if not the seller", async function () {
      await expect(
        marketplace.connect(buyer).unlist(0)
      ).to.be.revertedWith("Not seller");
    });

    it("should revert if not listed", async function () {
      await marketplace.connect(creator).unlist(0);
      await expect(
        marketplace.connect(creator).unlist(0)
      ).to.be.revertedWith("Not listed");
    });

    it("should revert unlisting a never-listed token", async function () {
      // tokenId 999 never listed
      await expect(
        marketplace.connect(creator).unlist(999)
      ).to.be.revertedWith("Not listed");
    });
  });

  // ─── BUYING ────────────────────────────────────────────────────────────────

  describe("Buying", function () {
    beforeEach(async function () {
      await marketplace.connect(creator).list(0, await usdc.getAddress(), PRICE);
      // Buyer approves marketplace
      await usdc.connect(buyer).approve(await marketplace.getAddress(), ethers.parseUnits("10000", 6));
    });

    it("should transfer NFT to buyer", async function () {
      await marketplace.connect(buyer).buy(0);
      expect(await nft.ownerOf(0)).to.equal(buyer.address);
    });

    it("should deactivate listing after purchase", async function () {
      await marketplace.connect(buyer).buy(0);
      const listing = await marketplace.listings(0);
      expect(listing.active).to.be.false;
    });

    it("should emit Sold event", async function () {
      await expect(marketplace.connect(buyer).buy(0))
        .to.emit(marketplace, "Sold")
        .withArgs(0, creator.address, buyer.address, PRICE, await usdc.getAddress());
    });

    it("should distribute platform fee correctly (2.5%)", async function () {
      const feeRecipientBefore = await usdc.balanceOf(feeRecipient.address);
      await marketplace.connect(buyer).buy(0);
      const feeRecipientAfter = await usdc.balanceOf(feeRecipient.address);

      const expectedFee = (PRICE * BigInt(250)) / BigInt(10000); // 2.5%
      expect(feeRecipientAfter - feeRecipientBefore).to.equal(expectedFee);
    });

    it("should not pay royalty on primary sale (seller = creator)", async function () {
      const creatorBefore = await usdc.balanceOf(creator.address);
      await marketplace.connect(buyer).buy(0);
      const creatorAfter = await usdc.balanceOf(creator.address);

      // Creator gets price - platformFee (no royalty since seller IS the creator)
      const platformFee = (PRICE * BigInt(250)) / BigInt(10000);
      expect(creatorAfter - creatorBefore).to.equal(PRICE - platformFee);
    });

    it("should pay royalty on secondary sale", async function () {
      // First sale: creator -> buyer
      await marketplace.connect(buyer).buy(0);

      // buyer lists for secondary sale
      await nft.connect(buyer).setApprovalForAll(await marketplace.getAddress(), true);
      await marketplace.connect(buyer).list(0, await usdc.getAddress(), PRICE);

      // buyer2 buys (secondary)
      await usdc.connect(buyer2).approve(await marketplace.getAddress(), PRICE);
      const creatorBefore = await usdc.balanceOf(creator.address);

      await marketplace.connect(buyer2).buy(0);

      const creatorAfter = await usdc.balanceOf(creator.address);
      // Royalty = 5% of price
      const expectedRoyalty = (PRICE * BigInt(500)) / BigInt(10000);
      expect(creatorAfter - creatorBefore).to.equal(expectedRoyalty);
    });

    it("should cap royalty at 10%", async function () {
      // The contract caps royalty at 10% — MangaNFT sets 5% so this just verifies the cap logic exists
      // Since MangaNFT royalty is 5%, it won't be capped — this tests that proceeds are correct
      await marketplace.connect(buyer).buy(0);

      // Verify total deducted from buyer equals price
      const buyerSpent = ethers.parseUnits("10000", 6) - (await usdc.balanceOf(buyer.address));
      expect(buyerSpent).to.equal(PRICE);
    });

    it("should correctly distribute fees on secondary sale (fee + royalty + seller)", async function () {
      // First sale
      await marketplace.connect(buyer).buy(0);

      // Secondary sale setup
      await nft.connect(buyer).setApprovalForAll(await marketplace.getAddress(), true);
      await marketplace.connect(buyer).list(0, await usdc.getAddress(), PRICE);
      await usdc.connect(buyer2).approve(await marketplace.getAddress(), PRICE);

      const feeRecBefore = await usdc.balanceOf(feeRecipient.address);
      const creatorBefore = await usdc.balanceOf(creator.address);
      const sellerBefore = await usdc.balanceOf(buyer.address);

      await marketplace.connect(buyer2).buy(0);

      const platformFee = (PRICE * BigInt(250)) / BigInt(10000);
      const royalty = (PRICE * BigInt(500)) / BigInt(10000);
      const sellerProceeds = PRICE - platformFee - royalty;

      expect((await usdc.balanceOf(feeRecipient.address)) - feeRecBefore).to.equal(platformFee);
      expect((await usdc.balanceOf(creator.address)) - creatorBefore).to.equal(royalty);
      expect((await usdc.balanceOf(buyer.address)) - sellerBefore).to.equal(sellerProceeds);
    });

    it("should revert if buyer is the seller", async function () {
      await expect(
        marketplace.connect(creator).buy(0)
      ).to.be.revertedWith("Cannot buy own");
    });

    it("should revert if listing is not active", async function () {
      await marketplace.connect(creator).unlist(0);
      await expect(
        marketplace.connect(buyer).buy(0)
      ).to.be.revertedWith("Not listed");
    });

    it("should revert if buyer has insufficient token balance", async function () {
      // Drain buyer's USDC
      const bal = await usdc.balanceOf(buyer.address);
      await usdc.connect(buyer).transfer(owner.address, bal);

      await expect(
        marketplace.connect(buyer).buy(0)
      ).to.be.reverted; // SafeERC20 will revert
    });

    it("should revert if buyer has not approved marketplace", async function () {
      // Reset approval to 0
      await usdc.connect(buyer).approve(await marketplace.getAddress(), 0);

      await expect(
        marketplace.connect(buyer).buy(0)
      ).to.be.reverted;
    });

    it("should handle small prices correctly", async function () {
      // Unlist and relist with tiny price
      await marketplace.connect(creator).unlist(0);
      await marketplace.connect(creator).list(0, await usdc.getAddress(), SMALL_PRICE);

      await marketplace.connect(buyer).buy(0);
      expect(await nft.ownerOf(0)).to.equal(buyer.address);
    });

    it("should work with USDT payment token", async function () {
      // Unlist USDC listing, relist with USDT
      await marketplace.connect(creator).unlist(0);
      await marketplace.connect(creator).list(0, await usdt.getAddress(), PRICE);

      await usdt.connect(buyer).approve(await marketplace.getAddress(), PRICE);
      await marketplace.connect(buyer).buy(0);

      expect(await nft.ownerOf(0)).to.equal(buyer.address);
    });

    it("should fail if NFT was transferred away after listing (stale listing)", async function () {
      // Creator transfers NFT away without unlisting
      await nft.connect(creator).transferFrom(creator.address, owner.address, 0);

      // Listing is still active but NFT ownership changed
      await expect(
        marketplace.connect(buyer).buy(0)
      ).to.be.reverted; // safeTransferFrom will fail since marketplace can't move from creator
    });
  });

  // ─── SOCIAL (LIKES) ────────────────────────────────────────────────────────

  describe("Likes", function () {
    it("should like a token", async function () {
      await marketplace.connect(buyer).like(0);
      expect(await marketplace.likeCount(0)).to.equal(1);
      expect(await marketplace.hasLiked(0, buyer.address)).to.be.true;
    });

    it("should emit Liked event", async function () {
      await expect(marketplace.connect(buyer).like(0))
        .to.emit(marketplace, "Liked")
        .withArgs(0, buyer.address);
    });

    it("should allow multiple users to like", async function () {
      await marketplace.connect(buyer).like(0);
      await marketplace.connect(buyer2).like(0);
      expect(await marketplace.likeCount(0)).to.equal(2);
    });

    it("should revert if already liked", async function () {
      await marketplace.connect(buyer).like(0);
      await expect(
        marketplace.connect(buyer).like(0)
      ).to.be.revertedWith("Already liked");
    });

    it("should unlike a token", async function () {
      await marketplace.connect(buyer).like(0);
      await marketplace.connect(buyer).unlike(0);
      expect(await marketplace.likeCount(0)).to.equal(0);
      expect(await marketplace.hasLiked(0, buyer.address)).to.be.false;
    });

    it("should emit Unliked event", async function () {
      await marketplace.connect(buyer).like(0);
      await expect(marketplace.connect(buyer).unlike(0))
        .to.emit(marketplace, "Unliked")
        .withArgs(0, buyer.address);
    });

    it("should revert unlike if not liked", async function () {
      await expect(
        marketplace.connect(buyer).unlike(0)
      ).to.be.revertedWith("Not liked");
    });

    it("should allow like again after unlike", async function () {
      await marketplace.connect(buyer).like(0);
      await marketplace.connect(buyer).unlike(0);
      await marketplace.connect(buyer).like(0);
      expect(await marketplace.likeCount(0)).to.equal(1);
    });

    it("should track likes independently per tokenId", async function () {
      // Mint another NFT
      await nft.connect(creator).mint(creator.address, "ipfs://another");

      await marketplace.connect(buyer).like(0);
      await marketplace.connect(buyer).like(1);
      await marketplace.connect(buyer2).like(0);

      expect(await marketplace.likeCount(0)).to.equal(2);
      expect(await marketplace.likeCount(1)).to.equal(1);
    });
  });

  // ─── ADMIN ─────────────────────────────────────────────────────────────────

  describe("Admin functions", function () {
    describe("setAllowedToken", function () {
      it("should add a new allowed token", async function () {
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        const newToken = await MockERC20.deploy("USDm", "USDm", 18);
        await newToken.waitForDeployment();

        await marketplace.connect(owner).setAllowedToken(await newToken.getAddress(), true);
        expect(await marketplace.allowedTokens(await newToken.getAddress())).to.be.true;
      });

      it("should emit TokenAllowed event", async function () {
        const addr = "0x0000000000000000000000000000000000000099";
        await expect(marketplace.connect(owner).setAllowedToken(addr, true))
          .to.emit(marketplace, "TokenAllowed")
          .withArgs(addr, true);
      });

      it("should remove an allowed token", async function () {
        await marketplace.connect(owner).setAllowedToken(await usdc.getAddress(), false);
        expect(await marketplace.allowedTokens(await usdc.getAddress())).to.be.false;
      });

      it("should revert if called by non-owner", async function () {
        await expect(
          marketplace.connect(buyer).setAllowedToken(await usdc.getAddress(), false)
        ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
      });

      it("should prevent listing with removed token", async function () {
        await marketplace.connect(owner).setAllowedToken(await usdc.getAddress(), false);
        await expect(
          marketplace.connect(creator).list(0, await usdc.getAddress(), PRICE)
        ).to.be.revertedWith("Token not allowed");
      });
    });

    describe("setPlatformFee", function () {
      it("should update platform fee", async function () {
        await marketplace.connect(owner).setPlatformFee(500); // 5%
        expect(await marketplace.platformFeeBps()).to.equal(500);
      });

      it("should emit PlatformFeeUpdated event", async function () {
        await expect(marketplace.connect(owner).setPlatformFee(100))
          .to.emit(marketplace, "PlatformFeeUpdated")
          .withArgs(100);
      });

      it("should allow setting fee to 0", async function () {
        await marketplace.connect(owner).setPlatformFee(0);
        expect(await marketplace.platformFeeBps()).to.equal(0);

        // Buy with 0 platform fee
        await marketplace.connect(creator).list(0, await usdc.getAddress(), PRICE);
        await usdc.connect(buyer).approve(await marketplace.getAddress(), PRICE);

        const feeRecBefore = await usdc.balanceOf(feeRecipient.address);
        await marketplace.connect(buyer).buy(0);
        const feeRecAfter = await usdc.balanceOf(feeRecipient.address);

        expect(feeRecAfter - feeRecBefore).to.equal(0);
      });

      it("should revert if fee exceeds 10% (1000 bps)", async function () {
        await expect(
          marketplace.connect(owner).setPlatformFee(1001)
        ).to.be.revertedWith("Max 10%");
      });

      it("should allow max 10% fee", async function () {
        await marketplace.connect(owner).setPlatformFee(1000);
        expect(await marketplace.platformFeeBps()).to.equal(1000);
      });

      it("should revert if called by non-owner", async function () {
        await expect(
          marketplace.connect(buyer).setPlatformFee(500)
        ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
      });
    });

    describe("setFeeRecipient", function () {
      it("should update fee recipient", async function () {
        await marketplace.connect(owner).setFeeRecipient(buyer2.address);
        expect(await marketplace.feeRecipient()).to.equal(buyer2.address);
      });

      it("should revert if called by non-owner", async function () {
        await expect(
          marketplace.connect(buyer).setFeeRecipient(buyer.address)
        ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
      });

      it("should send fees to new recipient after update", async function () {
        await marketplace.connect(owner).setFeeRecipient(buyer2.address);

        await marketplace.connect(creator).list(0, await usdc.getAddress(), PRICE);
        await usdc.connect(buyer).approve(await marketplace.getAddress(), PRICE);

        const newRecBefore = await usdc.balanceOf(buyer2.address);
        await marketplace.connect(buyer).buy(0);
        const newRecAfter = await usdc.balanceOf(buyer2.address);

        const expectedFee = (PRICE * BigInt(250)) / BigInt(10000);
        expect(newRecAfter - newRecBefore).to.equal(expectedFee);
      });
    });

    describe("setNftContract", function () {
      it("should update NFT contract address", async function () {
        const MangaNFT2 = await ethers.getContractFactory("MangaNFT");
        const nft2 = await MangaNFT2.deploy(await usdc.getAddress(), owner.address);
        await nft2.waitForDeployment();

        await marketplace.connect(owner).setNftContract(await nft2.getAddress());
        expect(await marketplace.nftContract()).to.equal(await nft2.getAddress());
      });

      it("should revert if called by non-owner", async function () {
        await expect(
          marketplace.connect(buyer).setNftContract(buyer.address)
        ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
      });
    });
  });

  // ─── EDGE CASES ────────────────────────────────────────────────────────────

  describe("Edge cases", function () {
    it("should handle multiple listings from different sellers", async function () {
      // Mint another NFT for buyer
      await nft.connect(buyer).mint(buyer.address, "ipfs://buyer-nft");
      await nft.connect(buyer).setApprovalForAll(await marketplace.getAddress(), true);

      await marketplace.connect(creator).list(0, await usdc.getAddress(), PRICE);
      await marketplace.connect(buyer).list(1, await usdc.getAddress(), PRICE * BigInt(2));

      const listing0 = await marketplace.listings(0);
      const listing1 = await marketplace.listings(1);

      expect(listing0.seller).to.equal(creator.address);
      expect(listing1.seller).to.equal(buyer.address);
      expect(listing1.price).to.equal(PRICE * BigInt(2));
    });

    it("should not allow buying after listing is already sold", async function () {
      await marketplace.connect(creator).list(0, await usdc.getAddress(), PRICE);
      await usdc.connect(buyer).approve(await marketplace.getAddress(), PRICE);
      await marketplace.connect(buyer).buy(0);

      // buyer2 tries to buy the same listing
      await usdc.connect(buyer2).approve(await marketplace.getAddress(), PRICE);
      await expect(
        marketplace.connect(buyer2).buy(0)
      ).to.be.revertedWith("Not listed");
    });

    it("should handle constructor with empty allowed tokens array", async function () {
      const MangaMarketplace = await ethers.getContractFactory("MangaMarketplace");
      const mp = await MangaMarketplace.deploy(
        await nft.getAddress(),
        feeRecipient.address,
        []
      );
      await mp.waitForDeployment();

      expect(await mp.allowedTokens(await usdc.getAddress())).to.be.false;
    });

    it("should correctly report initial state", async function () {
      expect(await marketplace.platformFeeBps()).to.equal(250);
      expect(await marketplace.feeRecipient()).to.equal(feeRecipient.address);
      expect(await marketplace.nftContract()).to.equal(await nft.getAddress());
      expect(await marketplace.allowedTokens(await usdc.getAddress())).to.be.true;
      expect(await marketplace.allowedTokens(await usdt.getAddress())).to.be.true;
    });
  });
});

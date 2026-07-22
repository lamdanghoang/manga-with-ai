# Smart Contract Security Audit Report

**Project:** MangaWithAI  
**Auditor:** Slither Static Analyzer v0.11.5  
**Date:** July 23, 2026  
**Contracts:** MangaNFT.sol, MangaMarketplace.sol  
**Solidity:** ^0.8.27  
**Framework:** Hardhat + OpenZeppelin v5.1  

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 High | 0 | — |
| 🟠 Medium | 0 | — |
| 🟡 Low | 3 | Acknowledged |
| ℹ️ Informational | 10 | Acknowledged |

**Overall: No critical or high-risk vulnerabilities detected.**

---

## Contract Overview

| Contract | Functions | SLOC | Complexity | Dependencies |
|----------|-----------|------|------------|--------------|
| MangaNFT | 85 | ~120 | Low | ERC721, ERC721URIStorage, ERC721Royalty, Ownable, ReentrancyGuard |
| MangaMarketplace | 26 | ~76 | Low | Ownable, ReentrancyGuard, SafeERC20 |

**Total SLOC:** 196 (source) + 2117 (dependencies)  
**ERCs:** ERC165, ERC721, ERC2981, ERC20 (interaction)

---

## Findings

### 🟡 Low Severity

#### L-01: Missing zero-address validation

**Location:** 
- `MangaMarketplace.constructor()` — `_feeRecipient` parameter
- `MangaMarketplace.setFeeRecipient()` — `_recipient` parameter  
- `MangaNFT.constructor()` — `_feeRecipient` parameter

**Description:** These functions accept address parameters without checking for `address(0)`. Setting `feeRecipient` to zero address would permanently burn platform fees.

**Risk:** Low — only callable by owner/deployer.

**Recommendation:** Add `require(_recipient != address(0), "Zero address")` checks.

**Status:** Acknowledged. Owner-only functions with low practical risk.

---

### ℹ️ Informational

#### I-01: Costly operations inside loop

**Location:** `MangaNFT.batchMint()` — `_nextTokenId++` inside loop

**Description:** State variable `_nextTokenId` is incremented inside a loop. Each iteration writes to storage (expensive).

**Risk:** Gas cost scales linearly with batch size. Already mitigated by practical batch sizes (max ~10 panels per manga).

**Recommendation:** Consider caching `_nextTokenId` in memory and writing back once after the loop.

---

#### I-02: Naming convention (6 instances)

**Location:** Multiple admin function parameters use `_underscore` prefix instead of mixedCase.

**Parameters:**
- `MangaMarketplace.setPlatformFee(_feeBps)`
- `MangaMarketplace.setFeeRecipient(_recipient)`
- `MangaMarketplace.setNftContract(_nft)`
- `MangaNFT.setMintFee(_fee)`
- `MangaNFT.setFeeToken(_token)`
- `MangaNFT.setFeeRecipient(_recipient)`

**Risk:** None — cosmetic only, common Solidity convention.

---

#### I-03: Unindexed event address parameters (3 instances)

**Location:**
- `MangaMarketplace.TokenAllowed(address, bool)`
- `MangaNFT.FeeTokenUpdated(address)`
- `MangaNFT.FeeRecipientUpdated(address)`

**Description:** Address parameters in events should be `indexed` for efficient off-chain filtering.

**Recommendation:** Add `indexed` keyword to address parameters in these events.

---

## Security Features Verified ✅

| Feature | Status |
|---------|--------|
| Reentrancy protection | ✅ `ReentrancyGuard` on `buy()` and `mint()` |
| Access control | ✅ `Ownable` on all admin functions |
| Safe ERC20 transfers | ✅ `SafeERC20.safeTransferFrom` |
| Integer overflow | ✅ Solidity 0.8.x built-in checks |
| Royalty cap | ✅ Capped at 10% in marketplace |
| Self-buy prevention | ✅ `require(seller != msg.sender)` |
| Payment token whitelist | ✅ `allowedTokens` mapping |
| Platform fee cap | ✅ `require(_feeBps <= 1000)` max 10% |
| NFT approval check | ✅ Verified before listing |
| Audited base contracts | ✅ OpenZeppelin v5.1 |

---

## Test Coverage

| Test File | Tests | Status |
|-----------|-------|--------|
| MangaNFT.test.ts | 17 | ✅ All passing |
| MangaMarketplace.test.ts | 58 | ✅ All passing |

**Total: 75 tests passing**

---

## Recommendations (Non-Critical)

1. **Add zero-address checks** to constructor and setter functions for defense-in-depth.
2. **Index event addresses** for better off-chain queryability.
3. **Optimize batchMint** by caching `_nextTokenId` in memory variable.
4. Consider a **timelock** on admin functions for increased decentralization trust.

---

## Conclusion

The MangaWithAI smart contracts demonstrate solid security practices:
- No high or medium vulnerabilities detected
- Proper use of battle-tested OpenZeppelin libraries
- Reentrancy guards on all payment functions
- Appropriate access control
- Comprehensive test coverage (75 tests)

The contracts are suitable for production deployment on Celo Mainnet.

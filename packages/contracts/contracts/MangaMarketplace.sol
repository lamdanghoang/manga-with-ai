// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MangaMarketplace
 * @notice Marketplace for buying/selling MangaNFTs with multi-asset support (USDC, USDT, USDm on Celo).
 *         Supports ERC-2981 royalty payouts on secondary sales.
 */
contract MangaMarketplace is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Listing {
        address seller;
        address paymentToken; // ERC-20 token address for price
        uint256 price;
        bool active;
    }

    // Platform fee in basis points (2.5%)
    uint96 public platformFeeBps = 250;
    address public feeRecipient;

    // NFT contract
    IERC721 public nftContract;

    // Allowed payment tokens (USDC, USDT, USDm)
    mapping(address => bool) public allowedTokens;

    // tokenId => Listing
    mapping(uint256 => Listing) public listings;

    // Like counts per token
    mapping(uint256 => uint256) public likeCount;
    mapping(uint256 => mapping(address => bool)) public hasLiked;

    event Listed(uint256 indexed tokenId, address indexed seller, address paymentToken, uint256 price);
    event Unlisted(uint256 indexed tokenId, address indexed seller);
    event Sold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price, address paymentToken);
    event Liked(uint256 indexed tokenId, address indexed user);
    event Unliked(uint256 indexed tokenId, address indexed user);
    event TokenAllowed(address indexed token, bool allowed);
    event PlatformFeeUpdated(uint96 newFeeBps);

    constructor(address _nftContract, address _feeRecipient, address[] memory _allowedTokens) Ownable(msg.sender) {
        require(_nftContract != address(0), "Invalid nft contract");
        require(_feeRecipient != address(0), "Invalid recipient");
        nftContract = IERC721(_nftContract);
        feeRecipient = _feeRecipient;

        for (uint256 i = 0; i < _allowedTokens.length; i++) {
            allowedTokens[_allowedTokens[i]] = true;
            emit TokenAllowed(_allowedTokens[i], true);
        }
    }

    // --- Listings ---

    /**
     * @notice List an NFT for sale
     * @param tokenId The NFT token ID
     * @param paymentToken ERC-20 address to receive payment in
     * @param price Price in payment token's smallest unit
     */
    function list(uint256 tokenId, address paymentToken, uint256 price) external {
        require(allowedTokens[paymentToken], "Token not allowed");
        require(price > 0, "Price must be > 0");
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not owner");
        require(
            nftContract.getApproved(tokenId) == address(this) ||
            nftContract.isApprovedForAll(msg.sender, address(this)),
            "Not approved"
        );

        listings[tokenId] = Listing({
            seller: msg.sender,
            paymentToken: paymentToken,
            price: price,
            active: true
        });

        emit Listed(tokenId, msg.sender, paymentToken, price);
    }

    /**
     * @notice Cancel a listing
     */
    function unlist(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(listing.seller == msg.sender, "Not seller");

        listing.active = false;
        emit Unlisted(tokenId, msg.sender);
    }

    /**
     * @notice Buy a listed NFT. Handles royalty + platform fee distribution.
     * @param tokenId The NFT to buy
     */
    function buy(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(listing.seller != msg.sender, "Cannot buy own");

        address seller = listing.seller;
        address paymentToken = listing.paymentToken;
        uint256 price = listing.price;

        // Mark as sold
        listing.active = false;

        // Calculate fees
        uint256 platformFee = (price * platformFeeBps) / 10000;
        uint256 royaltyAmount = 0;
        address royaltyReceiver = address(0);

        // Check ERC-2981 royalty
        if (IERC165(address(nftContract)).supportsInterface(type(IERC2981).interfaceId)) {
            (royaltyReceiver, royaltyAmount) = IERC2981(address(nftContract)).royaltyInfo(tokenId, price);
            // Cap royalty at 10%
            if (royaltyAmount > (price * 1000) / 10000) {
                royaltyAmount = (price * 1000) / 10000;
            }
            // Don't pay royalty to seller (primary sale)
            if (royaltyReceiver == seller) {
                royaltyAmount = 0;
            }
        }

        uint256 sellerProceeds = price - platformFee - royaltyAmount;

        // Transfer payments
        IERC20 token = IERC20(paymentToken);
        token.safeTransferFrom(msg.sender, feeRecipient, platformFee);
        if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
            token.safeTransferFrom(msg.sender, royaltyReceiver, royaltyAmount);
        }
        token.safeTransferFrom(msg.sender, seller, sellerProceeds);

        // Transfer NFT
        nftContract.safeTransferFrom(seller, msg.sender, tokenId);

        emit Sold(tokenId, seller, msg.sender, price, paymentToken);
    }

    // --- Social ---

    /**
     * @notice Like an NFT (one per address)
     */
    function like(uint256 tokenId) external {
        require(!hasLiked[tokenId][msg.sender], "Already liked");
        hasLiked[tokenId][msg.sender] = true;
        likeCount[tokenId]++;
        emit Liked(tokenId, msg.sender);
    }

    /**
     * @notice Unlike an NFT
     */
    function unlike(uint256 tokenId) external {
        require(hasLiked[tokenId][msg.sender], "Not liked");
        hasLiked[tokenId][msg.sender] = false;
        likeCount[tokenId]--;
        emit Unliked(tokenId, msg.sender);
    }

    // --- Admin ---

    function setAllowedToken(address token, bool allowed) external onlyOwner {
        allowedTokens[token] = allowed;
        emit TokenAllowed(token, allowed);
    }

    function setPlatformFee(uint96 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Max 10%");
        platformFeeBps = _feeBps;
        emit PlatformFeeUpdated(_feeBps);
    }

    function setFeeRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid recipient");
        feeRecipient = _recipient;
    }

    function setNftContract(address _nft) external onlyOwner {
        nftContract = IERC721(_nft);
    }
}

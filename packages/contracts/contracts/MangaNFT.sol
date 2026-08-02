// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MangaNFT
 * @notice ERC-721 NFT for AI-generated manga creations on Celo.
 *         Creators mint their stories/panels as NFTs with on-chain royalties (ERC-2981).
 *         Mint fee is paid in stablecoin (USDC/USDm) — no CELO needed.
 */
contract MangaNFT is ERC721, ERC721URIStorage, ERC721Royalty, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 private _nextTokenId;

    // Default creator royalty on secondary sales (basis points)
    uint96 public constant DEFAULT_ROYALTY_BPS = 500; // 5%

    // Mint fee in stablecoin (0 for free minting, can be set by owner)
    uint256 public mintFee;

    // Stablecoin used for mint fee payment (e.g. USDC on Celo)
    IERC20 public feeToken;

    // Fee recipient (platform treasury)
    address public feeRecipient;

    // Mapping from tokenId to original creator
    mapping(uint256 => address) public creators;

    event Minted(uint256 indexed tokenId, address indexed creator, string tokenURI);
    event MintFeeUpdated(uint256 newFee);
    event FeeTokenUpdated(address indexed newToken);
    event FeeRecipientUpdated(address indexed newRecipient);

    constructor(address _feeToken, address _feeRecipient) ERC721("MangaWithAI", "MANGA") Ownable(msg.sender) {
        require(_feeToken != address(0), "Invalid token");
        require(_feeRecipient != address(0), "Invalid recipient");
        feeToken = IERC20(_feeToken);
        feeRecipient = _feeRecipient;
    }

    /**
     * @notice Mint a new manga NFT
     * @param to Recipient address (usually the creator)
     * @param uri IPFS/Arweave URI for metadata
     * @return tokenId The minted token ID
     */
    function mint(address to, string calldata uri) external nonReentrant returns (uint256) {
        _collectFee(1);

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        // Set creator royalty (ERC-2981)
        _setTokenRoyalty(tokenId, to, DEFAULT_ROYALTY_BPS);

        creators[tokenId] = to;

        emit Minted(tokenId, to, uri);
        return tokenId;
    }

    /**
     * @notice Batch mint multiple NFTs (e.g., all panels in a chapter)
     */
    function batchMint(address to, string[] calldata uris) external nonReentrant returns (uint256[] memory) {
        _collectFee(uris.length);

        uint256[] memory tokenIds = new uint256[](uris.length);
        for (uint256 i = 0; i < uris.length; i++) {
            uint256 tokenId = _nextTokenId++;
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, uris[i]);
            _setTokenRoyalty(tokenId, to, DEFAULT_ROYALTY_BPS);
            creators[tokenId] = to;
            tokenIds[i] = tokenId;

            emit Minted(tokenId, to, uris[i]);
        }
        return tokenIds;
    }

    /**
     * @notice Collect stablecoin fee (skip if mintFee is 0)
     */
    function _collectFee(uint256 count) private {
        if (mintFee == 0) return;
        uint256 totalFee = mintFee * count;
        feeToken.safeTransferFrom(msg.sender, feeRecipient, totalFee);
    }

    // --- Admin ---

    /**
     * @notice Update mint fee (owner only)
     */
    function setMintFee(uint256 _fee) external onlyOwner {
        mintFee = _fee;
        emit MintFeeUpdated(_fee);
    }

    /**
     * @notice Update fee token address (owner only)
     */
    function setFeeToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token");
        feeToken = IERC20(_token);
        emit FeeTokenUpdated(_token);
    }

    /**
     * @notice Update fee recipient (owner only)
     */
    function setFeeRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid recipient");
        feeRecipient = _recipient;
        emit FeeRecipientUpdated(_recipient);
    }

    /**
     * @notice Total supply of minted NFTs
     */
    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }

    // --- Overrides ---

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, ERC721Royalty) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

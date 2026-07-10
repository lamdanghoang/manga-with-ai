"use client";
import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { celoSepolia, activeContracts as contracts } from "@/lib/wagmi";
import { MANGA_NFT_ABI } from "@manga-with-ai/shared";

const ERC20_ABI = [
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
] as const;

interface MintNFTButtonProps {
  /** The metadata URI (IPFS or API URL) */
  metadataURI: string;
  /** Callback after successful mint */
  onMinted?: (tokenId: bigint, txHash: string) => void;
  /** Optional class override */
  className?: string;
}

export function MintNFTButton({
  metadataURI,
  onMinted,
  className,
}: MintNFTButtonProps) {
  const { address } = useAccount();
  const [minting, setMinting] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState("");
  const [minted, setMinted] = useState(false);

  const { writeContractAsync } = useWriteContract();

  // Read mint fee from contract
  const { data: mintFee } = useReadContract({
    address: contracts.mangaNFT,
    abi: MANGA_NFT_ABI,
    functionName: "mintFee",
    chainId: celoSepolia.id,
  });

  // Read fee token address from contract
  const { data: feeTokenAddress } = useReadContract({
    address: contracts.mangaNFT,
    abi: MANGA_NFT_ABI,
    functionName: "feeToken",
    chainId: celoSepolia.id,
  });

  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  if (isSuccess && !minted) {
    setMinted(true);
    setMinting(false);
  }

  async function handleMint() {
    if (!address || !contracts.mangaNFT) return;
    setMinting(true);
    setError("");

    try {
      const fee = mintFee || BigInt(0);

      // If fee > 0, approve stablecoin first
      if (fee > BigInt(0) && feeTokenAddress) {
        await writeContractAsync({
          address: feeTokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [contracts.mangaNFT, fee],
          chainId: celoSepolia.id,
        });
      }

      // Mint (no value — fee collected via ERC20 transferFrom)
      const hash = await writeContractAsync({
        address: contracts.mangaNFT,
        abi: MANGA_NFT_ABI,
        functionName: "mint",
        args: [address, metadataURI],
        chainId: celoSepolia.id,
      });
      setTxHash(hash);
      onMinted?.(BigInt(0), hash);
    } catch (err: any) {
      setError(err.shortMessage || err.message || "Save failed");
      setMinting(false);
    }
  }

  if (!contracts.mangaNFT) {
    return null;
  }

  if (minted) {
    return (
      <div className={`flex items-center gap-2 ${className || ""}`}>
        <span className="material-symbols-outlined text-primary text-lg">
          verified
        </span>
        <span className="font-label text-xs text-primary font-bold uppercase">
          SAVED AS COLLECTIBLE
        </span>
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        onClick={handleMint}
        disabled={minting || !address}
        className="flex items-center gap-1.5 bg-on-surface text-white font-label text-xs font-bold uppercase px-3 py-2 border-2 border-on-surface comic-shadow-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-base">bookmark</span>
        {minting ? "SAVING..." : "✨ SAVE AS COLLECTIBLE"}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

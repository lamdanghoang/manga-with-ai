"use client";
import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { parseUnits } from "viem";
import { celoSepolia, activeContracts as contracts, ATTRIBUTION_TAG } from "@/lib/wagmi";
import {
  MARKETPLACE_ABI,
  MANGA_NFT_ABI,
} from "@manga-with-ai/shared";

const TOKEN_OPTIONS = [
  { label: "USDC", address: contracts.usdc, decimals: 6 },
  { label: "USDT", address: contracts.usdt, decimals: 6 },
  { label: "USDm", address: contracts.usdm, decimals: 18 },
];

interface ListForSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: bigint;
  onListed?: () => void;
}

export function ListForSaleModal({
  isOpen,
  onClose,
  tokenId,
  onListed,
}: ListForSaleModalProps) {
  const { address } = useAccount();
  const [price, setPrice] = useState("");
  const [selectedToken, setSelectedToken] = useState(TOKEN_OPTIONS[0]);
  const [step, setStep] = useState<"form" | "approving" | "listing" | "done">(
    "form",
  );
  const [error, setError] = useState("");
  const [approveTxHash, setApproveTxHash] = useState<
    `0x${string}` | undefined
  >();
  const [listTxHash, setListTxHash] = useState<`0x${string}` | undefined>();

  const { writeContractAsync } = useWriteContract();

  // Check if marketplace is already approved
  const { data: isApproved } = useReadContract({
    address: contracts.mangaNFT,
    abi: MANGA_NFT_ABI,
    functionName: "isApprovedForAll",
    args: address ? [address, contracts.marketplace] : undefined,
    chainId: celoSepolia.id,
  });

  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });
  const { isSuccess: listConfirmed } = useWaitForTransactionReceipt({
    hash: listTxHash,
  });

  if (approveConfirmed && step === "approving") {
    handleList();
  }

  if (listConfirmed && step === "listing") {
    setStep("done");
    onListed?.();
  }

  async function handleSubmit() {
    if (!address || !price || parseFloat(price) <= 0) return;
    setError("");

    try {
      // If not approved, approve first
      if (!isApproved) {
        setStep("approving");
        const tx = await writeContractAsync({
          address: contracts.mangaNFT,
          abi: MANGA_NFT_ABI,
          functionName: "setApprovalForAll",
          args: [contracts.marketplace, true],
          chainId: celoSepolia.id,
          dataSuffix: ATTRIBUTION_TAG,
          // Pay gas in stablecoin so users without CELO can still transact
          feeCurrency: selectedToken.address,
        });
        setApproveTxHash(tx);
      } else {
        await handleList();
      }
    } catch (err: any) {
      setError(err.shortMessage || err.message || "Failed");
      setStep("form");
    }
  }

  async function handleList() {
    try {
      setStep("listing");
      const priceInUnits = parseUnits(price, selectedToken.decimals);
      const tx = await writeContractAsync({
        address: contracts.marketplace,
        abi: MARKETPLACE_ABI,
        functionName: "list",
        args: [tokenId, selectedToken.address, priceInUnits],
        chainId: celoSepolia.id,
        dataSuffix: ATTRIBUTION_TAG,
        // Pay gas in stablecoin so users without CELO can still transact
        feeCurrency: selectedToken.address,
      });
      setListTxHash(tx);
    } catch (err: any) {
      setError(err.shortMessage || err.message || "List failed");
      setStep("form");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="border-4 border-on-surface bg-white comic-shadow-lg p-6 max-w-sm w-full space-y-4">
        <h3 className="font-display text-xl uppercase text-center">
          LIST FOR SALE
        </h3>

        {step === "done" ? (
          <div className="text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-primary">
              check_circle
            </span>
            <p className="font-label text-sm">
              Your NFT is now listed on the marketplace!
            </p>
            <button
              onClick={onClose}
              className="w-full bg-primary text-white font-display text-sm border-2 border-on-surface py-2 uppercase"
            >
              DONE
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {/* Token selector */}
              <div>
                <label className="font-label text-xs text-secondary uppercase block mb-1">
                  Payment Token
                </label>
                <div className="flex gap-2">
                  {TOKEN_OPTIONS.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => setSelectedToken(t)}
                      className={`flex-1 font-label text-xs font-bold py-2 border-2 border-on-surface transition-colors ${
                        selectedToken.label === t.label
                          ? "bg-primary text-white"
                          : "bg-white text-on-surface hover:bg-surface-container"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price input */}
              <div>
                <label className="font-label text-xs text-secondary uppercase block mb-1">
                  Price ({selectedToken.label})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full border-2 border-on-surface p-2.5 font-display text-lg text-center focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={step !== "form" || !price || parseFloat(price) <= 0}
              className="w-full bg-on-surface text-white font-display text-lg border-4 border-on-surface py-3 comic-shadow active:translate-x-1 active:translate-y-1 active:shadow-none transition-all uppercase disabled:opacity-50"
            >
              {step === "approving"
                ? "APPROVING..."
                : step === "listing"
                  ? "LISTING..."
                  : "LIST FOR SALE"}
            </button>
            <button
              onClick={onClose}
              className="w-full text-center font-label text-xs text-secondary uppercase"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

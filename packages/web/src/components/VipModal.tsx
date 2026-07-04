"use client";
import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useSwitchChain,
  usePublicClient,
} from "wagmi";
import { parseUnits } from "viem";
import { celoSepolia } from "@/lib/wagmi";
import { api } from "@/lib/api";

// USDC on Celo Sepolia
const USDC_ADDRESS = "0x01C5C0122039549AD1493B8220cABEdD739BC44E" as const;
const MERCHANT_WALLET = "0x792cA42F2C2f9D9fB56dDBbfE9a0916AE6e98DD8" as const;
const VIP_PRICE = "1"; // $1 USDC per month

const ERC20_ABI = [
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
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

interface VipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function VipModal({ isOpen, onClose, onSuccess }: VipModalProps) {
  const { address } = useAccount();
  const [step, setStep] = useState<"info" | "paying" | "confirming" | "done">(
    "info",
  );
  const [error, setError] = useState("");

  const { data: balance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: celoSepolia.id,
  } as any);

  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: celoSepolia.id });

  async function handlePurchase() {
    if (!address) return;
    setStep("paying");
    setError("");

    try {
      await switchChainAsync({ chainId: celoSepolia.id });

      const txHash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [MERCHANT_WALLET, parseUnits(VIP_PRICE, 6)],
        chainId: celoSepolia.id,
      });

      setStep("confirming");

      // Wait for on-chain confirmation before notifying backend
      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") {
        throw new Error("Transaction reverted on-chain");
      }

      // Register subscription on backend (backend will also verify on-chain)
      await api("/v1/user/subscribe", {
        method: "POST",
        body: JSON.stringify({ paymentTx: txHash, plan: "vip" }),
      });

      setStep("done");
      setTimeout(() => onSuccess(), 1500);
    } catch (err: any) {
      setError(err.shortMessage || err.message || "Payment failed");
      setStep("info");
    }
  }

  if (!isOpen) return null;

  const balanceFormatted = balance
    ? (Number(balance) / 1e6).toFixed(2)
    : "0.00";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="border-4 border-on-surface bg-white comic-shadow-lg p-6 max-w-sm w-full space-y-4">
        {step === "done" ? (
          <div className="text-center space-y-3">
            <span className="material-symbols-outlined text-5xl text-yellow-500">
              star
            </span>
            <h3 className="font-display text-xl uppercase">VIP UNLOCKED!</h3>
            <p className="text-sm text-secondary">
              You now have access to all premium styles and custom prompts.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl text-yellow-500">
                workspace_premium
              </span>
              <h3 className="font-display text-xl uppercase mt-2">
                UNLOCK VIP
              </h3>
            </div>

            {/* Benefits */}
            <div className="border-2 border-on-surface bg-surface-container p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">
                  check_circle
                </span>
                <span className="font-label text-xs">
                  6 exclusive art styles
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">
                  check_circle
                </span>
                <span className="font-label text-xs">
                  Custom style prompt input
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">
                  check_circle
                </span>
                <span className="font-label text-xs">
                  Priority generation queue
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">
                  check_circle
                </span>
                <span className="font-label text-xs">
                  Creator badge on leaderboard
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="border-2 border-on-surface bg-yellow-50 p-3 text-center">
              <p className="font-display text-2xl text-on-surface">$1.00</p>
              <p className="font-label text-xs text-secondary">
                USDC · 30 days access
              </p>
              <p className="font-label text-[10px] text-secondary mt-1">
                Your balance: ${balanceFormatted} USDC
              </p>
            </div>

            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}

            <button
              onClick={handlePurchase}
              disabled={step !== "info"}
              className="w-full bg-yellow-400 text-on-surface font-display text-lg border-4 border-on-surface py-3 comic-shadow active:translate-x-1 active:translate-y-1 active:shadow-none transition-all uppercase disabled:opacity-50"
            >
              {step === "paying"
                ? "CONFIRMING TX..."
                : step === "confirming"
                  ? "ACTIVATING..."
                  : "UPGRADE TO VIP"}
            </button>
            <button
              onClick={onClose}
              className="w-full text-center font-label text-xs text-secondary uppercase"
            >
              Maybe later
            </button>
          </>
        )}
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useSwitchChain,
  usePublicClient,
} from "wagmi";
import { parseUnits } from "viem";
import { celoSepolia, USDC_ADDRESS, MERCHANT_WALLET, DEPOSIT_LINK, ATTRIBUTION_TAG } from "@/lib/wagmi";
import { api } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

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

const PACKAGES = {
  starter: {
    label: "Starter",
    price: "3",
    credits: 5,
    perks: ["5 manga credits"],
    bestValue: false,
  },
  creator: {
    label: "Creator",
    price: "5",
    credits: 25,
    perks: ["25 manga credits", "Premium styles"],
    bestValue: true,
  },
  pro: {
    label: "Pro",
    price: "10",
    credits: 70,
    perks: ["70 manga credits", "All styles", "Priority queue"],
    bestValue: false,
  },
} as const;

type PackageKey = keyof typeof PACKAGES;

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PackageModal({ isOpen, onClose, onSuccess }: PackageModalProps) {
  const { address } = useAccount();
  const [selectedPkg, setSelectedPkg] = useState<PackageKey>("creator");
  const [step, setStep] = useState<"select" | "paying" | "confirming" | "done">("select");
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

  async function handleBuy() {
    if (!address) return;
    setStep("paying");
    setError("");

    const pkg = PACKAGES[selectedPkg];

    try {
      try { await switchChainAsync({ chainId: celoSepolia.id }); } catch {}

      const txHash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [MERCHANT_WALLET, parseUnits(pkg.price, 6)],
        chainId: celoSepolia.id,
        dataSuffix: ATTRIBUTION_TAG,
      });

      setStep("confirming");

      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") {
        throw new Error("Transaction reverted");
      }

      await api("/v1/user/buy-package", {
        method: "POST",
        body: JSON.stringify({ paymentTx: txHash, package: selectedPkg }),
      });

      setStep("done");
      trackEvent('buy_package', { package: selectedPkg, price: pkg.price });
      setTimeout(() => onSuccess(), 1500);
    } catch (err: any) {
      setError(err.shortMessage || err.message || "Payment failed");
      setStep("select");
    }
  }

  if (!isOpen) return null;

  const balanceFormatted = balance ? (Number(balance) / 1e6).toFixed(2) : "0.00";
  const pkg = PACKAGES[selectedPkg];
  const insufficientBalance =
    balance !== undefined && Number(balance) / 1e6 < Number(pkg.price);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="border-2 border-on-surface bg-surface-container p-4 max-w-sm w-full space-y-3 overflow-y-auto max-h-[90vh]">
        {step === "done" ? (
          <div className="text-center space-y-3 py-4">
            <p className="text-4xl">🎉</p>
            <h3 className="font-display text-xl text-primary uppercase">
              {pkg.credits} CREDITS ADDED!
            </h3>
            <p className="font-label text-xs text-secondary">
              {pkg.label} package activated
            </p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h3 className="font-display text-lg text-primary uppercase">BUY CREDITS</h3>
              <p className="font-label text-[10px] text-secondary">
                Select a package
              </p>
            </div>

            {/* Package cards */}
            <div className="space-y-2">
              {(Object.entries(PACKAGES) as [PackageKey, (typeof PACKAGES)[PackageKey]][]).map(
                ([key, p]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPkg(key)}
                    className={`w-full text-left p-3 border-2 transition-all relative ${
                      selectedPkg === key
                        ? "border-yellow-500 bg-yellow-50"
                        : "border-on-surface/20 bg-white"
                    }`}
                  >
                    {p.bestValue && (
                      <span className="absolute -top-2 right-2 bg-yellow-400 text-on-surface font-label text-[9px] px-1.5 py-0.5 uppercase border border-on-surface">
                        Best Value
                      </span>
                    )}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-display text-sm uppercase">{p.label}</p>
                        <p className="font-label text-[10px] text-secondary">
                          {p.perks.join(" · ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg">${p.price}</p>
                        <p className="font-label text-[9px] text-secondary">
                          {p.credits} credits
                        </p>
                      </div>
                    </div>
                  </button>
                )
              )}
            </div>

            {/* Balance */}
            <p className="text-center font-label text-[10px] text-secondary">
              Balance: ${balanceFormatted} USDC
            </p>

            {insufficientBalance && (
              <a
                href={DEPOSIT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center font-label text-[10px] text-primary underline"
              >
                {celoSepolia.id === 11142220 ? "Get testnet USDC →" : "Deposit USDC →"}
              </a>
            )}

            {error && <p className="text-xs text-red-500 text-center">{error}</p>}

            <button
              onClick={handleBuy}
              disabled={step !== "select" || insufficientBalance}
              className="w-full bg-yellow-400 text-on-surface font-display text-base border-2 border-on-surface py-2.5 active:translate-y-0.5 transition-all uppercase disabled:opacity-50"
            >
              {step === "paying"
                ? "CONFIRMING..."
                : step === "confirming"
                  ? "PROCESSING..."
                  : `BUY ${pkg.credits} CREDITS — $${pkg.price}`}
            </button>

            <button
              onClick={onClose}
              className="w-full text-center font-label text-[10px] text-secondary uppercase"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

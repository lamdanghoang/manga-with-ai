"use client";
import {
  useWriteContract,
  useAccount,
  useReadContract,
  useSwitchChain,
  usePublicClient,
} from "wagmi";
import { parseUnits } from "viem";
import { celoSepolia } from "@/lib/wagmi";
import { useState } from "react";

// USDC on Celo Sepolia (Circle official)
const USDC_ADDRESS = "0x01C5C0122039549AD1493B8220cABEdD739BC44E" as const;
const MERCHANT_WALLET = "0x792cA42F2C2f9D9fB56dDBbfE9a0916AE6e98DD8" as const;
const PRICE_USDC = "0.05"; // $0.05

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

interface PayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (txHash: string) => void;
}

export function PayModal({ isOpen, onClose, onSuccess }: PayModalProps) {
  const { address } = useAccount();
  const [paying, setPaying] = useState(false);
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

  async function handlePay() {
    setPaying(true);
    setError("");
    try {
      // Skip switchChain in MiniPay (already on correct chain)
      try { await switchChainAsync({ chainId: celoSepolia.id }); } catch {}
      const txHash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [MERCHANT_WALLET, parseUnits(PRICE_USDC, 6)],
        chainId: celoSepolia.id,
      });
      // Wait for tx confirmation before notifying success
      await publicClient!.waitForTransactionReceipt({ hash: txHash });
      setPaying(false);
      onSuccess(txHash);
    } catch (err: any) {
      setPaying(false);
      setError(err.shortMessage || err.message || "Payment failed");
    }
  }

  if (!isOpen) return null;

  const balanceFormatted = balance
    ? (Number(balance) / 1e6).toFixed(2)
    : "0.00";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="border-4 border-on-surface bg-white comic-shadow-lg p-6 max-w-sm w-full space-y-4">
        <h3 className="font-display text-xl uppercase text-center">
          PAYMENT REQUIRED
        </h3>
        <p className="text-sm text-secondary text-center">
          Your free tier is used. Pay to continue creating manga.
        </p>

        <div className="border-2 border-on-surface bg-surface-container p-3 text-center">
          <p className="font-display text-2xl text-primary">$0.05</p>
          <p className="font-label text-xs text-secondary">
            USDC
          </p>
          <p className="font-label text-[10px] text-secondary mt-1">
            Your balance: ${balanceFormatted} USDC
          </p>
          {balance !== undefined && Number(balance) < 10000 && (
            <a
              href="https://link.minipay.xyz/add_cash?tokens=USDC"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 font-label text-[10px] text-primary underline"
            >
              Deposit USDC →
            </a>
          )}
        </div>

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full bg-primary text-white font-display text-lg border-4 border-on-surface py-3 comic-shadow active:translate-x-1 active:translate-y-1 active:shadow-none transition-all uppercase disabled:opacity-50"
        >
          {paying ? "CONFIRMING..." : "PAY & GENERATE"}
        </button>
        <button
          onClick={onClose}
          className="w-full text-center font-label text-xs text-secondary uppercase"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

"use client";
import {
  useWriteContract,
  useAccount,
  useReadContract,
  useSwitchChain,
  usePublicClient,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { celoSepolia, PAYMENT_TOKENS, MERCHANT_WALLET, DEPOSIT_LINK, ATTRIBUTION_TAG, PaymentToken } from "@/lib/wagmi";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

const PRICE_DISPLAY = "0.05"; // $0.05

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
  const { address, chain } = useAccount();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [selectedToken, setSelectedToken] = useState<PaymentToken>(PAYMENT_TOKENS[0]);

  // Read balance of selected token
  const { data: balance } = useReadContract({
    address: selectedToken.address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: celoSepolia.id,
  } as any);

  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: celoSepolia.id });

  const requiredAmount = parseUnits(PRICE_DISPLAY, selectedToken.decimals);
  const hasEnoughBalance = balance !== undefined && BigInt(balance as any) >= requiredAmount;

  const balanceFormatted = balance
    ? Number(formatUnits(BigInt(balance as any), selectedToken.decimals)).toFixed(selectedToken.decimals === 18 ? 4 : 2)
    : "0.00";

  async function handlePay() {
    // Pre-check balance before attempting transaction
    if (!hasEnoughBalance) {
      setError(`Insufficient ${selectedToken.symbol} balance. Please deposit funds first.`);
      return;
    }

    setPaying(true);
    setError("");
    try {
      // Skip switchChain in MiniPay (already on correct chain)
      try { await switchChainAsync({ chainId: celoSepolia.id }); } catch {}
      const txHash = await writeContractAsync({
        address: selectedToken.address,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [MERCHANT_WALLET, requiredAmount],
        chainId: celoSepolia.id,
        dataSuffix: ATTRIBUTION_TAG,
        // Pay gas in stablecoin so users without CELO can still transact
        feeCurrency: selectedToken.address,
      });
      // Wait for tx confirmation before notifying success
      await publicClient!.waitForTransactionReceipt({ hash: txHash });
      setPaying(false);
      trackEvent('pay_per_use', { amount: PRICE_DISPLAY, token: selectedToken.symbol });
      onSuccess(txHash);
    } catch (err: any) {
      setPaying(false);
      const msg = err.shortMessage || err.message || "Payment failed";
      // Friendly error for common issues
      if (msg.includes("transfer amount exceeds balance") || msg.includes("exceeds balance")) {
        setError(`Insufficient ${selectedToken.symbol} balance. Please deposit funds first.`);
      } else if (msg.includes("user rejected") || msg.includes("User denied")) {
        setError("Transaction cancelled.");
      } else {
        setError(msg);
      }
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="border-4 border-on-surface bg-white comic-shadow-lg p-6 max-w-sm w-full space-y-4">
        <h3 className="font-display text-xl uppercase text-center">
          PAYMENT REQUIRED
        </h3>
        <p className="text-sm text-secondary text-center">
          Your free tier is used. Pay to continue creating manga.
        </p>

        {/* Token Selector */}
        <div className="flex gap-2 justify-center">
          {PAYMENT_TOKENS.map((token) => (
            <button
              key={token.symbol}
              onClick={() => { setSelectedToken(token); setError(""); }}
              className={`font-label text-xs font-bold uppercase px-3 py-1.5 border-2 transition-all ${
                selectedToken.symbol === token.symbol
                  ? "border-primary bg-primary text-white"
                  : "border-on-surface bg-surface-container text-on-surface hover:bg-surface-container-high"
              }`}
            >
              {token.symbol}
            </button>
          ))}
        </div>

        <div className="border-2 border-on-surface bg-surface-container p-3 text-center">
          <p className="font-display text-2xl text-primary">${PRICE_DISPLAY}</p>
          <p className="font-label text-xs text-secondary">
            {selectedToken.symbol}
          </p>
          <p className={`font-label text-[10px] mt-1 ${hasEnoughBalance ? 'text-secondary' : 'text-red-500 font-bold'}`}>
            Your balance: {balanceFormatted} {selectedToken.symbol}
          </p>
          {!hasEnoughBalance && (
            <a
              href={DEPOSIT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 font-label text-[10px] text-primary underline"
            >
              Deposit {selectedToken.symbol} →
            </a>
          )}
        </div>

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        {chain && chain.id !== celoSepolia.id && (
          <div className="border-2 border-yellow-400 bg-yellow-50 p-2 text-center">
            <p className="font-label text-[10px] text-yellow-700">
              Wrong network. Please switch to Celo in your wallet settings.
            </p>
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={paying || !hasEnoughBalance || (chain?.id !== celoSepolia.id)}
          className="w-full bg-primary text-white font-display text-lg border-4 border-on-surface py-3 comic-shadow active:translate-x-1 active:translate-y-1 active:shadow-none transition-all uppercase disabled:opacity-50"
        >
          {paying ? "CONFIRMING..." : !hasEnoughBalance ? "INSUFFICIENT BALANCE" : "PAY & GENERATE"}
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

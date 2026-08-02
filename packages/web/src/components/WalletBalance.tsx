"use client";
import { useAccount, useReadContract, useBalance } from "wagmi";
import { celoSepolia, PAYMENT_TOKENS } from "@/lib/wagmi";
import { formatUnits } from "viem";

const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

export function WalletBalance() {
  const { address } = useAccount();

  const { data: balance0 } = useReadContract({
    address: PAYMENT_TOKENS[0].address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: celoSepolia.id,
  } as any);

  const { data: balance1 } = useReadContract({
    address: PAYMENT_TOKENS[1].address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: celoSepolia.id,
  } as any);

  const { data: balance2 } = useReadContract({
    address: PAYMENT_TOKENS[2].address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: celoSepolia.id,
  } as any);

  if (!address) return null;

  const balances = [balance0, balance1, balance2];

  // Show the token with highest balance, or first one
  const formatted = PAYMENT_TOKENS.map((token, i) => {
    const raw = balances[i];
    if (!raw) return { symbol: token.symbol, display: "0.00" };
    const val = Number(formatUnits(BigInt(raw as any), token.decimals));
    return {
      symbol: token.symbol,
      display: token.decimals === 18 ? val.toFixed(2) : val.toFixed(2),
    };
  }).filter((b) => Number(b.display) > 0);

  // Show top balance or default USDC
  const show = formatted.length > 0 ? formatted[0] : { symbol: PAYMENT_TOKENS[0].symbol, display: "0.00" };

  return (
    <div className="flex items-center gap-2">
      <span className="font-label text-[10px] bg-surface-container border border-on-surface px-2 py-0.5 font-bold">
        {show.display} {show.symbol}
      </span>
    </div>
  );
}

'use client';
import { useAccount, useReadContract, useBalance } from 'wagmi';
import { celoSepolia } from 'wagmi/chains';

const USDC_ADDRESS = '0x01C5C0122039549AD1493B8220cABEdD739BC44E' as const;
const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const;

export function WalletBalance() {
  const { address } = useAccount();

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: celoSepolia.id,
  } as any);

  const { data: celoBalance } = useBalance({
    address,
    chainId: celoSepolia.id,
  });

  const usdc = usdcBalance ? (Number(usdcBalance) / 1e6).toFixed(2) : '0.00';
  const celo = celoBalance ? Number(celoBalance.formatted).toFixed(3) : '0.000';

  if (!address) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="font-label text-[10px] bg-surface-container border border-on-surface px-2 py-0.5 font-bold">
        {usdc} USDC
      </span>
      <span className="font-label text-[10px] bg-surface-container border border-on-surface px-2 py-0.5 font-bold">
        {celo} CELO
      </span>
    </div>
  );
}

'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export function ConnectWalletButton() {
  const { isAuthed, address, connectWallet, signingIn } = useAuth();

  if (isAuthed && address) {
    const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
    return (
      <Link
        href="/profile"
        className="font-label text-[10px] font-bold uppercase bg-on-surface text-white px-2.5 py-1.5 border-2 border-on-surface max-w-[120px] truncate"
        title={address}
      >
        {short}
      </Link>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={signingIn}
      className="font-label text-[10px] font-bold uppercase bg-primary text-white px-3 py-1.5 border-2 border-on-surface comic-shadow-sm active:shadow-none disabled:opacity-60"
    >
      {signingIn ? '…' : 'Connect'}
    </button>
  );
}

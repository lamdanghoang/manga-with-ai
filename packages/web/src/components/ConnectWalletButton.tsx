'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export function ConnectWalletButton() {
  const { isAuthed, address, connectWallet, signingIn, error } = useAuth();

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
      title={error ?? undefined}
      className={`font-label text-[10px] font-bold uppercase px-3 py-1.5 border-2 border-on-surface comic-shadow-sm active:shadow-none disabled:opacity-60 ${
        error ? 'bg-red-600 text-white' : 'bg-primary text-white'
      }`}
    >
      {signingIn ? '…' : error ? 'Retry' : 'Connect'}
    </button>
  );
}

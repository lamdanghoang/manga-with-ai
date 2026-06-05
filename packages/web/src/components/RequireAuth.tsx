'use client';
import { type ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export function RequireAuth({
  children,
  title = 'Wallet required',
  description = 'Connect your MiniPay wallet to access this feature.',
}: {
  children: ReactNode;
  title?: string;
  description?: string;
}) {
  const { isAuthed, connectWallet, signingIn, error } = useAuth();

  if (isAuthed) return <>{children}</>;

  return (
    <main className="pt-8 px-4 max-w-md mx-auto">
      <div className="border-4 border-on-surface bg-white shadow-[8px_8px_0px_0px_#1a1c1c] p-8 text-center speed-lines">
        <span className="material-symbols-outlined text-5xl text-primary mb-4 block">account_balance_wallet</span>
        <h2 className="font-display text-2xl uppercase tracking-tighter mb-2">{title}</h2>
        <p className="text-sm text-secondary mb-6">{description}</p>
        {error && <p className="text-xs text-red-600 mb-4 font-label">{error}</p>}
        <button
          onClick={connectWallet}
          disabled={signingIn}
          className="w-full bg-primary text-white font-label font-bold uppercase tracking-widest py-3 px-6 border-2 border-on-surface comic-shadow-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60"
        >
          {signingIn ? 'Signing in...' : 'Connect Wallet'}
        </button>
        <Link href="/explore" className="block mt-4 font-label text-xs text-secondary uppercase hover:text-primary">
          Browse public stories →
        </Link>
      </div>
    </main>
  );
}

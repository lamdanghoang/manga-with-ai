'use client';
import Link from 'next/link';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';
import { useAuth } from '@/context/AuthContext';

export function Header() {
  const { isAuthed } = useAuth();

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center w-full px-4 py-2 bg-surface border-b-4 border-on-surface shadow-[4px_4px_0px_0px_#1a1c1c]">
      <div className="flex items-center gap-3">
        <Link href="/" className="font-display text-2xl text-primary uppercase tracking-tighter">
          MANGA WITH AI
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <ConnectWalletButton />
        {isAuthed && (
          <Link href="/profile" className="w-10 h-10 border-2 border-on-surface overflow-hidden bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-xl text-on-surface">person</span>
          </Link>
        )}
      </div>
    </header>
  );
}

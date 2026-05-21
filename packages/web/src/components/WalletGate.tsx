'use client';
import { useAccount, useConnect, useConnectors, useSignMessage } from 'wagmi';
import { useEffect, useState } from 'react';
import { useAutoConnect } from '@/hooks/useAutoConnect';
import { api } from '@/lib/api';

export function WalletGate({ children }: { children: React.ReactNode }) {
  const { address, isConnected, connector } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { connect } = useConnect();
  const connectors = useConnectors();
  const [ready, setReady] = useState(false);
  const [showRetry, setShowRetry] = useState(false);

  useAutoConnect(() => setShowRetry(true));

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (ready || showRetry) return;
    if (!isConnected || !address || !connector) return;
    if (localStorage.getItem('token')) { setReady(true); return; }

    const timer = setTimeout(async () => {
      try {
        const nonce = `Sign in to MangaWithAI: ${Date.now()}`;
        const signature = await signMessageAsync({ message: nonce });
        const data = await api<{ token: string }>('/v1/session/minipay', {
          method: 'POST',
          body: JSON.stringify({ walletAddress: address, nonce, signature }),
        });
        localStorage.setItem('token', data.token);
        setReady(true);
      } catch {
        setShowRetry(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isConnected, address, connector, signMessageAsync, ready, showRetry]);

  function handleConnect() {
    setShowRetry(false);
    localStorage.removeItem('logged_out');
    if (connectors.length > 0) {
      connect(
        { connector: connectors[0] },
        { onError: () => setShowRetry(true) }
      );
    }
  }

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">MangaWithAI</h1>
        {showRetry ? (
          <button onClick={handleConnect} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-xl">
            Connect Wallet
          </button>
        ) : (
          <p className="text-gray-400">Connecting wallet...</p>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

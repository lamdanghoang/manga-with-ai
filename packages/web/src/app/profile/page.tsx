'use client';
import { useAccount, useDisconnect } from 'wagmi';

export default function ProfilePage() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  function handleLogout() {
    localStorage.removeItem('token');
    disconnect();
    window.location.href = '/';
  }

  return (
    <main className="p-4 pt-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="bg-gray-800 rounded-lg p-4 space-y-3">
        <div>
          <p className="text-xs text-gray-400">Wallet Address</p>
          <p className="text-sm font-mono break-all">{address}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Network</p>
          <p className="text-sm">Celo Mainnet</p>
        </div>
      </div>
      <button onClick={handleLogout} className="mt-6 w-full bg-red-600/20 border border-red-600 text-red-400 py-3 rounded-xl font-semibold hover:bg-red-600/30">
        Disconnect Wallet
      </button>
    </main>
  );
}

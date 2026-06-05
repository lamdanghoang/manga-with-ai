'use client';
import { useAccount, useDisconnect } from 'wagmi';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { signOut } = useAuth();
  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    api<{ items: any[] }>('/v1/stories').then((d) => setStories(d.items || [])).catch(() => {});
  }, []);

  function handleLogout() {
    signOut();
    disconnect();
    window.location.href = '/';
  }

  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  const totalChapters = stories.reduce((a, s) => a + (s.totalChapters || 0), 0);
  const publicCount = stories.filter(s => s.visibility === 'public').length;

  return (
    <RequireAuth title="Your profile" description="Connect wallet to view your creator stats and works.">
    <main className="pt-6 px-4 max-w-3xl mx-auto relative">
      {/* Profile Header */}
      <section className="relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-end">
        <div className="w-36 h-36 border-4 border-on-surface bg-white shadow-[8px_8px_0px_0px_#1a1c1c] overflow-hidden rotate-[-2deg] flex items-center justify-center">
          <span className="material-symbols-outlined text-6xl text-primary">person</span>
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <h2 className="font-display text-3xl uppercase bg-on-surface text-white px-4 py-1 inline-block skew-x-[-6deg]">
            CREATOR
          </h2>
          <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
            <span className="material-symbols-outlined text-primary text-lg">account_balance_wallet</span>
            <code className="font-label text-xs bg-surface-container px-2 py-1 border-2 border-on-surface">{shortAddr}</code>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="mt-6 border-4 border-on-surface bg-white shadow-[6px_6px_0px_0px_#1a1c1c] p-0 flex divide-x-4 divide-on-surface overflow-hidden">
        <div className="flex-1 p-4 text-center group hover:bg-primary transition-colors cursor-pointer">
          <p className="font-label text-[10px] uppercase group-hover:text-white">Stories</p>
          <p className="font-display text-2xl group-hover:text-white">{stories.length}</p>
        </div>
        <div className="flex-1 p-4 text-center group hover:bg-primary transition-colors cursor-pointer">
          <p className="font-label text-[10px] uppercase group-hover:text-white">Chapters</p>
          <p className="font-display text-2xl group-hover:text-white">{totalChapters}</p>
        </div>
        <div className="flex-1 p-4 text-center group hover:bg-primary transition-colors cursor-pointer">
          <p className="font-label text-[10px] uppercase group-hover:text-white">Public</p>
          <p className="font-display text-2xl group-hover:text-white">{publicCount}</p>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="mt-6 flex flex-col sm:flex-row gap-3">
        <Link href="/create" className="flex-1 bg-primary text-white font-display text-lg text-center py-4 border-4 border-on-surface shadow-[6px_6px_0px_0px_#1a1c1c] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all uppercase">
          EDIT PROFILE
        </Link>
        <button onClick={handleLogout} className="flex-1 bg-white text-on-surface font-display text-lg text-center py-4 border-4 border-on-surface shadow-[6px_6px_0px_0px_#1a1c1c] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all uppercase">
          DISCONNECT WALLET
        </button>
      </section>

      {/* Works List */}
      <section className="mt-6 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-8 w-2 bg-primary"></span>
          <h3 className="font-display text-xl uppercase">SHARED WORKS</h3>
        </div>

        {stories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stories.map((s) => (
              <Link key={s.id} href={`/story/${s.id}`} className="border-4 border-on-surface bg-white shadow-[6px_6px_0px_0px_#1a1c1c] active:translate-x-1 active:translate-y-1 active:shadow-none flex overflow-hidden group transition-all">
                <div className="w-1/3 border-r-4 border-on-surface overflow-hidden bg-surface-container">
                  {s.coverImageUrl ? (
                    <img src={s.coverImageUrl} alt={s.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center speed-lines aspect-[3/4]">
                      <span className="material-symbols-outlined text-3xl text-secondary/30">auto_stories</span>
                    </div>
                  )}
                </div>
                <div className="w-2/3 p-3 flex flex-col justify-between speed-lines">
                  <div>
                    <span className="font-label text-[10px] bg-on-surface text-white px-2 py-0.5 inline-block uppercase">{s.status}</span>
                    <h4 className="font-display text-sm text-primary leading-tight mt-1 uppercase">{s.title}</h4>
                    {s.synopsis && <p className="text-xs text-secondary mt-1 line-clamp-2">{s.synopsis}</p>}
                  </div>
                  <span className="self-start font-label bg-on-surface text-white text-xs px-3 py-1 mt-2 hover:bg-primary transition-colors inline-flex items-center gap-1">
                    View <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border-4 border-dashed border-secondary/30 p-8 text-center speed-lines">
            <p className="font-label text-sm text-secondary uppercase">No works yet</p>
          </div>
        )}
      </section>

      {/* Empty teaser */}
      <div className="mt-6 border-4 border-dashed border-primary/30 h-20 speed-lines flex items-center justify-center">
        <p className="font-display text-sm text-primary/30 uppercase animate-pulse">More works coming soon...</p>
      </div>
    </main>
    </RequireAuth>
  );
}

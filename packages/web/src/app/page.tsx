'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';


export default function Home() {
  const { isAuthed, connectWallet, signingIn } = useAuth();
  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthed) {
      setStories([]);
      return;
    }
    api<{ items: any[] }>('/v1/stories')
      .then((d) => setStories(d.items || []))
      .catch(() => setStories([]));
  }, [isAuthed]);

  return (
    <main className="pt-6 px-4 max-w-7xl mx-auto relative">
      {/* Hero CTA */}
      <Link href="/create" className="block relative w-full group overflow-hidden border-4 border-on-surface comic-shadow-lg active:translate-x-1 active:translate-y-1 active:shadow-none transition-all mb-6">
        <div className="relative py-12 flex flex-col items-center justify-center bg-white speed-lines">
          <span className="font-display text-5xl md:text-6xl text-on-surface mb-3 tracking-tighter uppercase italic">NEW SERIES</span>
          <div className="bg-primary text-white font-label px-6 py-2.5 border-2 border-on-surface comic-shadow-sm group-hover:bg-primary-container transition-colors tracking-widest font-bold text-sm uppercase">
            START THE ADVENTURE
          </div>
        </div>
      </Link>

      {/* Section header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-xl uppercase tracking-tighter">CURRENT WORKS</h2>
        <span className="font-label text-xs bg-on-surface text-white px-2.5 py-1 font-bold">{stories.length} VOLUMES</span>
      </div>

      {/* Manga Grid 2 columns */}
      <div className="grid grid-cols-2 gap-3">
        {!isAuthed && (
          <div className="col-span-2 border-4 border-on-surface bg-white shadow-[6px_6px_0px_0px_#1a1c1c] p-6 text-center">
            <p className="font-display text-lg uppercase mb-2">Your library</p>
            <p className="text-sm text-secondary mb-4">Connect wallet to see and manage your manga.</p>
            <button
              onClick={connectWallet}
              disabled={signingIn}
              className="bg-primary text-white font-label font-bold uppercase tracking-widest text-xs px-5 py-2.5 border-2 border-on-surface comic-shadow-sm"
            >
              {signingIn ? 'Signing in...' : 'Connect Wallet'}
            </button>
          </div>
        )}
        {stories.map((s, idx) => {
          const rotations = ['', 'rotate-[0.5deg]', '-rotate-[0.5deg]', 'rotate-1'];
          return (
            <Link key={s.id} href={`/story/${s.id}`} className={`bg-white border-3 border-on-surface shadow-[4px_4px_0px_0px_#1a1c1c] hover:-translate-y-1 transition-all ${rotations[idx % 4]} group flex flex-col`}>
              <div className="aspect-[3/4] overflow-hidden border-b-2 border-on-surface bg-surface-container relative">
                {s.coverImageUrl ? (
                  <img src={s.coverImageUrl} alt={s.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center speed-lines">
                    <span className="material-symbols-outlined text-5xl text-secondary/20">auto_stories</span>
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <h3 className="font-display text-sm uppercase leading-tight text-on-surface group-hover:text-primary transition-colors">{s.title}</h3>
                <p className="font-label text-[11px] text-secondary mt-0.5">{s.status === 'ongoing' ? `Chapter ${s.totalChapters}` : s.status}</p>
              </div>
            </Link>
          );
        })}

        {/* Fill This Slot card */}
        <Link href="/create" className="border-3 border-dashed border-secondary/50 flex flex-col items-center justify-center p-6 text-center bg-surface-container-low hover:bg-surface-container transition-colors min-h-[220px]">
          <span className="material-symbols-outlined text-3xl text-secondary/50 mb-2">add_circle</span>
          <p className="font-label text-xs text-secondary uppercase tracking-wider font-bold">FILL THIS SLOT</p>
        </Link>
      </div>

      {/* FAB */}
      <Link href="/create" className="fixed bottom-20 right-4 w-12 h-12 bg-primary text-white border-2 border-on-surface shadow-[3px_3px_0px_0px_#1a1c1c] flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all z-40">
        <span className="material-symbols-outlined text-2xl">edit</span>
      </Link>
    </main>
  );
}

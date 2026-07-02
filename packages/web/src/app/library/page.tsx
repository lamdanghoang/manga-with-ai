"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Tab = "stories" | "collectibles";

export default function LibraryPage() {
  const { isAuthed, connectWallet, signingIn } = useAuth();
  const [tab, setTab] = useState<Tab>("stories");
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthed) {
      setStories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api<{ items: any[] }>("/v1/stories")
      .then((d) => setStories(d.items || []))
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, [isAuthed]);

  return (
    <main className="pt-4 px-4 max-w-7xl mx-auto relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-display text-2xl uppercase tracking-tighter">
          MY LIBRARY
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab("stories")}
          className={`font-label text-xs font-bold uppercase px-4 py-2 border-2 border-on-surface transition-all ${tab === "stories" ? "bg-on-surface text-white" : "bg-white text-on-surface"}`}
        >
          MY STORIES
        </button>
        <button
          onClick={() => setTab("collectibles")}
          className={`font-label text-xs font-bold uppercase px-4 py-2 border-2 border-on-surface transition-all ${tab === "collectibles" ? "bg-on-surface text-white" : "bg-white text-on-surface"}`}
        >
          MY COLLECTIBLES
        </button>
      </div>

      {loading && isAuthed ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-on-surface border-t-primary rounded-none animate-spin mx-auto mb-3"></div>
            <p className="font-label text-xs text-secondary uppercase">Loading library...</p>
          </div>
        </div>
      ) : !isAuthed ? (
        <div className="border-4 border-on-surface bg-white shadow-[6px_6px_0px_0px_#1a1c1c] p-6 text-center">
          <p className="font-display text-lg uppercase mb-2">Your library</p>
          <p className="text-sm text-secondary mb-4">
            Connect wallet to see your manga and collectibles.
          </p>
          <button
            onClick={connectWallet}
            disabled={signingIn}
            className="bg-primary text-white font-label font-bold uppercase tracking-widest text-xs px-5 py-2.5 border-2 border-on-surface comic-shadow-sm"
          >
            {signingIn ? "Signing in..." : "Connect Wallet"}
          </button>
        </div>
      ) : tab === "stories" ? (
        <>
          {/* Hero CTA */}
          <Link
            href="/create"
            className="block relative w-full group overflow-hidden border-4 border-on-surface comic-shadow-lg active:translate-x-1 active:translate-y-1 active:shadow-none transition-all mb-5"
          >
            <div className="relative py-8 flex flex-col items-center justify-center bg-white speed-lines">
              <span className="font-display text-3xl text-on-surface mb-2 tracking-tighter uppercase italic">
                NEW SERIES
              </span>
              <div className="bg-primary text-white font-label px-5 py-2 border-2 border-on-surface comic-shadow-sm group-hover:bg-primary-container transition-colors tracking-widest font-bold text-xs uppercase">
                START THE ADVENTURE
              </div>
            </div>
          </Link>

          {/* Stories Grid */}
          <div className="flex justify-between items-center mb-3">
            <span className="font-label text-xs text-secondary uppercase font-bold">
              {stories.length} volumes
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stories.map((s, idx) => {
              const rotations = [
                "",
                "rotate-[0.5deg]",
                "-rotate-[0.5deg]",
                "rotate-1",
              ];
              return (
                <Link
                  key={s.id}
                  href={`/story/${s.id}`}
                  className={`bg-white border-3 border-on-surface shadow-[4px_4px_0px_0px_#1a1c1c] hover:-translate-y-1 transition-all ${rotations[idx % 4]} group flex flex-col`}
                >
                  <div className="aspect-[3/4] overflow-hidden border-b-2 border-on-surface bg-surface-container relative">
                    {s.coverImageUrl ? (
                      <img
                        src={s.coverImageUrl}
                        alt={s.title}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center speed-lines">
                        <span className="material-symbols-outlined text-5xl text-secondary/20">
                          auto_stories
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <h3 className="font-display text-sm uppercase leading-tight text-on-surface group-hover:text-primary transition-colors">
                      {s.title}
                    </h3>
                    <p className="font-label text-[11px] text-secondary mt-0.5">
                      {s.status === "ongoing"
                        ? `Chapter ${s.totalChapters}`
                        : s.status}
                    </p>
                  </div>
                </Link>
              );
            })}
            <Link
              href="/create"
              className="border-3 border-dashed border-secondary/50 flex flex-col items-center justify-center p-6 text-center bg-surface-container-low hover:bg-surface-container transition-colors min-h-[220px]"
            >
              <span className="material-symbols-outlined text-3xl text-secondary/50 mb-2">
                add_circle
              </span>
              <p className="font-label text-xs text-secondary uppercase tracking-wider font-bold">
                FILL THIS SLOT
              </p>
            </Link>
          </div>
        </>
      ) : (
        /* Collectibles tab */
        <div className="space-y-4">
          <div className="border-4 border-on-surface bg-white comic-shadow-lg p-6 text-center">
            <span className="material-symbols-outlined text-4xl text-secondary/30 mb-3">
              collections
            </span>
            <h2 className="font-display text-lg uppercase mb-2">NO COLLECTIBLES YET</h2>
            <p className="text-sm text-secondary mb-4">
              Save your manga as collectibles or browse from other creators.
            </p>
            <Link
              href="/create"
              className="inline-block bg-primary text-white font-label font-bold uppercase tracking-widest text-xs px-5 py-2.5 border-2 border-on-surface comic-shadow-sm"
            >
              CREATE & SAVE
            </Link>
          </div>

          {/* Marketplace info */}
          <div className="grid grid-cols-2 gap-2">
            <div className="border-2 border-on-surface bg-white p-3 text-center">
              <span className="material-symbols-outlined text-xl text-primary mb-1">
                bookmark
              </span>
              <p className="font-label text-[10px] font-bold uppercase">SAVE</p>
              <p className="font-label text-[9px] text-secondary mt-0.5">
                Turn manga into collectibles
              </p>
            </div>
            <div className="border-2 border-on-surface bg-white p-3 text-center">
              <span className="material-symbols-outlined text-xl text-primary mb-1">
                sell
              </span>
              <p className="font-label text-[10px] font-bold uppercase">
                TRADE
              </p>
              <p className="font-label text-[9px] text-secondary mt-0.5">
                USDC / USDT / USDm
              </p>
            </div>
            <div className="border-2 border-on-surface bg-white p-3 text-center">
              <span className="material-symbols-outlined text-xl text-primary mb-1">
                favorite
              </span>
              <p className="font-label text-[10px] font-bold uppercase">LIKE</p>
              <p className="font-label text-[9px] text-secondary mt-0.5">
                Support creators
              </p>
            </div>
            <div className="border-2 border-on-surface bg-white p-3 text-center">
              <span className="material-symbols-outlined text-xl text-primary mb-1">
                payments
              </span>
              <p className="font-label text-[10px] font-bold uppercase">
                5% ROYALTY
              </p>
              <p className="font-label text-[9px] text-secondary mt-0.5">
                Earn on resales
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type Period = "week" | "month" | "all";

interface CreatorEntry {
  rank: number;
  userId: string;
  walletAddress: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalStories: number;
  totalLikes: number;
  totalViews: number;
  totalShares: number;
  score: number;
}

interface StoryEntry {
  rank: number;
  storyId: string;
  title: string;
  slug: string | null;
  coverImageUrl: string | null;
  totalChapters: number;
  creator: {
    userId: string;
    walletAddress: string;
    displayName: string | null;
  };
  likes: number;
  views: number;
  score: number;
}

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function getRankBadge(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<"creators" | "stories">("creators");
  const [period, setPeriod] = useState<Period>("week");
  const [creators, setCreators] = useState<CreatorEntry[]>([]);
  const [stories, setStories] = useState<StoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (tab === "creators") {
      api<{ items: CreatorEntry[] }>(
        `/v1/leaderboard/creators?period=${period}&limit=20`,
      )
        .then((d) => setCreators(d.items || []))
        .catch(() => setCreators([]))
        .finally(() => setLoading(false));
    } else {
      api<{ items: StoryEntry[] }>(
        `/v1/leaderboard/stories?period=${period}&limit=20&sort=score`,
      )
        .then((d) => setStories(d.items || []))
        .catch(() => setStories([]))
        .finally(() => setLoading(false));
    }
  }, [tab, period]);

  // Calculate countdown to next weekly reset (Monday 00:00 UTC)
  function getWeeklyCountdown() {
    const now = new Date();
    const daysUntilMonday = (7 - now.getUTCDay() + 1) % 7 || 7;
    const nextMonday = new Date(now);
    nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
    nextMonday.setUTCHours(0, 0, 0, 0);
    const diff = nextMonday.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  }

  const top3 = tab === "creators" ? creators.slice(0, 3) : [];

  return (
    <main className="pt-4 px-2 w-full max-w-[100vw] overflow-x-hidden pb-8">
      {/* Prize Panel */}
      <div className="border-2 border-yellow-500 bg-gradient-to-b from-yellow-50 to-white p-3 mb-4">
        <div className="text-center mb-3">
          <p className="font-display text-sm uppercase text-yellow-700">Weekly Prize Pool</p>
          <p className="font-display text-2xl text-on-surface">10 USDC</p>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-2 mb-3">
          {/* 2nd place */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-2 border-yellow-400 bg-surface-container overflow-hidden flex items-center justify-center">
              {top3[1] ? (
                <img src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${top3[1].walletAddress}`} alt="" className="w-full h-full" />
              ) : (
                <span className="text-xs text-secondary">?</span>
              )}
            </div>
            <div className="bg-gray-200 w-14 h-12 flex flex-col items-center justify-center mt-1 border border-on-surface">
              <span className="text-sm">🥈</span>
              <span className="font-label text-[8px] font-bold">$2</span>
            </div>
          </div>

          {/* 1st place */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-yellow-500 bg-yellow-100 overflow-hidden flex items-center justify-center">
              {top3[0] ? (
                <img src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${top3[0].walletAddress}`} alt="" className="w-full h-full" />
              ) : (
                <span className="text-xs text-secondary">?</span>
              )}
            </div>
            <div className="bg-yellow-300 w-14 h-16 flex flex-col items-center justify-center mt-1 border border-on-surface">
              <span className="text-base">🥇</span>
              <span className="font-label text-[8px] font-bold">$5</span>
            </div>
          </div>

          {/* 3rd place */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-2 border-orange-300 bg-surface-container overflow-hidden flex items-center justify-center">
              {top3[2] ? (
                <img src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${top3[2].walletAddress}`} alt="" className="w-full h-full" />
              ) : (
                <span className="text-xs text-secondary">?</span>
              )}
            </div>
            <div className="bg-orange-100 w-14 h-10 flex flex-col items-center justify-center mt-1 border border-on-surface">
              <span className="text-sm">🥉</span>
              <span className="font-label text-[8px] font-bold">$3</span>
            </div>
          </div>
        </div>

        {/* Countdown */}
        <p className="text-center font-label text-[10px] text-secondary">
          ⏰ Resets in {getWeeklyCountdown()} · Prizes sent by team weekly
        </p>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h1 className="font-display text-xl uppercase tracking-tighter">
          LEADERBOARD
        </h1>
        <span className="font-label text-[10px] bg-yellow-400 text-on-surface px-2 py-0.5 font-bold border-2 border-on-surface">
          TOP CREATORS
        </span>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("creators")}
          className={`font-label text-xs font-bold uppercase px-4 py-2 border-2 border-on-surface transition-colors ${
            tab === "creators"
              ? "bg-on-surface text-white"
              : "bg-white text-on-surface"
          }`}
        >
          CREATORS
        </button>
        <button
          onClick={() => setTab("stories")}
          className={`font-label text-xs font-bold uppercase px-4 py-2 border-2 border-on-surface transition-colors ${
            tab === "stories"
              ? "bg-on-surface text-white"
              : "bg-white text-on-surface"
          }`}
        >
          STORIES
        </button>
      </div>

      {/* Period filter */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(["week", "month", "all"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`font-label text-[10px] font-bold uppercase px-2 py-1 border-2 border-on-surface transition-colors ${
              period === p
                ? "bg-primary text-white"
                : "bg-surface-container text-on-surface"
            }`}
          >
            {p === "week"
              ? "WEEK"
              : p === "month"
                ? "MONTH"
                : "ALL"}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-on-surface border-t-primary rounded-none animate-spin mx-auto mb-3"></div>
            <p className="font-label text-xs text-secondary uppercase">Loading rankings...</p>
          </div>
        </div>
      ) : tab === "creators" ? (
        <div className="space-y-2.5">
          {creators.length === 0 ? (
            <div className="border-4 border-on-surface bg-white comic-shadow-lg p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-secondary/30 mb-2">
                emoji_events
              </span>
              <p className="font-display text-lg uppercase">NO CREATORS YET</p>
              <p className="text-sm text-secondary mt-1">
                Publish your manga to appear on the leaderboard!
              </p>
            </div>
          ) : (
            creators.map((c) => (
              <div
                key={c.userId}
                className={`border-2 border-on-surface bg-white p-2.5 flex items-center gap-2 ${
                  c.rank <= 3 ? "border-yellow-500" : ""
                }`}
              >
                {/* Rank */}
                <div className="font-display text-base w-8 text-center shrink-0">
                  {getRankBadge(c.rank)}
                </div>

                {/* Avatar */}
                <div className="w-8 h-8 border-2 border-on-surface bg-surface-container flex items-center justify-center shrink-0 overflow-hidden rounded-full">
                  {c.avatarUrl ? (
                    <img
                      src={c.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-sm text-secondary">
                      person
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-display text-xs uppercase truncate">
                    {c.displayName || shortAddress(c.walletAddress)}
                  </p>
                  <p className="font-label text-[9px] text-secondary">
                    {c.totalStories} stories · {c.totalLikes}♥ · {c.totalViews}👁
                  </p>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <p className="font-display text-base text-primary">{c.score}</p>
                  <p className="font-label text-[8px] text-secondary uppercase">
                    PTS
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {stories.length === 0 ? (
            <div className="border-4 border-on-surface bg-white comic-shadow-lg p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-secondary/30 mb-2">
                menu_book
              </span>
              <p className="font-display text-lg uppercase">NO STORIES YET</p>
              <p className="text-sm text-secondary mt-1">
                Published stories will appear here ranked by engagement.
              </p>
            </div>
          ) : (
            stories.map((s) => (
              <Link
                key={s.storyId}
                href={s.slug ? `/read/${s.slug}` : "#"}
                className="border-2 border-on-surface bg-white p-2.5 flex items-center gap-2"
              >
                {/* Rank */}
                <div className="font-display text-base w-8 text-center shrink-0">
                  {getRankBadge(s.rank)}
                </div>

                {/* Cover */}
                <div className="w-10 h-14 border-2 border-on-surface bg-surface-container shrink-0 overflow-hidden">
                  {s.coverImageUrl ? (
                    <img
                      src={s.coverImageUrl}
                      alt={s.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm text-secondary/30">
                        auto_stories
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-display text-xs uppercase truncate">
                    {s.title}
                  </p>
                  <p className="font-label text-[9px] text-secondary truncate">
                    {s.creator.displayName ||
                      shortAddress(s.creator.walletAddress)}
                  </p>
                  <p className="font-label text-[9px] text-secondary">
                    {s.totalChapters}ch · ♥{s.likes} · 👁{s.views}
                  </p>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <p className="font-display text-base text-primary">{s.score}</p>
                  <p className="font-label text-[8px] text-secondary uppercase">
                    PTS
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Scoring explanation */}
      <div className="mt-6 border-2 border-dashed border-secondary/30 p-3 bg-surface-container-low">
        <p className="font-label text-[10px] text-secondary uppercase text-center">
          Score = Likes×3 + Views×1 + Shares×2 · Updated in real-time
        </p>
      </div>
    </main>
  );
}

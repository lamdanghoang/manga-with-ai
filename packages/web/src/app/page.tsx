"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getApiUrl, api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const [stories, setStories] = useState<any[]>([]);
  const [filter, setFilter] = useState<"latest" | "popular">("latest");
  const [commentOpen, setCommentOpen] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const { isAuthed } = useAuth();
  const API = getApiUrl();

  useEffect(() => {
    fetch(`${API}/v1/public/feed`)
      .then((r) => r.json())
      .then((d) => setStories(d.items || []))
      .catch(() => setStories([]));
  }, []);

  const sorted =
    filter === "popular"
      ? [...stories].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
      : stories;

  function handleLike(slug: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    fetch(`${API}/v1/public/stories/${slug}/like`, { method: "POST" }).then(
      () =>
        setStories((prev) =>
          prev.map((s) =>
            s.publicSlug === slug
              ? { ...s, likeCount: (s.likeCount || 0) + 1 }
              : s,
          ),
        ),
    );
  }

  function handleShare(slug: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/read/${slug}`);
    fetch(`${API}/v1/public/stories/${slug}/share`, { method: "POST" }).then(
      () =>
        setStories((prev) =>
          prev.map((s) =>
            s.publicSlug === slug
              ? { ...s, shareCount: (s.shareCount || 0) + 1 }
              : s,
          ),
        ),
    );
  }

  function toggleComments(slug: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (commentOpen === slug) {
      setCommentOpen(null);
      return;
    }
    setCommentOpen(slug);
    setComments([]);
    fetch(`${API}/v1/public/stories/${slug}/comments`)
      .then((r) => r.json())
      .then((d) => setComments(d.items || []))
      .catch(() => setComments([]));
  }

  async function postComment(slug: string) {
    if (!commentText.trim() || posting) return;
    setPosting(true);
    try {
      const c = await api<any>(`/v1/public/stories/${slug}/comments`, {
        method: "POST",
        body: JSON.stringify({ text: commentText.trim() }),
      });
      setComments((prev) => [c, ...prev]);
      setCommentText("");
      setStories((prev) =>
        prev.map((s) =>
          s.publicSlug === slug
            ? { ...s, commentCount: (s.commentCount || 0) + 1 }
            : s,
        ),
      );
    } catch {
      /* ignore */
    }
    setPosting(false);
  }

  function shortAddr(addr: string) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  return (
    <main className="pt-4 px-4 max-w-lg mx-auto">
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter("latest")}
          className={`font-label text-xs font-bold uppercase px-4 py-2 border-2 border-on-surface transition-all ${filter === "latest" ? "bg-primary text-white comic-shadow-sm" : "bg-white text-on-surface"}`}
        >
          LATEST
        </button>
        <button
          onClick={() => setFilter("popular")}
          className={`font-label text-xs font-bold uppercase px-4 py-2 border-2 border-on-surface transition-all ${filter === "popular" ? "bg-primary text-white comic-shadow-sm" : "bg-white text-on-surface"}`}
        >
          POPULAR
        </button>
      </div>

      {/* Feed */}
      {sorted.length === 0 ? (
        <div className="border-4 border-dashed border-secondary/30 p-12 text-center speed-lines">
          <span className="material-symbols-outlined text-4xl text-secondary/30 block mb-2">
            explore
          </span>
          <p className="font-label text-sm text-secondary uppercase font-bold">
            No public stories yet
          </p>
          <p className="text-xs text-secondary mt-1">
            Be the first to publish!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((s, idx) => (
            <div
              key={s.publicSlug}
              className="border-4 border-on-surface bg-white shadow-[6px_6px_0px_0px_#1a1c1c] overflow-hidden"
            >
              <Link
                href={`/read/${s.publicSlug}`}
                className="block active:translate-x-1 active:translate-y-1 transition-all"
              >
                {/* Cover Image */}
                <div className="relative aspect-[16/9] overflow-hidden border-b-4 border-on-surface bg-surface-container">
                  {s.coverImageUrl ? (
                    <img
                      src={s.coverImageUrl}
                      alt={s.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center speed-lines">
                      <span className="material-symbols-outlined text-5xl text-secondary/20">
                        auto_stories
                      </span>
                    </div>
                  )}
                  {idx === 0 && (
                    <div className="absolute bottom-3 left-3 bg-primary text-white font-label text-[10px] px-2 py-0.5 border-2 border-on-surface font-bold uppercase">
                      FEATURED
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-display text-lg uppercase leading-tight text-on-surface flex-1">
                      {s.title}
                    </h3>
                    <span className="font-label text-[10px] bg-on-surface text-white px-2 py-0.5 font-bold ml-2 shrink-0">
                      CH. {s.totalChapters || 1}
                    </span>
                  </div>
                  {s.synopsis && (
                    <p className="text-sm text-secondary mt-2 line-clamp-2">
                      {s.synopsis}
                    </p>
                  )}
                </div>
              </Link>

              {/* Actions bar */}
              <div className="flex items-center justify-between px-4 pb-3">
                <div className="flex items-center gap-3 font-label text-[11px] text-secondary">
                  <button
                    onClick={(e) => handleLike(s.publicSlug, e)}
                    className="hover:text-primary transition-colors"
                  >
                    {s.likeCount || 0} likes
                  </button>
                  <span>{s.viewCount || 0} views</span>
                  <button
                    onClick={(e) => handleShare(s.publicSlug, e)}
                    className="hover:text-primary transition-colors"
                  >
                    {s.shareCount || 0} shares
                  </button>
                </div>
                <Link
                  href={`/read/${s.publicSlug}`}
                  className="font-label bg-on-surface text-white text-[10px] px-3 py-1 font-bold inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    auto_stories
                  </span>{" "}
                  READ
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="py-12 flex flex-col items-center justify-center">
        <p className="font-display text-sm text-on-surface/30 uppercase">
          — END —
        </p>
      </div>
    </main>
  );
}

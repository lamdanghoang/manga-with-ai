'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getApiUrl } from '@/lib/api';

export default function PublicReaderPage() {
  const { slug } = useParams();
  const [story, setStory] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const API = getApiUrl();

  async function handleLike() {
    if (liked) return;
    setLiked(true);
    setLikeCount(prev => prev + 1);
    fetch(`${API}/v1/public/stories/${slug}/like`, { method: 'POST' }).catch(() => {});
  }

  async function handleShare() {
    fetch(`${API}/v1/public/stories/${slug}/share`, { method: 'POST' }).catch(() => {});
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    fetch(`${API}/v1/public/stories/${slug}`)
      .then(r => r.json())
      .then((data) => {
        setStory(data);
        setLikeCount(Number(data.metrics?.likeCount || 0));
        if (data.chapters?.length) {
          Promise.all(data.chapters.map((ch: any) => fetch(`${API}/v1/public/stories/${slug}/chapters/${ch.id}`).then(r => r.json()))).then(setChapters);
        }
      }).catch(console.error);
  }, [slug]);

  if (!story) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-on-surface border-t-primary rounded-none animate-spin mx-auto mb-3"></div>
        <p className="font-label text-xs text-secondary uppercase">Loading story...</p>
      </div>
    </main>
  );

  return (
    <main className="pt-3 px-2 pb-8 w-full max-w-[100vw] overflow-x-hidden">
      {/* Title */}
      <div className="border-2 border-on-surface bg-white p-3 mb-3">
        <h1 className="font-display text-lg text-primary uppercase tracking-tighter leading-tight">{story.title}</h1>
        {story.synopsis && <p className="text-xs text-secondary mt-1 line-clamp-2">{story.synopsis}</p>}
      </div>

      {/* Chapters */}
      {chapters.length > 0 && (
        <div className="space-y-3 mb-3">
          {chapters.map((ch) => (
            <div key={ch.id} className="border-2 border-on-surface bg-white overflow-hidden">
              <div className="bg-on-surface text-white px-2 py-1 font-label text-[11px] font-bold uppercase">
                Ch.{ch.chapterNumber}{ch.title ? ` — ${ch.title}` : ''}
              </div>
              {ch.pageImageUrl && (
                <img
                  src={ch.pageImageUrl}
                  alt={`Chapter ${ch.chapterNumber}`}
                  className="w-full h-auto block"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {chapters.length === 0 && (
        <div className="border-2 border-dashed border-secondary/50 p-6 text-center bg-surface-container-low mb-3">
          <p className="font-label text-xs text-secondary uppercase font-bold">No chapters available</p>
        </div>
      )}

      {/* Like / Share */}
      <div className="flex items-center gap-4 px-1">
        <button onClick={handleLike} className={`flex items-center gap-1 font-label text-[11px] ${liked ? 'text-red-600' : 'text-on-surface'}`}>
          <span className="material-symbols-outlined text-[18px]">{liked ? 'favorite' : 'favorite_border'}</span>
          <span>{liked ? 'Liked' : 'Like'}</span>
          {likeCount > 0 && <span className="text-[10px] text-secondary">({likeCount})</span>}
        </button>
        <button onClick={handleShare} className="flex items-center gap-1 font-label text-[11px] text-on-surface ml-auto">
          <span className="material-symbols-outlined text-[18px]">share</span>
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>
    </main>
  );
}

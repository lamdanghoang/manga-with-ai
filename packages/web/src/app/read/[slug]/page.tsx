'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getApiUrl, api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function PublicReaderPage() {
  const { slug } = useParams();
  const [story, setStory] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const { isAuthed } = useAuth();
  const API = getApiUrl();

  async function handleLike() {
    await fetch(`${API}/v1/public/stories/${slug}/like`, { method: 'POST' });
    setLiked(true);
  }

  async function handleShare() {
    await fetch(`${API}/v1/public/stories/${slug}/share`, { method: 'POST' });
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function postComment() {
    if (!commentText.trim() || posting) return;
    setPosting(true);
    try {
      const c = await api<any>(`/v1/public/stories/${slug}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text: commentText.trim() }),
      });
      setComments((prev) => [c, ...prev]);
      setCommentText('');
    } catch { /* ignore */ }
    setPosting(false);
  }

  useEffect(() => {
    fetch(`${API}/v1/public/stories/${slug}`)
      .then(r => r.json())
      .then((data) => {
        setStory(data);
        if (data.chapters?.length) {
          Promise.all(data.chapters.map((ch: any) => fetch(`${API}/v1/public/stories/${slug}/chapters/${ch.id}`).then(r => r.json()))).then(setChapters);
        }
      }).catch(console.error);

    fetch(`${API}/v1/public/stories/${slug}/comments`)
      .then(r => r.json())
      .then(d => setComments(d.items || []))
      .catch(() => {});
  }, [slug]);

  if (!story) return <div className="p-4 text-center font-label text-secondary">Loading...</div>;

  return (
    <main className="pt-3 px-2 pb-8 w-full max-w-[100vw] overflow-x-hidden">
      {/* Title */}
      <div className="border-2 border-on-surface bg-white p-3 mb-3">
        <h1 className="font-display text-lg text-primary uppercase tracking-tighter leading-tight">{story.title}</h1>
        {story.synopsis && <p className="text-xs text-secondary mt-1 line-clamp-2">{story.synopsis}</p>}
      </div>

      {/* Like / Share */}
      <div className="flex gap-2 mb-3">
        <button onClick={handleLike} className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 border-2 border-on-surface font-label text-[11px] uppercase font-bold ${liked ? 'bg-red-100 text-red-600' : 'bg-white text-on-surface'}`}>
          <span className="material-symbols-outlined text-sm">favorite</span>{liked ? 'Liked' : 'Like'}
        </button>
        <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-1 px-2 py-2 border-2 border-on-surface bg-white font-label text-[11px] uppercase font-bold">
          <span className="material-symbols-outlined text-sm">share</span>{copied ? 'Copied!' : 'Share'}
        </button>
      </div>

      {/* Chapters */}
      {chapters.length > 0 && (
        <div className="space-y-3">
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
        <div className="border-2 border-dashed border-secondary/50 p-6 text-center bg-surface-container-low">
          <p className="font-label text-xs text-secondary uppercase font-bold">No chapters available</p>
        </div>
      )}

      {/* Comments */}
      <div className="mt-4 border-2 border-on-surface bg-white p-3">
        <h2 className="font-display text-base uppercase mb-2">Comments</h2>

        {isAuthed ? (
          <div className="flex gap-1 mb-3">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && postComment()}
              placeholder="Add a comment..."
              maxLength={500}
              className="flex-1 min-w-0 border-2 border-on-surface bg-surface-container px-2 py-1.5 text-xs font-label focus:outline-none focus:border-primary"
            />
            <button
              onClick={postComment}
              disabled={posting || !commentText.trim()}
              className="bg-primary text-white font-label text-[10px] font-bold px-2 py-1.5 border-2 border-on-surface disabled:opacity-50 shrink-0"
            >
              POST
            </button>
          </div>
        ) : (
          <p className="text-xs text-secondary mb-3 font-label">Connect to comment</p>
        )}

        {comments.length === 0 ? (
          <p className="text-xs text-secondary font-label">No comments yet. Be the first!</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <div className="w-6 h-6 border border-on-surface bg-surface-container rounded-full flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[10px] text-secondary">person</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-label text-[10px] font-bold text-on-surface">
                    {c.user?.displayName || `${c.user?.walletAddress?.slice(0, 6)}...${c.user?.walletAddress?.slice(-4)}`}
                  </span>
                  <p className="text-[11px] text-on-surface/80 break-words">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

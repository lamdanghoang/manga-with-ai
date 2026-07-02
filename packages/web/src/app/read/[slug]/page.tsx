'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getApiUrl, api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS, MARKETPLACE_ABI } from '@manga-with-ai/shared';
import { celoSepolia } from '@/lib/wagmi';

export default function PublicReaderPage() {
  const { slug } = useParams();
  const [story, setStory] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [visibleComments, setVisibleComments] = useState(3);
  const { isAuthed } = useAuth();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const API = getApiUrl();
  const contracts = CONTRACTS.celoSepolia;

  async function handleLike() {
    if (liked || liking || !address) return;
    setLiking(true);
    try {
      // On-chain like via marketplace contract
      await writeContractAsync({
        address: contracts.marketplace,
        abi: MARKETPLACE_ABI,
        functionName: 'like',
        args: [BigInt(story.nftTokenId || 0)],
        chainId: celoSepolia.id,
      });
      // Tx success → update UI
      setLiked(true);
      setLikeCount(prev => prev + 1);
      // Also update off-chain counter
      fetch(`${API}/v1/public/stories/${slug}/like`, { method: 'POST' }).catch(() => {});
    } catch (err: any) {
      console.error('Like failed:', err.shortMessage || err.message);
    }
    setLiking(false);
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
        setLikeCount(data.metrics?.likes || 0);
        if (data.chapters?.length) {
          Promise.all(data.chapters.map((ch: any) => fetch(`${API}/v1/public/stories/${slug}/chapters/${ch.id}`).then(r => r.json()))).then(setChapters);
        }
      }).catch(console.error);

    fetch(`${API}/v1/public/stories/${slug}/comments`)
      .then(r => r.json())
      .then(d => setComments(d.items || []))
      .catch(() => {});
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

      {/* Chapters - swipe horizontal */}
      {chapters.length > 0 && (
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide mb-3">
          {chapters.map((ch) => (
            <div key={ch.id} className="snap-center shrink-0 w-full">
              <div className="border-2 border-on-surface bg-white overflow-hidden">
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
            </div>
          ))}
        </div>
      )}

      {chapters.length > 1 && (
        <p className="text-center font-label text-[10px] text-secondary uppercase mb-3">← Swipe chapters →</p>
      )}

      {chapters.length === 0 && (
        <div className="border-2 border-dashed border-secondary/50 p-6 text-center bg-surface-container-low mb-3">
          <p className="font-label text-xs text-secondary uppercase font-bold">No chapters available</p>
        </div>
      )}

      {/* Like / Comment / Share - single row */}
      <div className="flex items-center gap-3 mb-2 px-1">
        <button onClick={handleLike} disabled={liked || liking || !address || !story?.mintTxHash} className={`flex items-center gap-1 font-label text-[11px] disabled:opacity-50 ${liked ? 'text-red-600' : 'text-on-surface'}`}>
          <span className="material-symbols-outlined text-[18px]">{liked ? 'favorite' : 'favorite_border'}</span>
          <span>{liking ? '...' : liked ? 'Liked' : 'Like'}</span>
          {likeCount > 0 && <span className="text-[10px] text-secondary">({likeCount})</span>}
        </button>
        <button onClick={() => document.getElementById('comment-input')?.focus()} className="flex items-center gap-1 font-label text-[11px] text-on-surface">
          <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
          <span>Comment</span>
        </button>
        <button onClick={handleShare} className="flex items-center gap-1 font-label text-[11px] text-on-surface ml-auto">
          <span className="material-symbols-outlined text-[18px]">share</span>
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* Comment input */}
      <div className="border-t border-on-surface/20 border-b border-b-on-surface/20 py-2 mb-3">
        {isAuthed ? (
          <div className="flex gap-2 items-center">
            <input
              id="comment-input"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && postComment()}
              placeholder="Add a comment..."
              maxLength={500}
              className="flex-1 min-w-0 bg-transparent text-xs font-label py-1 focus:outline-none placeholder:text-secondary"
            />
            <button
              onClick={postComment}
              disabled={posting || !commentText.trim()}
              className="font-label text-[11px] font-bold text-primary disabled:opacity-40 shrink-0"
            >
              Post
            </button>
          </div>
        ) : (
          <p className="text-xs text-secondary font-label">Connect wallet to comment</p>
        )}
      </div>

      {/* Comments list */}
      {comments.length > 0 && (
        <div className="space-y-0 mb-3">
          {comments.slice(0, visibleComments).map((c, i) => (
            <div key={c.id} className={`border-b border-on-surface/10 pb-2 px-1 ${i === 0 ? 'pt-0' : 'pt-2'}`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-label text-[11px] font-bold text-on-surface">
                  {c.user?.displayName || `${c.user?.walletAddress?.slice(0, 6)}...${c.user?.walletAddress?.slice(-4)}`}
                </span>
                <span className="font-label text-[9px] text-secondary">2h ago</span>
              </div>
              <p className="text-[12px] text-on-surface/80 break-words">{c.text}</p>
            </div>
          ))}
          {comments.length > visibleComments && (
            <button onClick={() => setVisibleComments(prev => prev + 3)} className="w-full pt-2 text-center font-label text-[11px] text-secondary">
              View more
            </button>
          )}
        </div>
      )}
    </main>
  );
}

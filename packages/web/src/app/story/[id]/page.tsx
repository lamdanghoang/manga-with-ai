'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { RequireAuth } from '@/components/RequireAuth';
import { MintNFTButton } from '@/components/MintNFTButton';

export default function StoryPage() {
  const { id } = useParams();
  const [story, setStory] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [mintingChapter, setMintingChapter] = useState<string | null>(null);
  const [metadataURI, setMetadataURI] = useState<string | null>(null);

  useEffect(() => {
    api(`/v1/stories/${id}`).then((data: any) => {
      setStory(data.story);
      Promise.all(data.chapters.map((ch: any) => api(`/v1/stories/${id}/chapters/${ch.id}`))).then(setChapters);
    }).catch(console.error);
  }, [id]);

  async function handlePublish() {
    await api(`/v1/stories/${id}/publish`, { method: 'POST' });
    setStory({ ...story, visibility: 'public' });
  }

  async function handleMintPrepare(chapterId: string) {
    setMintingChapter(chapterId);
    setMetadataURI(null);
    try {
      const res = await api<{ metadataURI: string }>(`/v1/chapters/${chapterId}/metadata`, { method: 'POST' });
      setMetadataURI(res.metadataURI);
    } catch (err: any) {
      console.error('Metadata error:', err.message);
      setMintingChapter(null);
    }
  }

  return (
    <RequireAuth title="Your story" description="Connect wallet to view and manage your manga.">
    {!story ? (
      <div className="p-8 text-center font-label text-secondary">Loading...</div>
    ) : (
    <main className="pt-6 px-4 max-w-lg mx-auto">
      {/* Title */}
      <div className="border-4 border-on-surface bg-white comic-shadow p-4 mb-6">
        <h1 className="font-display text-2xl text-primary uppercase tracking-tighter">{story.title}</h1>
      </div>

      {/* Chapters - horizontal snap scroll */}
      {chapters.length > 0 && (
        <>
          <p className="font-label text-xs text-secondary uppercase mb-2 tracking-wider">← Swipe chapters →</p>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
            {chapters.map((ch) => (
              <div key={ch.id} className="snap-center shrink-0 w-full">
                <div className="border-4 border-on-surface bg-white comic-shadow overflow-hidden">
                  <div className="bg-on-surface text-white px-3 py-1 font-label text-xs font-bold uppercase">
                    Chapter {ch.chapterNumber}{ch.title ? ` — ${ch.title}` : ''}
                  </div>
                  {ch.pageImageUrl && <img src={ch.pageImageUrl} alt={`Chapter ${ch.chapterNumber}`} className="w-full" />}
                </div>
                {/* Mint NFT button per chapter */}
                {mintingChapter === ch.id && metadataURI ? (
                  <MintNFTButton metadataURI={metadataURI} />
                ) : (
                  <button onClick={() => handleMintPrepare(ch.id)} disabled={mintingChapter === ch.id} className="mt-2 w-full bg-on-surface text-white font-label text-xs py-2 border-2 border-on-surface comic-shadow-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none uppercase disabled:opacity-50">
                    {mintingChapter === ch.id ? 'PREPARING...' : '🎨 MINT AS NFT'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {chapters.length === 0 && (
        <div className="border-4 border-dashed border-secondary/50 p-8 text-center bg-surface-container-low speed-lines">
          <p className="font-label text-sm text-secondary uppercase font-bold animate-pulse">Generating...</p>
        </div>
      )}

      <Link href={`/story/${id}/continue`} className="block mt-6 w-full bg-primary text-white font-display text-lg text-center border-4 border-on-surface px-6 py-4 comic-shadow hover:bg-primary-container active:translate-x-1 active:translate-y-1 active:shadow-none transition-all uppercase">
        CONTINUE STORY →
      </Link>

      {/* Publish */}
      {story.visibility !== 'public' && (
        <button onClick={handlePublish} className="block mt-3 w-full bg-white text-on-surface font-display text-lg text-center border-4 border-on-surface px-6 py-4 comic-shadow hover:bg-surface-container active:translate-x-1 active:translate-y-1 active:shadow-none transition-all uppercase">
          PUBLISH TO EXPLORE
        </button>
      )}
      {story.visibility === 'public' && (
        <p className="mt-3 text-center font-label text-xs text-secondary uppercase">✓ Published</p>
      )}
    </main>
    )}
    </RequireAuth>
  );
}

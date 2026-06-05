'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getApiUrl } from '@/lib/api';

export default function PublicReaderPage() {
  const { slug } = useParams();
  const [story, setStory] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const API = getApiUrl();

  useEffect(() => {
    fetch(`${API}/v1/public/stories/${slug}`)
      .then(r => r.json())
      .then((data) => {
        setStory(data);
        if (data.chapters?.length) {
          Promise.all(data.chapters.map((ch: any) => fetch(`${API}/v1/public/stories/${slug}/chapters/${ch.id}`).then(r => r.json()))).then(setChapters);
        }
      }).catch(console.error);
  }, [slug]);

  if (!story) return <div className="p-8 text-center font-label text-secondary">Loading...</div>;

  return (
    <main className="pt-6 px-4 max-w-lg mx-auto">
      {/* Title */}
      <div className="border-4 border-on-surface bg-white comic-shadow p-4 mb-6">
        <h1 className="font-display text-2xl text-primary uppercase tracking-tighter">{story.title}</h1>
      </div>

      {/* Chapters */}
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
              </div>
            ))}
          </div>
        </>
      )}

      {chapters.length === 0 && (
        <div className="border-4 border-dashed border-secondary/50 p-8 text-center bg-surface-container-low speed-lines">
          <p className="font-label text-sm text-secondary uppercase font-bold">No chapters available</p>
        </div>
      )}
    </main>
  );
}

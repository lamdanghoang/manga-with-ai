'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function StoryPage() {
  const { id } = useParams();
  const [story, setStory] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api(`/v1/stories/${id}`).then((data: any) => {
      setStory(data.story);
      Promise.all(
        data.chapters.map((ch: any) => api(`/v1/stories/${id}/chapters/${ch.id}`))
      ).then(setChapters);
    }).catch(console.error);
  }, [id]);

  if (!story) return <div className="p-4 text-center text-gray-400">Loading...</div>;
  if (!chapters.length) return <div className="p-4 text-center text-gray-400">Loading chapters...</div>;

  return (
    <main className="p-4 pt-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">{story.title}</h1>
      <p className="text-sm text-gray-400 mt-1">← Swipe to read chapters →</p>

      {/* Horizontal snap scroll */}
      <div ref={scrollRef} className="mt-4 flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
        {chapters.map((ch) => (
          <div key={ch.id} className="snap-center shrink-0 w-full">
            <p className="text-xs text-gray-400 mb-2">Chapter {ch.chapterNumber}{ch.title ? ` — ${ch.title}` : ''}</p>
            {ch.pageImageUrl && (
              <img src={ch.pageImageUrl} alt={`Chapter ${ch.chapterNumber}`} className="w-full rounded-lg border border-gray-700" />
            )}
          </div>
        ))}
      </div>

      <Link href={`/story/${id}/continue`} className="block mt-4 text-center bg-purple-600 hover:bg-purple-700 py-3 rounded-xl font-semibold">
        Continue Story →
      </Link>
    </main>
  );
}

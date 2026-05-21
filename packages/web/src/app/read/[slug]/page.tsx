'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function PublicReaderPage() {
  const { slug } = useParams();
  const [story, setStory] = useState<any>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/v1/public/stories/${slug}`)
      .then(r => r.json()).then(setStory).catch(console.error);
  }, [slug]);

  if (!story) return <div className="p-4 text-center text-gray-400">Loading...</div>;

  return (
    <main className="p-4 pt-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">{story.title}</h1>
      {story.synopsis && <p className="text-gray-400 mt-2">{story.synopsis}</p>}
      <div className="mt-6 space-y-2">
        {story.chapters?.map((ch: any) => (
          <Link key={ch.id} href={`/read/${slug}/${ch.id}`} className="block bg-gray-800 rounded-lg p-3 hover:bg-gray-700">
            <span className="font-medium">Chapter {ch.chapterNumber}</span>
            {ch.title && <span className="text-gray-400 ml-2">— {ch.title}</span>}
          </Link>
        ))}
      </div>
    </main>
  );
}

'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ExplorePage() {
  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/v1/public/feed`)
      .then(r => r.json()).then(d => setStories(d.items || [])).catch(console.error);
  }, []);

  return (
    <main className="p-4 pt-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Explore Stories</h1>
      {stories.length === 0 && <p className="text-gray-500 text-center mt-8">No public stories yet.</p>}
      <div className="space-y-3">
        {stories.map((s) => (
          <Link key={s.publicSlug} href={`/read/${s.publicSlug}`} className="block bg-gray-800 rounded-lg p-4 hover:bg-gray-700">
            <h3 className="font-semibold">{s.title}</h3>
            {s.synopsis && <p className="text-sm text-gray-400 mt-1 line-clamp-2">{s.synopsis}</p>}
            <span className="text-xs text-gray-500 mt-1 block">{s.totalChapters} chapters</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function LibraryPage() {
  const [stories, setStories] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api<{ items: any[] }>(`/v1/stories?status=${filter}`).then((d) => setStories(d.items)).catch(console.error);
  }, [filter]);

  return (
    <main className="p-4 pt-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Library</h1>
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {['all', 'ongoing', 'completed', 'draft'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${filter === f ? 'bg-purple-600' : 'bg-gray-800'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      {stories.length === 0 && <p className="text-gray-500 text-center mt-8">No stories yet. Create one!</p>}
      <div className="space-y-3">
        {stories.map((s) => (
          <Link key={s.id} href={`/story/${s.id}`} className="block bg-gray-800 rounded-lg p-4 hover:bg-gray-700">
            <h3 className="font-semibold">{s.title}</h3>
            <div className="flex gap-2 mt-1 text-xs text-gray-400">
              <span>{s.totalChapters} chapters</span>
              <span>•</span>
              <span className={s.visibility === 'public' ? 'text-green-400' : ''}>{s.visibility}</span>
              <span>•</span>
              <span>{s.status}</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

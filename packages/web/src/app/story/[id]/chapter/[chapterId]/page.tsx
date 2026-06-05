'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { RequireAuth } from '@/components/RequireAuth';

export default function ChapterPage() {
  const { id, chapterId } = useParams();
  const [chapter, setChapter] = useState<any>(null);

  useEffect(() => {
    api(`/v1/stories/${id}/chapters/${chapterId}`).then(setChapter).catch(console.error);
  }, [id, chapterId]);

  return (
    <RequireAuth>
    {!chapter ? (
      <div className="p-4 text-center text-gray-400">Loading chapter...</div>
    ) : (
    <main className="p-4 pt-8 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Chapter {chapter.chapterNumber}{chapter.title ? `: ${chapter.title}` : ''}</h1>

      {/* Full manga page */}
      {chapter.pageImageUrl && (
        <img src={chapter.pageImageUrl} alt={`Chapter ${chapter.chapterNumber}`} className="w-full rounded-lg border border-gray-700" />
      )}

      {/* Panel narrations below the page */}
      {chapter.panels?.length > 0 && (
        <div className="mt-4 space-y-2">
          {chapter.panels.map((panel: any) => (
            <div key={panel.id} className="text-sm">
              {panel.narrationText && <p className="italic text-gray-300">📖 {panel.narrationText}</p>}
              {panel.dialogueText?.map((d: string, i: number) => (
                <p key={i} className="text-gray-400 ml-4">💬 {d}</p>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Link href={`/story/${id}`} className="flex-1 text-center bg-gray-700 py-3 rounded-xl">← Story</Link>
        <Link href={`/story/${id}/continue`} className="flex-1 text-center bg-purple-600 py-3 rounded-xl font-semibold">Continue →</Link>
      </div>
    </main>
    )}
    </RequireAuth>
  );
}

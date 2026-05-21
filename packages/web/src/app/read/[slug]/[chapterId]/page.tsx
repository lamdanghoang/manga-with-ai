'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function PublicChapterPage() {
  const { slug, chapterId } = useParams();
  const [chapter, setChapter] = useState<any>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/v1/public/stories/${slug}/chapters/${chapterId}`)
      .then(r => r.json()).then(setChapter).catch(console.error);
  }, [slug, chapterId]);

  if (!chapter) return <div className="p-4 text-center text-gray-400">Loading...</div>;

  return (
    <main className="p-4 pt-8 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Chapter {chapter.chapterNumber}{chapter.title ? `: ${chapter.title}` : ''}</h1>
      <div className="space-y-6">
        {chapter.panels?.map((panel: any) => (
          <div key={panel.id} className="bg-gray-800 rounded-lg overflow-hidden">
            {panel.imageUrl && <img src={panel.imageUrl} alt={`Panel ${panel.panelNumber}`} className="w-full aspect-[3/4] object-cover" />}
            {panel.narrationText && <p className="px-3 py-2 text-sm italic text-gray-300">{panel.narrationText}</p>}
            {panel.dialogueText?.length > 0 && (
              <div className="px-3 pb-2">
                {panel.dialogueText.map((d: string, i: number) => (
                  <p key={i} className="text-sm bg-gray-700 rounded px-2 py-1 mt-1">💬 {d}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <Link href={`/read/${slug}`} className="block mt-6 text-center bg-gray-700 py-3 rounded-xl">← Back to Story</Link>
    </main>
  );
}

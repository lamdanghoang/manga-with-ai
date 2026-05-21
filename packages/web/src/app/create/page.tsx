'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface CharRef { name: string; role: string; imageData: string; preview: string }

export default function CreatePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<'manga-bw' | 'manga-soft-color'>('manga-bw');
  const [panelCount, setPanelCount] = useState<4 | 6 | 8>(4);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [charRefs, setCharRefs] = useState<CharRef[]>([]);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCharRefs([...charRefs, { name: '', role: 'main', imageData: dataUrl, preview: dataUrl }]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function updateCharRef(index: number, field: string, value: string) {
    const updated = [...charRefs];
    (updated[index] as any)[field] = value;
    setCharRefs(updated);
  }

  function removeCharRef(index: number) {
    setCharRefs(charRefs.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setStatus('Creating story...');

    const res = await api<{ jobId: string; storyId: string }>('/v1/stories', {
      method: 'POST',
      body: JSON.stringify({
        prompt, stylePreset: style, panelCount,
        characterRefs: charRefs.map(c => ({ name: c.name || 'Character', role: c.role, imageData: c.imageData })),
      }),
    });

    const interval = setInterval(async () => {
      const job = await api<{ status: string; chapterId: string | null }>(`/v1/jobs/${res.jobId}`);
      setStatus(job.status === 'running' ? 'Generating manga page...' : job.status);
      if (job.status === 'completed') {
        clearInterval(interval);
        router.push(`/story/${res.storyId}`);
      } else if (job.status === 'failed') {
        clearInterval(interval);
        setLoading(false);
        setStatus('Generation failed. Try again.');
      }
    }, 3000);
  }

  if (loading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-pulse text-4xl mb-4">🎨</div>
        <p className="text-lg font-semibold">{status}</p>
        <p className="text-sm text-gray-400 mt-2">This may take a minute...</p>
      </main>
    );
  }

  return (
    <main className="p-4 pt-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Story</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Story Prompt</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} placeholder="Describe your manga story..." className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white resize-none focus:outline-none focus:border-purple-500" />
        </div>

        {/* Character References */}
        <div>
          <label className="block text-sm text-gray-300 mb-1">Character References (optional)</label>
          <div className="space-y-3">
            {charRefs.map((ref, i) => (
              <div key={i} className="flex gap-2 items-start bg-gray-800 rounded-lg p-2">
                <img src={ref.preview} alt="" className="w-16 h-16 rounded object-cover shrink-0" />
                <div className="flex-1 space-y-1">
                  <input value={ref.name} onChange={(e) => updateCharRef(i, 'name', e.target.value)} placeholder="Name" className="w-full bg-gray-700 rounded px-2 py-1 text-sm text-white" />
                  <select value={ref.role} onChange={(e) => updateCharRef(i, 'role', e.target.value)} className="w-full bg-gray-700 rounded px-2 py-1 text-sm text-white">
                    <option value="main">Main character</option>
                    <option value="supporting">Supporting</option>
                    <option value="villain">Villain</option>
                  </select>
                </div>
                <button type="button" onClick={() => removeCharRef(i)} className="text-red-400 text-lg">✕</button>
              </div>
            ))}
          </div>
          {charRefs.length < 5 && (
            <label className="block mt-2 text-center border border-dashed border-gray-600 rounded-lg py-3 cursor-pointer hover:border-purple-500">
              <span className="text-sm text-gray-400">+ Upload character image</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Style</label>
          <div className="flex gap-2">
            {(['manga-bw', 'manga-soft-color'] as const).map((s) => (
              <button key={s} type="button" onClick={() => setStyle(s)} className={`flex-1 py-2 rounded-lg border ${style === s ? 'border-purple-500 bg-purple-900/30' : 'border-gray-700 bg-gray-800'}`}>
                {s === 'manga-bw' ? '⬛ B&W' : '🎨 Color'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Panels per Chapter</label>
          <div className="flex gap-2">
            {([4, 6, 8] as const).map((n) => (
              <button key={n} type="button" onClick={() => setPanelCount(n)} className={`flex-1 py-2 rounded-lg border ${panelCount === n ? 'border-purple-500 bg-purple-900/30' : 'border-gray-700 bg-gray-800'}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={!prompt.trim()} className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl">
          ✨ Generate Story
        </button>
      </form>
    </main>
  );
}

'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { RequireAuth } from '@/components/RequireAuth';

export default function ContinuePage() {
  const { id } = useParams();
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setStatus('PLANNING NEXT CHAPTER...');

    const res = await api<{ jobId: string }>(`/v1/stories/${id}/chapters`, {
      method: 'POST',
      body: JSON.stringify({ prompt, branchMode: 'canon' }),
    });

    const interval = setInterval(async () => {
      const job = await api<{ status: string; chapterId: string | null }>(`/v1/jobs/${res.jobId}`);
      setStatus(job.status === 'running' ? 'GENERATING MANGA PAGE...' : job.status.toUpperCase());
      if (job.status === 'completed') { clearInterval(interval); router.push(`/story/${id}`); }
      else if (job.status === 'failed') { clearInterval(interval); setLoading(false); setStatus('FAILED'); }
    }, 3000);
  }

  if (loading) {
    return (
      <RequireAuth>
        <main className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="border-4 border-on-surface bg-white comic-shadow-lg p-8 text-center speed-lines">
            <span className="material-symbols-outlined text-5xl text-primary animate-pulse mb-4 block">auto_fix_high</span>
            <p className="font-display text-xl uppercase">{status}</p>
          </div>
        </main>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
    <main className="pt-6 px-4 max-w-lg mx-auto">
      <div className="border-4 border-on-surface bg-surface-container-low p-3 comic-shadow flex items-center gap-3 mb-6">
        <span className="font-label text-xs bg-on-surface text-white px-3 py-1 font-bold skew-x-[-4deg]">NEXT</span>
        <span className="font-display text-lg uppercase text-primary">Continue Story</span>
      </div>

      <form onSubmit={handleSubmit} className="border-4 border-on-surface bg-white p-5 comic-shadow-lg space-y-5">
        <div className="relative pt-2">
          <label className="absolute -top-1 left-4 bg-white px-2 font-label text-xs border-2 border-on-surface z-10 font-bold uppercase">What happens next?</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} placeholder="Describe the next scene or chapter..." className="w-full border-2 border-on-surface bg-surface-container font-body p-3 focus:outline-none focus:border-4 resize-none text-sm" />
        </div>
        <button type="submit" disabled={!prompt.trim()} className="w-full bg-primary text-white font-display text-lg border-4 border-on-surface px-6 py-4 comic-shadow hover:bg-primary-container active:translate-x-1 active:translate-y-1 active:shadow-none transition-all uppercase disabled:opacity-40">
          GENERATE NEXT CHAPTER
        </button>
      </form>
    </main>
    </RequireAuth>
  );
}

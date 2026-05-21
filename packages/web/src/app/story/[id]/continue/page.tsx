'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

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
    setStatus('Planning next chapter...');

    const res = await api<{ jobId: string; storyId: string }>(`/v1/stories/${id}/chapters`, {
      method: 'POST',
      body: JSON.stringify({ prompt, branchMode: 'canon' }),
    });

    const interval = setInterval(async () => {
      const job = await api<{ status: string; chapterId: string | null }>(`/v1/jobs/${res.jobId}`);
      setStatus(job.status === 'running' ? 'Generating panels...' : job.status);
      if (job.status === 'completed') {
        clearInterval(interval);
        router.push(`/story/${id}/chapter/${job.chapterId}`);
      } else if (job.status === 'failed') {
        clearInterval(interval);
        setLoading(false);
        setStatus('Failed. Try again.');
      }
    }, 3000);
  }

  if (loading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-pulse text-4xl mb-4">📝</div>
        <p className="text-lg font-semibold">{status}</p>
      </main>
    );
  }

  return (
    <main className="p-4 pt-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Continue Story</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} placeholder="What happens next..." className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white resize-none focus:outline-none focus:border-purple-500" />
        <button type="submit" disabled={!prompt.trim()} className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl">
          Generate Next Chapter →
        </button>
      </form>
    </main>
  );
}

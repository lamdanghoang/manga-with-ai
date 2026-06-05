'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { RequireAuth } from '@/components/RequireAuth';

interface CharRef { name: string; role: string; imageData: string; preview: string }

export default function CreatePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<'manga-bw' | 'manga-soft-color'>('manga-bw');
  const [panelCount, setPanelCount] = useState<4 | 6 | 8>(4);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [charRefs, setCharRefs] = useState<CharRef[]>([]);
  const [styleTags, setStyleTags] = useState<string[]>(['high-energy', 'ink-bold']);

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
    setStatus('ESTABLISHING LEGEND...');

    const res = await api<{ jobId: string; storyId: string }>('/v1/stories', {
      method: 'POST',
      body: JSON.stringify({ prompt: `${prompt}. Style: ${styleTags.join(', ')}`, stylePreset: style, panelCount, characterRefs: charRefs.map(c => ({ name: c.name || 'Character', role: c.role, imageData: c.imageData })) }),
    });

    const interval = setInterval(async () => {
      const job = await api<{ status: string; chapterId: string | null }>(`/v1/jobs/${res.jobId}`);
      setStatus(job.status === 'running' ? 'GENERATING MANGA PAGE...' : job.status.toUpperCase());
      if (job.status === 'completed') { clearInterval(interval); router.push(`/story/${res.storyId}`); }
      else if (job.status === 'failed') { clearInterval(interval); setLoading(false); setStatus('GENERATION FAILED'); }
    }, 3000);
  }

  if (loading) {
    return (
      <RequireAuth title="Create your manga" description="Connect wallet to start a new AI-generated series.">
      <main className="fixed inset-0 flex flex-col items-center justify-center p-4 z-50 bg-surface">
        <div className="border-4 border-on-surface bg-white comic-shadow-lg p-8 text-center speed-lines max-w-sm w-full">
          <div className="w-12 h-12 border-4 border-on-surface border-t-primary rounded-none animate-spin mx-auto mb-4"></div>
          <p className="font-display text-xl uppercase tracking-tight">{status}</p>
          <p className="text-xs text-secondary mt-2 font-label">This may take a minute...</p>
        </div>
      </main>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth title="Create your manga" description="Connect wallet to start a new AI-generated series.">
    <main className="pt-4 px-4 max-w-lg mx-auto pb-8">
      {/* Step Banner */}
      <div className="border-4 border-on-surface bg-surface-container-low p-3 comic-shadow flex items-center gap-3 mb-6">
        <span className="font-label text-xs bg-on-surface text-white px-3 py-1 font-bold skew-x-[-4deg]">NEW</span>
        <span className="font-display text-base uppercase text-primary">CREATE YOUR MANGA</span>
        <span className="ml-auto w-2 h-6 bg-primary"></span>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="border-4 border-on-surface bg-white p-5 comic-shadow-lg space-y-5">
        {/* SFX Header */}
        <div className="flex items-center gap-2 border-b-2 border-surface-container pb-3">
          <span className="font-display text-lg text-on-surface">SFX:</span>
          <span className="font-label text-xs bg-on-surface text-white px-2 py-0.5 italic tracking-wider font-bold">POW!</span>
          <h2 className="font-display text-base ml-auto uppercase">THE LOOK</h2>
        </div>

        {/* Appearance / Story Prompt */}
        <div className="relative pt-2">
          <label className="absolute -top-1 left-4 bg-white px-2 font-label text-xs border-2 border-on-surface z-10 font-bold uppercase">Appearance / Story</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} placeholder="Describe hair color, outfit, setting, plot... (e.g., 'Spiky blue hair, red scarf, Neo-Tokyo cyberpunk streets at midnight')" className="w-full border-2 border-on-surface bg-surface-container font-body p-3 focus:outline-none focus:border-4 resize-none text-sm" />
        </div>

        {/* Character References */}
        <div className="relative pt-2">
          <label className="absolute -top-1 left-4 bg-white px-2 font-label text-xs border-2 border-on-surface z-10 font-bold uppercase">Character Refs</label>
          <div className="border-2 border-on-surface bg-surface-container p-3 space-y-2">
            {charRefs.map((ref, i) => (
              <div key={i} className="flex gap-2 items-start bg-white border-2 border-on-surface p-2">
                <img src={ref.preview} alt="" className="w-14 h-14 object-cover border-2 border-on-surface shrink-0" />
                <div className="flex-1 space-y-1">
                  <input value={ref.name} onChange={(e) => updateCharRef(i, 'name', e.target.value)} placeholder="Name" className="w-full bg-surface-container border border-on-surface px-2 py-1 text-xs font-label" />
                  <select value={ref.role} onChange={(e) => updateCharRef(i, 'role', e.target.value)} className="w-full bg-surface-container border border-on-surface px-2 py-1 text-xs font-label">
                    <option value="main">Main</option>
                    <option value="supporting">Supporting</option>
                    <option value="villain">Villain</option>
                  </select>
                </div>
                <button type="button" onClick={() => removeCharRef(i)} className="text-primary font-bold text-lg">✕</button>
              </div>
            ))}
            {charRefs.length < 5 && (
              <label className="block text-center border-2 border-dashed border-secondary/50 py-3 cursor-pointer hover:border-primary">
                <span className="font-label text-xs text-secondary uppercase">+ Upload character image</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Style + Panels row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative pt-2">
            <label className="absolute -top-1 left-3 bg-white px-1 font-label text-[10px] border border-on-surface z-10 font-bold uppercase">Style</label>
            <div className="flex flex-col gap-1 border-2 border-on-surface p-2 bg-surface-container">
              {(['manga-bw', 'manga-soft-color'] as const).map((s) => (
                <button key={s} type="button" onClick={() => setStyle(s)} className={`py-1.5 border-2 font-label text-[10px] font-bold uppercase ${style === s ? 'border-primary bg-primary text-white' : 'border-on-surface bg-white text-on-surface'}`}>
                  {s === 'manga-bw' ? 'B&W INK' : 'SOFT COLOR'}
                </button>
              ))}
            </div>
          </div>
          <div className="relative pt-2">
            <label className="absolute -top-1 left-3 bg-white px-1 font-label text-[10px] border border-on-surface z-10 font-bold uppercase">Panels</label>
            <div className="flex flex-col gap-1 border-2 border-on-surface p-2 bg-surface-container">
              {([4, 6, 8] as const).map((n) => (
                <button key={n} type="button" onClick={() => setPanelCount(n)} className={`py-1.5 border-2 font-label text-[10px] font-bold ${panelCount === n ? 'border-primary bg-primary text-white' : 'border-on-surface bg-white text-on-surface'}`}>
                  {n} PANELS
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>

      {/* Speech bubble tip */}
      <div className="relative bg-white border-2 border-on-surface p-4 comic-shadow mt-5 max-w-sm ml-3">
        <p className="text-xs text-secondary font-bold leading-relaxed">
          "Your character's description will be used to maintain consistency across every panel of your manga. Be descriptive!"
        </p>
        <div className="absolute -left-2.5 bottom-4 w-5 h-5 bg-white border-l-2 border-b-2 border-on-surface transform rotate-45"></div>
      </div>

      {/* Style Chips - selectable */}
      <div className="mt-4 flex flex-wrap gap-2">
        {([
          { id: 'high-energy', icon: 'bolt', label: 'HIGH ENERGY' },
          { id: 'ink-bold', icon: 'brush', label: 'INK BOLD' },
          { id: 'screen-tone', icon: 'grid_4x4', label: 'SCREEN-TONE' },
          { id: 'dramatic', icon: 'contrast', label: 'DRAMATIC' },
          { id: 'soft-shading', icon: 'blur_on', label: 'SOFT SHADING' },
        ]).map((chip) => (
          <button key={chip.id} type="button" onClick={() => setStyleTags(prev => prev.includes(chip.id) ? prev.filter(t => t !== chip.id) : [...prev, chip.id])} className={`font-label text-[10px] px-2.5 py-1 flex items-center gap-1 font-bold border-2 transition-all ${styleTags.includes(chip.id) ? 'bg-primary text-white border-primary' : 'bg-on-surface text-white border-on-surface opacity-60'}`}>
            <span className="material-symbols-outlined text-[12px]">{chip.icon}</span> {chip.label}
          </button>
        ))}
      </div>

      {/* Submit CTA */}
      <button onClick={handleSubmit} disabled={!prompt.trim()} className="w-full mt-6 bg-primary text-white font-display text-xl border-4 border-on-surface px-6 py-5 comic-shadow-lg hover:bg-primary-container active:translate-x-1 active:translate-y-1 active:shadow-none transition-all uppercase disabled:opacity-40 flex items-center justify-center gap-3">
        <span>ESTABLISH LEGEND</span>
        <span className="material-symbols-outlined text-2xl">arrow_forward</span>
      </button>
    </main>
    </RequireAuth>
  );
}

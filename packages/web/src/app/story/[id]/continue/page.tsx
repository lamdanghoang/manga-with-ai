'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { sanitizeInput, containsCode } from '@/lib/sanitize';
import { RequireAuth } from '@/components/RequireAuth';
import { PayModal } from '@/components/PayModal';
import { PackageModal } from '@/components/PackageModal';

export default function ContinuePage() {
  const { id } = useParams();
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [promptWarning, setPromptWarning] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [paymentTx, setPaymentTx] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [userPlan, setUserPlan] = useState<string>('free');

  useEffect(() => {
    api<{ credits: number; tier: string }>('/v1/user/credits')
      .then((d) => { setUserPlan(d.tier || 'free'); setUserCredits(d.credits || 0); })
      .catch(() => {});
  }, []);

  function handlePackageSuccess() {
    setShowPackageModal(false);
    api<{ credits: number; tier: string }>('/v1/user/credits')
      .then((d) => { setUserPlan(d.tier || 'free'); setUserCredits(d.credits || 0); })
      .catch(() => {});
  }

  async function handleSubmit(e?: React.FormEvent, txOverride?: string) {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setStatus('PLANNING NEXT CHAPTER...');

    const tx = txOverride || paymentTx;
    try {
      const res = await api<{ jobId: string }>(`/v1/stories/${id}/chapters`, {
        method: 'POST',
        headers: tx ? { 'x-payment-tx': tx } : undefined,
        body: JSON.stringify({ prompt, branchMode: 'canon' }),
      });

      const interval = setInterval(async () => {
        const job = await api<{ status: string; chapterId: string | null }>(`/v1/jobs/${res.jobId}`);
        setStatus(job.status === 'running' ? 'GENERATING MANGA PAGE...' : job.status.toUpperCase());
        if (job.status === 'completed' || job.status === 'completed_partial') { clearInterval(interval); router.push(`/story/${id}?new=1`); }
        else if (job.status === 'failed') { clearInterval(interval); setLoading(false); setStatus('FAILED'); }
      }, 3000);
    } catch (err: any) {
      setLoading(false);
      if (err.message?.includes('402') || err.message?.includes('Payment')) {
        setShowPayModal(true);
      } else {
        setStatus(err.message || 'ERROR');
      }
    }
  }

  function handlePaySuccess(txHash: string) {
    setShowPayModal(false);
    setPaymentTx(txHash);
    handleSubmit(undefined, txHash);
  }

  if (loading) {
    return (
      <RequireAuth>
        <main className="fixed inset-0 flex flex-col items-center justify-center p-4 z-50 bg-surface">
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
          <textarea value={prompt} onChange={(e) => {
                const raw = e.target.value;
                if (containsCode(raw)) {
                  setPromptWarning("Code/scripts are not allowed. Describe your story in plain text.");
                  setPrompt(sanitizeInput(raw));
                } else {
                  setPromptWarning("");
                  setPrompt(raw);
                }
              }} rows={4} placeholder="Describe the next scene or chapter..." className="w-full border-2 border-on-surface bg-surface-container font-body p-3 focus:outline-none focus:border-4 resize-none text-sm" />
          {promptWarning && (
            <p className="text-[10px] text-red-500 mt-1">{promptWarning}</p>
          )}
        </div>
        <button type="submit" disabled={!prompt.trim()} className="w-full bg-primary text-white font-display text-lg border-4 border-on-surface px-6 py-4 comic-shadow hover:bg-primary-container active:translate-x-1 active:translate-y-1 active:shadow-none transition-all uppercase disabled:opacity-40">
          GENERATE NEXT CHAPTER
        </button>
      </form>

      {/* Credits remaining */}
      <p className="text-center font-label text-[11px] text-secondary mt-4">
        {userCredits > 1
          ? `${userCredits} credits remaining`
          : userCredits === 1
            ? '1 credit remaining'
            : <span>No credits — <button onClick={() => setShowPackageModal(true)} className="text-primary underline">Buy credits</button> or $0.05 per use</span>}
      </p>

      <PayModal isOpen={showPayModal} onClose={() => setShowPayModal(false)} onSuccess={handlePaySuccess} />
      <PackageModal isOpen={showPackageModal} onClose={() => setShowPackageModal(false)} onSuccess={handlePackageSuccess} />
    </main>
    </RequireAuth>
  );
}

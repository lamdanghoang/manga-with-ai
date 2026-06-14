"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { RequireAuth } from "@/components/RequireAuth";
import { PayModal } from "@/components/PayModal";
import { VipModal } from "@/components/VipModal";

interface CharRef {
  name: string;
  role: string;
  imageData: string;
  preview: string;
}
interface StyleTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  previewUrl: string | null;
  category: string;
  tier: "free" | "vip";
}

export default function CreatePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [panelCount, setPanelCount] = useState<4 | 6 | 8>(4);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [charRefs, setCharRefs] = useState<CharRef[]>([]);
  const [customStylePrompt, setCustomStylePrompt] = useState("");

  // Styles
  const [styles, setStyles] = useState<StyleTemplate[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>("manga-bw");
  const [userPlan, setUserPlan] = useState<"free" | "vip">("free");
  const [showVipModal, setShowVipModal] = useState(false);

  // Payment
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentTx, setPaymentTx] = useState<string | null>(null);

  // Load styles and subscription
  useEffect(() => {
    api<{ items: StyleTemplate[] }>("/v1/styles")
      .then((d) => setStyles(d.items || []))
      .catch(() => {});
    api<{ plan: string }>("/v1/user/subscription")
      .then((d) => setUserPlan(d.plan as "free" | "vip"))
      .catch(() => {});
  }, []);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCharRefs([
        ...charRefs,
        { name: "", role: "main", imageData: dataUrl, preview: dataUrl },
      ]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function updateCharRef(index: number, field: string, value: string) {
    const updated = [...charRefs];
    (updated[index] as any)[field] = value;
    setCharRefs(updated);
  }

  function removeCharRef(index: number) {
    setCharRefs(charRefs.filter((_, i) => i !== index));
  }

  function handleStyleSelect(slug: string, tier: string) {
    if (tier === "vip" && userPlan !== "vip") {
      setShowVipModal(true);
      return;
    }
    setSelectedStyle(slug);
  }

  function handleVipSuccess() {
    setShowVipModal(false);
    setUserPlan("vip");
  }

  async function handleSubmit(e?: React.FormEvent, txOverride?: string) {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setStatus("ESTABLISHING LEGEND...");

    const tx = txOverride || paymentTx;

    // Build style string from selected template + custom prompt
    const selectedTemplate = styles.find((s) => s.slug === selectedStyle);
    let styleString = selectedTemplate?.slug || "manga-bw";
    if (customStylePrompt.trim() && userPlan === "vip") {
      styleString += `. Custom style: ${customStylePrompt.trim()}`;
    }

    try {
      const res = await api<{ jobId: string; storyId: string }>("/v1/stories", {
        method: "POST",
        headers: tx ? { "x-payment-tx": tx } : undefined,
        body: JSON.stringify({
          prompt: `${prompt}. Style: ${styleString}`,
          stylePreset: selectedStyle as any,
          panelCount,
          customStylePrompt: userPlan === "vip" ? customStylePrompt : undefined,
          characterRefs: charRefs.map((c) => ({
            name: c.name || "Character",
            role: c.role,
            imageData: c.imageData,
          })),
        }),
      });

      const interval = setInterval(async () => {
        const job = await api<{ status: string; chapterId: string | null }>(
          `/v1/jobs/${res.jobId}`,
        );
        setStatus(
          job.status === "running"
            ? "GENERATING MANGA PAGE..."
            : job.status.toUpperCase(),
        );
        if (job.status === "completed") {
          clearInterval(interval);
          router.push(`/story/${res.storyId}`);
        } else if (job.status === "failed") {
          clearInterval(interval);
          setLoading(false);
          setStatus("GENERATION FAILED");
        }
      }, 3000);
    } catch (err: any) {
      setLoading(false);
      if (err.message?.includes("402") || err.message?.includes("Payment")) {
        setShowPayModal(true);
      } else {
        setStatus(err.message || "ERROR");
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
      <RequireAuth
        title="Create your manga"
        description="Connect wallet to start a new AI-generated series."
      >
        <main className="fixed inset-0 flex flex-col items-center justify-center p-4 z-50 bg-surface">
          <div className="border-4 border-on-surface bg-white comic-shadow-lg p-8 text-center speed-lines max-w-sm w-full">
            <div className="w-12 h-12 border-4 border-on-surface border-t-primary rounded-none animate-spin mx-auto mb-4"></div>
            <p className="font-display text-xl uppercase tracking-tight">
              {status}
            </p>
            <p className="text-xs text-secondary mt-2 font-label">
              This may take a minute...
            </p>
          </div>
        </main>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth
      title="Create your manga"
      description="Connect wallet to start a new AI-generated series."
    >
      <main className="pt-4 px-4 max-w-lg mx-auto pb-8">
        {/* Step Banner */}
        <div className="border-4 border-on-surface bg-surface-container-low p-3 comic-shadow flex items-center gap-3 mb-6">
          <span className="font-label text-xs bg-on-surface text-white px-3 py-1 font-bold skew-x-[-4deg]">
            NEW
          </span>
          <span className="font-display text-base uppercase text-primary">
            CREATE YOUR MANGA
          </span>
          <span className="ml-auto w-2 h-6 bg-primary"></span>
        </div>

        {/* Main Form */}
        <form
          onSubmit={handleSubmit}
          className="border-4 border-on-surface bg-white p-5 comic-shadow-lg space-y-5"
        >
          {/* Story Prompt */}
          <div className="relative pt-2">
            <label className="absolute -top-1 left-4 bg-white px-2 font-label text-xs border-2 border-on-surface z-10 font-bold uppercase">
              Story & Appearance
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Describe hair color, outfit, setting, plot... (e.g., 'Spiky blue hair, red scarf, Neo-Tokyo cyberpunk streets at midnight')"
              className="w-full border-2 border-on-surface bg-surface-container font-body p-3 focus:outline-none focus:border-4 resize-none text-sm"
            />
          </div>

          {/* Character References */}
          <div className="relative pt-2">
            <label className="absolute -top-1 left-4 bg-white px-2 font-label text-xs border-2 border-on-surface z-10 font-bold uppercase">
              Character Refs
            </label>
            <div className="border-2 border-on-surface bg-surface-container p-3 space-y-2">
              {charRefs.map((ref, i) => (
                <div
                  key={i}
                  className="flex gap-2 items-start bg-white border-2 border-on-surface p-2"
                >
                  <img
                    src={ref.preview}
                    alt=""
                    className="w-14 h-14 object-cover border-2 border-on-surface shrink-0"
                  />
                  <div className="flex-1 space-y-1">
                    <input
                      value={ref.name}
                      onChange={(e) => updateCharRef(i, "name", e.target.value)}
                      placeholder="Name"
                      className="w-full bg-surface-container border border-on-surface px-2 py-1 text-xs font-label"
                    />
                    <select
                      value={ref.role}
                      onChange={(e) => updateCharRef(i, "role", e.target.value)}
                      className="w-full bg-surface-container border border-on-surface px-2 py-1 text-xs font-label"
                    >
                      <option value="main">Main</option>
                      <option value="supporting">Supporting</option>
                      <option value="villain">Villain</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCharRef(i)}
                    className="text-primary font-bold text-lg"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {charRefs.length < 5 && (
                <label className="block text-center border-2 border-dashed border-secondary/50 py-3 cursor-pointer hover:border-primary">
                  <span className="font-label text-xs text-secondary uppercase">
                    + Upload character image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Panels */}
          <div className="relative pt-2">
            <label className="absolute -top-1 left-3 bg-white px-1 font-label text-[10px] border border-on-surface z-10 font-bold uppercase">
              Panels per page
            </label>
            <div className="flex gap-2 border-2 border-on-surface p-2 bg-surface-container">
              {([4, 6, 8] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPanelCount(n)}
                  className={`flex-1 py-2 border-2 font-label text-xs font-bold ${panelCount === n ? "border-primary bg-primary text-white" : "border-on-surface bg-white text-on-surface"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Style Templates Section */}
        <div className="mt-5 border-4 border-on-surface bg-white p-4 comic-shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-base uppercase">ART STYLE</h3>
            {userPlan === "vip" && (
              <span className="font-label text-[10px] bg-yellow-400 text-on-surface px-2 py-0.5 font-bold border border-on-surface">
                VIP
              </span>
            )}
          </div>

          {/* Style Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {styles.map((style) => {
              const isLocked = style.tier === "vip" && userPlan !== "vip";
              const isSelected = selectedStyle === style.slug;
              return (
                <button
                  key={style.slug}
                  type="button"
                  onClick={() => handleStyleSelect(style.slug, style.tier)}
                  className={`relative p-2.5 pr-8 border-2 text-left transition-all min-h-[48px] ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-[2px_2px_0px_0px_var(--color-primary)]"
                      : isLocked
                        ? "border-on-surface/50 bg-surface-container/50 opacity-75"
                        : "border-on-surface bg-white hover:bg-surface-container"
                  }`}
                >
                  <p className="font-label text-[11px] font-bold uppercase leading-tight">
                    {style.name}
                  </p>
                  {isLocked && (
                    <div className="absolute top-1/2 -translate-y-1/2 right-2 flex flex-col items-center gap-0.5">
                      <span className="material-symbols-outlined text-sm text-secondary">
                        lock
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Style Prompt (VIP only) */}
          <div className="relative pt-2">
            <label className="absolute -top-1 left-3 bg-white px-1 font-label text-[10px] border border-on-surface z-10 font-bold uppercase flex items-center gap-1">
              Custom Style
              {userPlan !== "vip" && (
                <span className="text-[8px] bg-yellow-400 text-on-surface px-1">
                  VIP
                </span>
              )}
            </label>
            <textarea
              value={customStylePrompt}
              onChange={(e) => {
                if (userPlan !== "vip") {
                  setShowVipModal(true);
                  return;
                }
                setCustomStylePrompt(e.target.value);
              }}
              rows={2}
              placeholder={
                userPlan === "vip"
                  ? 'Add custom style instructions... (e.g., "Studio Ghibli watercolor with golden hour lighting")'
                  : "Unlock VIP to use custom style prompts"
              }
              disabled={userPlan !== "vip"}
              className="w-full border-2 border-on-surface bg-surface-container font-body p-2.5 focus:outline-none focus:border-primary resize-none text-xs disabled:opacity-50"
            />
          </div>

          {/* Unlock VIP button */}
          {userPlan !== "vip" && (
            <button
              type="button"
              onClick={() => setShowVipModal(true)}
              className="w-full mt-3 flex items-center justify-center gap-2 bg-yellow-400 text-on-surface font-label text-xs font-bold uppercase py-2.5 border-2 border-on-surface comic-shadow-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            >
              <span className="material-symbols-outlined text-base">star</span>
              UNLOCK VIP STYLES — $1/MONTH
            </button>
          )}
        </div>

        {/* Submit CTA */}
        <button
          onClick={handleSubmit}
          disabled={!prompt.trim()}
          className="w-full mt-6 bg-primary text-white font-display text-xl border-4 border-on-surface px-6 py-5 comic-shadow-lg hover:bg-primary-container active:translate-x-1 active:translate-y-1 active:shadow-none transition-all uppercase disabled:opacity-40 flex items-center justify-center gap-3"
        >
          <span>ESTABLISH LEGEND</span>
          <span className="material-symbols-outlined text-2xl">
            arrow_forward
          </span>
        </button>

        {/* Modals */}
        <PayModal
          isOpen={showPayModal}
          onClose={() => setShowPayModal(false)}
          onSuccess={handlePaySuccess}
        />
        <VipModal
          isOpen={showVipModal}
          onClose={() => setShowVipModal(false)}
          onSuccess={handleVipSuccess}
        />
      </main>
    </RequireAuth>
  );
}

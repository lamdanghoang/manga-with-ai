"use client";
import { useEffect, useState } from "react";

const DISMISSED_KEY = "manga_onboarding_dismissed";

export function GettingStarted() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(DISMISSED_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="border-2 border-on-surface bg-white p-5 max-w-sm w-full shadow-[4px_4px_0px_0px_#1a1c1c]">
        <p className="text-center text-2xl mb-1">🎨</p>
        <h2 className="font-display text-lg uppercase mb-1 text-center">Welcome to MangaWithAI</h2>
        <p className="text-center text-xs text-secondary mb-4">Create manga stories with AI in 3 simple steps</p>
        <div className="space-y-3">
          <div className="flex items-start gap-3 border-b border-on-surface/10 pb-3">
            <span className="font-display text-primary text-xl leading-none">1</span>
            <div>
              <p className="text-sm font-bold text-on-surface">Write your idea</p>
              <p className="text-[11px] text-secondary">Describe your story, pick an art style</p>
            </div>
          </div>
          <div className="flex items-start gap-3 border-b border-on-surface/10 pb-3">
            <span className="font-display text-primary text-xl leading-none">2</span>
            <div>
              <p className="text-sm font-bold text-on-surface">AI creates your manga</p>
              <p className="text-[11px] text-secondary">Full manga pages generated in ~30 seconds</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-display text-primary text-xl leading-none">3</span>
            <div>
              <p className="text-sm font-bold text-on-surface">Share & collect</p>
              <p className="text-[11px] text-secondary">Publish to the community or save as a collectible</p>
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] text-secondary mt-4 mb-2">Your first creation is free ✨</p>
        <button
          onClick={dismiss}
          className="w-full font-label text-xs font-bold uppercase px-4 py-2.5 border-2 border-on-surface bg-primary text-white comic-shadow-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          Let's go!
        </button>
      </div>
    </div>
  );
}

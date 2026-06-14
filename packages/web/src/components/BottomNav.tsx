"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Library", icon: "auto_stories" },
  { href: "/create", label: "Create", icon: "add_box" },
  { href: "/marketplace", label: "Market", icon: "storefront" },
  { href: "/leaderboard", label: "Ranks", icon: "emoji_events" },
  { href: "/explore", label: "Explore", icon: "explore" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-3 py-2 bg-surface border-t-4 border-on-surface">
      {tabs.map((t) => {
        const isActive = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-col items-center justify-center p-1 ${isActive ? "bg-primary text-white border-2 border-on-surface comic-shadow-sm" : "text-on-surface/60"}`}
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {t.icon}
            </span>
            <span className="font-label text-[11px] font-bold">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

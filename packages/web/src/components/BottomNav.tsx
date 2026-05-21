'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/create', label: 'Create', icon: '✨' },
  { href: '/library', label: 'Library', icon: '📚' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around py-2 z-50">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className={`flex flex-col items-center text-xs ${pathname === t.href ? 'text-purple-400' : 'text-gray-400'}`}>
          <span className="text-xl">{t.icon}</span>
          <span>{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}

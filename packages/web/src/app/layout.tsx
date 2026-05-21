import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { WalletGate } from '@/components/WalletGate';
import { BottomNav } from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'MangaWithAI',
  description: 'Create manga stories with AI on MiniPay',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white min-h-screen pb-16">
        <Providers>
          <WalletGate>
            {children}
            <BottomNav />
          </WalletGate>
        </Providers>
      </body>
    </html>
  );
}

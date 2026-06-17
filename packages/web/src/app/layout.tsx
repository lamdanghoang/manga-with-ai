import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "MangaWithAI",
  description: "Create manga stories with AI on MiniPay",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="talentapp:project_verification"
          content="11f409463b41a7c025f3a68ec3945ae722be80bb6ba03512d889e5c473d89596fe1fdf1a128bb20c93a149176a66cd41e2682fe93ee49b8a2f6d44a77fd97c65"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="bg-surface text-on-surface min-h-screen font-body pb-20">
        <div className="fixed inset-0 halftone-bg pointer-events-none opacity-40 z-0"></div>
        <Providers>
          <div className="relative z-10">
            <Header />
            {children}
          </div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}

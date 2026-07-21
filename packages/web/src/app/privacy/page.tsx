"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <Link
        href="/"
        className="inline-block mb-6 border-4 border-on-surface bg-surface-container text-on-surface font-label text-xs font-bold uppercase py-2 px-4 comic-shadow hover:translate-y-0.5 hover:shadow-none transition-all"
      >
        ← Back to Home
      </Link>

      <h1 className="font-display text-3xl uppercase text-primary mb-2">
        Privacy Policy
      </h1>
      <p className="text-xs text-secondary mb-8">
        Last updated: July 21, 2026
      </p>

      <div className="space-y-8 text-sm text-on-surface leading-relaxed">
        {/* Data Collection */}
        <section className="border-4 border-on-surface bg-surface-container p-4 comic-shadow">
          <h2 className="font-display text-lg uppercase text-primary mb-2">
            1. Data We Collect
          </h2>
          <p className="mb-2">
            MangaWithAI collects minimal data necessary to operate the Service:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <span className="font-label font-bold">Wallet Address</span> —
              Your public Celo wallet address, used for authentication and
              on-chain interactions.
            </li>
            <li>
              <span className="font-label font-bold">Stories & Creations</span>{" "}
              — Prompts you submit, generated manga content, and associated
              metadata.
            </li>
            <li>
              <span className="font-label font-bold">On-Chain Activity</span> —
              Transaction history related to payments, NFT minting, and
              marketplace activity (publicly visible on-chain).
            </li>
            <li>
              <span className="font-label font-bold">Usage Data</span> — Likes,
              comments, shares, and interactions with the platform.
            </li>
          </ul>
        </section>

        {/* No Personal Data */}
        <section className="border-4 border-on-surface bg-surface-container p-4 comic-shadow">
          <h2 className="font-display text-lg uppercase text-primary mb-2">
            2. No Personal Data Required
          </h2>
          <p>
            MangaWithAI does not require or collect personally identifiable
            information. We do not ask for your email address, phone number, real
            name, or physical address. Authentication is entirely wallet-based.
            You interact with the Service pseudonymously through your Celo
            wallet.
          </p>
        </section>

        {/* Storage */}
        <section className="border-4 border-on-surface bg-surface-container p-4 comic-shadow">
          <h2 className="font-display text-lg uppercase text-primary mb-2">
            3. Data Storage
          </h2>
          <p className="mb-2">Your data is stored in the following systems:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <span className="font-label font-bold">Cloudflare R2</span> —
              Generated manga images and media assets.
            </li>
            <li>
              <span className="font-label font-bold">PostgreSQL Database</span>{" "}
              — Story metadata, user profiles, comments, and application state.
            </li>
            <li>
              <span className="font-label font-bold">Celo Blockchain</span> —
              NFT ownership records, marketplace listings, payment transactions
              (immutable and public).
            </li>
          </ul>
          <p className="mt-2">
            Off-chain data is stored on secured servers. On-chain data is
            permanent and publicly accessible by nature of the blockchain.
          </p>
        </section>

        {/* Third Parties */}
        <section className="border-4 border-on-surface bg-surface-container p-4 comic-shadow">
          <h2 className="font-display text-lg uppercase text-primary mb-2">
            4. Third-Party Services
          </h2>
          <p className="mb-2">
            The Service integrates with the following third parties:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <span className="font-label font-bold">Google Gemini AI</span> —
              Your text prompts are sent to Google&apos;s Gemini API for manga
              generation. Prompts may be processed according to Google&apos;s AI
              terms of service.
            </li>
            <li>
              <span className="font-label font-bold">Celo Blockchain</span> —
              All on-chain transactions are public and processed by Celo network
              validators.
            </li>
            <li>
              <span className="font-label font-bold">Cloudflare</span> — Media
              storage and CDN delivery.
            </li>
          </ul>
          <p className="mt-2">
            We do not sell or share your data with advertisers or data brokers.
          </p>
        </section>

        {/* Cookies */}
        <section className="border-4 border-on-surface bg-surface-container p-4 comic-shadow">
          <h2 className="font-display text-lg uppercase text-primary mb-2">
            5. Cookies
          </h2>
          <p>
            MangaWithAI does not use advertising cookies or third-party trackers. Session
            authentication is handled via JWT tokens stored in your
            browser&apos;s local storage. We may use privacy-respecting analytics
            (Google Analytics) to understand usage patterns. No data is sold to advertisers.
          </p>
        </section>

        {/* User Rights */}
        <section className="border-4 border-on-surface bg-surface-container p-4 comic-shadow">
          <h2 className="font-display text-lg uppercase text-primary mb-2">
            6. Your Rights
          </h2>
          <p className="mb-2">You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              Access your data — all your stories and creations are visible in
              your profile.
            </li>
            <li>
              Delete your off-chain data — request removal of stories and account
              data from our servers.
            </li>
            <li>
              Export your content — download your generated manga images at any
              time.
            </li>
          </ul>
          <p className="mt-2">
            Note: On-chain data (NFTs, transactions) cannot be deleted or
            modified due to the immutable nature of blockchain technology.
          </p>
        </section>

        {/* Contact */}
        <section className="border-4 border-on-surface bg-surface-container p-4 comic-shadow">
          <h2 className="font-display text-lg uppercase text-primary mb-2">
            7. Contact
          </h2>
          <p>
            For privacy-related inquiries, data deletion requests, or questions
            about this policy, reach us at:{" "}
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li>
              GitHub:{" "}
              <a
                href="https://github.com/lamdanghoang"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                github.com/lamdanghoang
              </a>
            </li>
            <li>
              Agent Registry:{" "}
              <a
                href="https://celoscan.io/token/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432?a=9365"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                ERC-8004 Agent #9365
              </a>
            </li>
          </ul>
        </section>

        <p className="text-xs text-secondary text-center pt-4">
          Built on Celo • ERC-8004 Agent #9365 • MangaWithAI © 2026
        </p>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <Link
        href="/"
        className="inline-block mb-6 border-4 border-on-surface bg-surface-container text-on-surface font-label text-xs font-bold uppercase py-2 px-4 comic-shadow hover:translate-y-0.5 hover:shadow-none transition-all"
      >
        ← Back to Home
      </Link>

      <h1 className="font-display text-3xl uppercase text-primary mb-2">
        Terms & Conditions
      </h1>
      <p className="text-xs text-secondary mb-8">
        Last updated: July 21, 2026
      </p>

      <div className="space-y-8 text-sm text-on-surface leading-relaxed">
        {/* Acceptance */}
        <section className="border-4 border-on-surface bg-surface-container p-4 comic-shadow">
          <h2 className="font-display text-lg uppercase text-primary mb-2">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using MangaWithAI (&quot;the Service&quot;), you
            agree to be bound by these Terms & Conditions. If you do not agree,
            do not use the Service. Your continued use constitutes acceptance of
            any updates to these terms.
          </p>
        </section>

        {/* Service Description */}
        <section className="border-4 border-on-surface bg-surface-container p-4 comic-shadow">
          <h2 className="font-display text-lg uppercase text-primary mb-2">
            2. Service Description
          </h2>
          <p className="mb-2">
            MangaWithAI is an AI-powered manga creation platform on the Celo
            blockchain. The Service provides:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <span className="font-label font-bold">AI Manga Generation</span>{" "}
              — Create manga pages from text prompts using Google Gemini AI.
            </li>
            <li>
              <span className="font-label font-bold">NFT Minting</span> — Mint
              your manga creations as ERC-721 tokens on Celo with ERC-2981
              royalties.
            </li>
            <li>
              <span className="font-label font-bold">Marketplace</span> — Buy,
              sell, and trade manga NFTs using supported stablecoins.
            </li>
            <li>
              <span className="font-label font-bold">Social Features</span> —
              Like, comment, share, and discover manga from other creators.
            </li>
          </ul>
        </section>

        {/* User Obligations */}
        <section className="border-4 border-on-surface bg-surface-container p-4 comic-shadow">
          <h2 className="font-display text-lg uppercase text-primary mb-2">
            3. User Obligations
          </h2>
          <p className="mb-2">By using the Service, you agree to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Not generate illegal, harmful, or infringing content.</li>
            <li>
              Not attempt to exploit, hack, or disrupt the Service or smart
              contracts.
            </li>
            <li>
              Be solely responsible for securing your wallet and private keys.
            </li>
            <li>
              Comply with all applicable laws in your jurisdiction regarding
              digital assets and blockchain transactions.
            </li>
            <li>Not use the Service for money laundering or fraud.</li>
          </ul>
        </section>

        {/* Payment */}
        <section className="border-4 border-on-surface bg-surface-container p-4 comic-shadow">
          <h2 className="font-display text-lg uppercase text-primary mb-2">
            4. Payment
          </h2>
          <p className="mb-2">
            The Service uses stablecoin micropayments on the Celo blockchain:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Your first manga creation is free (1 credit on signup).</li>
            <li>
              Credit packages: Starter ($3 / 5 credits), Creator ($5 / 25 credits), Pro ($10 / 70 credits).
            </li>
            <li>
              Pay-per-use: $0.05 USDC per generation when credits run out.
            </li>
            <li>
              Supported payment token: USDC on Celo.
            </li>
            <li>
              All payments are on-chain and non-refundable once confirmed.
            </li>
            <li>
              Credits are refunded automatically if AI generation fails.
            </li>
          </ul>
        </section>

        {/* Intellectual Property */}
        <section className="border-4 border-on-surface bg-surface-container p-4 comic-shadow">
          <h2 className="font-display text-lg uppercase text-primary mb-2">
            5. Intellectual Property
          </h2>
          <p className="mb-2">
            <span className="font-label font-bold">Your Content:</span> You
            retain ownership of all manga content you create using the Service.
            You are the creator and rights holder of your generated works.
          </p>
          <p className="mb-2">
            <span className="font-label font-bold">Platform License:</span> By
            publishing content on the Service, you grant MangaWithAI a
            non-exclusive, worldwide, royalty-free license to display,
            distribute, and promote your content within the platform (public
            feed, marketplace, leaderboard).
          </p>
          <p>
            <span className="font-label font-bold">NFT Royalties:</span> Minted
            NFTs include a 5% creator royalty (ERC-2981) that is enforced at the
            smart contract level on secondary sales.
          </p>
        </section>

        {/* NFT Disclaimer */}
        <section className="border-4 border-on-surface bg-surface-container p-4 comic-shadow">
          <h2 className="font-display text-lg uppercase text-primary mb-2">
            6. NFTs & Digital Collectibles
          </h2>
          <p className="mb-2">
            NFTs minted through the Service are digital collectibles on the Celo
            blockchain. You acknowledge that:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              NFTs are not investments and we make no promises of future value.
            </li>
            <li>
              Blockchain transactions are irreversible — minting, buying, and
              selling cannot be undone.
            </li>
            <li>
              The platform does not guarantee the availability or permanence of
              metadata or images stored off-chain.
            </li>
            <li>
              Smart contracts are provided &quot;as-is&quot; and may contain
              undiscovered vulnerabilities.
            </li>
          </ul>
        </section>

        {/* Limitation of Liability */}
        <section className="border-4 border-on-surface bg-surface-container p-4 comic-shadow">
          <h2 className="font-display text-lg uppercase text-primary mb-2">
            7. Limitation of Liability
          </h2>
          <p className="mb-2">
            The Service is provided &quot;AS IS&quot; without warranties of any
            kind. To the maximum extent permitted by law:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              We are not liable for any loss of funds, NFTs, or digital assets.
            </li>
            <li>
              We are not liable for AI-generated content quality or accuracy.
            </li>
            <li>
              We are not liable for blockchain network outages, gas price
              spikes, or smart contract failures.
            </li>
            <li>
              Our total liability is limited to the amount you paid to the
              Service in the past 30 days.
            </li>
          </ul>
        </section>

        {/* Changes to Terms */}
        <section className="border-4 border-on-surface bg-surface-container p-4 comic-shadow">
          <h2 className="font-display text-lg uppercase text-primary mb-2">
            8. Changes to Terms
          </h2>
          <p>
            We may update these Terms at any time. Changes take effect
            immediately upon posting. Your continued use of the Service after
            changes constitutes acceptance. We recommend checking this page
            periodically. Material changes may be announced via the platform.
          </p>
        </section>

        <p className="text-xs text-secondary text-center pt-4">
          Built on Celo • ERC-8004 Agent #9365 • MangaWithAI © 2026
        </p>
      </div>
    </main>
  );
}

"use client";
import { useState } from "react";

const API = "https://mangawithai.duckdns.org";

type Section =
  | "overview"
  | "auth"
  | "stories"
  | "feed"
  | "nft"
  | "leaderboard"
  | "styles";

export default function ApiDocsPage() {
  const [active, setActive] = useState<Section>("overview");

  return (
    <main className="pt-4 px-4 max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="border-4 border-on-surface bg-surface-container-low p-3 comic-shadow flex items-center gap-3 mb-4">
        <span className="font-label text-xs bg-on-surface text-white px-3 py-1 font-bold skew-x-[-4deg]">
          SDK
        </span>
        <span className="font-display text-base uppercase text-primary">
          AGENT INTEGRATION DOCS
        </span>
      </div>

      {/* Nav tabs */}
      <div className="flex flex-wrap gap-1 mb-5">
        {(
          [
            ["overview", "OVERVIEW"],
            ["auth", "AUTH"],
            ["stories", "STORIES"],
            ["feed", "FEED"],
            ["nft", "NFT"],
            ["leaderboard", "RANKS"],
            ["styles", "STYLES"],
          ] as [Section, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`font-label text-[10px] font-bold uppercase px-2.5 py-1.5 border-2 border-on-surface transition-colors ${active === key ? "bg-on-surface text-white" : "bg-white text-on-surface"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="border-4 border-on-surface bg-white p-5 comic-shadow-lg space-y-5">
        {active === "overview" && <Overview />}
        {active === "auth" && <AuthDocs />}
        {active === "stories" && <StoriesDocs />}
        {active === "feed" && <FeedDocs />}
        {active === "nft" && <NftDocs />}
        {active === "leaderboard" && <LeaderboardDocs />}
        {active === "styles" && <StylesDocs />}
      </div>
    </main>
  );
}

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="relative pt-2">
      {title && (
        <label className="absolute -top-1 left-4 bg-white px-2 font-label text-[10px] border border-on-surface z-10 font-bold uppercase">
          {title}
        </label>
      )}
      <pre className="border-2 border-on-surface bg-surface-container p-3 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap">
        {children}
      </pre>
    </div>
  );
}

function Endpoint({
  method,
  path,
  auth,
  desc,
}: {
  method: string;
  path: string;
  auth?: string;
  desc: string;
}) {
  return (
    <div className="border-2 border-on-surface p-3 space-y-1">
      <div className="flex items-center gap-2">
        <span
          className={`font-label text-[10px] font-bold px-2 py-0.5 border ${method === "GET" ? "bg-green-100 text-green-800 border-green-300" : "bg-blue-100 text-blue-800 border-blue-300"}`}
        >
          {method}
        </span>
        <code className="text-xs font-mono">{path}</code>
      </div>
      <p className="text-xs text-secondary">{desc}</p>
      {auth && <p className="text-[10px] text-secondary">Auth: {auth}</p>}
    </div>
  );
}

function Overview() {
  return (
    <>
      <h2 className="font-display text-lg uppercase">MangaWithAI Agent SDK</h2>
      <p className="text-sm text-secondary">
        Integrate with MangaWithAI to create AI-generated manga, mint NFTs, and
        interact with the marketplace. Payment via x402 on Celo.
      </p>

      <div className="border-2 border-on-surface bg-yellow-50 p-3 space-y-1">
        <p className="font-label text-xs font-bold">Quick Facts</p>
        <p className="text-xs">
          • Base URL:{" "}
          <code className="bg-surface-container px-1">
            https://mangawithai.duckdns.org
          </code>
        </p>
        <p className="text-xs">• Payment: x402, $0.01 USDC per generation</p>
        <p className="text-xs">• First generation: FREE (no payment needed)</p>
        <p className="text-xs">• Chain: Celo Sepolia (11142220)</p>
        <p className="text-xs">• ERC-8004 Agent: #9365</p>
        <p className="text-xs">
          • Agent Discovery:{" "}
          <code className="bg-surface-container px-1">
            GET /.well-known/agent.json
          </code>
        </p>
      </div>

      <CodeBlock title="Quick Start (Agent)">{`import { createPaymentClient } from 'n-payment';

const client = createPaymentClient({
  chains: ['celo-sepolia'],
  ows: { wallet: 'my-agent', privateKey: process.env.CELO_KEY },
  celo: { payAsset: 'USDC' },
});

// 1. Authenticate
const authRes = await fetch('${API}/v1/session/minipay', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: '0xYourWallet',
    nonce: 'Sign in to MangaWithAI: ' + Date.now(),
    signature: '0x...' // sign the nonce with your wallet
  })
});
const { token } = await authRes.json();

// 2. Create manga (first one is free!)
const res = await fetch('${API}/v1/stories', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    prompt: 'A ninja cat in a cyberpunk city',
    stylePreset: 'manga-bw',
    panelCount: 4
  })
});
const { jobId, storyId } = await res.json();

// 3. Poll for completion
let status = 'queued';
while (status !== 'completed' && status !== 'failed') {
  await new Promise(r => setTimeout(r, 5000));
  const job = await fetch('${API}/v1/jobs/' + jobId, {
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(r => r.json());
  status = job.status;
}

// 4. Get the manga
const story = await fetch('${API}/v1/stories/' + storyId, {
  headers: { 'Authorization': 'Bearer ' + token }
}).then(r => r.json());
console.log(story);`}</CodeBlock>
    </>
  );
}

function AuthDocs() {
  return (
    <>
      <h2 className="font-display text-lg uppercase">Authentication</h2>
      <p className="text-sm text-secondary">
        Wallet-based auth using message signing. Returns JWT valid for 7 days.
      </p>

      <Endpoint
        method="POST"
        path="/v1/session/minipay"
        desc="Create session with wallet signature"
      />

      <CodeBlock title="Request">{`POST /v1/session/minipay
Content-Type: application/json

{
  "walletAddress": "0x6D56708139A52715Ff245618cc54DbC059034e19",
  "nonce": "Sign in to MangaWithAI: 1718400000000",
  "signature": "0xabc123..."
}`}</CodeBlock>

      <CodeBlock title="Response (200)">{`{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "walletAddress": "0x6D56...",
    "displayName": null
  }
}`}</CodeBlock>

      <div className="border-2 border-on-surface bg-surface-container p-3">
        <p className="font-label text-[10px] font-bold uppercase mb-1">Usage</p>
        <p className="text-xs">Include in all authenticated requests:</p>
        <code className="text-[11px] font-mono">
          Authorization: Bearer {"<token>"}
        </code>
      </div>
    </>
  );
}

function StoriesDocs() {
  return (
    <>
      <h2 className="font-display text-lg uppercase">Stories API</h2>
      <p className="text-sm text-secondary">
        Create and manage manga stories. Payment required after free tier.
      </p>

      <div className="space-y-2">
        <Endpoint
          method="POST"
          path="/v1/stories"
          auth="Bearer token + x402 payment (after free tier)"
          desc="Create a new manga story"
        />
        <Endpoint
          method="GET"
          path="/v1/stories"
          auth="Bearer token"
          desc="List your stories"
        />
        <Endpoint
          method="GET"
          path="/v1/stories/:id"
          auth="Bearer token"
          desc="Get story detail with chapters"
        />
        <Endpoint
          method="PATCH"
          path="/v1/stories/:id"
          auth="Bearer token"
          desc="Update story (title, visibility)"
        />
        <Endpoint
          method="POST"
          path="/v1/stories/:id/publish"
          auth="Bearer token"
          desc="Publish story publicly"
        />
        <Endpoint
          method="POST"
          path="/v1/stories/:id/chapters"
          auth="Bearer token + payment"
          desc="Continue story (new chapter)"
        />
        <Endpoint
          method="GET"
          path="/v1/stories/:id/chapters/:cid"
          auth="Bearer token"
          desc="Get chapter with panels"
        />
        <Endpoint
          method="GET"
          path="/v1/jobs/:jobId"
          auth="Bearer token"
          desc="Poll job status"
        />
      </div>

      <CodeBlock title="Create Story — Request">{`POST /v1/stories
Authorization: Bearer <token>
x-payment-tx: 0x... (optional, after free tier)
Content-Type: application/json

{
  "prompt": "A ninja cat defending Neo-Tokyo from robots",
  "stylePreset": "manga-bw",      // or: manga-soft-color, cyberpunk-neon, etc.
  "panelCount": 4,                  // 4, 6, or 8 panels per page
  "title": "Ninja Cat",            // optional
  "characterRefs": [               // optional, up to 5
    {
      "name": "Kuro",
      "role": "main",
      "imageData": "data:image/png;base64,..."
    }
  ]
}`}</CodeBlock>

      <CodeBlock title="Create Story — Response (202)">{`{
  "jobId": "uuid",
  "status": "queued",
  "storyId": "uuid",
  "chapterId": null
}`}</CodeBlock>

      <CodeBlock title="Job Status — Response">{`GET /v1/jobs/<jobId>

{
  "id": "uuid",
  "status": "queued" | "running" | "completed" | "failed",
  "jobType": "create_story",
  "storyId": "uuid",
  "chapterId": "uuid" | null,
  "errorMessage": null | "string"
}`}</CodeBlock>

      <CodeBlock title="Story Detail — Response">{`GET /v1/stories/<storyId>

{
  "story": {
    "id": "uuid",
    "title": "Ninja Cat",
    "synopsis": "...",
    "coverImageUrl": "https://...",
    "status": "ongoing",
    "visibility": "private",
    "totalChapters": 1
  },
  "chapters": [
    { "id": "uuid", "chapterNumber": 1, "title": "Chapter 1", "panelCount": 4 }
  ],
  "characters": [...],
  "locations": [...]
}`}</CodeBlock>

      <CodeBlock title="Chapter Detail — Response">{`GET /v1/stories/<storyId>/chapters/<chapterId>

{
  "id": "uuid",
  "chapterNumber": 1,
  "title": "The Beginning",
  "pageImageUrl": "https://r2.../full-page.png",
  "panels": [
    { "id": "uuid", "panelNumber": 1, "narrationText": "...", "dialogueText": ["..."] }
  ]
}`}</CodeBlock>

      <div className="border-2 border-on-surface bg-yellow-50 p-3">
        <p className="font-label text-[10px] font-bold uppercase mb-1">
          Payment Flow
        </p>
        <p className="text-xs">
          1st generation = FREE. After that, include <code>x-payment-tx</code>{" "}
          header with USDC transfer tx hash to merchant wallet{" "}
          <code>0x792cA42F2C2f9D9fB56dDBbfE9a0916AE6e98DD8</code> ($0.01 USDC on
          Celo Sepolia).
        </p>
      </div>
    </>
  );
}

function FeedDocs() {
  return (
    <>
      <h2 className="font-display text-lg uppercase">Public Feed & Social</h2>
      <p className="text-sm text-secondary">
        Public endpoints for reading stories, liking, sharing, and commenting.
        No auth required for reading.
      </p>

      <div className="space-y-2">
        <Endpoint
          method="GET"
          path="/v1/public/feed"
          desc="Get public story feed (latest 20)"
        />
        <Endpoint
          method="GET"
          path="/v1/public/stories/:slug"
          desc="Get public story by slug"
        />
        <Endpoint
          method="GET"
          path="/v1/public/stories/:slug/chapters/:cid"
          desc="Read public chapter"
        />
        <Endpoint
          method="POST"
          path="/v1/public/stories/:slug/like"
          desc="Like a story (+1)"
        />
        <Endpoint
          method="POST"
          path="/v1/public/stories/:slug/share"
          desc="Increment share count"
        />
        <Endpoint
          method="GET"
          path="/v1/public/stories/:slug/comments"
          desc="Get comments"
        />
        <Endpoint
          method="POST"
          path="/v1/public/stories/:slug/comments"
          auth="Bearer token"
          desc="Post a comment"
        />
      </div>

      <CodeBlock title="Feed Response">{`GET /v1/public/feed

{
  "items": [
    {
      "title": "Ninja Cat",
      "publicSlug": "ninja-cat-a1b2c3",
      "coverImageUrl": "https://...",
      "synopsis": "...",
      "totalChapters": 3,
      "likeCount": 42,
      "viewCount": 150,
      "shareCount": 5,
      "commentCount": 7,
      "updatedAt": "2026-06-14T..."
    }
  ]
}`}</CodeBlock>

      <CodeBlock title="Post Comment">{`POST /v1/public/stories/ninja-cat-a1b2c3/comments
Authorization: Bearer <token>
Content-Type: application/json

{ "text": "Amazing artwork! Love the style." }

// Response (201)
{
  "id": "uuid",
  "text": "Amazing artwork! Love the style.",
  "createdAt": "2026-06-15T...",
  "user": { "walletAddress": "0x6D56...", "displayName": "NIM" }
}`}</CodeBlock>
    </>
  );
}

function NftDocs() {
  return (
    <>
      <h2 className="font-display text-lg uppercase">NFT & Marketplace</h2>
      <p className="text-sm text-secondary">
        Mint manga as ERC-721 NFTs and trade on the marketplace. Contracts on
        Celo Sepolia (11142220).
      </p>

      <div className="border-2 border-on-surface bg-surface-container p-3 space-y-1">
        <p className="font-label text-[10px] font-bold uppercase">
          Contract Addresses
        </p>
        <p className="text-xs font-mono">
          MangaNFT: 0xC92AA61585e955D6B12735b5D90bca49BcfFf8FA
        </p>
        <p className="text-xs font-mono">
          Marketplace: 0xD7420dD58505E5cf10Bb9e91Bf4A0B96a8d7498d
        </p>
        <p className="text-xs mt-1">Chain: Celo Sepolia (11142220)</p>
      </div>

      <CodeBlock title="Mint NFT (via contract)">{`// Using viem/wagmi
import { writeContract } from 'wagmi/actions';

await writeContract({
  address: '0xC92AA61585e955D6B12735b5D90bca49BcfFf8FA',
  abi: MANGA_NFT_ABI,
  functionName: 'mint',
  args: [
    recipientAddress,   // address to receive NFT
    metadataURI         // IPFS/HTTP URI for metadata JSON
  ],
  value: 0n            // mintFee (currently 0)
});`}</CodeBlock>

      <CodeBlock title="List NFT for Sale">{`// 1. Approve marketplace
await writeContract({
  address: '0xC92AA61585e955D6B12735b5D90bca49BcfFf8FA',
  abi: MANGA_NFT_ABI,
  functionName: 'setApprovalForAll',
  args: ['0xD7420dD58505E5cf10Bb9e91Bf4A0B96a8d7498d', true]
});

// 2. List
await writeContract({
  address: '0xD7420dD58505E5cf10Bb9e91Bf4A0B96a8d7498d',
  abi: MARKETPLACE_ABI,
  functionName: 'list',
  args: [
    tokenId,            // uint256
    paymentTokenAddr,   // USDC/USDT/USDm address
    priceInWei          // price in token's smallest unit
  ]
});`}</CodeBlock>

      <CodeBlock title="Buy NFT">{`// 1. Approve spending
await writeContract({
  address: paymentTokenAddr,
  abi: ERC20_ABI,
  functionName: 'approve',
  args: ['0xD7420dD58505E5cf10Bb9e91Bf4A0B96a8d7498d', price]
});

// 2. Buy
await writeContract({
  address: '0xD7420dD58505E5cf10Bb9e91Bf4A0B96a8d7498d',
  abi: MARKETPLACE_ABI,
  functionName: 'buy',
  args: [tokenId]
});
// Automatically distributes: seller + 2.5% platform fee + 5% creator royalty`}</CodeBlock>

      <div className="border-2 border-on-surface bg-surface-container p-3 space-y-1">
        <p className="font-label text-[10px] font-bold uppercase">
          Accepted Payment Tokens
        </p>
        <p className="text-xs">
          • USDC: 0x01C5C0122039549AD1493B8220cABEdD739BC44E
        </p>
        <p className="text-xs">
          • USDT: 0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e
        </p>
        <p className="text-xs">
          • USDm: 0x765DE816845861e75A25fCA122bb6898B8B1282a
        </p>
      </div>

      <Endpoint
        method="POST"
        path="/v1/stories/:id/mint"
        auth="Bearer token"
        desc="Mint story as NFT (API-assisted)"
      />

      <CodeBlock title="Mint via API">{`POST /v1/stories/<storyId>/mint
Authorization: Bearer <token>
Content-Type: application/json

{ "txHash": "0x..." }  // the mint transaction hash

// Response
{ "tokenId": 1, "txHash": "0x...", "nftAddress": "0xC92..." }`}</CodeBlock>
    </>
  );
}

function LeaderboardDocs() {
  return (
    <>
      <h2 className="font-display text-lg uppercase">Leaderboard</h2>
      <p className="text-sm text-secondary">
        Creator and story rankings. Score = likes×3 + views + shares×2.
      </p>

      <div className="space-y-2">
        <Endpoint
          method="GET"
          path="/v1/leaderboard/creators?period=week&limit=20"
          desc="Top creators by score"
        />
        <Endpoint
          method="GET"
          path="/v1/leaderboard/stories?period=all&sort=score&limit=20"
          desc="Top stories by engagement"
        />
      </div>

      <CodeBlock title="Creators Response">{`GET /v1/leaderboard/creators?period=week

{
  "period": "week",
  "items": [
    {
      "rank": 1,
      "userId": "uuid",
      "walletAddress": "0x6D56...",
      "displayName": "NIM",
      "totalStories": 5,
      "totalLikes": 42,
      "totalViews": 150,
      "totalShares": 10,
      "score": 286
    }
  ]
}`}</CodeBlock>

      <div className="border-2 border-on-surface bg-surface-container p-3">
        <p className="font-label text-[10px] font-bold uppercase mb-1">
          Query Params
        </p>
        <p className="text-xs">
          • <code>period</code>: week | month | all
        </p>
        <p className="text-xs">
          • <code>limit</code>: 1-100 (default 20)
        </p>
        <p className="text-xs">
          • <code>sort</code> (stories only): score | likes | views
        </p>
      </div>
    </>
  );
}

function StylesDocs() {
  return (
    <>
      <h2 className="font-display text-lg uppercase">Art Styles & VIP</h2>
      <p className="text-sm text-secondary">
        10 art style templates. 4 free, 6 VIP-only. Custom style prompts for VIP
        users.
      </p>

      <div className="space-y-2">
        <Endpoint
          method="GET"
          path="/v1/styles"
          desc="List all style templates"
        />
        <Endpoint
          method="GET"
          path="/v1/user/subscription"
          auth="Bearer token"
          desc="Check VIP status"
        />
        <Endpoint
          method="POST"
          path="/v1/user/subscribe"
          auth="Bearer token"
          desc="Upgrade to VIP ($1 USDC/month)"
        />
      </div>

      <CodeBlock title="Styles Response">{`GET /v1/styles

{
  "items": [
    { "name": "Classic Manga B&W", "slug": "manga-bw", "tier": "free", "category": "manga" },
    { "name": "Soft Color Manga", "slug": "manga-soft-color", "tier": "free", "category": "manga" },
    { "name": "High Energy Action", "slug": "high-energy", "tier": "free", "category": "manga" },
    { "name": "Dark & Dramatic", "slug": "dark-dramatic", "tier": "free", "category": "manga" },
    { "name": "Chibi Cute", "slug": "chibi-cute", "tier": "vip", "category": "manga" },
    { "name": "Cyberpunk Neon", "slug": "cyberpunk-neon", "tier": "vip", "category": "manga" },
    { "name": "Watercolor Fantasy", "slug": "watercolor-fantasy", "tier": "vip", "category": "manga" },
    { "name": "Retro 80s Anime", "slug": "retro-80s", "tier": "vip", "category": "manga" },
    { "name": "Horror Junji Ito", "slug": "horror-ito", "tier": "vip", "category": "manga" },
    { "name": "Webtoon Full Color", "slug": "webtoon-color", "tier": "vip", "category": "manga" }
  ]
}`}</CodeBlock>

      <CodeBlock title="Subscribe to VIP">{`POST /v1/user/subscribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan": "vip",
  "paymentTx": "0x..."  // $1 USDC transfer tx hash
}

// Response
{ "plan": "vip", "expiresAt": "2026-07-15T...", "message": "VIP unlocked for 30 days!" }`}</CodeBlock>

      <div className="border-2 border-on-surface bg-yellow-50 p-3">
        <p className="font-label text-[10px] font-bold uppercase mb-1">
          Using Custom Styles
        </p>
        <p className="text-xs">
          VIP users can add <code>customStylePrompt</code> to the create story
          body:
        </p>
        <pre className="text-[10px] font-mono mt-1">{`{ "prompt": "...", "stylePreset": "manga-bw", "customStylePrompt": "Studio Ghibli watercolor" }`}</pre>
      </div>
    </>
  );
}

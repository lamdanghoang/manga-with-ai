# MangaWithAI

AI-powered manga creation Mini App for MiniPay on Celo. Create manga stories from prompts, continue with character consistency, and share publicly.

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS 4, Wagmi/Viem (Celo)
- **Backend**: Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **AI**: Google Gemini API (`gemini-2.5-pro` for text, `gemini-3-pro-image-preview` for images)
- **Monorepo**: npm workspaces

## Quick Start

### 1. Prerequisites
- Node.js 20+
- Docker (for PostgreSQL)
- Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

### 2. Setup

```bash
# Clone and install
git clone <repo-url> manga-with-ai
cd manga-with-ai
npm install

# Start database
docker compose up -d

# Configure environment
cp .env.example packages/api/.env
# Edit packages/api/.env with your GEMINI_API_KEY and JWT_SECRET

# Run migrations
cd packages/api
npx prisma migrate dev --name init
npx prisma db seed
cd ../..

# Start dev servers
npm run dev
```

### 3. Access
- Frontend: http://localhost:3000
- API: http://localhost:4000
- Prisma Studio: `cd packages/api && npx prisma studio`

## Project Structure

```
packages/
├── api/          # Express backend
│   ├── prisma/   # Schema & migrations
│   └── src/
│       ├── lib/gemini/   # Gemini API wrapper
│       ├── routes/       # REST endpoints
│       └── workers/      # Job processing
├── shared/       # Shared TypeScript types
└── web/          # Next.js frontend
    └── src/
        ├── app/          # Pages (App Router)
        ├── components/   # React components
        └── lib/          # Utilities
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /v1/session/minipay | No | Wallet login |
| POST | /v1/stories | Yes | Create story |
| GET | /v1/stories | Yes | List my stories |
| GET | /v1/stories/:id | Yes | Story detail |
| PATCH | /v1/stories/:id | Yes | Update story |
| POST | /v1/stories/:id/publish | Yes | Publish story |
| POST | /v1/stories/:id/chapters | Yes | Continue story |
| GET | /v1/stories/:id/chapters/:cid | Yes | Chapter detail |
| GET | /v1/jobs/:id | Yes | Job status |
| POST | /v1/chapters/:id/regenerate | Yes | Regenerate chapter |
| POST | /v1/panels/:id/regenerate | Yes | Regenerate panel |
| GET | /v1/public/feed | No | Public feed |
| GET | /v1/public/stories/:slug | No | Public story |
| GET | /v1/public/stories/:slug/chapters/:cid | No | Public chapter |

## AI Pipeline

1. **Story Bible Extraction** — `gemini-2.5-pro` extracts characters, locations, world rules from user prompt
2. **Scene Planning** — `gemini-2.5-pro` creates panel-by-panel visual descriptions
3. **Image Generation** — `gemini-3-pro-image-preview` (Nano Banana Pro) generates manga panels with character reference images for consistency
4. **Canon Continuation** — Previous story bible + chapter summaries fed to maintain consistency

## MiniPay Integration

- Auto-detects MiniPay injected provider
- Wallet-based authentication (sign nonce → JWT)
- Designed for Celo/Celo Alfajores chains
- Mobile-first UI (375px+)

# Eva — AI Design Assistant

AI-powered design assistant for your space and style preferences. Chat to capture preferences, get recommendations, and export design briefs.

## Prerequisites

- **Node.js** 20+
- **npm** or pnpm

## Quick start

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd chatbot_v3
   npm install
   ```

2. **Environment**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local`: set `OPENAI_API_KEY` (required for chat and extraction) and `DATABASE_URL`. For production, set `NEXTAUTH_SECRET` and `NEXTAUTH_URL`. Optional: Google OAuth, Sentry (see comments in `.env.example`).

3. **Database**
   ```bash
   npm run db:generate
   npm run db:push
   ```
   Or run the full setup: `npm run setup`

4. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script        | Description                    |
|---------------|--------------------------------|
| `npm run dev` | Start dev server               |
| `npm run build` | Production build             |
| `npm run start` | Start production server      |
| `npm run db:generate` | Generate Prisma client   |
| `npm run db:push` | Push schema to DB (no migrations) |
| `npm run db:studio` | Open Prisma Studio        |
| `npm run db:seed` | Run seed script            |
| `npm run setup` | install + db:generate + db:push |

## Project structure

- `src/app/` — Next.js App Router (layout, pages, API routes)
- `src/components/layout/` — Navbar, sidebars, dashboard layout
- `src/components/views/` — Chat, history, files, discover, playbook, etc.
- `src/lib/api/` — API client, error helpers, request helpers
- `src/lib/auth/` — NextAuth config and conversation access helpers
- `src/lib/domain/` — Domain config and field definitions
- `src/lib/core/` — DB, env, logger, rate-limit, constants, utils, OpenAI, context-builder, guardrails, cost-tracker
- `src/lib/contexts/`, `src/lib/extraction/` — React contexts and extraction logic
- `prisma/` — Schema and seed
- Upload files are served by id at `/api/uploads/[id]` without auth; protect ids if needed.

## Tech stack

- **Next.js 16** (App Router), **React 19**
- **Prisma** (SQLite by default)
- **NextAuth** (optional auth)
- **OpenAI** (chat + extraction)
- **Tailwind CSS**, **Radix UI**, **Lucide icons**

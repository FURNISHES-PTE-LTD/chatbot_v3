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

- `app/` — Next.js App Router (layout, pages, API routes)
- `components/` — React UI (chat, sidebars, views)
- `lib/` — Contexts, API client, extraction logic, auth, DB
- `prisma/` — Schema and seed
- `config/` — Domain config (fields, prompts)

## Tech stack

- **Next.js 16** (App Router), **React 19**
- **Prisma** (SQLite by default)
- **NextAuth** (optional auth)
- **OpenAI** (chat + extraction)
- **Tailwind CSS**, **Radix UI**, **Lucide icons**

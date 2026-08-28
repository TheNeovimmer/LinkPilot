# LinkPilot

**Your private AI career copilot.** Track jobs, manage recruiter conversations, prep for interviews, and let AI draft your replies — all from one place.

> Migrated from a separate Express + React (Vite) stack to a unified **Next.js 16** app with App Router, server components, and co-located API routes.

---

## Features

| Area | What it does |
|---|---|
| **Dashboard** | At-a-glance pipeline: upcoming interviews, active conversations, application stats |
| **Conversations** | Threaded recruiter/candidate messages with AI-drafted replies and rewrite assistance |
| **Jobs** | Track openings with status pipeline (Watchlist → Applied → Interviewing → Offer). AI analyzes each job: fit score, strengths, gaps, likely questions |
| **Companies** | Company profiles linked to jobs, recruiters, and conversations |
| **Recruiters** | Recruiter CRM with status tracking (New → Contacted → Responded → …) and last-contact dates |
| **Interviews** | Schedule and manage interviews. AI generates prep material: topics, likely questions, tips |
| **Applications** | Application status tracking with cover letters and notes |
| **Notes** | Pinnable, tagged notes for interview talking points, research, etc. |
| **Reminders** | Due-date reminders with notification support |
| **Activity** | Audit log of user and AI actions |
| **Settings** | Profile, AI tone preferences, career goals |
| **Auth** | Email/password sign-up & sign-in via Better Auth (30-day sessions) |

### AI capabilities

Powered by any **OpenAI-compatible** API (OpenAI, OpenCode Zen, local models, etc.):

- **Draft reply** — generates a context-aware response in a conversation thread
- **Rewrite** — rewrites a message for tone, clarity, or length
- **Job analysis** — produces a 0–100 fit score plus structured strengths / gaps / questions
- **Interview prep** — generates topics, likely questions, and tips based on the job and interviewer
- **Conversation summary** — condenses a long thread into key points

AI features are optional — the app works fully without an AI key configured.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Radix UI, Tailwind CSS 4, Framer Motion, Lucide icons |
| State | TanStack React Query, Zustand |
| Forms | React Hook Form + Zod validation |
| Auth | Better Auth (Prisma adapter, email/password) |
| Database | PostgreSQL + pgvector (via Prisma) |
| AI | OpenAI-compatible REST API (streaming SSE, JSON mode, embeddings) |
| Tooling | TypeScript 5, ESLint 9, tsx |

---

## Getting started

### Prerequisites

- **Node.js** ≥ 20
- **PostgreSQL** database (local or hosted — e.g. Neon)
- An **OpenAI-compatible** API key (optional — for AI features)

### 1. Clone and install

```bash
git clone https://github.com/TheNeovimmer/LinkPilot.git
cd LinkPilot
npm install
```

### 2. Environment variables

Create a `.env.local` at the project root:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/linkpilot?schema=public"

# Better Auth
BETTER_AUTH_SECRET="a-long-random-string"
BETTER_AUTH_URL="http://localhost:3000"

# AI (optional)
AI_API_KEY="sk-..."
AI_BASE_URL="https://api.openai.com/v1"
AI_MODEL="gpt-4o"
AI_TIMEOUT_MS=60000
# AI_EMBEDDING_MODEL="text-embedding-3-small"   # enables semantic search
```

### 3. Database setup

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Seed demo data (optional)

```bash
npm run db:seed
```

This creates a demo account with realistic sample data:

| | |
|---|---|
| Email | `demo@linkpilot.app` |
| Password | `linkpilot-demo-1234` |

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type checking |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run db:deploy` | Deploy migrations (production) |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |

---

## Project structure

```
├── app/                          # Next.js App Router
│   ├── (app)/                    # Authenticated pages (route group)
│   │   ├── dashboard/
│   │   ├── conversations/
│   │   ├── jobs/
│   │   ├── companies/
│   │   ├── recruiters/
│   │   ├── interviews/
│   │   ├── applications/
│   │   ├── notes/
│   │   ├── reminders/
│   │   ├── activity/
│   │   └── settings/
│   ├── api/                      # API routes
│   │   ├── auth/[...all]/        # Better Auth handler
│   │   ├── health/               # Health check
│   │   └── v1/[...path]/         # REST API catch-all
│   ├── login/
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing / redirect
├── src/
│   ├── components/               # React components
│   │   ├── ui/                   # Primitives (Button, Card, Dialog, …)
│   │   ├── layout/               # Sidebar, Topbar, CommandPalette
│   │   ├── ai/                   # AI composer
│   │   ├── jobs/                 # Job forms, import, analyze
│   │   ├── conversations/        # Thread, list, form
│   │   ├── interviews/           # Interview form, prep
│   │   └── …
│   ├── modules/                  # Domain modules (service + repository + types)
│   │   ├── ai/
│   │   ├── auth/
│   │   ├── jobs/
│   │   ├── conversations/
│   │   ├── interviews/
│   │   ├── recruiters/
│   │   ├── companies/
│   │   ├── applications/
│   │   ├── notes/
│   │   ├── reminders/
│   │   ├── notifications/
│   │   ├── dashboard/
│   │   ├── users/
│   │   └── audit/
│   ├── prompts/                  # AI prompt builders
│   ├── lib/                      # Shared utilities (API client, formatters, SSE)
│   ├── stores/                   # Zustand stores (session, UI)
│   ├── config/                   # Env validation
│   ├── database/                 # Prisma client singleton
│   ├── server/                   # Server utilities (HTTP, realtime, workers)
│   ├── types/                    # Shared types
│   ├── utils/                    # Helpers (errors, logging, pagination, …)
│   └── views/                    # Page-level view components
├── prisma/
│   ├── schema.prisma             # Database schema (PostgreSQL + pgvector)
│   ├── seed.ts                   # Idempotent demo seed
│   └── migrations/
├── public/                       # Static assets
├── logs/                         # Server logs (gitignored)
└── package.json
```

---

## Architecture notes

- **Modular domain design** — each domain (jobs, conversations, interviews, etc.) owns its repository, service, types, and Zod schemas under `src/modules/`.
- **API routes** — Next.js Route Handlers in `app/api/v1/` proxy to the modular services. Auth is handled by Better Auth mounted at `/api/auth`.
- **AI as a sidecar** — the AI client is OpenAI-compatible and optional. All AI features degrade gracefully when no key is configured.
- **pgvector** — the `Job` model supports vector embeddings for future semantic search.
- **No Redis** — after migration, all server state lives in PostgreSQL (sessions, rate limiting via Better Auth).

---

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Set environment variables in the Vercel dashboard
4. Add a PostgreSQL database (e.g. Neon) and set `DATABASE_URL`
5. Deploy — Vercel runs `prisma generate` automatically via `postinstall`

### Self-hosted

```bash
npm run build
npm run db:deploy    # run migrations against production DB
npm run start
```

---

## License

Private — not open for redistribution.

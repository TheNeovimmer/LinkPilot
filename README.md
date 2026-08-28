# LinkPilot

**Your private AI career copilot.** Track jobs, manage recruiter conversations, prep for interviews, negotiate offers, and let AI draft your replies — all from one place.

> A self-hosted, single-user workspace. Installable as a **PWA**, protected with **2FA**, with a dashboard that tells you *how your search is going* rather than just what's in it.

> Migrated from a separate Express + React (Vite) stack to a unified **Next.js 16** app with App Router, server components, and co-located API routes.

---

## Features

| Area | What it does |
|---|---|
| **Dashboard** | Command center: application funnel (submitted → interviewing → offer → accepted), response-rate & avg-days-to-reply analytics, 30-day application trends, open-offer tracker, upcoming interviews, and due-reminder strip |
| **Conversations** | Threaded recruiter/candidate messages with AI-drafted replies and rewrite assistance |
| **Jobs** | Track openings with status pipeline (Watchlist → Applied → Interviewing → Offer). AI analyzes each job: fit score, strengths, gaps, likely questions |
| **Companies** | Company profiles linked to jobs, recruiters, and conversations |
| **Recruiters** | Recruiter CRM with status tracking (New → Contacted → Responded → …) and last-contact dates |
| **Interviews** | Schedule and manage interviews. AI generates prep material (topics, likely questions, tips) and one-click **calendar export (.ics)** with a built-in reminder |
| **Applications** | Full application lifecycle: source tracking, auto-recorded first-response time, „days waiting“ follow-up badges, **offer & compensation tracking** (amount, currency, frequency, negotiation status), and **file attachments** (resume, cover letter, contract) |
| **Notes** | Pinnable, tagged notes with optional file attachments |
| **Reminders** | Due-date reminders with notification support and 24h snooze |
| **Activity** | Audit log of user and AI actions |
| **Settings** | Profile, AI tone & career goals, **per-user AI provider config**, and password management |
| **Export** | One-click **CSV export** for applications, jobs, reminders, and notes + a full **JSON account export** |
| **Auth & Security** | Email/password via Better Auth (30-day sessions) plus **TOTP two-factor authentication** from Settings |
| **PWA** | Installable to home screen with offline fallback, themed app icons, and a service worker |

### AI capabilities

Powered by any **OpenAI-compatible** API (OpenAI, OpenCode Zen, local models, etc.):

- **Draft reply** — generates a context-aware response in a conversation thread
- **Rewrite** — rewrites a message for tone, clarity, or length
- **Job analysis** — produces a 0–100 fit score plus structured strengths / gaps / questions
- **Interview prep** — generates topics, likely questions, and tips based on the job and interviewer
- **Conversation summary** — condenses a long thread into key points

Your **OpenAI-compatible** endpoint, model, embedding model, and API key can be configured either via environment variables or per-user from **Settings → AI provider** (the key is stored server-side only and never returned to the browser unmasked). AI features are optional — the app works fully without a key configured.

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
| File storage | Local disk (`UPLOAD_DIR`) for avatars & attachments |
| PWA | Web app manifest, service worker (`public/sw.js`), offline fallback |
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

# AI (optional — can also be set per-user from Settings → AI provider)
AI_API_KEY="sk-..."
AI_BASE_URL="https://api.openai.com/v1"
AI_MODEL="gpt-4o"
AI_TIMEOUT_MS=60000
# AI_EMBEDDING_MODEL="text-embedding-3-small"   # enables semantic search

# File storage (uploads for avatars & attachments) — must persist for self-hosting
UPLOAD_DIR="/data/linkpilot/uploads"
```

### 4. Run the migrations

```bash
npx prisma generate
npx prisma migrate deploy   # use `migrate dev` in local development
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Production deployments**: the PWA service worker only activates in production builds (`npm run build && npm run start`), and the `UPLOAD_DIR` must point at a persistent volume so avatars and attachments survive restarts.

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
| `npm run db:seed` | Seed dev-only sample data — **do not run in production** |
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
│   ├── offline/                 # Offline fallback page (PWA)
│   ├── manifest.ts              # Web app manifest (served at /manifest.webmanifest)
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing / redirect
├── src/
│   ├── components/               # React components
│   │   ├── ui/                   # Primitives (Button, Card, Dialog, …)
│   │   ├── layout/               # Sidebar, Topbar, CommandPalette
│   │   ├── ai/                   # AI composer
│   │   ├── attachments/          # File-upload manager (resume, cover letter, …)
│   │   ├── dashboard/            # Command-center analytics
│   │   ├── settings/             # AI provider, 2FA, preferences
│   │   ├── jobs/                 # Job forms, import, analyze
│   │   ├── conversations/        # Thread, list, form
│   │   ├── interviews/           # Interview form, prep
│   │   └── …
│   ├── modules/                  # Domain modules (service + repository + types)
│   │   ├── ai/
│   │   ├── auth/
│   │   ├── attachments/
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

- **Modular domain design** — each domain (jobs, conversations, interviews, applications, etc.) owns its repository, service, types, and Zod schemas under `src/modules/`.
- **API routes** — Next.js Route Handlers in `app/api/v1/` proxy to the modular services. Auth (including 2FA) is handled by Better Auth mounted at `/api/auth`.
- **AI as a sidecar** — the AI client is OpenAI-compatible and optional. Endpoint/model/key resolve **per-user** from `Profile.preferences.ai` (configured in Settings), falling back to environment variables. Keys are stored server-side only and masked in the UI.
- **Response analytics** — `Application.firstResponseAt` is auto-set the first time an application reaches INTERVIEWING/OFFER/REJECTED, giving real response-rate and time-to-reply metrics on the dashboard.
- **Offer tracking** — applications in the OFFER state capture compensation (amount, currency, frequency) and negotiation status; open offers surface on the dashboard command center.
- **Attachments** — files are uploaded to `UPLOAD_DIR` and registered in the `Attachment` model, scoped to a user's application or note. The DB is the source of truth; orphaned files are rolled back on failed writes and cleaned on delete.
- **PWA** — a web manifest + conservative service worker (`public/sw.js`) provide offline fallback (`/offline`) and installability. The SW never intercepts `/api` or `/uploads`.
- **2FA** — TOTP two-factor via the Better Auth `twoFactor` plugin (secret + recovery back-up codes). Enforced at sign-in and toggleable from Settings.
- **pgvector** — the `Job` model supports vector embeddings for semantic search.
- **No Redis** — all server state lives in PostgreSQL (sessions, rate limiting via Better Auth).

---

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Set the environment variables in the Vercel dashboard (see above)
4. Add a PostgreSQL database (e.g. Neon) and set `DATABASE_URL`
5. Run `npm run db:deploy` against the production database (or in a build step) so the Prisma migrations apply
6. Deploy — Vercel runs `prisma generate` automatically via `postinstall`

> Notes for Vercel: set `UPLOAD_DIR` to a persistent path (e.g. an attached volume / blob store) if you rely on file attachments and avatars, because the serverless filesystem is ephemeral. The **service worker (PWA) only registers in production builds**.

### Self-hosted

```bash
npm run build
npm run db:deploy    # run migrations against production DB
npm run start        # serve from a persistent volume for UPLOAD_DIR
```

### Production checklist

- [ ] `NODE_ENV=production`, strong `BETTER_AUTH_SECRET`, HTTPS
- [ ] `DATABASE_URL` points at a Postgres instance with pgvector
- [ ] `UPLOAD_DIR` is persistent and backed up
- [ ] Migrations applied (`npm run db:deploy`)
- [ ] `db:seed` NOT run in production (dev-only sample data)
- [ ] Optional: enable **2FA** for the account from Settings

---

## License

Private — not open for redistribution.

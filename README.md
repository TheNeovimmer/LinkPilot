# LinkPilot

A self-hosted, AI-powered **personal LinkedIn assistant** — one user, their job search, no CRM cruft.

Track conversations, jobs, recruiters, companies, applications, interviews, notes and reminders in one place. The AI (any OpenAI-compatible endpoint — OpenCode Zen free models work out of the box) drafts replies in your voice, analyzes job fit, prepares you for interviews, and summarizes conversations.

```
frontend  (React 19 · Vite · Tailwind v4 · TanStack Query · Zustand)
backend   (Express 5 · TypeScript · Prisma + Neon (PostgreSQL/pgvector) · Better Auth · Socket.IO)
docker    (Dockerfiles + nginx for production; dev runs natively)
```

---

## Quick start (local dev)

**1. Create a Neon database.** LinkPilot uses [Neon](https://neon.tech) (serverless Postgres with pgvector) — no local database or Redis required. In the Neon console, create a project and copy the **pooled** connection string (host ends in `-pooler`). It looks like:

```
postgresql://USER:PASSWORD@...pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

**2. Configure the backend:**

```bash
cp backend/.env.example backend/.env   # or create backend/.env
# set DATABASE_URL to your Neon connection string
# fill in AI_API_KEY to unlock AI features (OpenCode Zen: https://opencode.ai/zen)
```

Defaults point at a Neon database and an OpenCode Zen endpoint (`AI_BASE_URL=https://opencode.ai/zen/v1`, `AI_MODEL=deepseek-v4-flash-free`).

**3. Install, migrate, seed, run:**

```bash
npm install
npm run db:migrate    # creates the schema (pgvector included)
npm run db:seed       # optional demo dataset
npm run dev           # backend :4000 + frontend :5173
```

Importing job **links** uses a headless browser as a fallback for JS-rendered pages. If your OS doesn't already have Chromium/Chrome and you want that fallback, install it once: `npx playwright install chromium`.

Open **http://localhost:5173** — sign in with the seeded account
`demo@linkpilot.app` / `linkpilot-demo-1234`, or create your own.

API docs (Swagger): http://localhost:4000/docs

---

## AI setup

LinkPilot speaks any OpenAI-compatible chat API. Set in `backend/.env`:

| Variable            | Default                                | Notes                                  |
| ------------------- | -------------------------------------- | -------------------------------------- |
| `AI_BASE_URL`       | `https://opencode.ai/zen/v1`           | OpenAI-compatible base URL             |
| `AI_API_KEY`        | *(unset)*                              | Unset → AI features disabled gracefully|
| `AI_MODEL`          | `deepseek-v4-flash-free`               | Free OpenCode Zen model                |
| `AI_EMBEDDING_MODEL`| *(unset)*                              | Set e.g. `text-embedding-3-small` for vector semantic job search; text fallback otherwise |

Without a key the app runs fully — AI buttons surface a clear "not configured" state.

---

## Scripts

| Command                  | What it does                                  |
| ------------------------ | --------------------------------------------- |
| `npm run dev`            | Backend + frontend dev servers                |
| `npm run dev:backend`    | API only (tsx watch, :4000)                   |
| `npm run dev:frontend`   | Web only (Vite, :5173, proxies /api → :4000)  |
| `npm run build`          | Type-check + build both workspaces            |
| `npm run typecheck`      | `tsc --noEmit` both workspaces                |
| `npm run lint`           | ESLint (backend) + tsc (frontend)             |
| `npm test`               | Backend unit tests (vitest)                   |
| `npm run db:migrate`     | Prisma migrate dev                            |
| `npm run db:seed`        | Idempotent demo dataset                       |
| `npm run db:studio`      | Prisma Studio                                 |

Production: `docker compose up --build` (backend + nginx serving the built frontend; edit `AI_API_KEY` and `DATABASE_URL` under `backend.environment` first).

---

## Architecture

Modular monorepo — each module is a self-contained `controller → service → repository` stack with zod validation and typed DTOs:

```
src/modules/
  auth          Better Auth (email/password) at /api/auth, session middleware
  users         profile + avatar upload (multer) — the AI context
  conversations  contact tracking + message threads
  messages      thread messages (ME / THEM / AI roles)
  recruiters    people pipeline
  companies     orgs
  jobs          roles + pgvector semantic search + AI fit analysis
  applications  application pipeline
  interviews    calendar + AI prep
  notes         free-form notes with tags
  reminders     due notifications (cron worker every minute)
  notifications Socket.IO realtime push + in-app inbox
  ai            streaming SSE endpoints: draft-reply, rewrite, summarize, analyze-job, interview-prep
  audit         immutable audit log
  dashboard     stats (computed on demand)
```

- **Response envelope:** `{ success, data, meta }` everywhere; errors `{ success, error: { code, message } }`.
- **Cross-entity logic:** moving an application to `INTERVIEWING`/`OFFER`/etc. syncs the linked job's status and fires a milestone notification; scheduling an interview moves the linked job + application to `INTERVIEWING`, notifies you, and re-arms the 24h reminder when rescheduled.
- **Workers:** two cron jobs, once a minute — due reminders and interviews within the next 24h become realtime notifications (once each).
- **Semantic search:** `Job.embedding` is a pgvector `vector(1536)`; embeddings are generated automatically on job create/update when `AI_EMBEDDING_MODEL` is set, and search falls back to a multi-word text match otherwise.
- **Account lifecycle:** change password (`/api/auth/change-password`, signs out other sessions) and delete account (cascades through every owned row) from Settings.
- **Activity log:** every mutation is recorded (`/activity` in the UI) with action/entity filters and pagination.
- **Uploads:** avatars are sniffed by magic bytes (raster-only — no SVG/XSS), size-capped, and old files are removed on replace.
- **Job import from a link:** pasting a URL into Import fetches the posting server-side (plain HTTP first, headless browser fallback for JS-rendered pages) and the AI extracts title/company/salary/description from the real content. Sites behind hard bot walls (aggressive Cloudflare/Turnstile) return a clear error — paste the description text instead.
- **Auth:** Better Auth session cookie; the web client calls `/api/auth/*` directly and `/api/v1/*` via axios with `withCredentials`.
- **AI streaming:** SSE from `/api/v1/ai/*` — `{ type: "delta" | "done" | "error" }` events; client aborts on disconnect.
- **Workers:** `node-cron` turns due reminders into notifications + realtime push every minute.
- **CI:** GitHub Actions — install → prisma generate → typecheck → lint → test → build (`.github/workflows/ci.yml`).

## Tests

Backend unit tests cover the fiddly bits: pagination helpers, JSON extraction from model output, and prompt construction (`backend/tests/`). Run with `npm test`.

## License

MIT — private by default: every record is scoped to the single owner user. No third-party analytics, no tracking.

import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarClock,
  Check,
  FileDown,
  Inbox,
  Lock,
  Minus,
  Paperclip,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/common/reveal";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Kbd } from "@/components/ui/kbd";
import { ProductTabs } from "@/components/landing/product-tabs";

export const metadata: Metadata = {
  title: "LinkPilot — Your private AI career copilot",
  description:
    "Track applications, prep for interviews, and let AI draft replies. Self-hosted, private by default, installable as a PWA.",
  openGraph: {
    title: "LinkPilot — Your private AI career copilot",
    description:
      "Track applications, prep for interviews, and let AI draft replies. Self-hosted and private by default.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkPilot — Your private AI career copilot",
    description: "Track applications, prep interviews, let AI draft replies. Self-hosted and private by default.",
  },
};

const NAV_LINKS: [string, string][] = [
  ["Tour", "#tour"],
  ["Features", "#features"],
  ["Compare", "#compare"],
  ["Pricing", "#pricing"],
  ["FAQ", "#faq"],
];

const PROOF_STATS: [string, string][] = [
  ["11", "workspace areas"],
  ["5", "AI capabilities"],
  ["30d", "secure sessions"],
  ["100%", "data ownership"],
];

const STACK = ["PostgreSQL + pgvector", "Better Auth + 2FA", "OpenAI-compatible AI", "PWA + offline", "CSV + JSON export"];

const STEPS = [
  {
    n: "01",
    title: "Capture everything",
    body: "Jobs, recruiters, conversations, and interviews live in one pipeline. No spreadsheets, no lost threads.",
  },
  {
    n: "02",
    title: "Let AI do the drafting",
    body: "Fit scores, reply drafts, rewrites, and interview prep are generated from your real context.",
  },
  {
    n: "03",
    title: "Follow through",
    body: "Reminders, response analytics, and offer tracking show what needs attention and what pays off.",
  },
];

const COMPARE_ROWS: { label: string; lp: boolean; sheets: boolean; boards: boolean; note?: string }[] = [
  { label: "Private and self-hosted", lp: true, sheets: true, boards: false },
  { label: "AI drafts in your tone", lp: true, sheets: false, boards: false },
  { label: "Job fit scores with gaps", lp: true, sheets: false, boards: false },
  { label: "Offer and comp tracking", lp: true, sheets: false, boards: false },
  { label: "Interview prep plus calendar export", lp: true, sheets: false, boards: false },
  { label: "CSV and full JSON export", lp: true, sheets: false, boards: false },
  { label: "Offline PWA, no ads or tracking", lp: true, sheets: false, boards: false },
];

const PERSONAS: { role: string; body: string; tag: string }[] = [
  {
    role: "New graduates",
    body: "Turn every application into a tracked pipeline from day one. Learn what gets replies with real response stats.",
    tag: "FUNNEL + ANALYTICS",
  },
  {
    role: "Seniors on the move",
    body: "Juggle parallel processes without dropping threads. Prep per interviewer, compare offers side by side.",
    tag: "PREP + OFFERS",
  },
  {
    role: "Contractors",
    body: "Keep recruiters, clients, and renewals in one CRM with last-contact dates and follow-up nudges.",
    tag: "CRM + REMINDERS",
  },
];

const FAQS = [
  {
    q: "Do I need an AI key to use LinkPilot?",
    a: "No. Tracking, reminders, analytics, and exports work without any key. Add an OpenAI-compatible endpoint later from Settings to unlock drafts and analysis.",
  },
  {
    q: "How is this different from Teal or Simplify?",
    a: "Those run on someone else's cloud with your career data. LinkPilot is single user and self-hosted, so the database, files, and AI keys live on your server. Export everything anytime.",
  },
  {
    q: "Which AI providers work?",
    a: "Any OpenAI-compatible endpoint: OpenAI, OpenCode Zen, local models, and similar. Configure endpoint, model, and key per user from Settings. The key is stored server-side only.",
  },
  {
    q: "Where is my data stored?",
    a: "In your own PostgreSQL database and your own upload volume. Sessions, keys, and files never leave your server. AI keys are stored server-side only.",
  },
  {
    q: "Can I install it on my phone?",
    a: "Yes. LinkPilot is a PWA with an offline fallback page. Install it from the browser in production builds and open the dashboard from your home screen.",
  },
  {
    q: "Can I leave with my data?",
    a: "Anytime. Export applications, jobs, reminders, and notes to CSV, or take a full JSON snapshot of your account from the app.",
  },
];

function CompareCell({ yes, label }: { yes: boolean; label: string }) {
  return yes ? (
    <span className="inline-flex items-center gap-1.5 text-accent">
      <Check className="h-4 w-4" strokeWidth={2} />
      <span className="sr-only">{label}: yes</span>
    </span>
  ) : (
    <span className="inline-flex items-center text-text-muted">
      <Minus className="h-4 w-4" strokeWidth={2} />
      <span className="sr-only">{label}: no</span>
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-background text-text">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'LinkPilot',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            description: 'Private AI career copilot. Track applications, prep interviews, let AI draft replies.',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      {/* Announcement bar */}
      <div className="border-b border-border bg-surface/80">
        <p className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-5 py-2 text-center text-[12.5px] text-text-secondary">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          Offer tracking and CSV export are live.
          <Link href="#features" className="font-medium text-accent hover:underline">
            See what is new
          </Link>
        </p>
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="LinkPilot home">
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-accent/12 ring-1 ring-accent-border">
              <span className="font-mono text-[13px] font-bold text-accent">L</span>
            </span>
            <span className="text-[14px] font-semibold tracking-tight">LinkPilot</span>
          </Link>
          <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV_LINKS.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-[var(--radius-control)] px-3 py-1.5 text-[13px] text-text-secondary transition-colors hover:bg-surface-2 hover:text-text"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/login">
                Get started
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
            </Button>
            <details className="relative lg:hidden">
              <summary className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-[var(--radius-control)] border border-border text-text-secondary [&::-webkit-details-marker]:hidden">
                <span className="sr-only">Menu</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M1 3.5h12M1 7h12M1 10.5h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </summary>
              <nav aria-label="Mobile" className="absolute end-0 top-10 flex w-48 flex-col rounded-[var(--radius-card)] border border-border bg-surface p-1.5 shadow-xl">
                {NAV_LINKS.map(([label, href]) => (
                  <Link key={href} href={href} className="rounded-[6px] px-3 py-2 text-[13px] text-text-secondary hover:bg-surface-2 hover:text-text">
                    {label}
                  </Link>
                ))}
              </nav>
            </details>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 pt-16 pb-12 md:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:px-8 lg:pt-24">
          <Reveal>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-accent-border bg-accent-muted px-3 py-1 font-mono text-[11px] tracking-wide text-accent">
              <Lock className="h-3 w-3" strokeWidth={2} />
              SELF HOSTED · PRIVATE · PWA
            </p>
            <h1 className="mt-5 max-w-[16ch] text-4xl leading-[1.05] font-semibold tracking-tighter text-balance md:text-5xl lg:text-6xl">
              Your job search, under control.
            </h1>
            <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-text-secondary">
              Track applications, prep interviews, and let AI draft replies. All private, on your server.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/login">
                  Get started
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link href="#tour">Take the tour</Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <Card className="overflow-hidden rounded-[var(--radius-overlay)] shadow-[0_24px_60px_-32px_rgba(0,0,0,0.55)]">
              <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-surface-3" />
                <span className="h-2.5 w-2.5 rounded-full bg-surface-3" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent/60" />
                <span className="ms-2 font-mono text-[11px] text-text-muted">dashboard</span>
                <span className="ms-auto hidden items-center gap-1 rounded-full bg-accent-muted px-2 py-0.5 font-mono text-[10.5px] text-accent sm:inline-flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent lp-pulse" />
                  24% response rate
                </span>
              </div>
              <CardContent className="grid grid-cols-3 gap-3 p-4">
                {["Applied 18", "Interview 6", "Offer 2"].map((s) => (
                  <div key={s} className="rounded-[var(--radius-card)] border border-border bg-surface-2 px-3 py-2.5">
                    <p className="font-mono text-[15px] font-semibold">{s.split(" ")[1]}</p>
                    <p className="text-[11px] text-text-muted">{s.split(" ")[0]}</p>
                  </div>
                ))}
                <div className="col-span-3 rounded-[var(--radius-card)] border border-border bg-surface-2 p-3">
                  <div className="flex items-baseline justify-between">
                    <p className="text-[12px] font-medium">Applications, last 30 days</p>
                    <p className="font-mono text-[11px] text-text-muted">avg reply 3.2d</p>
                  </div>
                  <div className="mt-2.5 flex h-14 items-end gap-1.5" aria-hidden="true">
                    {[35, 55, 40, 70, 52, 88, 64, 46, 78, 58, 92, 72].map((h, i) => (
                      <span
                        key={i}
                        style={{ height: `${h}%` }}
                        className={i > 8 ? "flex-1 rounded-sm bg-accent/80" : "flex-1 rounded-sm bg-surface-3"}
                      />
                    ))}
                  </div>
                </div>
                <div className="col-span-3 rounded-[var(--radius-card)] border border-accent-border bg-accent-muted p-3">
                  <p className="flex items-center gap-1.5 font-mono text-[11px] text-accent">
                    <Sparkles className="h-3 w-3" strokeWidth={2} />
                    AI DRAFT READY
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-text">
                    “Thanks for reaching out. I would love to discuss the role on Thursday…”
                  </p>
                </div>
                <div className="col-span-3 flex items-center gap-2 rounded-[var(--radius-card)] border border-border bg-surface px-3 py-2">
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                  <span className="text-[12px] text-text-muted">Jump to interviews, recruiters, offers…</span>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </section>

        {/* Proof band: plain mono metrics, no cards */}
        <section aria-label="At a glance" className="border-y border-border bg-surface/60">
          <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
            <dl className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {PROOF_STATS.map(([n, label]) => (
                <div key={label}>
                  <dt className="order-2 mt-1 text-[12.5px] text-text-muted">{label}</dt>
                  <dd className="order-1 font-mono text-2xl font-semibold tracking-tight">{n}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-1.5 border-t border-border pt-4">
              {STACK.map((s) => (
                <span key={s} className="font-mono text-[11.5px] text-text-muted">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Product tour: interactive tabs */}
        <section id="tour" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-16 lg:px-8 lg:py-24">
          <Reveal>
            <h2 className="max-w-[22ch] text-3xl font-semibold tracking-tighter text-balance md:text-4xl">
              Tour the workspace.
            </h2>
            <p className="mt-3 max-w-[65ch] text-[15px] leading-relaxed text-text-secondary">
              Four views carry the whole search. Pick one to see what it does.
            </p>
          </Reveal>
          <div className="mt-8">
            <ProductTabs />
          </div>
        </section>

        {/* Features bento */}
        <section id="features" className="border-y border-border bg-surface/60 scroll-mt-16">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
            <Reveal>
              <h2 className="max-w-[22ch] text-3xl font-semibold tracking-tighter text-balance md:text-4xl">
                One workspace for the whole search.
              </h2>
              <p className="mt-3 max-w-[65ch] text-[15px] leading-relaxed text-text-secondary">
                Every stage connects. A conversation becomes an interview, an interview becomes an offer, and the dashboard shows the full picture.
              </p>
            </Reveal>
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-6">
              <Reveal className="md:col-span-4" delay={0.02}>
                <Card className="h-full border-accent-border bg-accent-muted">
                  <CardContent className="p-5">
                    <Inbox className="h-5 w-5 text-accent" strokeWidth={1.75} />
                    <CardTitle className="mt-3 text-[15px]">Command center dashboard</CardTitle>
                    <CardDescription className="mt-1.5">
                      Funnel, response rate, reply time, 30-day trends, open offers, and due reminders in one view.
                    </CardDescription>
                    <div className="mt-4 flex h-16 items-end gap-1.5" aria-hidden="true">
                      {[30, 48, 62, 44, 74, 58, 90, 66].map((h, i) => (
                        <span key={i} style={{ height: `${h}%` }} className="flex-1 rounded-sm bg-accent/55" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
              <Reveal className="md:col-span-2" delay={0.06}>
                <Card className="h-full">
                  <CardContent className="p-5">
                    <Send className="h-5 w-5 text-accent" strokeWidth={1.75} />
                    <CardTitle className="mt-3 text-[15px]">Replies that sound like you</CardTitle>
                    <CardDescription className="mt-1.5">
                      Context-aware drafts and rewrites in your tone. Summaries for long threads.
                    </CardDescription>
                  </CardContent>
                </Card>
              </Reveal>
              <Reveal className="md:col-span-2" delay={0.02}>
                <Card className="h-full">
                  <CardContent className="p-5">
                    <FileDown className="h-5 w-5 text-accent" strokeWidth={1.75} />
                    <CardTitle className="mt-3 text-[15px]">Offers, tracked</CardTitle>
                    <CardDescription className="mt-1.5">
                      Compensation, currency, frequency, and negotiation status per application.
                    </CardDescription>
                  </CardContent>
                </Card>
              </Reveal>
              <Reveal className="md:col-span-2" delay={0.06}>
                <Card className="h-full bg-surface-2">
                  <CardContent className="p-5">
                    <CalendarClock className="h-5 w-5 text-accent" strokeWidth={1.75} />
                    <CardTitle className="mt-3 text-[15px]">Interview prep + calendar</CardTitle>
                    <CardDescription className="mt-1.5">
                      Topics, likely questions, and tips. One-click calendar export with reminders.
                    </CardDescription>
                  </CardContent>
                </Card>
              </Reveal>
              <Reveal className="md:col-span-2" delay={0.1}>
                <Card className="h-full">
                  <CardContent className="p-5">
                    <Paperclip className="h-5 w-5 text-accent" strokeWidth={1.75} />
                    <CardTitle className="mt-3 text-[15px]">Files and follow-ups</CardTitle>
                    <CardDescription className="mt-1.5">
                      Resumes and contracts on applications. Waiting badges plus 24h snooze.
                    </CardDescription>
                  </CardContent>
                </Card>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Compare: table family */}
        <section id="compare" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-16 lg:px-8 lg:py-24">
          <Reveal>
            <h2 className="max-w-[22ch] text-3xl font-semibold tracking-tighter text-balance md:text-4xl">
              Why not a spreadsheet.
            </h2>
            <p className="mt-3 max-w-[65ch] text-[15px] leading-relaxed text-text-secondary">
              Spreadsheets store rows. Job boards rent you listings. LinkPilot runs the search with you.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="mt-8 overflow-x-auto rounded-[var(--radius-card)] border border-border">
              <table className="w-full min-w-[560px] border-collapse bg-surface text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="px-5 py-3.5 font-medium text-text-muted">
                      Capability
                    </th>
                    <th scope="col" className="px-5 py-3.5 font-semibold text-accent">
                      LinkPilot
                    </th>
                    <th scope="col" className="px-5 py-3.5 font-medium text-text-muted">
                      Spreadsheets
                    </th>
                    <th scope="col" className="px-5 py-3.5 font-medium text-text-muted">
                      Job boards
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((r) => (
                    <tr key={r.label} className="border-b border-border last:border-0">
                      <th scope="row" className="px-5 py-3 font-normal text-text-secondary">
                        {r.label}
                      </th>
                      <td className="px-5 py-3">
                        <CompareCell yes={r.lp} label={r.label} />
                      </td>
                      <td className="px-5 py-3">
                        <CompareCell yes={r.sheets} label={r.label} />
                      </td>
                      <td className="px-5 py-3">
                        <CompareCell yes={r.boards} label={r.label} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </section>

        {/* How it works */}
        <section id="how" className="border-y border-border bg-surface/60 scroll-mt-16">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
            <Reveal>
              <h2 className="text-3xl font-semibold tracking-tighter md:text-4xl">How it works</h2>
              <p className="mt-3 max-w-[65ch] text-[15px] leading-relaxed text-text-secondary">
                Set up in minutes. Value from the first application you log.
              </p>
            </Reveal>
            <ol className="mt-8 divide-y divide-border border-y border-border">
              {STEPS.map((s, i) => (
                <li key={s.n}>
                  <Reveal delay={i * 0.05}>
                    <div className="grid grid-cols-1 gap-2 py-6 md:grid-cols-[80px_220px_1fr] md:items-baseline md:gap-6">
                      <span className="font-mono text-[13px] text-accent">{s.n}</span>
                      <span className="text-[15px] font-semibold tracking-tight">{s.title}</span>
                      <span className="max-w-[65ch] text-[14px] leading-relaxed text-text-secondary">{s.body}</span>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* AI panel */}
        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24" aria-label="AI capabilities">
          <Reveal>
            <div className="rounded-[var(--radius-overlay)] border border-accent-border bg-accent-muted p-6 md:p-10">
              <p className="font-mono text-[11px] tracking-wide text-accent">OPTIONAL AI SIDECAR</p>
              <h2 className="mt-3 max-w-[24ch] text-3xl font-semibold tracking-tighter text-balance md:text-4xl">
                AI that reads the thread before it writes.
              </h2>
              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  ["Fit score", "0 to 100 with strengths, gaps, and likely questions per job."],
                  ["Drafts", "Replies generated from the conversation, the job, and your goals."],
                  ["Prep", "Topics and tips built from the role and the interviewer."],
                ].map(([t, b]) => (
                  <div key={t} className="rounded-[var(--radius-card)] border border-accent-border bg-background/60 p-4">
                    <p className="text-[14px] font-semibold">{t}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{b}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 font-mono text-[12px] leading-relaxed text-text-secondary">
                Bring any OpenAI-compatible endpoint, or run with no key at all.
              </p>
            </div>
          </Reveal>
        </section>

        {/* Who it is for: editorial rules, no boxes */}
        <section id="who" className="mx-auto max-w-7xl scroll-mt-20 px-5 pb-16 lg:px-8 lg:pb-24" aria-label="Who LinkPilot is for">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tighter md:text-4xl">Built for serious searches.</h2>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            {PERSONAS.map((p, i) => (
              <Reveal key={p.role} delay={i * 0.05}>
                <div className="border-t-2 border-accent pt-4">
                  <p className="font-mono text-[11px] tracking-wide text-accent">{p.tag}</p>
                  <h3 className="mt-2 text-[16px] font-semibold tracking-tight">{p.role}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-secondary">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Pricing: two panels, distinct intents */}
        <section id="pricing" className="border-y border-border bg-surface/60 scroll-mt-16">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
            <Reveal>
              <h2 className="text-3xl font-semibold tracking-tighter md:text-4xl">Start free, stay private.</h2>
              <p className="mt-3 max-w-[65ch] text-[15px] leading-relaxed text-text-secondary">
                The full workspace today. No seat limits, because there is one seat: yours.
              </p>
            </Reveal>
            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Reveal>
                <div className="flex h-full flex-col rounded-[var(--radius-overlay)] border border-border bg-surface p-6 md:p-8">
                  <p className="font-mono text-[11px] tracking-wide text-text-muted">SELF-HOSTED</p>
                  <p className="mt-3 flex items-baseline gap-2">
                    <span className="text-4xl font-semibold tracking-tighter">Free</span>
                    <span className="text-[13px] text-text-muted">forever, on your server</span>
                  </p>
                  <ul className="mt-6 flex flex-col gap-2.5">
                    {["All 11 workspace areas", "AI with your own endpoint", "PWA install plus offline page", "CSV and JSON export"].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-[13.5px] text-text-secondary">
                        <Check className="h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button variant="secondary" size="lg" asChild className="mt-8 w-full">
                    <a href="https://github.com/TheNeovimmer/LinkPilot" target="_blank" rel="noreferrer">
                      View deploy guide
                      <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                    </a>
                  </Button>
                </div>
              </Reveal>
              <Reveal delay={0.06}>
                <div className="flex h-full flex-col rounded-[var(--radius-overlay)] border border-accent-border bg-accent-muted p-6 md:p-8">
                  <p className="font-mono text-[11px] tracking-wide text-accent">CLOUD · COMING SOON</p>
                  <p className="mt-3 flex items-baseline gap-2">
                    <span className="text-4xl font-semibold tracking-tighter">Managed</span>
                    <span className="text-[13px] text-text-secondary">for people who prefer signup</span>
                  </p>
                  <ul className="mt-6 flex flex-col gap-2.5">
                    {["Same workspace, zero ops", "Automatic backups", "Priority feature access", "Bring your own AI key or none"].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-[13.5px] text-text-secondary">
                        <Check className="h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button size="lg" asChild className="mt-8 w-full">
                    <Link href="/login">
                      Get early access
                      <ArrowRight className="h-4 w-4" strokeWidth={2} />
                    </Link>
                  </Button>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Security */}
        <section id="security" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-16 lg:px-8 lg:py-24">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tighter md:text-4xl">Private by architecture.</h2>
            <p className="mt-3 max-w-[65ch] text-[15px] leading-relaxed text-text-secondary">
              Single user, self-hosted, no tracking. Your search stays yours.
            </p>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              {
                icon: ShieldCheck,
                t: "2FA and hardened auth",
                b: "Email and password via Better Auth with 30-day sessions, plus TOTP two-factor with backup codes.",
              },
              {
                icon: Lock,
                t: "Keys stay server-side",
                b: "Per-user AI provider config. Secrets never reach the browser unmasked, and every AI action is audit-logged.",
              },
              {
                icon: Bell,
                t: "Reminders with snooze",
                b: "Due dates, notification stream, and 24h snooze so nothing slips while you wait on replies.",
              },
              {
                icon: FileDown,
                t: "Exports without lock-in",
                b: "CSV for applications, jobs, reminders, and notes. Full JSON snapshot of the account on demand.",
              },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 0.04}>
                <Card className="h-full">
                  <CardContent className="flex gap-3.5 p-5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-accent/12 ring-1 ring-accent-border">
                      <c.icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
                    </span>
                    <span>
                      <CardTitle className="text-[15px]">{c.t}</CardTitle>
                      <CardDescription className="mt-1">{c.b}</CardDescription>
                    </span>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-border bg-surface/60 scroll-mt-16">
          <div className="mx-auto max-w-3xl px-5 py-16 lg:py-24">
            <Reveal>
              <h2 className="text-3xl font-semibold tracking-tighter md:text-4xl">Questions, answered.</h2>
            </Reveal>
            <div className="mt-6 overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
              {FAQS.map((f, i) => (
                <details key={f.q} className={i > 0 ? "border-t border-border" : undefined}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[14px] font-medium [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={1.75} />
                  </summary>
                  <p className="px-5 pb-5 text-[13.5px] leading-relaxed text-text-secondary">{f.a}</p>
                </details>
              ))}
            </div>
            <Reveal>
              <div className="mt-10 rounded-[var(--radius-overlay)] border border-border bg-surface p-8 text-center">
                <h3 className="text-2xl font-semibold tracking-tighter">Stop juggling tabs.</h3>
                <p className="mx-auto mt-2 max-w-[48ch] text-[14px] leading-relaxed text-text-secondary">
                  Log your first application tonight. Wake up to a pipeline that tells you what to do next.
                </p>
                <Button size="lg" asChild className="mt-6">
                  <Link href="/login">
                    Get started
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 py-10 md:grid-cols-4 lg:px-8">
          <div className="col-span-2 md:col-span-1">
            <p className="flex items-center gap-2 text-[14px] font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-accent/12 ring-1 ring-accent-border">
                <span className="font-mono text-[11px] font-bold text-accent">L</span>
              </span>
              LinkPilot
            </p>
            <p className="mt-2 max-w-[32ch] text-[13px] leading-relaxed text-text-muted">
              Your private AI career copilot. Self-hosted and installable as a PWA.
            </p>
          </div>
          <nav aria-label="Product" className="flex flex-col gap-2 text-[13px] text-text-secondary">
            <span className="font-mono text-[11px] tracking-wide text-text-muted">PRODUCT</span>
            <Link href="#tour" className="w-fit hover:text-text">Tour</Link>
            <Link href="#features" className="w-fit hover:text-text">Features</Link>
            <Link href="#pricing" className="w-fit hover:text-text">Pricing</Link>
          </nav>
          <nav aria-label="Compare" className="flex flex-col gap-2 text-[13px] text-text-secondary">
            <span className="font-mono text-[11px] tracking-wide text-text-muted">COMPARE</span>
            <Link href="#compare" className="w-fit hover:text-text">Why LinkPilot</Link>
            <Link href="#who" className="w-fit hover:text-text">Who it fits</Link>
            <Link href="#security" className="w-fit hover:text-text">Security</Link>
          </nav>
          <nav aria-label="Account" className="flex flex-col gap-2 text-[13px] text-text-secondary">
            <span className="font-mono text-[11px] tracking-wide text-text-muted">ACCOUNT</span>
            <Link href="/login" className="w-fit hover:text-text">Sign in</Link>
            <Link href="/dashboard" className="w-fit hover:text-text">Dashboard</Link>
            <Link href="/offline" className="w-fit hover:text-text">Offline</Link>
          </nav>
        </div>
        <div className="border-t border-border">
          <p className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-5 py-4 font-mono text-[11px] text-text-muted lg:px-8">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              All systems normal.
            </span>
            <span>Private build. No tracking.</span>
            <span className="ms-auto inline-flex items-center gap-1.5">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
              <span>to navigate</span>
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}

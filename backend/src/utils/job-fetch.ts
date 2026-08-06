/// <reference lib="dom" /> // for page.evaluate callbacks (browser-side code)
import { existsSync } from 'node:fs';
import { ApiError } from './ApiError.js';

/**
 * Job-link import: fetch a posting URL and reduce it to text an LLM can
 * extract from. Plain fetch first (fast, no deps); a headless browser
 * (Playwright) is used only when the site blocks plain HTTP (Cloudflare
 * challenges, JS-rendered pages like LinkedIn).
 */

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/** Keep the AI payload well under the import schema's 30k char cap. */
const MAX_CHARS = 24_000;

/** Roughly URL-shaped: has a scheme, or is a bare domain/path without spaces. */
export function isLikelyUrl(input: string): boolean {
  const t = input.trim();
  if (/^https?:\/\//i.test(t)) return true;
  return !/\s/.test(t) && /^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?(\/\S*)?$/i.test(t);
}

export function normalizeUrl(input: string): string {
  const t = input.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function looksLikeChallenge(text: string): boolean {
  return /just a moment|checking your browser|verify you are human|enable javascript and cookies|performing security verification|security service to protect/i.test(text);
}

/** Plain HTTP fetch; null on failure, non-HTML responses, or bot challenges. */
async function plainFetch(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': BROWSER_UA,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en,fr;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') ?? '';
    if (!/html|text/i.test(type)) return null;
    const html = await res.text();
    if (html.length < 1_000 || looksLikeChallenge(html)) return null;
    return html;
  } catch {
    return null;
  }
}

/** Extract a condensed, model-friendly text blob: title, meta, JSON-LD, body. */
export function extractHtmlText(html: string): string {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const desc =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ??
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1];

  // Structured job data (schema.org JobPosting) — keep verbatim, the model parses JSON well.
  const jsonLd: string[] = [];
  const ldRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = ldRe.exec(html)) && jsonLd.length < 8) {
    const raw = m[1]!.trim();
    if (raw) jsonLd.push(raw);
  }

  let body = html
    .replace(/<(script|style|noscript|svg|iframe|template|head)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  // Remove nav/footer/aside blocks one at a time (job titles often live in <header>, keep it).
  let prev = '';
  while (prev !== body) {
    prev = body;
    body = body.replace(/<(nav|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  }
  body = body
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();

  return [title, desc, ...jsonLd, body].filter(Boolean).join('\n\n').slice(0, MAX_CHARS);
}

// --- Headless browser fallback (Playwright) ---------------------------------

const SYSTEM_BROWSERS = [
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/brave-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

async function launchBrowser() {
  const { chromium } = await import('playwright');
  const candidates: (string | undefined)[] = [
    process.env.PLAYWRIGHT_EXECUTABLE_PATH,
    ...SYSTEM_BROWSERS.filter((p) => existsSync(p)),
  ];
  if (!candidates.some(Boolean)) candidates.push(undefined); // bundled playwright chromium
  let lastErr: unknown = new Error('No Chromium available');
  for (const executablePath of candidates) {
    try {
      return await chromium.launch(executablePath ? { headless: true, executablePath } : { headless: true });
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

let browserPromise: Promise<Awaited<ReturnType<typeof launchBrowser>>> | null = null;
function getBrowser() {
  browserPromise ??= launchBrowser().catch((err) => {
    browserPromise = null; // allow a retry on the next request
    throw err;
  });
  return browserPromise;
}

/** Render the page in a real browser (defeats JS challenges), return inner text. */
async function browserFetch(url: string): Promise<string | null> {
  let browser: Awaited<ReturnType<typeof launchBrowser>>;
  try {
    browser = await getBrowser();
  } catch (err) {
    throw ApiError.badRequest(
      `This site blocks plain requests and no browser is available for rendering (${(err as Error).message}). ` +
        'Install one: npx playwright install chromium. Or paste the job description text instead.',
    );
  }
  const ctx = await browser.newContext({ userAgent: BROWSER_UA, locale: 'en-US' });
  try {
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    // Let JS/Cloudflare challenges clear (poll up to ~10s).
    const deadline = Date.now() + 10_000;
    let text = await page.evaluate(() => document.body?.innerText ?? '');
    while ((!text.trim() || looksLikeChallenge(text)) && Date.now() < deadline) {
      await page.waitForTimeout(500);
      text = await page.evaluate(() => document.body?.innerText ?? '');
    }
    if (!text.trim() || looksLikeChallenge(text)) return null;
    return text.slice(0, MAX_CHARS);
  } catch {
    return null;
  } finally {
    await ctx.close();
  }
}

/** Fetch a posting URL and reduce it to extraction-ready text. Throws on total failure. */
export async function fetchJobContent(url: string): Promise<string> {
  const html = await plainFetch(url);
  if (html) return extractHtmlText(html);
  const text = await browserFetch(url);
  if (text) return text;
  throw ApiError.badRequest(
    'Could not load that URL (login or bot protection?). Try pasting the job description text instead.',
  );
}

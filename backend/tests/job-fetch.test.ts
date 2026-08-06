import { describe, expect, it } from 'vitest';
import { extractHtmlText, isLikelyUrl, normalizeUrl } from '../src/utils/job-fetch.js';

describe('isLikelyUrl', () => {
  it('accepts scheme URLs and bare domains', () => {
    expect(isLikelyUrl('https://www.tanitjobs.com/job/1710442/x/')).toBe(true);
    expect(isLikelyUrl('http://example.com')).toBe(true);
    expect(isLikelyUrl('tanitjobs.com/job/1710442/x')).toBe(true);
  });
  it('rejects pasted plain text', () => {
    expect(isLikelyUrl('Full stack developer needed in Tunis, apply now')).toBe(false);
    expect(isLikelyUrl('We are hiring\nSend your CV to hr@x.com')).toBe(false);
  });
});

describe('normalizeUrl', () => {
  it('prepends https to bare domains', () => {
    expect(normalizeUrl('tanitjobs.com/job/x')).toBe('https://tanitjobs.com/job/x');
    expect(normalizeUrl('https://x.com/job/1')).toBe('https://x.com/job/1');
  });
});

describe('extractHtmlText', () => {
  const html = `
    <html><head>
      <title>Full Stack Developer - Tunis</title>
      <meta name="description" content="Build web apps with React and Node">
      <script>alert('xss');</script>
      <script type="application/ld+json">{"@type":"JobPosting","title":"Full Stack Developer","baseSalary":{"value":2500}}</script>
      <style>.nav{display:none}</style>
    </head><body>
      <nav><a href="/">Home</a></nav>
      <header><h1>Full Stack Developer</h1></header>
      <p>We are hiring a &nbsp; Full Stack developer &amp; engineer.</p>
      <footer>© 2026 Example Co</footer>
      <noscript>enable JS</noscript>
    </body></html>`;

  it('keeps title, meta description and JSON-LD', () => {
    const out = extractHtmlText(html);
    expect(out).toContain('Full Stack Developer - Tunis');
    expect(out).toContain('Build web apps with React and Node');
    expect(out).toContain('"@type":"JobPosting"');
    expect(out).toContain('"baseSalary"');
  });
  it('strips scripts, styles, nav/footer and collapses whitespace', () => {
    const out = extractHtmlText(html);
    expect(out).not.toContain('alert');
    expect(out).not.toContain('nav');
    expect(out).not.toContain('© 2026');
    expect(out).not.toContain('enable JS');
    expect(out).toContain('Full Stack developer & engineer');
    expect(out).not.toMatch(/[^\S\n]{2,}/); // no double spaces
    expect(out).not.toMatch(/\n{3,}/); // no blank-line runs
  });
});

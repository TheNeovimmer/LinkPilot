import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';
  return [{ url: `${base}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 }];
}

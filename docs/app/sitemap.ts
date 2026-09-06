import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';
import { blogSource, versions } from '@/lib/source';

export const revalidate = false;

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, site.url).toString();

  return [
    { url: url('/'), changeFrequency: 'monthly', priority: 1 },
    { url: url('/blog'), changeFrequency: 'monthly', priority: 0.6 },
    ...blogSource.getPages().map((page) => ({
      url: url(page.url),
      lastModified: page.data.date,
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    })),
    ...versions.flatMap((version) =>
      version.source.getPages().map((page) => ({
        url: url(page.url),
        changeFrequency: 'weekly' as const,
        priority: version.tag === 'latest' ? 0.8 : 0.5,
      }))
    ),
  ];
}

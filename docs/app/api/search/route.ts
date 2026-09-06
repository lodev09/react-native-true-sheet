import { createSearchAPI } from 'fumadocs-core/search/server';
import { versions } from '@/lib/source';

export const revalidate = false;

export const { GET } = createSearchAPI('advanced', {
  indexes: versions.flatMap((version) =>
    version.source.getPages().map((page) => ({
      id: page.url,
      title: page.data.title,
      description: page.data.description,
      url: page.url,
      structuredData: page.data.structuredData,
      tag: version.tag,
    }))
  ),
});

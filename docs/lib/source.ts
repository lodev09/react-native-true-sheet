import { loader } from 'fumadocs-core/source';
import { toFumadocsSource } from 'fumadocs-mdx/runtime/server';
import { blog, docs } from '@/.source/server';

export const source = loader({
  baseUrl: '/',
  source: docs.toFumadocsSource(),
  // Latest version is served at the root, other versions keep their folder prefix.
  slugs(_file, next) {
    const slugs = next();
    return slugs[0] === 'latest' ? slugs.slice(1) : slugs;
  },
});

export const blogSource = loader({
  baseUrl: '/blog',
  source: toFumadocsSource(blog, []),
});

export type DocsPage = (typeof source)['$inferPage'];

export async function getLLMText(page: DocsPage) {
  const processed = await page.data.getText('processed');
  return `# ${page.data.title} (${page.url})\n\n${processed}`;
}

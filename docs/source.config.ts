import { transformerMetaHighlight } from '@shikijs/transformers';
import { rehypeCodeDefaultOptions, remarkDirectiveAdmonition } from 'fumadocs-core/mdx-plugins';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { defineCollections, defineConfig, defineDocs } from 'fumadocs-mdx/config';
import remarkDirective from 'remark-directive';
import { z } from 'zod';
import { codeThemes } from './lib/code-theme';

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema.extend({
      keywords: z.array(z.string()).optional(),
    }),
    postprocess: { includeProcessedMarkdown: true },
  },
  meta: { schema: metaSchema },
});

export const blog = defineCollections({
  type: 'doc',
  dir: 'content/blog',
  schema: pageSchema.extend({
    date: z.coerce.date(),
    authors: z.array(z.string()),
    tags: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
  }),
});

export default defineConfig({
  mdxOptions: async () => ({
    remarkPlugins: [
      remarkDirective,
      [
        remarkDirectiveAdmonition,
        {
          types: {
            info: 'info',
            note: 'info',
            tip: 'idea',
            warning: 'warning',
            danger: 'error',
          },
        },
      ],
    ],
    remarkNpmOptions: { persist: { id: 'package-manager' } },
    rehypeCodeOptions: {
      themes: codeThemes,
      transformers: [...(rehypeCodeDefaultOptions.transformers ?? []), transformerMetaHighlight()],
    },
  }),
});

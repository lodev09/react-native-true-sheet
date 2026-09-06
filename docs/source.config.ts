import { transformerMetaHighlight } from '@shikijs/transformers';
import { rehypeCodeDefaultOptions, remarkDirectiveAdmonition } from 'fumadocs-core/mdx-plugins';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { defineCollections, defineConfig, defineDocs } from 'fumadocs-mdx/config';
import remarkDirective from 'remark-directive';
import { z } from 'zod';
import { loadCodeThemes } from './lib/code-theme';

const docSchema = pageSchema.extend({
  keywords: z.array(z.string()).optional(),
});

const docOptions = {
  schema: docSchema,
  postprocess: { includeProcessedMarkdown: true },
};

export const docs = defineDocs({
  dir: 'content/docs',
  docs: docOptions,
  meta: { schema: metaSchema },
});

export const next = defineDocs({
  dir: 'content/next',
  docs: docOptions,
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
      themes: await loadCodeThemes(),
      transformers: [...(rehypeCodeDefaultOptions.transformers ?? []), transformerMetaHighlight()],
    },
  }),
});

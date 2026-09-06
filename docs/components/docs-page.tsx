import { createRelativeLink } from 'fumadocs-ui/mdx';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  EditOnGitHub,
} from 'fumadocs-ui/layouts/notebook/page';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import { site } from '@/lib/site';
import { source } from '@/lib/source';

export function DocsPageView({ slug }: { slug: string[] }) {
  const page = source.getPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
      </DocsBody>
      <EditOnGitHub
        href={`${site.github}/blob/main/docs/content/docs/${page.path}`}
        className="self-start"
      />
    </DocsPage>
  );
}

export function docsPageMetadata(slug: string[]): Metadata {
  const page = source.getPage(slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    keywords: page.data.keywords,
    alternates: { canonical: page.url },
    openGraph: { title: page.data.title, description: page.data.description, url: page.url },
  };
}

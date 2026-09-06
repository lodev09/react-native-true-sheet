import { createRelativeLink } from 'fumadocs-ui/mdx';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  EditOnGitHub,
} from 'fumadocs-ui/layouts/docs/page';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import { site } from '@/lib/site';
import type { DocsVersion } from '@/lib/source';

export function DocsPageView({ version, slug }: { version: DocsVersion; slug?: string[] }) {
  const page = version.source.getPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={getMDXComponents({ a: createRelativeLink(version.source, page) })} />
      </DocsBody>
      <EditOnGitHub
        href={`${site.github}/blob/main/docs/content/${version.dir}/${page.path}`}
      />
    </DocsPage>
  );
}

export function docsPageMetadata(version: DocsVersion, slug?: string[]): Metadata {
  const page = version.source.getPage(slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    keywords: page.data.keywords,
    alternates: { canonical: page.url },
    openGraph: { title: page.data.title, description: page.data.description, url: page.url },
  };
}

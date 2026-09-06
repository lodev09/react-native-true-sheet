import type { Metadata } from 'next';
import { DocsPageView, docsPageMetadata } from '@/components/docs-page';
import { unreleased } from '@/lib/source';

type Props = { params: Promise<{ slug?: string[] }> };

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <DocsPageView version={unreleased} slug={slug} />;
}

export function generateStaticParams() {
  return unreleased.source.generateParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return docsPageMetadata(unreleased, slug);
}

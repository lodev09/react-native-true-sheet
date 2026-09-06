import type { Metadata } from 'next';
import { DocsPageView, docsPageMetadata } from '@/components/docs-page';
import { latest } from '@/lib/source';

type Props = { params: Promise<{ slug: string[] }> };

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <DocsPageView version={latest} slug={slug} />;
}

export function generateStaticParams() {
  return latest.source.generateParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return docsPageMetadata(latest, slug);
}

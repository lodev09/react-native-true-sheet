import type { Metadata } from 'next';
import { DocsPageView, docsPageMetadata } from '@/components/docs-page';
import { source } from '@/lib/source';

type Props = { params: Promise<{ slug: string[] }> };

// Unknown paths fall through to the root not-found instead of rendering inside the docs layout.
export const dynamicParams = false;

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <DocsPageView slug={slug} />;
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return docsPageMetadata(slug);
}

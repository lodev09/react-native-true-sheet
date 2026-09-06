import { InlineTOC } from 'fumadocs-ui/components/inline-toc';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import { authors } from '@/lib/authors';
import { formatDate } from '@/lib/date';
import { blogSource } from '@/lib/source';

type Props = { params: Promise<{ slug: string }> };

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const page = blogSource.getPage([slug]);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <main className="mx-auto w-full max-w-[800px] flex-1 px-4 py-12">
      <Link href="/blog" className="text-sm text-fd-muted-foreground hover:text-fd-primary">
        ← All posts
      </Link>
      <time
        dateTime={page.data.date.toISOString()}
        className="mt-8 block text-sm text-fd-muted-foreground"
      >
        {formatDate(page.data.date)}
      </time>
      <h1 className="font-heading mt-3 mb-3 text-4xl font-bold tracking-tight">
        {page.data.title}
      </h1>
      <p className="mb-6 text-lg text-fd-muted-foreground">{page.data.description}</p>
      <div className="mb-10 flex flex-wrap items-center gap-4 text-sm">
        {page.data.authors.map((id) => {
          const author = authors[id];
          if (!author) return null;
          return (
            <a key={id} href={author.url} className="flex items-center gap-2">
              <img src={author.image} alt="" className="size-8 rounded-full" />
              <span>
                <span className="block font-medium">{author.name}</span>
                <span className="block text-xs text-fd-muted-foreground">{author.title}</span>
              </span>
            </a>
          );
        })}
      </div>
      <article className="prose">
        <InlineTOC items={page.data.toc} />
        <MDX components={getMDXComponents()} />
      </article>
      {page.data.tags && (
        <ul className="mt-10 flex flex-wrap gap-2">
          {page.data.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-fd-secondary px-3 py-1 text-xs text-fd-secondary-foreground"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export function generateStaticParams() {
  return blogSource.getPages().map((page) => ({ slug: page.slugs[0] }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = blogSource.getPage([slug]);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    keywords: page.data.keywords ?? page.data.tags,
    alternates: { canonical: page.url },
    openGraph: {
      type: 'article',
      title: page.data.title,
      description: page.data.description,
      url: page.url,
      publishedTime: page.data.date.toISOString(),
    },
  };
}

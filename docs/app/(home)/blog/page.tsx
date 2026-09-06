import clsx from 'clsx';
import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { authors } from '@/lib/authors';
import { formatDate } from '@/lib/date';
import { blogSource } from '@/lib/source';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Release notes and announcements for React Native True Sheet.',
  alternates: { canonical: '/blog' },
};

type Post = ReturnType<typeof blogSource.getPages>[number];

export default function BlogIndex() {
  const [latest, ...posts] = blogSource
    .getPages()
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return (
    <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-12 md:py-16">
      <header className="mb-12 max-w-2xl">
        <p className="mb-3 text-sm font-semibold tracking-wide text-fd-primary uppercase">Blog</p>
        <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl">
          Release notes and announcements
        </h1>
        <p className="mt-4 text-lg text-fd-muted-foreground">
          What&apos;s new in React Native True Sheet, from major releases to the details behind
          them.
        </p>
      </header>

      {latest && <PostCard post={latest} featured />}

      <section className="mt-14">
        <h2 className="font-heading mb-6 text-2xl font-bold tracking-tight">All posts</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.url} post={post} />
          ))}
        </div>
      </section>
    </main>
  );
}

function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  const author = authors[post.data.authors[0]];

  return (
    <Link
      href={post.url}
      className={clsx(
        'group flex flex-col rounded-2xl border border-fd-border bg-fd-card transition-colors hover:border-fd-primary/40 hover:bg-fd-accent/40',
        featured ? 'gap-6 p-8 md:flex-row md:items-end md:justify-between md:p-10' : 'gap-4 p-6'
      )}
    >
      <div className={clsx('flex flex-col', featured ? 'gap-5 md:max-w-3xl' : 'flex-1 gap-3')}>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {featured && (
            <span className="rounded-full bg-fd-primary px-2.5 py-0.5 font-semibold text-fd-primary-foreground">
              Latest
            </span>
          )}
          <time dateTime={post.data.date.toISOString()} className="text-fd-muted-foreground">
            {formatDate(post.data.date)}
          </time>
        </div>
        <h2
          className={clsx(
            'font-heading font-bold tracking-tight transition-colors group-hover:text-fd-primary',
            featured ? 'text-3xl md:text-4xl' : 'text-xl'
          )}
        >
          {post.data.title}
        </h2>
        <p
          className={clsx(
            'text-fd-muted-foreground',
            featured ? 'text-lg' : 'line-clamp-3 text-sm leading-relaxed'
          )}
        >
          {post.data.description}
        </p>
        {post.data.tags && (
          <ul className="flex flex-wrap gap-1.5">
            {post.data.tags.slice(0, featured ? 5 : 3).map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-fd-primary/15 bg-fd-primary/8 px-2.5 py-0.5 text-xs font-medium text-fd-primary"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div
        className={clsx(
          'flex items-center justify-between gap-4',
          featured ? 'md:flex-col md:items-end md:gap-6' : 'mt-auto pt-2'
        )}
      >
        {author && (
          <span className="flex items-center gap-2.5 text-sm">
            <img src={author.image} alt="" className="size-7 rounded-full" />
            <span className="font-medium">{author.name}</span>
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-sm font-medium text-fd-primary">
          Read post
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

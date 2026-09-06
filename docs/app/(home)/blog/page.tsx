import type { Metadata } from 'next';
import Link from 'next/link';
import { blogSource } from '@/lib/source';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Release notes and announcements for React Native True Sheet.',
  alternates: { canonical: '/blog' },
};

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export default function BlogIndex() {
  const posts = blogSource
    .getPages()
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return (
    <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-12">
      <h1 className="font-heading mb-2 text-4xl font-bold tracking-tight">Blog</h1>
      <p className="mb-10 text-fd-muted-foreground">
        Release notes and announcements for React Native True Sheet.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.url}
            href={post.url}
            className="flex flex-col rounded-2xl border border-fd-border bg-fd-card p-5 transition-colors hover:border-fd-ring/40 hover:bg-fd-accent/40"
          >
            <p className="font-heading text-lg font-bold tracking-tight">{post.data.title}</p>
            <p className="mt-2 text-sm text-fd-muted-foreground">{post.data.description}</p>
            <p className="mt-auto pt-4 text-xs text-fd-primary">{formatDate(post.data.date)}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

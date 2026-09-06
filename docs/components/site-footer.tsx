import Link from 'next/link';
import { site } from '@/lib/site';

const columns = [
  {
    title: 'Docs',
    items: [
      { label: 'Introduction', href: '/v3/intro' },
      { label: 'Installation', href: '/v3/install' },
      { label: 'Usage', href: '/v3/usage' },
      { label: 'Configuration', href: '/v3/reference/configuration' },
      { label: 'Troubleshooting', href: '/v3/troubleshooting' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { label: 'Keyboard', href: '/v3/guides/keyboard' },
      { label: 'Navigation', href: '/v3/guides/navigation' },
      { label: 'Reanimated', href: '/v3/guides/reanimated' },
      { label: 'Liquid Glass', href: '/v3/guides/liquid-glass' },
      { label: 'Web', href: '/v3/guides/web' },
    ],
  },
  {
    title: 'Project',
    items: [
      { label: 'Blog', href: '/blog' },
      { label: 'GitHub', href: site.github },
      { label: 'npm', href: site.npm },
      { label: 'Changelog', href: `${site.github}/blob/main/CHANGELOG.md` },
      { label: 'Example app', href: `${site.github}/tree/main/example` },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-fd-border bg-fd-background px-4 pt-12 pb-8">
      <div className="mx-auto grid w-full max-w-[1180px] gap-8 sm:grid-cols-3">
        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="font-heading mb-3 text-sm font-bold tracking-tight text-fd-foreground">
              {column.title}
            </h3>
            <ul className="flex flex-col gap-2">
              {column.items.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-fd-muted-foreground transition-colors hover:text-fd-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-10 w-full max-w-[1180px] text-center text-sm text-fd-muted-foreground">
        Made with ❤️ by{' '}
        <a href={site.author.url} className="hover:text-fd-primary">
          {site.author.name}
        </a>
      </p>
    </footer>
  );
}

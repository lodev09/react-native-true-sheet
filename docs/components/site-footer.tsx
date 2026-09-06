import Link from 'next/link';
import { site } from '@/lib/site';

const columns = [
  {
    title: 'Docs',
    items: [
      { label: 'Introduction', href: '/intro' },
      { label: 'Installation', href: '/install' },
      { label: 'Usage', href: '/usage' },
      { label: 'Configuration', href: '/reference/configuration' },
      { label: 'Troubleshooting', href: '/troubleshooting' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { label: 'Keyboard', href: '/guides/keyboard' },
      { label: 'Navigation', href: '/guides/navigation' },
      { label: 'Reanimated', href: '/guides/reanimated' },
      { label: 'Liquid Glass', href: '/guides/liquid-glass' },
      { label: 'Web', href: '/guides/web' },
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

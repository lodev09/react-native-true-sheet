'use client';

import clsx from 'clsx';
import { usePathname } from 'fumadocs-core/framework';
import Link from 'fumadocs-core/link';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import {
  isLinkItemActive,
  LinkItem,
  type BaseSlots,
  type LinkItemType,
} from 'fumadocs-ui/layouts/shared';
import type { ComponentProps, ReactNode } from 'react';

interface SiteHeaderProps extends ComponentProps<'header'> {
  navItems: LinkItemType[];
  slots: BaseSlots;
  /** Link forced active for the current layout, e.g. Docs while inside the docs layout. */
  activeUrl?: string;
  /** Rendered on small screens in place of the inline links. */
  menu?: ReactNode;
}

export const hasUrl = (item: LinkItemType): item is Extract<LinkItemType, { url: string }> =>
  'url' in item && typeof item.url === 'string';

export function SiteHeader({
  navItems,
  slots,
  activeUrl,
  menu,
  className,
  ...props
}: SiteHeaderProps) {
  const pathname = usePathname();
  const links = navItems.filter((item) => hasUrl(item) && item.type !== 'icon');
  const icons = navItems.filter((item) => hasUrl(item) && item.type === 'icon');

  return (
    <header
      {...props}
      className={clsx('sticky z-40 h-14 bg-fd-background/80 backdrop-blur-lg', className)}
    >
      <nav className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-2 px-4">
        <slots.navTitle className="inline-flex items-center gap-2.5 font-semibold" />
        <ul className="ms-4 flex items-center gap-1 max-lg:hidden">
          {links.map((item, i) => (
            <li key={i}>
              <Link
                href={item.url}
                external={item.external}
                data-active={item.url === activeUrl || isLinkItemActive(item, pathname)}
                className="inline-flex items-center gap-1 p-2 text-sm text-fd-muted-foreground transition-colors hover:text-fd-accent-foreground data-[active=true]:text-fd-primary"
              >
                {item.text}
              </Link>
            </li>
          ))}
        </ul>
        <div className="ms-auto flex items-center gap-1.5">
          {slots.searchTrigger && (
            <slots.searchTrigger.full
              hideIfDisabled
              className="w-full max-w-[240px] rounded-full ps-2.5 max-lg:hidden"
            />
          )}
          {slots.themeSwitch && <slots.themeSwitch className="shrink-0 max-lg:hidden" />}
          {icons.map((item, i) => (
            <LinkItem
              key={i}
              item={item}
              aria-label={item.label}
              className={clsx(
                buttonVariants({ color: 'ghost', size: 'icon-sm' }),
                'shrink-0 text-fd-muted-foreground max-lg:hidden'
              )}
            >
              {item.icon}
            </LinkItem>
          ))}
          {slots.searchTrigger && (
            <slots.searchTrigger.sm hideIfDisabled className="p-2 lg:hidden" />
          )}
          <div className="flex items-center lg:hidden">{menu}</div>
        </div>
      </nav>
    </header>
  );
}

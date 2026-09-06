'use client';

import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { useHomeLayout } from 'fumadocs-ui/layouts/home';
import { LinkItem } from 'fumadocs-ui/layouts/shared';
import { Menu } from 'lucide-react';
import type { ComponentProps } from 'react';
import { hasUrl, SiteHeader } from './site-header';

export function HomeHeader(props: ComponentProps<'header'>) {
  const { navItems, menuItems, slots } = useHomeLayout();

  return (
    <SiteHeader
      {...props}
      navItems={navItems}
      slots={slots}
      className="top-0"
      menu={
        <Popover>
          <PopoverTrigger
            aria-label="Toggle Menu"
            className={buttonVariants({ color: 'ghost', size: 'icon-sm', className: '-me-1.5' })}
          >
            <Menu />
          </PopoverTrigger>
          <PopoverContent align="end" className="flex flex-col gap-1 p-2">
            {menuItems.filter(hasUrl).map((item, i) => (
              <LinkItem
                key={i}
                item={item}
                className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-fd-accent data-[active=true]:text-fd-primary [&_svg]:size-4"
              >
                {item.icon}
                {item.text}
              </LinkItem>
            ))}
            {slots.themeSwitch && <slots.themeSwitch className="mt-1 self-start" />}
          </PopoverContent>
        </Popover>
      }
    />
  );
}

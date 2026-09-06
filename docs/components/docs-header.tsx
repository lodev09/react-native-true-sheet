'use client';

import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { useNotebookLayout } from 'fumadocs-ui/layouts/notebook';
import { PanelLeft } from 'lucide-react';
import type { ComponentProps } from 'react';
import { docsUrl } from '@/lib/layout.shared';
import { SiteHeader } from './site-header';

export function DocsHeader(props: ComponentProps<'header'>) {
  const { navItems, slots } = useNotebookLayout();

  return (
    <SiteHeader
      {...props}
      navItems={navItems}
      slots={slots}
      activeUrl={docsUrl}
      className="[grid-area:header] top-(--fd-docs-row-1) layout:[--fd-header-height:--spacing(14)]"
      menu={
        slots.sidebar && (
          <slots.sidebar.trigger
            className={buttonVariants({ color: 'ghost', size: 'icon-sm', className: '-me-1.5' })}
          >
            <PanelLeft />
          </slots.sidebar.trigger>
        )
      }
    />
  );
}

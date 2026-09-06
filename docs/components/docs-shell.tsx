import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import type { ReactNode } from 'react';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';
import { DocsHeader } from './docs-header';

export function DocsShell({ children }: { children: ReactNode }) {
  const base = baseOptions();

  return (
    <DocsLayout
      {...base}
      tree={source.getPageTree()}
      nav={{ ...base.nav, mode: 'top' }}
      slots={{ header: DocsHeader }}
    >
      {children}
    </DocsLayout>
  );
}

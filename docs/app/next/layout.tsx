import type { ReactNode } from 'react';
import { DocsShell } from '@/components/docs-shell';
import { unreleased } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  return <DocsShell version={unreleased}>{children}</DocsShell>;
}

import type { ReactNode } from 'react';
import { DocsShell } from '@/components/docs-shell';
import { latest } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  return <DocsShell version={latest}>{children}</DocsShell>;
}

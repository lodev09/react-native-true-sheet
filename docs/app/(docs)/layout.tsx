import type { ReactNode } from 'react';
import { DocsShell } from '@/components/docs-shell';

export default function Layout({ children }: { children: ReactNode }) {
  return <DocsShell>{children}</DocsShell>;
}

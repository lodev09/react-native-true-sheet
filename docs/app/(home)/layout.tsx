import type { ReactNode } from 'react';
import { HomeShell } from '@/components/home-shell';

export default function Layout({ children }: { children: ReactNode }) {
  return <HomeShell>{children}</HomeShell>;
}

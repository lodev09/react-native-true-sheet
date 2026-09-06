import { HomeLayout } from 'fumadocs-ui/layouts/home';
import type { ReactNode } from 'react';
import { baseOptions } from '@/lib/layout.shared';
import { HomeHeader } from './home-header';

export function HomeShell({ children }: { children: ReactNode }) {
  return (
    <HomeLayout {...baseOptions()} slots={{ header: HomeHeader }}>
      {children}
    </HomeLayout>
  );
}

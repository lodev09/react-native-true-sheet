'use client';

import { fetchRepositoryInfo } from 'fumadocs-ui/components/github-info';
import { RootProvider } from 'fumadocs-ui/provider/next';
import dynamic from 'next/dynamic';
import { createContext, useEffect, useState, type ReactNode } from 'react';
import { site } from '@/lib/site';

const SearchDialog = dynamic(() => import('@/components/search'), { ssr: false });

export const GitHubStarsContext = createContext<number | undefined>(undefined);

export function Provider({ children }: { children: ReactNode }) {
  const [stars, setStars] = useState<number>();

  useEffect(() => {
    const [owner, repo] = new URL(site.github).pathname.slice(1).split('/');
    fetchRepositoryInfo({ owner, repo })
      .then((info) => setStars(info.stars))
      .catch((error) => console.error('Failed to load GitHub stars:', error));
  }, []);

  return (
    <RootProvider search={{ SearchDialog }}>
      <GitHubStarsContext value={stars}>{children}</GitHubStarsContext>
    </RootProvider>
  );
}

'use client';

import { fetchRepositoryInfo } from 'fumadocs-ui/components/github-info';
import { RootProvider } from 'fumadocs-ui/provider/next';
import dynamic from 'next/dynamic';
import { createContext, useEffect, useState, type ReactNode } from 'react';
import { site } from '@/lib/site';
import type { Version } from '@/lib/versions';

const SearchDialog = dynamic(() => import('@/components/search'), { ssr: false });

export const GitHubStarsContext = createContext<number | undefined>(undefined);
export const VersionsContext = createContext<Version[]>([]);

export function Provider({ versions, children }: { versions: Version[]; children: ReactNode }) {
  const [stars, setStars] = useState<number>();

  useEffect(() => {
    const [owner, repo] = new URL(site.github).pathname.slice(1).split('/');
    fetchRepositoryInfo({ owner, repo })
      .then((info) => setStars(info.stars))
      .catch((error) => console.error('Failed to load GitHub stars:', error));
  }, []);

  return (
    <VersionsContext value={versions}>
      <RootProvider search={{ SearchDialog }}>
        <GitHubStarsContext value={stars}>{children}</GitHubStarsContext>
      </RootProvider>
    </VersionsContext>
  );
}

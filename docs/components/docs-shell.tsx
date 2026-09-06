import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { LayoutTab } from 'fumadocs-ui/layouts/shared';
import type { ReactNode } from 'react';
import { baseOptions } from '@/lib/layout.shared';
import { versions, type DocsVersion } from '@/lib/source';

function versionTabs(): LayoutTab[] {
  return versions.map((version) => ({
    title: version.label,
    description: version.description,
    url: `${version.source.getPage(['intro'])?.url}`,
    urls: new Set(version.source.getPages().map((page) => page.url)),
  }));
}

export function DocsShell({ version, children }: { version: DocsVersion; children: ReactNode }) {
  return (
    <DocsLayout {...baseOptions()} tree={version.source.getPageTree()} tabs={versionTabs()}>
      {children}
    </DocsLayout>
  );
}

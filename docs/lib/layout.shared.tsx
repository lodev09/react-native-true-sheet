import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { site } from './site';

export const docsUrl = '/intro';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <img src="/img/logo.svg" alt="" width={24} height={24} />
          <span className="font-heading font-bold tracking-tight">{site.shortName}</span>
        </>
      ),
    },
    githubUrl: site.github,
    links: [
      { text: 'Docs', url: docsUrl, active: 'none' },
      { text: 'Blog', url: '/blog', active: 'nested-url' },
      { text: 'Example', url: `${site.github}/tree/main/example`, external: true },
      { text: 'Changelog', url: `${site.github}/blob/main/CHANGELOG.md`, external: true },
    ],
  };
}

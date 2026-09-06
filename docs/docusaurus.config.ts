import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const codeTheme = (backgroundColor: string) => ({
  ...prismThemes.oneDark,
  plain: { ...prismThemes.oneDark.plain, backgroundColor },
});

const config: Config = {
  title: 'React Native True Sheet',
  tagline: 'The true native bottom sheet experience for your React Native Apps.',
  favicon: '/favicon.ico',
  url: 'https://sheet.lodev09.com',
  baseUrl: '/',
  organizationName: 'lodev09',
  projectName: 'react-native-true-sheet',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  plugins: [
    [
      'vercel-analytics',
      {
        debug: true,
        mode: 'auto',
      },
    ],
  ],
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/lodev09/react-native-true-sheet/blob/main/docs/',
          versions: {
            current: {
              label: 'Unreleased',
            },
          },
        },
        blog: {
          showReadingTime: true,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        gtag: {
          trackingID: 'G-1KKZ78CJ2X',
          anonymizeIP: false,
        },
        sitemap: {
          lastmod: 'date',
        },
      } satisfies Preset.Options,
    ],
  ],
  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://github.com/lodev09',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossorigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&display=swap',
      },
    },
    {
      tagName: 'script',
      attributes: {
        type: 'application/ld+json',
      },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org/',
        '@type': 'WebSite',
        'name': 'React Native True Sheet',
        'url': 'https://sheet.lodev09.com',
        'description': 'The true native bottom sheet experience for your React Native Apps.',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': 'https://sheet.lodev09.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      }),
    },
    {
      tagName: 'script',
      attributes: {
        type: 'application/ld+json',
      },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org/',
        '@type': 'SoftwareSourceCode',
        'name': 'react-native-true-sheet',
        'description': 'The true native bottom sheet experience for your React Native Apps.',
        'url': 'https://github.com/lodev09/react-native-true-sheet',
        'codeRepository': 'https://github.com/lodev09/react-native-true-sheet',
        'programmingLanguage': ['TypeScript', 'Kotlin', 'Objective-C++', 'C++'],
        'runtimePlatform': 'React Native',
        'author': {
          '@type': 'Person',
          'name': 'Jovanni Lo',
          'url': 'https://github.com/lodev09',
          'image': 'https://github.com/lodev09.png',
          'sameAs': ['https://www.linkedin.com/in/lodev09/'],
        },
      }),
    },
  ],
  themeConfig: {
    algolia: {
      appId: 'AEIYW2K56K',
      apiKey: '41925ec2de867f214b3fac11bc69b079',
      indexName: 'sheet-lodev09',
      contextualSearch: false,
    },
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'True Sheet',
      logo: {
        alt: 'True Sheet Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docsVersionDropdown',
          position: 'left',
        },
        {
          type: 'docSidebar',
          sidebarId: 'trueSheetSidebar',
          label: 'Docs',
          position: 'right',
        },
        {
          to: '/blog',
          label: 'Blog',
          position: 'right',
        },
        {
          href: 'https://github.com/lodev09/react-native-true-sheet/tree/main/example',
          label: 'Example',
          position: 'right',
          className: 'navbar__link--plain',
        },
        {
          href: 'https://github.com/lodev09/react-native-true-sheet/blob/main/CHANGELOG.md',
          label: 'Changelog',
          position: 'right',
          className: 'navbar__link--plain',
        },
        {
          'href': 'https://github.com/lodev09/react-native-true-sheet',
          'position': 'right',
          'className': 'header-github-link',
          'aria-label': 'GitHub repository',
        },
      ],
    },
    footer: {
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Introduction', to: '/intro' },
            { label: 'Installation', to: '/install' },
            { label: 'Usage', to: '/usage' },
            { label: 'Configuration', to: '/reference/configuration' },
            { label: 'Troubleshooting', to: '/troubleshooting' },
          ],
        },
        {
          title: 'Guides',
          items: [
            { label: 'Keyboard', to: '/guides/keyboard' },
            { label: 'Navigation', to: '/guides/navigation' },
            { label: 'Reanimated', to: '/guides/reanimated' },
            { label: 'Liquid Glass', to: '/guides/liquid-glass' },
            { label: 'Web', to: '/guides/web' },
          ],
        },
        {
          title: 'Project',
          items: [
            { label: 'Blog', to: '/blog' },
            { label: 'GitHub', href: 'https://github.com/lodev09/react-native-true-sheet' },
            { label: 'npm', href: 'https://www.npmjs.com/package/@lodev09/react-native-true-sheet' },
            {
              label: 'Changelog',
              href: 'https://github.com/lodev09/react-native-true-sheet/blob/main/CHANGELOG.md',
            },
            {
              label: 'Example app',
              href: 'https://github.com/lodev09/react-native-true-sheet/tree/main/example',
            },
          ],
        },
      ],
      copyright: `Made with ❤️ by <a href="https://github.com/lodev09">Jovanni Lo</a>`,
    },
    prism: {
      theme: codeTheme('#0f1b2d'),
      darkTheme: codeTheme('#1a2d4a'),
      additionalLanguages: ['swift', 'java', 'kotlin'],
    },
    announcementBar: {
      id: '4.0.0-beta',
      content: `🚧 <b>True Sheet 4.0 beta</b> rewrites the layout engine. <code>npx expo install @lodev09/react-native-true-sheet@beta</code> <a href="/next/migration">Migration guide</a>`,
      backgroundColor: '#0f1b2d',
      textColor: '#ffffff',
    },
    image: 'img/logo.png',
    metadata: [
      {
        name: 'author',
        content: 'Jovanni Lo',
      },
      {
        name: 'keywords',
        content:
          'react native bottom sheet, native bottom sheet, ios bottom sheet, android bottom sheet, react native sheet component, fabric bottom sheet, new architecture bottom sheet, UISheetPresentationController, true sheet',
      },
      {
        name: 'twitter:card',
        content: 'summary',
      },
      {
        name: 'twitter:creator',
        content: '@lodev09',
      },
    ],
  } satisfies Preset.ThemeConfig,
};

export default config;

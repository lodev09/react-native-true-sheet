import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// import pkg from '../package.json'

const config: Config = {
  title: 'True Native Bottom Sheet',
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
      tagName: 'script',
      attributes: {
        type: 'application/ld+json',
      },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org/',
        '@type': 'Person',
        'name': 'Jovanni Lo',
        'url': 'https://github.com/lodev09',
        'image': 'https://github.com/lodev09.png',
        'jobTitle': 'Lead React Native Developer',
        'sameAs': ['https://www.linkedin.com/in/lodev09/'],
      }),
    },
    {
      tagName: 'script',
      attributes: {
        type: 'application/ld+json',
      },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org/',
        '@type': 'WebSite',
        'name': 'Installation',
        'url': 'https://sheet.lodev09.com/install',
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
        '@type': 'WebSite',
        'name': 'Configuration',
        'url': 'https://sheet.lodev09.com/reference/configuration',
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
          type: 'docSidebar',
          sidebarId: 'trueSheetSidebar',
          label: 'Docs',
          position: 'left',
        },
        {
          to: '/blog',
          label: 'Blog',
          position: 'left',
        },
        {
          href: 'https://github.com/lodev09/react-native-true-sheet/tree/main/example',
          label: 'Example',
          position: 'left',
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
      copyright: `Made with ❤️ by <a href="https://github.com/lodev09">Jovanni Lo</a>`,
    },
    prism: {
      theme: prismThemes.oneDark,
      darkTheme: prismThemes.oneDark,
      additionalLanguages: ['swift', 'java', 'kotlin'],
    },
    announcementBar: {
      id: '3.0.0-release',
      content: `🎉 <b>True Sheet 3.0</b> is here! Completely rebuilt for Fabric ⚡ <a href="/blog/release-3-0">Read the announcement →</a>`,
      backgroundColor: '#1f64ae',
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
          'bottom sheet, pure native bottom sheet, react native bottom sheet, bottom sheet documentation, fabric bottom sheet',
      },
      {
        name: 'og:title',
        content: 'True Sheet Documentation',
      },
      {
        name: 'og:type',
        content: 'application',
      },
      {
        name: 'og:description',
        content: 'The true native bottom sheet experience for your React Native Apps.',
      },
      {
        name: 'og:image',
        content: '/img/logo.png',
      },
    ],
  } satisfies Preset.ThemeConfig,
};

export default config;

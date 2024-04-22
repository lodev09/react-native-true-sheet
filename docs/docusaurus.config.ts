import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'
import pkg from './package.json'

const config: Config = {
  title: 'React Native True Sheet',
  tagline: 'The true native bottom sheet experience for your React Native Apps.',
  favicon: 'img/favicon.png',
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
  trailingSlash: false,
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
              label: pkg.version,
              badge: true,
            },
          },
        },
        blog: {
          showReadingTime: true,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
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
          position: 'right',
        },
        {
          href: 'https://github.com/lodev09/react-native-true-sheet',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      copyright: `Made with ❤️ by <a href="https://github.com/lodev09">Jovanni Lo</a>`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.palenight,
      additionalLanguages: ['swift', 'java', 'kotlin'],
    },
    image: 'img/logo.png',
    metadata: [
      {
        name: 'author',
        content: 'Marc Rousavy',
      },
      {
        name: 'keywords',
        content:
          'react, native, sheet, bottom-sheet, react-native, react-native-bottom-sheet, react-native-true-sheet, TrueSheet, True Sheet, Bottom Sheet, documentation, coding, docs, guides, lodev09, jovanni',
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
}

export default config

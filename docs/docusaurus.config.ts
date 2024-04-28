import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

// import pkg from '../package.json'

const config: Config = {
  title: 'True Native Bottom Sheet',
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
      } satisfies Preset.Options,
    ],
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
          to: '/contributing',
          label: 'Contributing',
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
      theme: prismThemes.oneDark,
      darkTheme: prismThemes.oneDark,
      additionalLanguages: ['swift', 'java', 'kotlin'],
    },
    announcementBar: {
      id: '0.11.0-dimming',
      content: `<b style="color: #47d995">Dimming</b> is now available 🎉! Checkout <a href="/guides/dimming">this guide</a> and start building your own Maps App 😎`,
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
          'bottom sheet, pure native bottom sheet, react native bottom sheet, bottom sheet documentation',
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

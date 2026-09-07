import './global.css';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics } from '@vercel/analytics/next';
import { Banner } from 'fumadocs-ui/components/banner';
import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { site } from '@/lib/site';
import { Provider } from './provider';

const heading = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  axes: ['opsz'],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  keywords: [...site.keywords],
  authors: [{ name: site.author.name, url: site.author.url }],
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: { type: 'website', siteName: site.name, images: '/img/logo.png' },
  twitter: { card: 'summary', creator: site.author.twitter },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfcfe' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0c0f' },
  ],
};

const jsonLd = [
  {
    '@context': 'https://schema.org/',
    '@type': 'WebSite',
    'name': site.name,
    'url': site.url,
    'description': site.description,
  },
  {
    '@context': 'https://schema.org/',
    '@type': 'SoftwareSourceCode',
    'name': 'react-native-true-sheet',
    'description': site.description,
    'url': site.github,
    'codeRepository': site.github,
    'programmingLanguage': ['TypeScript', 'Kotlin', 'Objective-C++', 'C++'],
    'runtimePlatform': 'React Native',
    'author': {
      '@type': 'Person',
      'name': site.author.name,
      'url': site.author.url,
      'image': site.author.image,
      'sameAs': [site.author.linkedin],
    },
  },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={heading.variable} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <Banner id="v4-beta" className="border-b bg-fd-secondary text-fd-foreground">
          <span>
            🚧 <b>True Sheet 4.0 beta</b> rewrites the layout engine.{' '}
            <code className="rounded bg-fd-accent px-1.5 py-0.5 text-xs">
              npx expo install @lodev09/react-native-true-sheet@beta
            </code>{' '}
            <Link href="/next/migration" className="underline">
              Migration guide
            </Link>
          </span>
        </Banner>
        <Provider>
          {children}
          <SiteFooter />
        </Provider>
        {jsonLd.map((data, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
          />
        ))}
        <Analytics />
        <GoogleAnalytics gaId={site.gaId} />
      </body>
    </html>
  );
}

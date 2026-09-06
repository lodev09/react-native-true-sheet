import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  agentRules: false,
  async redirects() {
    return [
      { source: '/next', destination: '/next/intro', permanent: false },
      { source: '/blog/tags/:path*', destination: '/blog', permanent: true },
      { source: '/blog/page/:page', destination: '/blog', permanent: true },
      { source: '/blog/archive', destination: '/blog', permanent: true },
    ];
  },
};

export default withMDX(config);

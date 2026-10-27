import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  agentRules: false,
  async redirects() {
    return [
      { source: '/next', destination: '/next/intro', permanent: false },
      { source: '/v3', destination: '/v3/intro', permanent: false },
    ];
  },
};

export default withMDX(config);

import fs from 'node:fs';
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

// While v3 is the latest release it lives at the root, so legacy `/v3` URLs
// redirect there. Once the release script archives it, those URLs are its own
// again and the redirects must drop out.
const v3Archived = fs.existsSync(new URL('./content/docs/v3', import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  agentRules: false,
  async redirects() {
    return [
      { source: '/next', destination: '/next/intro', permanent: false },
      ...(v3Archived
        ? []
        : [
            { source: '/v3', destination: '/intro', permanent: false },
            { source: '/v3/:path*', destination: '/:path*', permanent: false },
          ]),
      { source: '/blog/tags/:path*', destination: '/blog', permanent: true },
      { source: '/blog/page/:page', destination: '/blog', permanent: true },
      { source: '/blog/archive', destination: '/blog', permanent: true },
    ];
  },
};

export default withMDX(config);

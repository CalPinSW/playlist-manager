import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  eslint: {
    dirs: ['app', 'lib']
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*' // Allow images from all domains
      }
    ]
    // domains: ['scontent-mad1-1.xx.fbcdn.net', 'scontent-ams4-1.xx.fbcdn.net', 'mosaic.scdn.co', 'i.scdn.co']
  }
};

export default withSentryConfig(nextConfig, {
  org: 'softwire-zd',
  project: 'playlist-manager-web',
  silent: true,
  // No SENTRY_AUTH_TOKEN configured yet, so source map upload is skipped;
  // set one (from Sentry > Settings > Auth Tokens) to enable readable stack traces.
  widenClientFileUpload: true,
  webpack: {
    treeshake: { removeDebugLogging: true }
  }
});

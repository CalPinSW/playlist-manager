import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  eslint: {
    dirs: [
      'app/(pages)',
      'app/api',
      'app/components',
      'app/context',
      'app/types',
      'app/hooks',
      'app/tests',
      'app/utils',
      'lib'
    ]
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

export default nextConfig;

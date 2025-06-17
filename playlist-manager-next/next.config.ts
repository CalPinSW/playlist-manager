import type { NextConfig } from 'next';

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

export default nextConfig;

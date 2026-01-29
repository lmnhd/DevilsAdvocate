import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL || ''
  }
};

export default nextConfig;

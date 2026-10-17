import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination:
          process.env.BACKEND_INTERNAL_URL ||
          'https://zero-day-cj0b.onrender.com/api/:path*',
      },
    ];
  },
};

export default nextConfig;

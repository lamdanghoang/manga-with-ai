import type { NextConfig } from 'next';

const backend =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_PROXY_URL ||
  'https://mangawithai.duckdns.org';

const nextConfig: NextConfig = {
  transpilePackages: ['@manga-with-ai/shared'],
  async rewrites() {
    if (process.env.NODE_ENV === 'development') return [];
    const base = backend.replace(/\/$/, '');
    return [
      { source: '/v1/:path*', destination: `${base}/v1/:path*` },
      { source: '/health', destination: `${base}/health` },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const backend =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_PROXY_URL ||
  'https://mangawithai.duckdns.org';

const nextConfig: NextConfig = {
  transpilePackages: ['@manga-with-ai/shared'],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    };
    return config;
  },
  async rewrites() {
    if (process.env.NODE_ENV === 'development') return [];
    const base = backend.replace(/\/$/, '');
    return [
      { source: '/v1/:path*', destination: `${base}/v1/:path*` },
      { source: '/health', destination: `${base}/health` },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Suppresses source map upload logs during build
  silent: true,
  // Disable source map upload when no auth token is provided
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});

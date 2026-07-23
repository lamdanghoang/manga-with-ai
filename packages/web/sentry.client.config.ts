import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: 0.1, // 10% of transactions
  
  // Session replay (optional, only in production)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  // Enable in all environments while DSN is set
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Filter out noisy errors
  ignoreErrors: [
    "ResizeObserver loop",
    "Network request failed",
    "Load failed",
    "ChunkLoadError",
  ],

  environment: process.env.NODE_ENV,
});

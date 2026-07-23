import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: 0.1,

  // Only send in production
  enabled: process.env.NODE_ENV === "production",

  environment: process.env.NODE_ENV || "development",

  // Filter noisy errors
  ignoreErrors: [
    "ECONNRESET",
    "EPROTO",
    "socket hang up",
  ],
});

export default Sentry;

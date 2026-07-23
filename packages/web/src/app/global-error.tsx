"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-4">
        <div className="border-4 border-on-surface bg-surface-container p-6 max-w-sm w-full comic-shadow text-center">
          <p className="text-3xl mb-2">💥</p>
          <h2 className="font-display text-xl uppercase text-primary mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-secondary mb-4">
            An unexpected error occurred. Our team has been notified.
          </p>
          <button
            onClick={reset}
            className="font-label text-xs font-bold uppercase px-4 py-2 border-2 border-on-surface bg-primary text-white comic-shadow-sm active:translate-y-0.5 transition-all"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}

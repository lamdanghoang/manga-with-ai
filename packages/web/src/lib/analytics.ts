// Simple event tracking - can be replaced with GA4/Mixpanel later
const ANALYTICS_ENDPOINT = process.env.NEXT_PUBLIC_API_URL;

export function trackEvent(event: string, props?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  // Fire and forget
  fetch(`${ANALYTICS_ENDPOINT}/v1/analytics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, props, timestamp: Date.now() }),
  }).catch(() => {});
}

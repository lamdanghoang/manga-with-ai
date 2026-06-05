/** API base URL for fetch calls. */
export function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:4000';
    }
    // Production on Vercel: same-origin, proxied via next.config rewrites
    return '';
  }
  return 'http://localhost:4000';
}

export async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const base = getApiUrl();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }), ...opts?.headers },
    });
  } catch {
    const origin = typeof window !== 'undefined' ? window.location.origin : base;
    throw new Error(`Cannot reach API (${base || origin}). Check API proxy / redeploy.`);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error || res.statusText);
  return body as T;
}

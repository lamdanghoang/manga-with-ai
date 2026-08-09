import { Request, Response, NextFunction } from "express";
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
export function rateLimit(options: { windowMs: number; max: number; key: (req: Request) => string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now(); const key = options.key(req); const old = buckets.get(key);
    const bucket = !old || old.resetAt <= now ? { count: 0, resetAt: now + options.windowMs } : old;
    bucket.count++; buckets.set(key, bucket);
    if (bucket.count > options.max) { res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000)); res.status(429).json({ error: "Too many requests" }); return; }
    next();
  };
}
export function requestIp(req: Request) { return (req.ip || req.socket.remoteAddress || "unknown").replace(/^::ffff:/, ""); }

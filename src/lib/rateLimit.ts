import { NextResponse } from "next/server";

/**
 * A small fixed-window rate limiter. In-memory, so it bounds abuse per server
 * instance (and in dev) without extra infrastructure; for multi-instance
 * production, back `hit` with Redis/Upstash — the call sites don't change.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/** Record a hit against `key`; returns whether it's within `limit` per window. */
export function hit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): RateLimitResult {
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }
  if (b.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: b.resetAt - now };
  }
  b.count += 1;
  return { allowed: true, remaining: limit - b.count, retryAfterMs: 0 };
}

/** Best-effort client IP from proxy headers. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Enforce a per-IP limit for a named action. Returns a ready 429 response to
 * return, or null when the request may proceed.
 */
export function enforceRateLimit(
  req: Request,
  name: string,
  opts: { limit: number; windowMs: number }
): NextResponse | null {
  const result = hit(`${name}:${clientIp(req)}`, opts.limit, opts.windowMs);
  if (result.allowed) return null;
  return NextResponse.json(
    { success: false, errors: ["Too many requests — please slow down."] },
    { status: 429, headers: { "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)) } }
  );
}

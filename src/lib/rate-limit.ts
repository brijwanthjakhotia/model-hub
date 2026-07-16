import "server-only";
import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 20_000;

export type RateLimitResult = { ok: boolean; retryAfterSec: number };

/**
 * Best-effort fixed-window rate limiter.
 *
 * State lives in-process, so it only limits within a single server instance —
 * fine for local/single-instance deployments; a multi-instance or serverless
 * setup needs a shared store (Redis/Upstash). It's a real speed bump against
 * online password-guessing, not a distributed guarantee.
 *
 * `now` is injectable so the window logic is unit-testable without fake timers.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    evict(now);
    return { ok: true, retryAfterSec: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  return { ok: true, retryAfterSec: 0 };
}

/** Bound memory: drop expired entries, then oldest-first if still over the cap. */
function evict(now: number) {
  if (buckets.size <= MAX_BUCKETS) return;
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  while (buckets.size > MAX_BUCKETS) {
    const oldest = buckets.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    buckets.delete(oldest);
  }
}

/** Test-only: clear in-process state so cases don't leak into each other. */
export function __resetRateLimit() {
  buckets.clear();
}

/**
 * Best-effort client IP for rate-limit keys.
 *
 * `X-Forwarded-For` is client-spoofable unless the app sits behind a proxy that
 * appends it. Set `TRUSTED_PROXY_HOPS` to the number of proxies in front of the
 * app and we read the entry the closest trusted proxy added (Nth from the
 * right). With no trusted proxy configured we do NOT trust the header and return
 * a constant: the per-account rate-limit keys (which include the email) still
 * bound brute force regardless of IP, and the coarse per-IP cap merely collapses
 * to one shared bucket — which an attacker can't rotate around.
 */
const TRUSTED_PROXY_HOPS = Math.max(
  0,
  Math.trunc(Number(process.env.TRUSTED_PROXY_HOPS)) || 0,
);

export async function clientIp(): Promise<string> {
  const h = await headers();
  if (TRUSTED_PROXY_HOPS > 0) {
    const xff = h.get("x-forwarded-for");
    if (xff) {
      const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
      const idx = parts.length - TRUSTED_PROXY_HOPS;
      if (idx >= 0 && parts[idx]) return parts[idx];
    }
    const real = h.get("x-real-ip");
    if (real) return real.trim();
  }
  return "shared";
}

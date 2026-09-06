// lib/security/rate-limit.ts
import 'server-only';
import type { NextRequest } from 'next/server';

type Bucket = { count: number; resetAt: number };

/**
 * Fixed-window limiter held in module scope. On Vercel this is per lambda
 * instance — enough to blunt scripted abuse of the public endpoints without a
 * Redis dependency. Swap `hit()` for Upstash if you need global counters.
 */
const BUCKETS = new Map<string, Bucket>();
const MAX_KEYS = 5000;

export function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? '0.0.0.0';
}

export type RateVerdict = { ok: true } | { ok: false; retryAfter: number };

export function hit(key: string, limit: number, windowMs: number): RateVerdict {
  const now = Date.now();

  if (BUCKETS.size > MAX_KEYS) {
    for (const [k, v] of BUCKETS) if (v.resetAt <= now) BUCKETS.delete(k);
    if (BUCKETS.size > MAX_KEYS) BUCKETS.clear();
  }

  const bucket = BUCKETS.get(key);

  if (!bucket || bucket.resetAt <= now) {
    BUCKETS.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true };
}

export function limitRequest(
  request: NextRequest,
  scope: string,
  limit: number,
  windowMs: number,
): RateVerdict {
  return hit(`${scope}:${clientIp(request)}`, limit, windowMs);
}

export function tooMany(retryAfter: number): Response {
  return new Response(JSON.stringify({ error: 'RATE_LIMITED', retryAfter }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfter),
    },
  });
}

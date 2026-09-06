// lib/b2b/access.ts
import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * B2B access without an account.
 *
 * A buyer identifies themselves once — name, company, position, phone — and we
 * hand back a signed cookie that unlocks the catalogue for 30 days. There is no
 * password, no signup e-mail and no session to manage, which is the whole point:
 * an acquisitions head evaluating a title will fill in four fields, but will not
 * create an account.
 *
 * The cookie is a signed claim, not a bearer secret: it carries the lead id and
 * an expiry, signed with B2B_ACCESS_SECRET. It grants exactly one thing — the
 * public catalogue — and nothing in it is trusted for anything else.
 */

const COOKIE = 'cap_b2b';
const MAX_AGE_S = 60 * 60 * 24 * 30;

function secret(): string | null {
  return process.env.B2B_ACCESS_SECRET ?? process.env.CRON_SECRET ?? null;
}

function sign(payload: string, key: string): string {
  return createHmac('sha256', key).update(payload).digest('base64url');
}

export function issueToken(leadId: string): string | null {
  const key = secret();
  if (!key) return null;

  const payload = `${leadId}.${Date.now() + MAX_AGE_S * 1000}`;
  return `${payload}.${sign(payload, key)}`;
}

export type LeadClaim = { leadId: string; expires: number };

export function verifyToken(token: string | undefined): LeadClaim | null {
  const key = secret();
  if (!key || !token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [leadId, expiresRaw, signature] = parts as [string, string, string];
  const payload = `${leadId}.${expiresRaw}`;
  const expected = sign(payload, key);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires < Date.now()) return null;

  return { leadId, expires };
}

export async function setAccessCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_S,
  });
}

export async function readAccessCookie(): Promise<LeadClaim | null> {
  const jar = await cookies();
  return verifyToken(jar.get(COOKIE)?.value);
}

export const B2B_COOKIE = COOKIE;

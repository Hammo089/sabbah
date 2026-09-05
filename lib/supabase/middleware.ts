// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database.types';

export type SessionRefresh = {
  user: { id: string; email?: string } | null;
  /** false when Supabase could not be reached or is not configured. */
  ok: boolean;
};

/**
 * Refreshes the Supabase auth cookie and writes the rotated cookies onto the
 * outgoing response.
 *
 * NEVER throws. Middleware runs on every request, so an unhandled error here
 * takes the entire site down with MIDDLEWARE_INVOCATION_FAILED — including
 * fully static pages that do not need auth at all. A missing env var or a
 * Supabase outage must degrade to "nobody is signed in", not to a 500.
 */
export async function refreshSupabaseSession(
  request: NextRequest,
  response: NextResponse,
): Promise<SessionRefresh> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error(
      '[middleware] Supabase env vars missing — auth disabled for this request. ' +
        'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
    return { user: null, ok: false };
  }

  try {
    const supabase = createServerClient<Database>(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return { user: user ? { id: user.id, email: user.email } : null, ok: true };
  } catch (error) {
    console.error('[middleware] Supabase session refresh failed:', error);
    return { user: null, ok: false };
  }
}

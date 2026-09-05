// app/api/admin/people/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile, isStaff } from '@/lib/auth/rbac';
import { isLocale } from '@/i18n/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Query = z.object({
  q: z.string().min(1).max(80),
  lang: z.string().refine(isLocale).default('ar'),
});

export async function GET(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  const parsed = Query.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ people: [] });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('search_people', {
    q: parsed.data.q,
    lang: parsed.data.lang,
    max_results: 10,
  });

  if (error) {
    console.error('[admin/people]', error);
    return NextResponse.json({ people: [] });
  }

  return NextResponse.json({ people: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

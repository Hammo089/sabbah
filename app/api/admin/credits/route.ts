// app/api/admin/credits/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile, isStaff } from '@/lib/auth/rbac';
import { isLocale } from '@/i18n/config';
import { t } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Query = z.object({
  seriesId: z.string().uuid(),
  lang: z.string().refine(isLocale).default('ar'),
});

export async function GET(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  const parsed = Query.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_QUERY' }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('credits')
    .select('id, kind, role, character, people(name)')
    .eq('series_id', parsed.data.seriesId)
    .order('sort_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type Row = { id: string; kind: 'cast' | 'crew'; role: string | null; character: unknown; people: { name: unknown } | null };

  const credits = ((data ?? []) as unknown as Row[]).map((c) => ({
    id: c.id,
    kind: c.kind,
    role: c.role,
    character: t(c.character, parsed.data.lang, ''),
    name: t(c.people?.name, parsed.data.lang, ''),
  }));

  return NextResponse.json({ credits }, { headers: { 'Cache-Control': 'no-store' } });
}

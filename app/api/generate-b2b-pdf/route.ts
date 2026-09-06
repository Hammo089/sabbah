// app/api/generate-b2b-pdf/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buildB2BCatalogPdf, type CatalogTitle } from '@/lib/pdf/b2b-catalog';
import { t } from '@/lib/utils';
import { limitRequest, tooMany } from '@/lib/security/rate-limit';
import { readAccessCookie } from '@/lib/b2b/access';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const QuerySchema = z.object({
  lang: z.enum(['ar', 'en', 'fr']).default('en'),
  status: z.enum(['available', 'optioned', 'licensed', 'all']).default('available'),
  territory: z.string().trim().max(8).optional(),
});

type LicenseRow = {
  territory: string[] | null;
  rights: string[] | null;
  drm: string;
  status: string;
  starts_on: string | null;
  ends_on: string | null;
  series: {
    title: unknown;
    synopsis: unknown;
    year: number | null;
    genres: string[] | null;
    seasons_count: number | null;
    episodes_count: number | null;
    original_language: string | null;
    status: string;
  } | null;
};

export async function GET(request: NextRequest) {
  const gate = limitRequest(request, 'b2b-pdf', 10, 60_000);
  if (!gate.ok) return tooMany(gate.retryAfter);

  const parsed = QuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );

  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_QUERY', issues: parsed.error.flatten() }, { status: 400 });
  }

  const { lang, status, territory } = parsed.data;
  const supabase = await createSupabaseServerClient();

  // ---- Who is asking -------------------------------------------------------
  // Two ways in, and only two. Either a signed-in staff/B2B account, or an
  // identified buyer holding a valid lead cookie. Buyers are deliberately NOT
  // made to register: they gave us name, company, position and phone once, and
  // that is the whole gate.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name: string | null; company_name: string | null; email: string | null } | null = null;

  if (user) {
    const { data } = await supabase
      .from('users_profiles')
      .select('role, is_active, full_name, company_name, email')
      .eq('id', user.id)
      .single();

    const allowed = ['super_admin', 'admin', 'b2b_client'];
    if (!data?.is_active || !allowed.includes(data.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    profile = { full_name: data.full_name, company_name: data.company_name, email: data.email };
  } else {
    const claim = await readAccessCookie();
    if (!claim) {
      // 403, not 401: there is no login to send them to. The page shows the
      // identify-yourself form instead.
      return NextResponse.json({ error: 'IDENTIFY_REQUIRED' }, { status: 403 });
    }

    try {
      const admin = createSupabaseAdminClient();
      const { data: lead } = await admin
        .from('b2b_leads')
        .select('id, full_name, company, downloads')
        .eq('id', claim.leadId)
        .maybeSingle();

      if (!lead) return NextResponse.json({ error: 'IDENTIFY_REQUIRED' }, { status: 403 });

      profile = { full_name: lead.full_name, company_name: lead.company, email: null };

      await admin
        .from('b2b_leads')
        .update({ downloads: (lead.downloads ?? 0) + 1, last_seen: new Date().toISOString() })
        .eq('id', lead.id);
    } catch {
      return NextResponse.json({ error: 'UNAVAILABLE' }, { status: 503 });
    }
  }

  // ---- Data ----------------------------------------------------------------
  // RLS on drm_licenses restricts SELECT to super_admin. For admin/b2b_client the
  // service-role read below is deliberately narrowed to non-sensitive columns:
  // license keys, fees and contract refs are never selected.
  let query = supabase
    .from('drm_licenses')
    .select(
      `territory, rights, drm, status, starts_on, ends_on,
       series:series_id ( title, synopsis, year, genres, seasons_count, episodes_count, original_language, status )`,
    )
    .not('series_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(300);

  if (status !== 'all') query = query.eq('status', status);
  if (territory) query = query.contains('territory', [territory.toUpperCase()]);

  const { data, error } = await query.returns<LicenseRow[]>();

  if (error) {
    return NextResponse.json({ error: 'QUERY_FAILED', detail: error.message }, { status: 500 });
  }

  const titles: CatalogTitle[] = (data ?? [])
    .filter((row) => row.series && row.series.status === 'published')
    .map((row) => ({
      title: t(row.series!.title, lang, 'Untitled'),
      synopsis: t(row.series!.synopsis, lang, ''),
      year: row.series!.year,
      genres: row.series!.genres ?? [],
      seasons: row.series!.seasons_count,
      episodes: row.series!.episodes_count,
      language: row.series!.original_language,
      territories: row.territory ?? [],
      rights: row.rights ?? [],
      drm: row.drm,
      status: row.status,
      availableFrom: row.starts_on,
      availableUntil: row.ends_on,
    }));

  if (titles.length === 0) {
    return NextResponse.json({ error: 'NO_TITLES_AVAILABLE' }, { status: 404 });
  }

  // ---- Render --------------------------------------------------------------
  const bytes = await buildB2BCatalogPdf({
    generatedFor: profile?.company_name || profile?.full_name || profile?.email || 'Cedars Art Production',
    generatedAt: new Date(),
    locale: lang,
    titles,
  });

  const filename = `CAP-Licensing-Catalogue-${new Date().toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(bytes.byteLength),
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

// app/api/search/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { searchCatalog, MAX_QUERY_LENGTH } from '@/lib/queries/search';
import { isLocale } from '@/i18n/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  q: z.string().min(1).max(MAX_QUERY_LENGTH),
  lang: z.string().refine(isLocale, 'unsupported locale').default('ar'),
  types: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(8),
});

export async function GET(request: NextRequest) {
  const parsed = QuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );

  if (!parsed.success) {
    return NextResponse.json({ results: [], suggestions: [], error: 'INVALID_QUERY' }, { status: 400 });
  }

  const { q, lang, types, limit } = parsed.data;

  const allowedTypes = ['series', 'movie', 'program'] as const;
  const typeFilter = types
    ?.split(',')
    .map((t) => t.trim())
    .filter((t): t is (typeof allowedTypes)[number] =>
      (allowedTypes as readonly string[]).includes(t),
    );

  const payload = await searchCatalog(
    q,
    lang,
    { types: typeFilter?.length ? typeFilter : undefined },
    limit,
  );

  return NextResponse.json(payload, {
    headers: {
      // Public catalogue data: safe to cache briefly at the edge, and the
      // stale window keeps the dropdown instant while it revalidates.
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}

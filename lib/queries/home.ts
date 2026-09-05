// lib/queries/home.ts
import 'server-only';
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { t } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

export type HeroPoster = {
  id: string;
  slug: string;
  title: string;
  year: number | null;
  posterUrl: string;
};

const MIN_POSTERS = 12;

/**
 * Featured slider posters.
 * 1. `is_featured_slider = true` (curated by admin) — ordered by sort_order.
 * 2. Topped up with the newest published series if the curation is thin,
 *    so the marquee never renders with visible gaps.
 */
export const getHeroPosters = cache(async (lang: Locale): Promise<HeroPoster[]> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('[home] Supabase env vars missing — hero renders without posters.');
    return [];
  }
  try {
    return await fetchHeroPosters(lang);
  } catch (error) {
    console.error('[home] hero posters failed:', error);
    return [];
  }
});

const fetchHeroPosters = async (lang: Locale): Promise<HeroPoster[]> => {
  const supabase = await createSupabaseServerClient();

  const { data: featured } = await supabase
    .from('series')
    .select('id, slug, title, year, poster_url, sort_order')
    .eq('status', 'published')
    .eq('is_featured_slider', true)
    .not('poster_url', 'is', null)
    .order('sort_order', { ascending: true })
    .limit(24);

  const rows = featured ?? [];

  if (rows.length < MIN_POSTERS) {
    const { data: fallback } = await supabase
      .from('series')
      .select('id, slug, title, year, poster_url, sort_order')
      .eq('status', 'published')
      .not('poster_url', 'is', null)
      .order('year', { ascending: false })
      .limit(MIN_POSTERS * 2);

    const seen = new Set(rows.map((r) => r.id));
    for (const row of fallback ?? []) {
      if (rows.length >= MIN_POSTERS * 2) break;
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      rows.push(row);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: t(row.title, lang, 'Untitled'),
    year: row.year,
    posterUrl: row.poster_url as string,
  }));
};

export const getLibraryCount = cache(async (): Promise<number> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return 0;
  try {
    const supabase = await createSupabaseServerClient();
    const { count } = await supabase
      .from('series')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published');
    return count ?? 0;
  } catch (error) {
    console.error('[home] library count failed:', error);
    return 0;
  }
});

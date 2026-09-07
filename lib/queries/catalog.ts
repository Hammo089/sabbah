// lib/queries/catalog.ts
import 'server-only';
import { cache } from 'react';
import { createSupabaseAnonClient } from '@/lib/supabase/server';
import { t } from '@/lib/utils';
import type { Locale } from '@/i18n/config';
import type { TitleKind, RegionCode } from '@/types/database.types';

export type CatalogCard = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  year: number | null;
  seasons: number;
  posterUrl: string | null;
  kind: TitleKind;
  region: RegionCode;
  isNew: boolean;
  isComingSoon: boolean;
};

export type CatalogFilters = {
  kind?: TitleKind;
  region?: RegionCode;
  genre?: string;
  year?: number;
  script?: boolean;
};

export type VideoKind =
  | 'trailer'
  | 'teaser'
  | 'clip'
  | 'opening'
  | 'behind_scenes'
  | 'interview'
  | 'promo';

export type TitleVideo = {
  id: string;
  kind: VideoKind;
  label: string;
  youtubeId: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  isPrimary: boolean;
};

/**
 * YouTube publishes a predictable thumbnail for every video, so a row that
 * skipped the optional thumbnail field still gets a poster on the rail.
 * maxres is missing on older uploads; hqdefault always exists.
 */
function youtubeThumb(id: string | null): string | null {
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

function guard(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function toCard(row: Record<string, unknown>, lang: Locale): CatalogCard {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: t(row.title, lang, row.slug as string),
    subtitle: t(row.subtitle, lang, ''),
    year: (row.year as number | null) ?? null,
    seasons: (row.seasons_count as number) ?? 1,
    posterUrl: (row.poster_url as string | null) ?? null,
    kind: (row.kind as TitleKind) ?? 'series',
    region: (row.region as RegionCode) ?? 'levant',
    isNew: Boolean(row.is_new),
    isComingSoon: Boolean(row.is_coming_soon),
  };
}

const SELECT =
  'id, slug, title, subtitle, year, seasons_count, poster_url, kind, region, is_new, is_coming_soon';

export const getCatalog = cache(
  async (lang: Locale, filters: CatalogFilters = {}, limit = 60, offset = 0) => {
    if (!guard()) return { items: [] as CatalogCard[], total: 0 };

    try {
      const supabase = createSupabaseAnonClient();
      let query = supabase
        .from('series')
        .select(SELECT, { count: 'exact' })
        .eq('status', 'published')
        .eq('is_script', filters.script ?? false)
        .order('sort_order', { ascending: true })
        .range(offset, offset + limit - 1);

      if (filters.kind) query = query.eq('kind', filters.kind);
      if (filters.region) query = query.eq('region', filters.region);
      if (filters.genre) query = query.contains('genres', [filters.genre]);
      if (filters.year) query = query.eq('year', filters.year);

      const { data, count } = await query;
      return { items: (data ?? []).map((r) => toCard(r, lang)), total: count ?? 0 };
    } catch (error) {
      console.error('[catalog]', error);
      return { items: [] as CatalogCard[], total: 0 };
    }
  },
);

/** Homepage rails: hits, newest, coming soon. */
export const getRails = cache(async (lang: Locale) => {
  if (!guard()) return { hits: [], fresh: [], soon: [] };

  try {
    const supabase = createSupabaseAnonClient();
    const base = () =>
      supabase.from('series').select(SELECT).eq('status', 'published').eq('is_script', false);

    const [hits, fresh, soon] = await Promise.all([
      base().eq('is_hit', true).order('sort_order').limit(18),
      base().eq('is_new', true).order('year', { ascending: false }).limit(18),
      base().eq('is_coming_soon', true).order('sort_order').limit(18),
    ]);

    return {
      hits: (hits.data ?? []).map((r) => toCard(r, lang)),
      fresh: (fresh.data ?? []).map((r) => toCard(r, lang)),
      soon: (soon.data ?? []).map((r) => toCard(r, lang)),
    };
  } catch (error) {
    console.error('[rails]', error);
    return { hits: [], fresh: [], soon: [] };
  }
});

export type TitleDetail = Awaited<ReturnType<typeof getTitleBySlug>>;

export const getTitleBySlug = cache(async (slug: string, lang: Locale) => {
  if (!guard()) return null;

  try {
    const supabase = createSupabaseAnonClient();

    const { data: row } = await supabase
      .from('series')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (!row) return null;

    const [credits, episodes, media, casters, videos] = await Promise.all([
      supabase
        .from('credits')
        .select('id, kind, role, character, sort_order, people(id, slug, name, photo_url)')
        .eq('series_id', row.id)
        .order('sort_order'),
      supabase
        .from('episodes')
        .select('id, season_number, episode_number, title, duration_seconds, thumbnail_url, air_date')
        .eq('series_id', row.id)
        .eq('status', 'published')
        .order('season_number')
        .order('episode_number'),
      supabase
        .from('media_assets')
        .select('id, url, caption, asset_type')
        .eq('series_id', row.id)
        .order('sort_order'),
      supabase
        .from('title_broadcasters')
        .select('broadcasters(id, name, logo_url, site_url)')
        .eq('series_id', row.id),
      supabase
        .from('title_videos')
        .select('id, kind, label, youtube_id, url, thumbnail_url, duration_seconds, is_primary, sort_order')
        .eq('series_id', row.id)
        .order('is_primary', { ascending: false })
        .order('sort_order'),
    ]);

    type CreditRow = {
      id: string;
      kind: 'cast' | 'crew';
      role: string | null;
      character: unknown;
      people: { id: string; slug: string; name: unknown; photo_url: string | null } | null;
    };

    const creditRows = (credits.data ?? []) as unknown as CreditRow[];

    return {
      id: row.id,
      slug: row.slug,
      title: t(row.title, lang, row.slug),
      subtitle: t(row.subtitle, lang, ''),
      synopsis: t(row.synopsis, lang, ''),
      year: row.year,
      seasons: row.seasons_count,
      episodesCount: row.episodes_count,
      genres: (row.genres ?? []) as string[],
      region: row.region as RegionCode,
      kind: row.kind as TitleKind,
      country: row.production_country as string | null,
      language: row.original_language as string,
      subtitleLangs: (row.subtitle_langs ?? []) as string[],
      posterUrl: row.poster_url as string | null,
      backdropUrl: row.backdrop_url as string | null,
      youtubeId: row.youtube_id as string | null,
      trailerUrl: row.trailer_url as string | null,
      isComingSoon: Boolean(row.is_coming_soon),
      cast: creditRows
        .filter((c) => c.kind === 'cast' && c.people)
        .map((c) => ({
          id: c.id,
          personSlug: c.people!.slug,
          name: t(c.people!.name, lang, ''),
          photoUrl: c.people!.photo_url,
          character: t(c.character, lang, ''),
        })),
      crew: creditRows
        .filter((c) => c.kind === 'crew' && c.people)
        .map((c) => ({
          id: c.id,
          personSlug: c.people!.slug,
          name: t(c.people!.name, lang, ''),
          photoUrl: c.people!.photo_url,
          role: c.role ?? '',
        })),
      episodes: (episodes.data ?? []).map((e) => ({
        id: e.id,
        season: e.season_number,
        number: e.episode_number,
        title: t(e.title, lang, `#${e.episode_number}`),
        duration: e.duration_seconds,
        thumbnailUrl: e.thumbnail_url,
        airDate: e.air_date,
      })),
      media: (media.data ?? []).map((m) => ({
        id: m.id,
        url: m.url,
        caption: t(m.caption, lang, ''),
        type: m.asset_type,
      })),
      broadcasters: (casters.data ?? [])
        .map((b) => (b as unknown as { broadcasters: { id: string; name: string; logo_url: string | null; site_url: string | null } | null }).broadcasters)
        .filter(Boolean) as { id: string; name: string; logo_url: string | null; site_url: string | null }[],
      videos: (videos.data ?? []).map((v) => ({
        id: v.id as string,
        kind: v.kind as VideoKind,
        // Falls back to the kind label so a video with no title still reads
        // as something ("Teaser") rather than an empty chip.
        label: t(v.label, lang, ''),
        youtubeId: v.youtube_id as string | null,
        url: v.url as string | null,
        thumbnailUrl: (v.thumbnail_url as string | null) ?? youtubeThumb(v.youtube_id as string | null),
        duration: v.duration_seconds as number | null,
        isPrimary: Boolean(v.is_primary),
      })),
    };
  } catch (error) {
    console.error('[title]', error);
    return null;
  }
});

export const getPersonBySlug = cache(async (slug: string, lang: Locale) => {
  if (!guard()) return null;

  try {
    const supabase = createSupabaseAnonClient();

    const { data: person } = await supabase
      .from('people')
      .select('id, slug, name, bio, photo_url, birth_year, nationality')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (!person) return null;

    const { data: credits } = await supabase
      .from('credits')
      .select('kind, role, character, series(slug, title, poster_url, year, status)')
      .eq('person_id', person.id);

    type Row = {
      kind: 'cast' | 'crew';
      role: string | null;
      character: unknown;
      series: { slug: string; title: unknown; poster_url: string | null; year: number | null; status: string } | null;
    };

    return {
      slug: person.slug,
      name: t(person.name, lang, person.slug),
      bio: t(person.bio, lang, ''),
      photoUrl: person.photo_url,
      birthYear: person.birth_year,
      nationality: person.nationality,
      titles: ((credits ?? []) as unknown as Row[])
        .filter((c) => c.series && c.series.status === 'published')
        .map((c) => ({
          slug: c.series!.slug,
          title: t(c.series!.title, lang, c.series!.slug),
          posterUrl: c.series!.poster_url,
          year: c.series!.year,
          role: c.kind === 'cast' ? t(c.character, lang, '') : (c.role ?? ''),
        })),
    };
  } catch (error) {
    console.error('[person]', error);
    return null;
  }
});

export const getAllPublishedSlugs = cache(async (): Promise<string[]> => {
  if (!guard()) return [];
  try {
    const supabase = createSupabaseAnonClient();
    const { data } = await supabase.from('series').select('slug').eq('status', 'published').limit(1000);
    return (data ?? []).map((r) => r.slug);
  } catch {
    return [];
  }
});

export const getPublishedSlugsByKind = cache(async (kind: TitleKind): Promise<string[]> => {
  if (!guard()) return [];
  try {
    const supabase = createSupabaseAnonClient();
    const { data } = await supabase
      .from('series')
      .select('slug')
      .eq('status', 'published')
      .eq('kind', kind)
      .limit(1000);
    return (data ?? []).map((r) => r.slug);
  } catch {
    return [];
  }
});


export type PartnerCard = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  siteUrl: string | null;
  titleCount: number;
};

/** Every broadcaster/platform that carries our work, with how much they hold. */
export const getPartners = cache(async (): Promise<PartnerCard[]> => {
  if (!guard()) return [];
  try {
    const supabase = createSupabaseAnonClient();
    const { data } = await supabase
      .from('broadcasters')
      .select('id, slug, name, logo_url, site_url, title_broadcasters(broadcaster_id)')
      .order('sort_order');

    return (data ?? []).map((row) => {
      const r = row as unknown as {
        id: string;
        slug: string;
        name: string;
        logo_url: string | null;
        site_url: string | null;
        title_broadcasters: unknown[] | null;
      };

      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        logoUrl: r.logo_url,
        siteUrl: r.site_url,
        titleCount: r.title_broadcasters?.length ?? 0,
      };
    });
  } catch (error) {
    console.error('[partners]', error);
    return [];
  }
});

/** One platform plus every published title it acquired from us. */
export const getPartnerBySlug = cache(
  async (slug: string, lang: Locale) => {
    if (!guard()) return null;
    try {
      const supabase = createSupabaseAnonClient();

      const { data: partner } = await supabase
        .from('broadcasters')
        .select('id, slug, name, logo_url, site_url')
        .eq('slug', slug)
        .maybeSingle();

      if (!partner) return null;

      const { data: links } = await supabase
        .from('title_broadcasters')
        .select('series_id')
        .eq('broadcaster_id', partner.id);

      const ids = (links ?? [])
        .map((l) => (l as { series_id: string | null }).series_id)
        .filter((id): id is string => Boolean(id));

      let titles: CatalogCard[] = [];

      if (ids.length > 0) {
        const { data: rows } = await supabase
          .from('series')
          .select(SELECT)
          .in('id', ids)
          .eq('status', 'published')
          .order('year', { ascending: false, nullsFirst: false })
          .limit(200);

        titles = (rows ?? []).map((row) => toCard(row as Record<string, unknown>, lang));
      }

      return {
        id: partner.id,
        slug: partner.slug,
        name: partner.name,
        logoUrl: partner.logo_url,
        siteUrl: partner.site_url,
        titles,
      };
    } catch (error) {
      console.error('[partner]', error);
      return null;
    }
  },
);

export const getAllBroadcasters = cache(async () => {
  if (!guard()) return [];
  try {
    const supabase = createSupabaseAnonClient();
    const { data } = await supabase
      .from('broadcasters')
      .select('id, name, logo_url, site_url')
      .order('sort_order');
    return data ?? [];
  } catch (error) {
    console.error('[broadcasters]', error);
    return [];
  }
});

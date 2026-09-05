// lib/queries/search.ts
import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Locale } from '@/i18n/config';
import type { SearchResultRow } from '@/types/database.types';

export type SearchFilters = {
  types?: ('series' | 'movie' | 'program')[];
  genres?: string[];
  yearFrom?: number;
  yearTo?: number;
};

export type SearchResponse = {
  results: SearchResultRow[];
  suggestions: string[];
  query: string;
  took: number;
};

export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 80;

/** Trims and caps the query; returns null when it is not worth a round trip. */
export function sanitizeQuery(raw: string | null | undefined): string | null {
  const q = (raw ?? '').trim().slice(0, MAX_QUERY_LENGTH);
  return q.length >= MIN_QUERY_LENGTH ? q : null;
}

export async function searchCatalog(
  query: string,
  lang: Locale,
  filters: SearchFilters = {},
  limit = 20,
  offset = 0,
): Promise<SearchResponse> {
  const started = Date.now();
  const q = sanitizeQuery(query);

  if (!q) return { results: [], suggestions: [], query: query ?? '', took: 0 };

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc('search_catalog', {
    q,
    lang,
    types: filters.types ?? null,
    genre_filter: filters.genres ?? null,
    year_from: filters.yearFrom ?? null,
    year_to: filters.yearTo ?? null,
    max_results: Math.min(Math.max(limit, 1), 50),
    skip: Math.max(offset, 0),
  });

  if (error) {
    console.error('[search_catalog]', error);
    return { results: [], suggestions: [], query: q, took: Date.now() - started };
  }

  const results = (data ?? []) as SearchResultRow[];

  // Only pay for "did you mean" when the search came up empty.
  let suggestions: string[] = [];
  if (results.length === 0) {
    const { data: sugg } = await supabase.rpc('search_suggest', { q, lang, max_results: 4 });
    suggestions = (sugg ?? []).map((s) => s.suggestion).filter(Boolean);
  }

  return { results, suggestions, query: q, took: Date.now() - started };
}

/** Route for a result row, respecting the entity type. */
export function resultHref(lang: Locale, row: Pick<SearchResultRow, 'entity_type' | 'slug'>): string {
  const segment =
    row.entity_type === 'movie' ? 'movies' : row.entity_type === 'program' ? 'programs' : 'series';
  return `/${lang}/${segment}/${row.slug}`;
}

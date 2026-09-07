// lib/queries/pages.ts
import 'server-only';
import { cache } from 'react';
import { createSupabaseAnonClient } from '@/lib/supabase/server';
import { t } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

/**
 * Queries behind the company pages — press, services, team.
 *
 * Each returns an empty array rather than throwing when Supabase is
 * unconfigured or the request fails, so a page renders its designed empty state
 * instead of a 500. The pages are statically revalidated, so a transient
 * database error would otherwise be cached as a broken build output.
 */

function guard(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export type PressItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  outlet: string | null;
  externalUrl: string | null;
  publishedOn: string | null;
};

export const getPressItems = cache(async (lang: Locale): Promise<PressItem[]> => {
  if (!guard()) return [];

  try {
    const supabase = createSupabaseAnonClient();
    const { data } = await supabase
      .from('news_press')
      .select('id, slug, title, excerpt, cover_url, outlet, external_url, published_on, sort_order')
      .eq('is_published', true)
      .order('published_on', { ascending: false, nullsFirst: false })
      .order('sort_order')
      .limit(60);

    return (data ?? []).map((r) => ({
      id: r.id as string,
      slug: r.slug as string,
      title: t(r.title, lang, r.slug as string),
      excerpt: t(r.excerpt, lang, ''),
      coverUrl: r.cover_url as string | null,
      outlet: r.outlet as string | null,
      externalUrl: r.external_url as string | null,
      publishedOn: r.published_on as string | null,
    }));
  } catch (error) {
    console.error('[press]', error);
    return [];
  }
});

export type ServiceItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  icon: string | null;
  imageUrl: string | null;
};

export const getServices = cache(async (lang: Locale): Promise<ServiceItem[]> => {
  if (!guard()) return [];

  try {
    const supabase = createSupabaseAnonClient();
    const { data } = await supabase
      .from('services')
      .select('id, slug, title, summary, icon, image_url')
      .eq('is_published', true)
      .order('sort_order');

    return (data ?? []).map((r) => ({
      id: r.id as string,
      slug: r.slug as string,
      title: t(r.title, lang, r.slug as string),
      summary: t(r.summary, lang, ''),
      icon: r.icon as string | null,
      imageUrl: r.image_url as string | null,
    }));
  } catch (error) {
    console.error('[services]', error);
    return [];
  }
});

export type TeamMember = {
  id: string;
  slug: string;
  name: string;
  jobTitle: string;
  photoUrl: string | null;
  bio: string;
};

export const getTeam = cache(async (lang: Locale): Promise<TeamMember[]> => {
  if (!guard()) return [];

  try {
    const supabase = createSupabaseAnonClient();
    const { data } = await supabase
      .from('people')
      .select('id, slug, name, job_title, photo_url, bio')
      .eq('is_team', true)
      .eq('is_published', true)
      .order('sort_order');

    return (data ?? []).map((r) => ({
      id: r.id as string,
      slug: r.slug as string,
      name: t(r.name, lang, r.slug as string),
      jobTitle: t(r.job_title, lang, ''),
      photoUrl: r.photo_url as string | null,
      bio: t(r.bio, lang, ''),
    }));
  } catch (error) {
    console.error('[team]', error);
    return [];
  }
});

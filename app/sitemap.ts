// app/sitemap.ts
import type { MetadataRoute } from 'next';
import { i18n } from '@/i18n/config';
import { SITE_URL } from '@/lib/seo/metadata';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createSupabaseServerClient();

  const { data: titles } = await supabase
    .from('series')
    .select('slug, updated_at, kind')
    .eq('status', 'published');

  const series = (titles ?? []).filter((r) => r.kind !== 'movie');
  const movies = (titles ?? []).filter((r) => r.kind === 'movie');

  const statics = [
    '',
    'catalog',
    'scripts',
    'legacy',
    'about',
    'about/team',
    'services',
    'press',
    'b2b',
    'partners',
    'submit',
    'contact',
    'terms',
    'privacy',
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const lang of i18n.locales) {
    for (const path of statics) {
      entries.push({
        url: `${SITE_URL}/${lang}${path ? `/${path}` : ''}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: path === '' ? 1 : 0.7,
        alternates: {
          languages: Object.fromEntries(
            i18n.locales.map((l) => [l, `${SITE_URL}/${l}${path ? `/${path}` : ''}`]),
          ),
        },
      });
    }

    for (const row of series) {
      entries.push({
        url: `${SITE_URL}/${lang}/series/${row.slug}`,
        lastModified: new Date(row.updated_at),
        changeFrequency: 'monthly',
        priority: 0.8,
      });
    }

    for (const row of movies) {
      entries.push({
        url: `${SITE_URL}/${lang}/movies/${row.slug}`,
        lastModified: new Date(row.updated_at),
        changeFrequency: 'monthly',
        priority: 0.8,
      });
    }
  }

  return entries;
}

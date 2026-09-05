// app/[lang]/admin/(dashboard)/series/[id]/page.tsx — SERVER COMPONENT
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TitleForm, type TitleFormValues } from '@/components/admin/title-form';
import { CreditsEditor } from '@/components/admin/credits-editor';
import { TitleBroadcasters } from '@/components/admin/title-broadcasters';
import { t } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const EMPTY: TitleFormValues = {
  slug: '',
  title: {}, subtitle: {}, synopsis: {},
  kind: 'series', region: 'levant', status: 'draft',
  year: null, seasons_count: 1, episodes_count: 0,
  genres: [], production_country: 'LB', original_language: 'ar', subtitle_langs: [],
  poster_url: null, backdrop_url: null, youtube_id: null,
  is_featured_slider: false, is_hit: false, is_new: false, is_coming_soon: false, is_script: false,
  sort_order: 0,
};

export default async function TitleEditorPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const isNew = id === 'new';

  let values = EMPTY;
  let heading = dict.admin.newTitle;
  let allBroadcasters: { id: string; name: string }[] = [];
  let attachedIds: string[] = [];

  if (!isNew) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from('series').select('*').eq('id', id).maybeSingle();
    if (!data) notFound();

    const [{ data: bcs }, { data: links }] = await Promise.all([
      supabase.from('broadcasters').select('id, name').order('sort_order'),
      supabase.from('title_broadcasters').select('broadcaster_id').eq('series_id', id),
    ]);
    allBroadcasters = bcs ?? [];
    attachedIds = (links ?? []).map((l) => l.broadcaster_id);

    values = {
      id: data.id,
      slug: data.slug,
      title: (data.title ?? {}) as Record<string, string>,
      subtitle: (data.subtitle ?? {}) as Record<string, string>,
      synopsis: (data.synopsis ?? {}) as Record<string, string>,
      kind: data.kind,
      region: data.region,
      status: data.status,
      year: data.year,
      seasons_count: data.seasons_count,
      episodes_count: data.episodes_count,
      genres: data.genres ?? [],
      production_country: data.production_country,
      original_language: data.original_language,
      subtitle_langs: data.subtitle_langs ?? [],
      poster_url: data.poster_url,
      backdrop_url: data.backdrop_url,
      youtube_id: data.youtube_id,
      is_featured_slider: data.is_featured_slider,
      is_hit: data.is_hit,
      is_new: data.is_new,
      is_coming_soon: data.is_coming_soon,
      is_script: data.is_script,
      sort_order: data.sort_order,
    };
    heading = t(data.title, locale, data.slug);
  }

  return (
    <div>
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href={`/${locale}/admin/series`} className="hover:text-primary">
          {dict.admin.series}
        </Link>
        <ChevronRight className="size-3 rtl:rotate-180" />
        <span className="text-foreground">{heading}</span>
      </nav>

      <h1 className="mt-3 text-display text-2xl font-light">{heading}</h1>

      <div className="mt-8">
        <TitleForm
          lang={locale}
          values={values}
          labels={{ save: dict.admin.save, saved: dict.admin.saved }}
          upload={{ ...dict.upload }}
        />
      </div>

      {values.id && (
        <>
          <TitleBroadcasters
            seriesId={values.id}
            all={allBroadcasters}
            attachedIds={attachedIds}
            labels={{ title: dict.admin.attachedTo, empty: dict.admin.noBroadcasters }}
          />
          <CreditsEditor seriesId={values.id} lang={locale} dict={dict.admin} />
        </>
      )}
    </div>
  );
}

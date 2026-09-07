// app/[lang]/admin/(dashboard)/series/[id]/page.tsx — SERVER COMPONENT
// The season record, laid out like the CAPDAMS "Season Details" screen: one
// header strip, then the tab row — Summary, Details, Broadcast, Images,
// Posters, Gallery, Synopsis, Episodes, Watch, Cast, Crew, Website, Social,
// Tracking.
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ExternalLink } from 'lucide-react';

import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TitleForm, type TitleFormValues } from '@/components/admin/title-form';
import { CreditsEditor } from '@/components/admin/credits-editor';
import { TitleBroadcasters } from '@/components/admin/title-broadcasters';
import { SeasonTabs, type TabDef } from '@/components/admin/season-tabs';
import { SeasonDetails } from '@/components/admin/season-details';
import { VideoManager, type VideoRow } from '@/components/admin/video-manager';
import { SeasonLinks } from '@/components/admin/season-links';
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

function Empty({ label }: { label: string }) {
  return <p className="py-14 text-center text-sm text-muted-foreground">{label}</p>;
}

export default async function SeasonEditorPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const isNew = id === 'new';

  // A brand-new record has nothing to hang tabs off yet — save the basics
  // first, then the full editor opens.
  if (isNew) {
    return (
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href={`/${locale}/admin/series`} className="hover:text-primary">
            {dict.admin.series}
          </Link>
          <ChevronRight className="size-3 rtl:rotate-180" />
          <span className="text-foreground">{dict.admin.newTitle}</span>
        </nav>

        <h1 className="mt-3 text-display text-2xl font-light">{dict.admin.newTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{dict.admin.newTitleHint}</p>

        <div className="mt-8">
          <TitleForm
            lang={locale}
            values={EMPTY}
            labels={{ save: dict.admin.save, saved: dict.admin.saved }}
            upload={{ ...dict.upload }}
          />
        </div>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('series').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();

  const [{ data: bcs }, { data: links }, { data: episodes }, { data: assets }, { data: events }, { data: socials }, { data: videos }] =
    await Promise.all([
      supabase.from('broadcasters').select('id, name').order('sort_order'),
      supabase.from('title_broadcasters').select('broadcaster_id').eq('series_id', id),
      supabase.from('episodes').select('id, episode_number, title, air_date').eq('series_id', id).order('episode_number').limit(500),
      supabase.from('media_assets').select('id, url, asset_type').eq('series_id', id).order('sort_order').limit(200),
      supabase.from('tracking_events').select('*').eq('entity_id', id).order('created_at', { ascending: false }).limit(50),
      supabase.from('social_accounts').select('id, platform, handle, profile_url, followers').eq('series_id', id),
      supabase
        .from('title_videos')
        .select('id, kind, label, youtube_id, url, thumbnail_url, duration_seconds, is_primary, sort_order')
        .eq('series_id', id)
        .order('is_primary', { ascending: false })
        .order('sort_order')
        .limit(100),
    ]);

  const values: TitleFormValues = {
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

  const heading = t(data.title, locale, data.slug);
  const posters = (assets ?? []).filter((a) => a.asset_type === 'poster');
  const gallery = (assets ?? []).filter((a) => a.asset_type !== 'poster');

  const tabs: TabDef[] = [
    { key: 'summary', label: dict.season.summary },
    { key: 'details', label: dict.season.details },
    { key: 'broadcast', label: dict.season.broadcast, badge: links?.length ?? 0 },
    { key: 'images', label: dict.season.images },
    { key: 'posters', label: dict.season.posters, badge: posters.length },
    { key: 'gallery', label: dict.season.gallery, badge: gallery.length },
    { key: 'synopsis', label: dict.season.synopsis },
    { key: 'episodes', label: dict.season.episodes, badge: episodes?.length ?? 0 },
    { key: 'watch', label: dict.season.watch },
    { key: 'videos', label: dict.admin.videos, badge: videos?.length ?? 0 },
    { key: 'cast', label: dict.season.cast },
    { key: 'crew', label: dict.season.crew },
    { key: 'website', label: dict.season.website },
    { key: 'social', label: dict.season.social, badge: socials?.length ?? 0 },
    { key: 'tracking', label: dict.season.tracking, badge: events?.length ?? 0 },
  ];

  const summaryPanel = (
    <TitleForm
      lang={locale}
      values={values}
      labels={{ save: dict.admin.save, saved: dict.admin.saved }}
      upload={{ ...dict.upload }}
    />
  );

  const panels = {
    summary: summaryPanel,

    details: (
      <SeasonDetails
        values={{
          id: data.id,
          region: data.region,
          production_country: data.production_country,
          seas_code: data.seas_code,
          prog_code: data.prog_code,
          remarks: data.remarks,
          genres: data.genres ?? [],
          audio_langs: data.audio_langs ?? [],
          dubbing_langs: data.dubbing_langs ?? [],
          subtitling_langs: data.subtitling_langs ?? [],
        }}
        dict={{
          region: dict.season.region,
          country: dict.season.country,
          seasCode: dict.season.seasCode,
          progCode: dict.season.progCode,
          genres: dict.season.genres,
          audio: dict.season.audio,
          dubbing: dict.season.dubbing,
          subtitling: dict.season.subtitling,
          remarks: dict.season.remarks,
          save: dict.admin.save,
          saved: dict.admin.saved,
          none: dict.season.none,
        }}
      />
    ),

    broadcast: (
      <TitleBroadcasters
        seriesId={data.id}
        all={bcs ?? []}
        attachedIds={(links ?? []).map((l) => l.broadcaster_id)}
        labels={{ title: dict.admin.attachedTo, empty: dict.admin.noBroadcasters }}
      />
    ),

    images: summaryPanel,
    posters: posters.length === 0 ? <Empty label={dict.detail.noPosters} /> : (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {posters.map((a) => (
          <div key={a.id} className="relative aspect-[2/3] overflow-hidden rounded-md bg-muted">
            <Image src={a.url} alt="" fill sizes="200px" className="object-cover" />
          </div>
        ))}
      </div>
    ),

    gallery: gallery.length === 0 ? <Empty label={dict.detail.noPosters} /> : (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {gallery.map((a) => (
          <div key={a.id} className="relative aspect-video overflow-hidden rounded-md bg-muted">
            <Image src={a.url} alt="" fill sizes="300px" className="object-cover" />
          </div>
        ))}
      </div>
    ),

    synopsis: summaryPanel,

    episodes: (episodes ?? []).length === 0 ? <Empty label={dict.detail.noEpisodes} /> : (
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[520px] text-sm">
          <tbody>
            {(episodes ?? []).map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="w-16 p-3 tabular-nums text-muted-foreground">{e.episode_number}</td>
                <td className="p-3">{t(e.title, locale, '—')}</td>
                <td className="w-32 p-3 text-xs text-muted-foreground" dir="ltr">{e.air_date ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),

    videos: (
      <VideoManager
        seriesId={data.id}
        rows={(videos ?? []) as VideoRow[]}
        dict={{
          videos: dict.admin.videos,
          addVideo: dict.admin.addVideo,
          kind: dict.admin.videoKind,
          label: dict.admin.videoLabel,
          youtube: dict.admin.videoYoutube,
          url: dict.admin.videoUrl,
          thumb: dict.admin.videoThumb,
          duration: dict.admin.videoDuration,
          primary: dict.admin.videoPrimary,
          empty: dict.admin.noVideos,
          save: dict.admin.save,
          saved: dict.admin.saved,
          cancel: dict.admin.cancel,
          edit: dict.admin.edit,
          delete: dict.admin.delete,
          confirmDelete: dict.admin.confirmDelete,
          kinds: dict.detail.kinds as Record<string, string>,
        }}
      />
    ),

    watch: (
      <SeasonLinks
        values={{
          id: data.id,
          youtube_id: data.youtube_id,
          watch_url: data.watch_url,
          website_url: data.website_url,
          press_kit_url: data.press_kit_url,
        }}
        dict={{
          youtube: dict.season.youtubeId,
          watch: dict.season.watchUrl,
          website: dict.season.websiteUrl,
          pressKit: dict.season.pressKit,
          save: dict.admin.save,
          saved: dict.admin.saved,
        }}
      />
    ),

    cast: <CreditsEditor seriesId={data.id} lang={locale} dict={dict.admin} />,
    crew: <CreditsEditor seriesId={data.id} lang={locale} dict={dict.admin} />,

    website: (
      <div className="space-y-4">
        <Link
          href={`/${locale}/series/${data.slug}`}
          target="_blank"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          /{locale}/series/{data.slug}
          <ExternalLink className="size-3.5" />
        </Link>
        <p className="text-xs text-muted-foreground">
          {data.status === 'published' ? dict.admin.published : dict.admin.draft}
        </p>
      </div>
    ),

    social: (socials ?? []).length === 0 ? <Empty label={dict.admin.noRecords} /> : (
      <ul className="space-y-2">
        {(socials ?? []).map((s) => (
          <li key={s.id} className="flex items-center gap-4 rounded-md border border-border p-3">
            <span className="rounded bg-muted px-2 py-0.5 text-xs">{s.platform}</span>
            <span className="text-sm" dir="ltr">{s.handle}</span>
            {s.followers ? (
              <span className="ms-auto text-xs tabular-nums text-muted-foreground">
                {s.followers.toLocaleString()}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    ),

    tracking: (events ?? []).length === 0 ? <Empty label={dict.admin.noActivity} /> : (
      <ul className="space-y-2">
        {(events ?? []).map((e) => (
          <li key={e.id} className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3 text-xs">
            <span className="rounded bg-muted px-1.5 py-0.5 uppercase">{e.action}</span>
            <span className="text-muted-foreground">{e.summary ?? e.entity}</span>
            <span className="ms-auto text-muted-foreground" dir="ltr">
              {new Date(e.created_at).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    ),
  };

  return (
    <div>
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href={`/${locale}/admin/series`} className="hover:text-primary">
          {dict.admin.series}
        </Link>
        <ChevronRight className="size-3 rtl:rotate-180" />
        <span className="text-foreground">{heading}</span>
      </nav>

      {/* Header strip — the green bar from the CAPDAMS layout: title in each
          language, and the season code. */}
      <header className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md bg-primary px-5 py-3 text-primary-foreground">
        <span className="text-sm font-medium">{t(data.title, 'en', data.slug)}</span>
        {data.seas_code && (
          <span className="rounded bg-black/20 px-2 py-0.5 text-xs tabular-nums">S{data.seas_code}</span>
        )}
        <span className="ms-auto text-sm" dir="rtl">
          {t(data.title, 'ar', '')}
        </span>
      </header>

      <div className="mt-5">
        <SeasonTabs tabs={tabs} panels={panels} storageKey={`season-tab-${data.id}`} />
      </div>
    </div>
  );
}

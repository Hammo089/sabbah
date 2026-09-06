// app/[lang]/(site)/(home)/page.tsx — SERVER COMPONENT
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata } from '@/lib/seo/metadata';
import { getRails, getCatalog, getAllBroadcasters } from '@/lib/queries/catalog';
import { getSiteSettings } from '@/lib/queries/settings';
import { CinematicHero } from '@/components/site/home/cinematic-hero';
import { StatsBar } from '@/components/site/home/stats-bar';
import { TitleMarquee } from '@/components/site/home/title-marquee';
import { ShowcaseGrid } from '@/components/site/home/showcase-grid';
import { AnniversaryFilm } from '@/components/site/home/anniversary-film';
import { BroadcasterStrip } from '@/components/site/home/broadcaster-strip';
import { MediaRail } from '@/components/site/media-rail';
import { AmbientFilm } from '@/components/site/ambient-film';

export const revalidate = 900;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return buildMetadata({
    lang,
    title: `${dict.meta.siteName} — ${dict.meta.tagline}`,
    description: dict.meta.description,
    siteName: dict.meta.siteName,
    path: '',
  });
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  const [rails, featured, broadcasters, settings] = await Promise.all([
    getRails(locale),
    getCatalog(locale, {}, 24, 0),
    getAllBroadcasters(),
    getSiteSettings(),
  ]);

  const posters = featured.items.filter((i) => i.posterUrl);
  const showcase = (rails.hits.length > 0 ? rails.hits : featured.items).slice(0, 7);

  const labels = {
    new: dict.catalog.new,
    comingSoon: dict.catalog.comingSoon,
    seasons: dict.catalog.seasons,
    viewAll: dict.common.viewAll,
  };

  return (
    <>
      {settings.bg_video_enabled && settings.bg_video_scope === 'home' && (
        <AmbientFilm youtubeId={settings.bg_video_youtube} opacity={settings.bg_video_opacity} />
      )}

      <CinematicHero
        lang={locale}
        dict={dict}
        posters={posters.slice(0, 10)}
        backdropUrl={settings.hero_backdrop_url ?? posters[0]?.posterUrl ?? null}
        align={settings.hero_align}
        showStrip={settings.hero_show_strip}
      />

      {settings.show_stats && (
        <StatsBar
          stats={[
            { value: settings.stat_years, sup: '+', label: dict.stats.years },
            { value: settings.stat_productions, sup: '+', label: dict.stats.productions },
            { value: settings.stat_offices, label: dict.stats.offices },
            { value: settings.stat_partners, sup: '+', label: dict.stats.partners },
          ]}
        />
      )}

      {settings.show_marquee && (
        <TitleMarquee names={featured.items.slice(0, 14).map((i) => i.title)} />
      )}

      {settings.show_showcase && (
      <section className="px-6 py-20 md:px-14 md:py-28">
        <div className="mx-auto w-full max-w-[1600px]">
          <header className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="sec-tag">{dict.catalog.hits}</p>
              <h2 className="sec-title">{dict.home.showcaseTitle}</h2>
            </div>
            <Link
              href={`/${locale}/catalog`}
              className="text-[11px] uppercase tracking-[0.25em] text-primary transition-opacity hover:opacity-70"
            >
              {dict.common.viewAll}
            </Link>
          </header>

          <ShowcaseGrid lang={locale} items={showcase} labels={labels} />
        </div>
      </section>
      )}

      {settings.anniversary_enabled && settings.anniversary_youtube && (
        <AnniversaryFilm
          youtubeId={settings.anniversary_youtube}
          dict={{
            tag: dict.home.anniversaryTag,
            title: dict.home.anniversaryTitle,
            line: dict.home.anniversaryLine,
            cta: dict.home.anniversaryCta,
            years: settings.stat_years,
          }}
        />
      )}

      {settings.show_rails && (
        <>
          <MediaRail lang={locale} title={dict.catalog.fresh} items={rails.fresh} href={`/${locale}/catalog`} labels={labels} />
          <MediaRail lang={locale} title={dict.catalog.soon} items={rails.soon} labels={labels} />
        </>
      )}

      {settings.show_partners && <BroadcasterStrip label={dict.home.partners} items={broadcasters} />}
    </>
  );
}

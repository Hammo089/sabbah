// app/[lang]/(site)/series/[slug]/page.tsx — SERVER COMPONENT
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata, SITE_URL } from '@/lib/seo/metadata';
import { getTitleBySlug, getAllPublishedSlugs } from '@/lib/queries/catalog';
import { TitleTabs } from '@/components/site/title-tabs';
import { WatchButton } from '@/components/site/watch-button';
import { cn } from '@/lib/utils';

export const revalidate = 900;

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs();
  return slugs.slice(0, 200).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};

  const [dict, title] = await Promise.all([getDictionary(lang), getTitleBySlug(slug, lang)]);
  if (!title) return {};

  return buildMetadata({
    lang,
    title: title.title,
    description: title.synopsis.slice(0, 160) || dict.meta.description,
    siteName: dict.meta.siteName,
    path: `series/${slug}`,
    image: title.backdropUrl ?? title.posterUrl ?? undefined,
    type: 'video.tv_show',
  });
}

export default async function TitlePage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const [dict, title] = await Promise.all([getDictionary(locale), getTitleBySlug(slug, locale)]);

  if (!title) notFound();

  const facts = [
    { label: dict.detail.year, value: title.year },
    { label: dict.detail.season, value: title.seasons > 0 ? title.seasons : null },
    { label: dict.detail.numEpisodes, value: title.episodesCount > 0 ? title.episodesCount : null },
    { label: dict.detail.country, value: title.country },
    { label: dict.detail.language, value: title.language?.toUpperCase() },
    { label: dict.detail.subtitles, value: title.subtitleLangs.join(', ').toUpperCase() || null },
  ].filter((f) => f.value);

  const ld = {
    '@context': 'https://schema.org',
    '@type': title.kind === 'movie' ? 'Movie' : 'TVSeries',
    name: title.title,
    description: title.synopsis,
    image: title.posterUrl,
    datePublished: title.year ? `${title.year}` : undefined,
    numberOfSeasons: title.seasons,
    inLanguage: title.language,
    url: `${SITE_URL}/${locale}/series/${slug}`,
    actor: title.cast.slice(0, 12).map((c) => ({ '@type': 'Person', name: c.name })),
    director: title.crew
      .filter((c) => /direct|إخراج|réalis/i.test(c.role))
      .map((c) => ({ '@type': 'Person', name: c.name })),
  };

  return (
    <main>
      {/* Backdrop */}
      <div className="relative min-h-[62svh] w-full overflow-hidden">
        {title.backdropUrl || title.posterUrl ? (
          <Image
            src={(title.backdropUrl ?? title.posterUrl)!}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-45"
          />
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/85 to-[#000000]/40" />

        <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-6 pb-14 pt-24 md:flex-row md:px-10 md:pt-32 xl:px-16">
          <div className="relative aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10 md:w-56">
            {title.posterUrl && (
              <Image src={title.posterUrl} alt={title.title} fill sizes="224px" className="object-cover" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            {title.isComingSoon && (
              <span className="inline-block rounded bg-primary/15 px-2 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-primary">
                {dict.catalog.comingSoon}
              </span>
            )}

            <h1 className="mt-3 text-display text-[clamp(2rem,5vw,3.6rem)] font-light leading-tight text-neutral-50">
              {title.title}
            </h1>
            {title.subtitle && <p className="mt-1 text-lg text-neutral-400">{title.subtitle}</p>}

            {title.genres.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {title.genres.map((g) => (
                  <Link
                    key={g}
                    href={`/${locale}/catalog?genre=${encodeURIComponent(g)}`}
                    className="rounded-full border border-primary/30 px-3 py-1 text-xs text-primary transition-colors hover:bg-primary/10"
                  >
                    {g}
                  </Link>
                ))}
              </div>
            )}

            <dl className="mt-7 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt className="text-[0.6rem] uppercase tracking-[0.18em] text-neutral-600">{f.label}</dt>
                  <dd className="mt-1 text-sm text-neutral-200">{f.value}</dd>
                </div>
              ))}
            </dl>

            {(title.youtubeId || title.trailerUrl) && (
              <div className="mt-8">
                <WatchButton
                  youtubeId={title.youtubeId}
                  fallbackUrl={title.trailerUrl}
                  label={dict.detail.watch}
                  title={title.title}
                />
              </div>
            )}

            {title.broadcasters.length > 0 && (
              <div className="mt-8">
                <p className="text-[0.6rem] uppercase tracking-[0.18em] text-neutral-600">
                  {dict.detail.broadcasters}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  {title.broadcasters.map((b) =>
                    b.logo_url ? (
                      <Image
                        key={b.id}
                        src={b.logo_url}
                        alt={b.name}
                        width={72}
                        height={28}
                        className="h-7 w-auto opacity-70 transition-opacity hover:opacity-100"
                      />
                    ) : (
                      <span key={b.id} className="text-xs text-neutral-400">
                        {b.name}
                      </span>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <TitleTabs lang={locale} title={title} dict={dict.detail} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
    </main>
  );
}

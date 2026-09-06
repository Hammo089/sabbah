// components/site/title-detail.tsx — SERVER COMPONENT (shared by /series/[slug] and /movies/[slug])
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { SITE_URL } from '@/lib/seo/metadata';
import { getTitleBySlug } from '@/lib/queries/catalog';
import { TitleTabs } from '@/components/site/title-tabs';
import { WatchButton } from '@/components/site/watch-button';
import { Reveal } from '@/components/motion/reveal';

export async function TitleDetail({
  lang,
  slug,
  basePath,
}: {
  lang: string;
  slug: string;
  basePath: 'series' | 'movies';
}) {
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
    url: `${SITE_URL}/${locale}/${basePath}/${slug}`,
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

        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40" />

        <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-6 pb-14 pt-24 md:flex-row md:px-10 md:pt-32 xl:px-16">
          <div className="relative aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-lg ring-1 ring-border md:w-56">
            {title.posterUrl && (
              <Image src={title.posterUrl} alt={title.title} fill sizes="224px" className="object-cover" />
            )}
          </div>

          <Reveal className="min-w-0 flex-1" amount={0.1}>
            {title.isComingSoon && (
              <span className="inline-block rounded bg-primary/15 px-2 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-primary">
                {dict.catalog.comingSoon}
              </span>
            )}

            <h1 className="mt-3 text-display text-[clamp(2rem,5vw,3.6rem)] font-light leading-tight text-foreground">
              {title.title}
            </h1>
            {title.subtitle && <p className="mt-1 text-lg text-muted-foreground">{title.subtitle}</p>}

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
                  <dt className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground/70">{f.label}</dt>
                  <dd className="mt-1 text-sm text-foreground/90">{f.value}</dd>
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
                <p className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground/70">
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
                      <span key={b.id} className="text-xs text-muted-foreground">
                        {b.name}
                      </span>
                    ),
                  )}
                </div>
              </div>
            )}
          </Reveal>
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

// components/site/title-detail.tsx — SERVER COMPONENT (shared by /series/[slug] and /movies/[slug])
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { SITE_URL } from '@/lib/seo/metadata';
import { getTitleBySlug } from '@/lib/queries/catalog';
import { TitleTabs } from '@/components/site/title-tabs';
import { TitleStage } from '@/components/site/title-stage';
import { WatchButton } from '@/components/site/watch-button';
import { Reveal } from '@/components/motion/reveal';

/**
 * A title page, staged like a screening room.
 *
 * Reading order is deliberate: the backdrop establishes the world, the poster
 * and title name it, then the SCREEN — the largest element on the page — hands
 * the visitor straight to the picture. Text about the work comes after the work
 * itself. Cast and crew are laid out flat rather than buried behind a tab,
 * because "who is in it" is the second question every visitor asks.
 */
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

  const theaterDict = {
    more: dict.detail.more,
    resume: dict.detail.resume,
    replay: dict.detail.replay,
    close: dict.detail.close,
    kinds: dict.detail.kinds as Record<string, string>,
    videos: dict.detail.videos,
    watchTrailer: dict.detail.watchTrailer,
    noVideos: dict.detail.noVideos,
  };

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
    trailer: title.videos.find((v) => v.isPrimary && v.youtubeId)
      ? {
          '@type': 'VideoObject',
          name: `${title.title} — ${dict.detail.kinds.trailer}`,
          thumbnailUrl: title.videos.find((v) => v.isPrimary)?.thumbnailUrl ?? undefined,
          embedUrl: `https://www.youtube.com/embed/${title.videos.find((v) => v.isPrimary)!.youtubeId}`,
        }
      : undefined,
    actor: title.cast.slice(0, 12).map((c) => ({ '@type': 'Person', name: c.name })),
    director: title.crew
      .filter((c) => /direct|إخراج|réalis/i.test(c.role))
      .map((c) => ({ '@type': 'Person', name: c.name })),
  };

  const backdrop = title.backdropUrl ?? title.posterUrl;

  return (
    <main>
      {/* ================= HERO ================= */}
      <div className="relative min-h-[68svh] w-full overflow-hidden">
        {backdrop ? (
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={backdrop}
              alt=""
              fill
              priority
              sizes="100vw"
              className="stage-drift object-cover opacity-40"
            />
          </div>
        ) : null}

        {/* Two washes, not one: the vertical gradient seats the panel on the page,
            the radial darkens the frame's edges so the copy stays legible over a
            busy backdrop. Radial rather than a left/right gradient because the
            layout mirrors in Arabic and a directional wash would land on the
            wrong side. */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/88 to-background/35" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,hsl(var(--background)/0.7)_100%)]" />

        <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-6 pb-16 pt-24 md:flex-row md:px-10 md:pt-32 xl:px-16">
          {/* Poster — lifted off the page, not pasted onto it */}
          <Reveal direction="none" className="shrink-0">
            <div className="group relative aspect-[2/3] w-40 overflow-hidden rounded-lg shadow-[0_28px_70px_-20px_rgba(0,0,0,0.85)] ring-1 ring-white/10 md:w-60">
              {title.posterUrl ? (
                <Image
                  src={title.posterUrl}
                  alt={title.title}
                  fill
                  sizes="240px"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              ) : (
                <div className="grid h-full place-items-center bg-muted/40 text-xs text-muted-foreground">
                  {title.title}
                </div>
              )}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent"
              />
            </div>
          </Reveal>

          <Reveal className="min-w-0 flex-1" amount={0.1}>
            {title.isComingSoon && (
              <span className="inline-block rounded bg-primary/15 px-2 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-primary">
                {dict.catalog.comingSoon}
              </span>
            )}

            <h1 className="mt-3 text-display text-[clamp(2.2rem,5.5vw,4rem)] font-light leading-[1.05] tracking-tight text-foreground text-balance">
              {title.title}
            </h1>
            {title.subtitle && (
              <p className="mt-2 text-lg font-light text-muted-foreground">{title.subtitle}</p>
            )}

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
                  <dt className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground/70">
                    {f.label}
                  </dt>
                  <dd className="mt-1 text-sm text-foreground/90">{f.value}</dd>
                </div>
              ))}
            </dl>

            {/* When the title has no video at all, the old single-trailer button
                is still the correct affordance — the stage below renders nothing. */}
            {title.videos.length === 0 && (title.youtubeId || title.trailerUrl) && (
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

      {/* ================= THE SCREEN ================= */}
      {title.videos.length > 0 && (
        <TitleStage
          videos={title.videos}
          title={title.title}
          posterUrl={title.posterUrl}
          dict={theaterDict}
        />
      )}

      {/* ================= SYNOPSIS ================= */}
      {title.synopsis && (
        <section className="mx-auto w-full max-w-[1600px] px-6 pt-16 md:px-10 xl:px-16">
          <Reveal>
            <p className="text-[0.6rem] uppercase tracking-[0.24em] text-muted-foreground/70">
              {dict.detail.overview}
            </p>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/80 md:text-lg">
              {title.synopsis}
            </p>
          </Reveal>
        </section>
      )}

      {/* ================= CAST ================= */}
      {title.cast.length > 0 && (
        <section className="mx-auto w-full max-w-[1600px] px-6 pt-16 md:px-10 xl:px-16">
          <Reveal>
            <p className="text-[0.6rem] uppercase tracking-[0.24em] text-muted-foreground/70">
              {dict.detail.starring}
              <span className="ms-2 text-muted-foreground/45">{title.cast.length}</span>
            </p>
          </Reveal>

          <div className="mt-6 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
            {title.cast.map((c, i) => (
              <Reveal key={c.id} delay={Math.min(i, 8) * 0.04} amount={0.2}>
                <Link href={`/${locale}/people/${c.personSlug}`} className="group block">
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-muted/40 ring-1 ring-border transition-all group-hover:ring-primary/50">
                    {c.photoUrl ? (
                      <Image
                        src={c.photoUrl}
                        alt={c.name}
                        fill
                        sizes="(max-width: 640px) 33vw, 12vw"
                        className="object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-2xl font-light text-muted-foreground/40">
                        {c.name.charAt(0)}
                      </div>
                    )}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    />
                  </div>
                  <p className="mt-2.5 truncate text-xs font-medium text-foreground/90 transition-colors group-hover:text-primary">
                    {c.name}
                  </p>
                  {c.character && (
                    <p className="truncate text-[0.7rem] text-muted-foreground">{c.character}</p>
                  )}
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ================= CREW ================= */}
      {title.crew.length > 0 && (
        <section className="mx-auto w-full max-w-[1600px] px-6 pt-14 md:px-10 xl:px-16">
          <Reveal>
            <p className="text-[0.6rem] uppercase tracking-[0.24em] text-muted-foreground/70">
              {dict.detail.crew}
            </p>
            <dl className="mt-5 grid max-w-4xl grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {title.crew.map((c) => (
                <div
                  key={c.id}
                  className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-2"
                >
                  <dt className="text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground/80">
                    {c.role}
                  </dt>
                  <dd className="min-w-0 truncate text-end text-sm">
                    <Link
                      href={`/${locale}/people/${c.personSlug}`}
                      className="text-foreground/90 transition-colors hover:text-primary"
                    >
                      {c.name}
                    </Link>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </section>
      )}

      {/* ================= EPISODES / POSTERS ================= */}
      <div className="pt-16">
        <TitleTabs lang={locale} title={title} dict={dict.detail} />
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </main>
  );
}

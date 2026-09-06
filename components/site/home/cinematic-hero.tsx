// components/site/home/cinematic-hero.tsx — SERVER COMPONENT
import Image from 'next/image';
import Link from 'next/link';
import { FilmStrip } from './film-strip';
import type { CatalogCard } from '@/lib/queries/catalog';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';

export function CinematicHero({
  lang,
  dict,
  posters,
  backdropUrl,
  align = 'start',
  showStrip = true,
}: {
  lang: Locale;
  dict: Dictionary;
  posters: CatalogCard[];
  backdropUrl: string | null;
  align?: 'start' | 'center';
  showStrip?: boolean;
}) {
  const centered = align === 'center';
  return (
    <section className="on-media relative flex min-h-[640px] items-end overflow-hidden pb-20 pt-28 md:min-h-[700px] md:h-svh md:pb-24">
      {backdropUrl && (
        <Image
          src={backdropUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-[0.35]"
        />
      )}

      <div aria-hidden className="hero-grid-lines absolute inset-0" />

      {/* Right-hand film strip — 48% wide, masked into the background */}
      {showStrip && <FilmStrip posters={posters} />}

      <div aria-hidden className="hero-scrim absolute inset-0 z-[1]" />

      <div
        className={
          centered
            ? 'relative z-[2] mx-auto w-full max-w-[880px] px-6 text-center md:px-14'
            : 'relative z-[2] w-full max-w-[680px] px-6 md:px-14 lg:max-w-[52%] xl:max-w-[680px]'
        }
      >
        <p
          className={
            'mb-6 flex flex-wrap items-center gap-3.5 text-[10px] uppercase tracking-[0.32em] text-primary sm:tracking-[0.5em]' +
            (centered ? ' justify-center' : '')
          }
        >
          <span className="block h-px w-9 bg-primary" />
          {dict.hero.established} · {dict.hero.offices}
        </p>

        <h1 className="display-title mb-3.5 text-balance text-[clamp(40px,7vw,96px)] text-foreground">
          {dict.hero.titlesLine1}
          <br />
          <span className="text-primary">{dict.hero.titlesLine2}</span>
          <br />
          {dict.hero.titlesLine3}
        </h1>

        <p className="condensed mb-7 break-words text-[clamp(12px,1.8vw,19px)] tracking-[0.24em] text-muted-foreground sm:tracking-[0.5em]">
          {dict.hero.disciplines}
        </p>

        <p
          className={
            'mb-12 max-w-[460px] text-[15px] leading-[1.85] text-muted-foreground' +
            (centered ? ' mx-auto' : '')
          }
        >
          {dict.hero.subtitle}
        </p>

        <div
          className={
            'flex flex-wrap items-center gap-5' + (centered ? ' justify-center' : '')
          }
        >
          <Link href={`/${lang}/catalog`} className="btn-gold">
            {dict.hero.ctaPrimary}
          </Link>

          <Link
            href={`/${lang}/legacy`}
            className="group flex items-center gap-2.5 text-[11px] uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-primary"
          >
            <span className="flex size-11 items-center justify-center rounded-full border border-border transition-colors group-hover:border-primary">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="text-primary">
                <path d="M6 1v10M1 6l5 5 5-5" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </span>
            {dict.hero.ctaSecondary}
          </Link>
        </div>
      </div>
    </section>
  );
}

// components/site/hero/split-hero.tsx
// SERVER COMPONENT — composes the two halves. Zero client JS ships from this file.
import { getHeroPosters, getLibraryCount } from '@/lib/queries/home';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import { HeroCopy } from './hero-copy';
import { PosterMarquee } from './poster-marquee';
import { cn } from '@/lib/utils';

export async function SplitHero({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const [posters, libraryCount] = await Promise.all([getHeroPosters(lang), getLibraryCount()]);

  return (
    <section
      aria-labelledby="hero-heading"
      className={cn(
        'grain relative isolate w-full overflow-hidden',
        'min-h-[92svh] bg-[#0a0a0a] dark:bg-[#0a0a0a]',
      )}
    >
      {/* ── Vintage light bloom ─────────────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(90% 65% at 12% 6%, rgba(203,163,66,0.16) 0%, rgba(203,163,66,0.04) 34%, transparent 68%),' +
            'radial-gradient(70% 55% at 92% 100%, rgba(203,163,66,0.09) 0%, transparent 62%)',
        }}
      />

      {/* ── Gold hairline grid ──────────────────────────────────────────── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
        <div className="absolute inset-y-0 start-[6%] hidden w-px bg-gradient-to-b from-transparent via-primary/22 to-transparent lg:block" />
        <div className="absolute inset-y-0 start-[54%] hidden w-px bg-gradient-to-b from-transparent via-primary/14 to-transparent lg:block" />
      </div>

      <div className="relative mx-auto grid w-full max-w-[1600px] grid-cols-1 items-center gap-10 px-6 py-24 md:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-16 lg:py-0 xl:px-16">
        {/* ── Start half: typography (left in LTR, right in RTL) ─────────── */}
        <HeroCopy lang={lang} dict={dict} libraryCount={libraryCount} />

        {/* ── End half: infinite poster marquee ──────────────────────────── */}
        <PosterMarquee
          lang={lang}
          posters={posters}
          label={dict.hero.archive}
          className="hidden lg:block"
        />

        {/* Mobile: single horizontal-safe column, reduced height */}
        <PosterMarquee
          lang={lang}
          posters={posters}
          label={dict.hero.archive}
          columns={2}
          className="lg:hidden"
          heightClassName="h-[46svh]"
        />
      </div>

      {/* ── Bottom fade into the next section ───────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent"
      />
    </section>
  );
}

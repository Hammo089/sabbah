// components/site/home/glass-hero.tsx — SERVER COMPONENT
// The homepage hero when the anniversary film is the backdrop.
//
// Built to the reference HTML: the film plays alone behind everything, one
// frosted panel carries the copy, and the round glass button starts the film
// full-screen with sound. Nothing else competes with the film — no hero image,
// no scrim, no drifting collage. That restraint is the design.
import Link from 'next/link';
import { AnniversaryButton } from '@/components/site/anniversary-button';
import { Reveal } from '@/components/motion/reveal';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import { cn } from '@/lib/utils';

export function GlassHero({
  lang,
  dict,
  align = 'start',
  anniversary,
}: {
  lang: Locale;
  dict: Dictionary;
  align?: 'start' | 'center';
  anniversary: { filmUrl: string; posterUrl: string | null; label: string } | null;
}) {
  const centered = align === 'center';

  return (
    <section
      className={cn(
        'relative flex min-h-[100svh] items-center px-6 py-28 md:px-14',
        centered && 'justify-center',
      )}
    >
      <Reveal
        distance={36}
        duration={0.9}
        className={cn(
          'glass-panel relative w-full rounded-[20px] p-9 sm:p-12 md:p-14',
          centered ? 'max-w-[640px] text-center' : 'max-w-[560px] lg:ms-[6%]',
        )}
      >
        <p
          className={cn(
            'mb-4 text-[0.7rem] uppercase tracking-[0.4em] text-white/60',
            centered && 'flex justify-center',
          )}
        >
          {dict.hero.established}
        </p>

        {/* Light weight, with the middle line bold — the contrast the reference
            uses to carry the whole headline. */}
        <h1 className="mb-5 text-[clamp(2.2rem,5.5vw,3.2rem)] font-light leading-[1.15] text-white">
          {dict.hero.titlesLine1}
          <br />
          <span className="font-bold text-primary">{dict.hero.titlesLine2}</span>
          <br />
          {dict.hero.titlesLine3}
        </h1>

        <p className="mb-9 max-w-[42ch] text-[0.95rem] leading-[1.75] text-white/75">
          {dict.hero.subtitle}
        </p>

        {anniversary ? (
          <AnniversaryButton
            filmUrl={anniversary.filmUrl}
            posterUrl={anniversary.posterUrl}
            label={anniversary.label}
            cta={dict.home.anniversaryCta}
            backLabel={dict.home.backToSite}
            className={centered ? 'justify-center' : undefined}
          />
        ) : (
          <Link
            href={`/${lang}/catalog`}
            className="inline-block bg-primary px-9 py-4 text-[11px] uppercase tracking-[0.25em] text-primary-foreground transition-all duration-300 hover:brightness-110"
          >
            {dict.hero.ctaPrimary}
          </Link>
        )}

        <div
          className={cn(
            'mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-6',
            centered && 'justify-center',
          )}
        >
          <Link
            href={`/${lang}/catalog`}
            className="text-[0.7rem] uppercase tracking-[0.2em] text-white/70 transition-colors hover:text-primary"
          >
            {dict.hero.ctaPrimary}
          </Link>
          <span className="text-white/20">·</span>
          <Link
            href={`/${lang}/legacy`}
            className="text-[0.7rem] uppercase tracking-[0.2em] text-white/70 transition-colors hover:text-primary"
          >
            {dict.hero.ctaSecondary}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

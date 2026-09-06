// components/site/home/glass-hero.tsx — SERVER COMPONENT
// The homepage hero when the anniversary film is the backdrop.
//
// Built to the reference HTML: the film plays alone behind everything, one
// frosted panel carries the copy, and the round glass button starts the film
// full-screen with sound. Nothing else competes with the film.
//
// The headline is ONE string with an optional highlighted fragment, not three
// hardcoded lines. Three fixed lines were an English-shaped decision: Arabic
// sets shorter, wraps differently, and the same break points produced
// "سبعة عقود / من الحكاية / العربية." — a phrase snapped in the wrong places.
// Now the browser wraps naturally and the operator picks which words carry the
// brand colour.
import Link from 'next/link';
import { AnniversaryButton } from '@/components/site/anniversary-button';
import { Reveal } from '@/components/motion/reveal';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import { cn } from '@/lib/utils';

export type HeroCopy = {
  eyebrow: string;
  headline: string;
  /** A fragment of `headline` painted in the brand colour. Optional. */
  highlight: string;
  body: string;
};

/**
 * Splits the headline around the highlighted fragment. Falls back to the plain
 * headline when the fragment is absent or not found, so a typo in the admin
 * field can never blank the hero.
 */
function paintHighlight(headline: string, highlight: string) {
  const needle = highlight.trim();
  if (!needle) return [headline];

  const at = headline.indexOf(needle);
  if (at === -1) return [headline];

  return [headline.slice(0, at), needle, headline.slice(at + needle.length)];
}

export function GlassHero({
  lang,
  dict,
  copy,
  align = 'start',
  anniversary,
}: {
  lang: Locale;
  dict: Dictionary;
  copy: HeroCopy;
  align?: 'start' | 'center';
  anniversary: {
    filmUrl: string;
    posterUrl: string | null;
    label: string;
    /** Operator artwork for the disc; null keeps the number. */
    artworkUrl?: string | null;
  } | null;
}) {
  const centered = align === 'center';
  const parts = paintHighlight(copy.headline, copy.highlight);

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
          centered ? 'max-w-[660px] text-center' : 'max-w-[600px] lg:ms-[6%]',
        )}
      >
        {copy.eyebrow && (
          <p
            className={cn(
              'mb-4 text-[0.7rem] uppercase tracking-[0.35em] text-muted-foreground',
              centered && 'flex justify-center',
            )}
          >
            {copy.eyebrow}
          </p>
        )}

        {/* `text-balance` keeps the last line from stranding a single word —
            which is what Arabic did with the old fixed breaks. */}
        <h1 className="mb-5 text-balance text-[clamp(2rem,5vw,3.1rem)] font-light leading-[1.25] text-foreground">
          {parts.length === 1 ? (
            parts[0]
          ) : (
            <>
              {parts[0]}
              <span className="font-bold text-primary">{parts[1]}</span>
              {parts[2]}
            </>
          )}
        </h1>

        {copy.body && (
          <p
            className={cn(
              'mb-9 text-[0.95rem] leading-[1.85] text-muted-foreground',
              centered ? 'mx-auto max-w-[46ch]' : 'max-w-[46ch]',
            )}
          >
            {copy.body}
          </p>
        )}

        {anniversary ? (
          <AnniversaryButton
            filmUrl={anniversary.filmUrl}
            posterUrl={anniversary.posterUrl}
            label={anniversary.label}
            artworkUrl={anniversary.artworkUrl}
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
            'mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-6',
            centered && 'justify-center',
          )}
        >
          <Link
            href={`/${lang}/catalog`}
            className="text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary"
          >
            {dict.hero.ctaPrimary}
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <Link
            href={`/${lang}/legacy`}
            className="text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary"
          >
            {dict.hero.ctaSecondary}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

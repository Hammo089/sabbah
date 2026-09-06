'use client';

// components/site/home/poster-rows.tsx
// The "Over 5000+ …" band from the reference: two rows of tilted cards sliding
// in opposite directions.
//
// The track is rendered twice and translated by exactly -50%, which is what
// makes the loop seamless — at the end of the cycle the second copy sits
// precisely where the first began, so there is no jump to hide. Sliding a
// single long track instead would show a gap the moment it ran out.
import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { useMotionAllowed, useTabVisible } from '@/components/motion/use-motion-allowed';
import type { CatalogCard } from '@/lib/queries/catalog';
import type { Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';

function Card({
  item,
  lang,
  tilt,
}: {
  item: CatalogCard;
  lang: Locale;
  tilt: number;
}) {
  const base = item.kind === 'movie' ? 'movies' : 'series';

  return (
    <Link
      href={`/${lang}/${base}/${item.slug}`}
      className="group relative block w-[38vw] shrink-0 sm:w-[26vw] lg:w-[16vw] xl:w-[13vw]"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div
        className={cn(
          'relative aspect-[4/3] overflow-hidden rounded-[14px] bg-muted',
          'ring-1 ring-white/[0.07] transition-all duration-500',
          'group-hover:ring-primary/50 group-hover:shadow-[0_20px_50px_-20px_hsl(var(--primary)/0.55)]',
        )}
      >
        {item.posterUrl && (
          <Image
            src={item.posterUrl}
            alt={item.title}
            fill
            sizes="(max-width:640px) 38vw, (max-width:1024px) 26vw, 14vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* The play affordance from the reference, in the brand green. */}
        <span
          className={cn(
            'absolute end-2.5 top-2.5 grid size-7 place-items-center rounded-full',
            'bg-primary text-primary-foreground opacity-0 transition-opacity duration-300',
            'group-hover:opacity-100',
          )}
        >
          <Play className="size-3 fill-current" />
        </span>

        <p className="absolute inset-x-0 bottom-0 truncate p-2.5 text-[0.7rem] font-medium text-white">
          {item.title}
        </p>
      </div>
    </Link>
  );
}

function Row({
  items,
  lang,
  reverse,
  seconds,
  running,
}: {
  items: CatalogCard[];
  lang: Locale;
  reverse: boolean;
  seconds: number;
  running: boolean;
}) {
  const loop = [...items, ...items];

  return (
    <div className="overflow-hidden py-3">
      <div
        className={cn('flex w-max gap-4', running && 'hover:[animation-play-state:paused]')}
        style={
          running
            ? {
                animationName: reverse ? 'marquee-x-reverse' : 'marquee-x-half',
                animationDuration: `${seconds}s`,
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
              }
            : undefined
        }
      >
        {loop.map((item, i) => (
          <Card
            key={`${item.id}-${i}`}
            item={item}
            lang={lang}
            tilt={i % 2 === 0 ? -2.5 : 2}
          />
        ))}
      </div>
    </div>
  );
}

export function PosterRows({
  lang,
  items,
  eyebrow,
  title,
  highlight,
}: {
  lang: Locale;
  items: CatalogCard[];
  eyebrow?: string;
  title: string;
  /** Trailing words painted in the brand colour, as in the reference. */
  highlight?: string;
}) {
  const { ambient } = useMotionAllowed();
  const visible = useTabVisible();

  if (items.length < 4) return null;

  const running = ambient && visible;
  const half = Math.ceil(items.length / 2);
  const top = items.slice(0, half);
  const bottom = items.slice(half).length >= 4 ? items.slice(half) : items.slice(0, half);

  return (
    <section className="overflow-hidden py-16 md:py-24">
      <header className="mx-auto mb-10 max-w-[1600px] px-6 text-center md:px-14">
        {eyebrow && (
          <p className="mb-3 text-[10px] uppercase tracking-[0.5em] text-primary">{eyebrow}</p>
        )}
        <h2 className="text-display text-[clamp(1.8rem,4vw,3rem)] font-light leading-tight">
          {title}
          {highlight && <span className="text-primary"> {highlight}</span>}
        </h2>
      </header>

      <Row items={top} lang={lang} reverse={false} seconds={52} running={running} />
      <Row items={bottom} lang={lang} reverse seconds={64} running={running} />
    </section>
  );
}

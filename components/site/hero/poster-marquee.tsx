// components/site/hero/poster-marquee.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import type { HeroPoster } from '@/lib/queries/home';
import type { Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';

/** Wraps `value` into the half-open range [min, max). */
function wrap(min: number, max: number, value: number): number {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
}

/** Round-robin split so each column stays visually balanced. */
function distribute<T>(items: T[], columns: number): T[][] {
  const buckets: T[][] = Array.from({ length: columns }, () => []);
  items.forEach((item, i) => buckets[i % columns]!.push(item));
  return buckets;
}

type MarqueeProps = {
  lang: Locale;
  posters: HeroPoster[];
  label: string;
  columns?: number;
  className?: string;
  heightClassName?: string;
};

export function PosterMarquee({
  lang,
  posters,
  label,
  columns = 3,
  className,
  heightClassName = 'h-[78svh]',
}: MarqueeProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [paused, setPaused] = React.useState(false);
  const reduce = useReducedMotion();

  // Scroll parallax on the whole cluster.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });
  const rawParallax = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const parallax = useSpring(rawParallax, { stiffness: 90, damping: 24, mass: 0.4 });

  const groups = React.useMemo(() => distribute(posters, columns), [posters, columns]);

  if (posters.length === 0) return null;

  const speeds = [26, 34, 21];

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Archive label */}
      <div className="pointer-events-none absolute -top-2 end-0 z-20 flex items-center gap-2">
        <span className="text-[0.62rem] uppercase tracking-[0.3em] text-neutral-500">{label}</span>
        <span className="inline-block h-px w-6 bg-primary/60" />
      </div>

      <motion.div
        style={reduce ? undefined : { y: parallax }}
        className={cn(
          'mask-fade-y grid gap-3 md:gap-4',
          heightClassName,
          columns === 2 ? 'grid-cols-2' : 'grid-cols-3',
        )}
      >
        {groups.map((group, index) => (
          <MarqueeColumn
            key={index}
            lang={lang}
            posters={group}
            speed={speeds[index % speeds.length]!}
            direction={index % 2 === 0 ? -1 : 1}
            offsetClassName={index === 1 ? 'mt-10' : index === 2 ? 'mt-4' : undefined}
            paused={paused}
            priority={index === 0}
          />
        ))}
      </motion.div>

      {/* Vignette edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent rtl:bg-gradient-to-l"
      />
    </div>
  );
}

function MarqueeColumn({
  lang,
  posters,
  speed,
  direction,
  paused,
  priority,
  offsetClassName,
}: {
  lang: Locale;
  posters: HeroPoster[];
  speed: number;
  direction: 1 | -1;
  paused: boolean;
  priority: boolean;
  offsetClassName?: string;
}) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const halfRef = React.useRef(0);
  const reduce = useReducedMotion();

  // Measure one loop's height (the track renders the list twice).
  React.useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const measure = () => {
      halfRef.current = el.scrollHeight / 2;
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [posters.length]);

  useAnimationFrame((_, delta) => {
    if (reduce || paused) return;
    const half = halfRef.current;
    if (!half) return;

    // delta is capped by the browser; clamp to avoid a jump after a tab switch.
    const step = (Math.min(delta, 50) / 1000) * speed * direction;
    y.set(wrap(-half, 0, y.get() + step));
  });

  const loop = [...posters, ...posters];

  return (
    <div className={cn('relative overflow-hidden', offsetClassName)}>
      <motion.div ref={trackRef} style={reduce ? undefined : { y }} className="flex flex-col gap-3 md:gap-4">
        {loop.map((poster, i) => (
          <PosterCard
            key={`${poster.id}-${i}`}
            lang={lang}
            poster={poster}
            priority={priority && i < 2}
            ariaHidden={i >= posters.length}
          />
        ))}
      </motion.div>
    </div>
  );
}

function PosterCard({
  lang,
  poster,
  priority,
  ariaHidden,
}: {
  lang: Locale;
  poster: HeroPoster;
  priority: boolean;
  ariaHidden: boolean;
}) {
  return (
    <Link
      href={`/${lang}/series/${poster.slug}`}
      aria-hidden={ariaHidden}
      tabIndex={ariaHidden ? -1 : 0}
      className={cn(
        'group relative block aspect-[2/3] w-full shrink-0 overflow-hidden rounded-md',
        'bg-neutral-900 ring-1 ring-white/[0.06] transition-all duration-500',
        'hover:ring-primary/45 hover:shadow-[0_18px_50px_-18px_rgba(203,163,66,0.5)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
      )}
    >
      <Image
        src={poster.posterUrl}
        alt={poster.title}
        fill
        sizes="(max-width: 1024px) 42vw, 15vw"
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        className={cn(
          'object-cover transition-all duration-700 ease-out',
          'scale-100 opacity-90 saturate-[0.82] group-hover:scale-[1.06] group-hover:opacity-100 group-hover:saturate-100',
        )}
      />

      {/* Permanent bottom scrim + hover title */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 translate-y-1.5 p-3 opacity-0 transition-all duration-400 group-hover:translate-y-0 group-hover:opacity-100">
        <p className="line-clamp-2 text-[0.78rem] font-medium leading-snug text-neutral-100">
          {poster.title}
        </p>
        {poster.year && (
          <p className="mt-0.5 text-[0.65rem] tracking-[0.16em] text-primary">{poster.year}</p>
        )}
      </div>

      {/* Gold edge on hover */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px scale-x-0 bg-primary transition-transform duration-500 group-hover:scale-x-100" />
    </Link>
  );
}

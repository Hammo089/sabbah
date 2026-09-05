// components/site/home/film-strip.tsx
'use client';

import Image from 'next/image';
import { useReducedMotion } from 'framer-motion';
import type { CatalogCard } from '@/lib/queries/catalog';
import { cn } from '@/lib/utils';

/**
 * The vertical film strip on the right of the hero. Pure CSS animation — the
 * track is rendered twice so the loop is seamless, and it pauses on hover.
 */
export function FilmStrip({ posters }: { posters: CatalogCard[] }) {
  const reduce = useReducedMotion();
  if (posters.length === 0) return null;

  const loop = [...posters, ...posters];

  return (
    <div
      aria-hidden
      className={cn(
        'absolute inset-y-0 end-0 z-0 hidden w-[48%] overflow-hidden lg:block',
        '[mask-image:linear-gradient(to_left,rgba(0,0,0,.6)_30%,transparent)]',
        '[-webkit-mask-image:linear-gradient(to_left,rgba(0,0,0,.6)_30%,transparent)]',
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-[3px]',
          !reduce && 'animate-film-scroll hover:[animation-play-state:paused]',
        )}
      >
        {loop.map((p, i) => (
          <div key={`${p.id}-${i}`} className="relative aspect-video w-full shrink-0 bg-[#1a1a1a]">
            {p.posterUrl && (
              <Image
                src={p.posterUrl}
                alt=""
                fill
                sizes="48vw"
                className="object-cover opacity-70"
                priority={i < 2}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

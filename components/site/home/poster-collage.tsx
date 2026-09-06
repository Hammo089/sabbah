'use client';

// components/site/home/poster-collage.tsx
// The drifting collage from the reference: rounded poster cards at slight
// rotations, each floating on its own slow loop so the cluster never settles
// into a pattern the eye can predict.
//
// Two decisions worth naming:
//
//  1. The layout is a fixed, hand-tuned arrangement, not random. Random
//     positions look different on every load and occasionally overlap badly;
//     these offsets were chosen so the cluster reads as one shape.
//  2. Only `transform` and `opacity` are animated. Both are composited on the
//     GPU, so the drift costs no layout or paint — which is what makes running
//     eight of them at once affordable.
import * as React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useMotionAllowed, useTabVisible } from '@/components/motion/use-motion-allowed';
import type { CatalogCard } from '@/lib/queries/catalog';
import { cn } from '@/lib/utils';

/** x/y are percentages of the stage; w is a percentage of stage width. */
type Slot = {
  x: number; y: number; w: number; rotate: number;
  depth: number; float: number; delay: number;
};

const SLOTS: Slot[] = [
  { x: 2,  y: 14, w: 26, rotate: -8,  depth: 0.55, float: 14, delay: 0 },
  { x: 30, y: 2,  w: 30, rotate: 5,   depth: 0.85, float: 18, delay: 0.6 },
  { x: 63, y: 10, w: 24, rotate: -4,  depth: 0.65, float: 12, delay: 1.2 },
  { x: 12, y: 46, w: 30, rotate: 6,   depth: 1,    float: 20, delay: 0.3 },
  { x: 45, y: 38, w: 34, rotate: -3,  depth: 1.15, float: 16, delay: 0.9 },
  { x: 74, y: 44, w: 22, rotate: 9,   depth: 0.5,  float: 13, delay: 1.6 },
  { x: 26, y: 76, w: 26, rotate: -6,  depth: 0.75, float: 15, delay: 2.1 },
  { x: 58, y: 74, w: 28, rotate: 4,   depth: 0.9,  float: 17, delay: 1.4 },
];

export function PosterCollage({
  posters,
  className,
}: {
  posters: CatalogCard[];
  className?: string;
}) {
  const { ambient, reveal } = useMotionAllowed();
  const visible = useTabVisible();

  if (posters.length === 0) return null;

  const cards = SLOTS.map((slot, i) => ({ slot, item: posters[i % posters.length]! }));
  const drifting = ambient && visible;

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-y-0 end-0 hidden w-[46%] lg:block xl:w-[50%]',
        '[mask-image:linear-gradient(to_left,#000_58%,transparent)]',
        '[-webkit-mask-image:linear-gradient(to_left,#000_58%,transparent)]',
        className,
      )}
    >
      <div className="relative size-full">
        {cards.map(({ slot, item }, i) => (
          <motion.div
            key={`${item.id}-${i}`}
            className="absolute"
            style={{
              left: `${slot.x}%`,
              top: `${slot.y}%`,
              width: `${slot.w}%`,
              zIndex: Math.round(slot.depth * 10),
            }}
            initial={reveal ? { opacity: 0, scale: 0.9, y: 24 } : false}
            animate={
              drifting
                ? {
                    opacity: 0.55 + slot.depth * 0.35,
                    scale: 1,
                    // The float itself: a slow vertical drift plus a hair of
                    // rotation, each card on its own phase via `delay`.
                    y: [0, -slot.float, 0],
                    rotate: [slot.rotate, slot.rotate + 1.6, slot.rotate],
                  }
                : { opacity: 0.55 + slot.depth * 0.35, scale: 1, y: 0, rotate: slot.rotate }
            }
            transition={
              drifting
                ? {
                    opacity: { duration: 0.9, delay: i * 0.08 },
                    scale: { duration: 0.9, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
                    y: { duration: 6 + slot.float / 4, repeat: Infinity, ease: 'easeInOut', delay: slot.delay },
                    rotate: { duration: 9 + slot.float / 3, repeat: Infinity, ease: 'easeInOut', delay: slot.delay },
                  }
                : { duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }
            }
          >
            <div
              className={cn(
                'relative aspect-[2/3] w-full overflow-hidden rounded-[18px]',
                'bg-muted ring-1 ring-white/[0.08]',
                'shadow-[0_28px_60px_-30px_rgba(0,0,0,0.9)]',
              )}
              style={{ transform: `rotate(${slot.rotate}deg)` }}
            >
              {item.posterUrl && (
                <Image
                  src={item.posterUrl}
                  alt=""
                  fill
                  sizes="(max-width:1280px) 22vw, 18vw"
                  priority={i < 3}
                  className="object-cover"
                />
              )}

              {/* Keeps the brand green in the cluster and stops any single
                  poster's colour from dominating the hero. */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary/25 via-transparent to-transparent" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

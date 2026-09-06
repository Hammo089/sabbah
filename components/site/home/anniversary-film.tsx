// components/site/home/anniversary-film.tsx
'use client';

import * as React from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Play } from 'lucide-react';
import { YouTubeTheatre } from '@/components/site/youtube-theatre';
import { cn } from '@/lib/utils';

type Dict = {
  tag: string;
  title: string;
  line: string;
  cta: string;
  years: string;
};

/**
 * The 70th-anniversary film.
 *
 * Deliberately not a bare embed: the section opens as a sealed gold-ruled
 * "reel" over a parallax field of frame numbers, and the iframe is only
 * mounted after a click — so YouTube loads nothing (and sets no cookies)
 * until the visitor actually asks for it.
 */
export function AnniversaryFilm({
  youtubeId,
  dict,
}: {
  youtubeId: string;
  dict: Dict;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.96, 1, 0.98]);

  return (
    <section
      ref={ref}
      className="on-media relative overflow-hidden border-y border-primary/10 bg-[#0f0f0f] py-24 md:py-32"
    >
      {/* Sprocket rails — the film-perforation motif from the brand */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 start-0 hidden w-10 flex-col justify-around py-6 md:flex">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="mx-auto block h-3 w-4 rounded-[2px] bg-primary/[0.07]" />
        ))}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 end-0 hidden w-10 flex-col justify-around py-6 md:flex">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="mx-auto block h-3 w-4 rounded-[2px] bg-primary/[0.07]" />
        ))}
      </div>

      <motion.div
        style={reduce ? undefined : { y }}
        aria-hidden
        className="pointer-events-none absolute inset-0 grid place-items-center"
      >
        <span className="condensed select-none text-[26vw] leading-none text-primary/[0.035]">
          {dict.years}
        </span>
      </motion.div>

      <div className="relative mx-auto w-full max-w-[1280px] px-6 md:px-14">
        <p className="sec-tag">{dict.tag}</p>
        <h2 className="sec-title max-w-3xl">{dict.title}</h2>
        <p className="mt-5 max-w-xl text-[15px] leading-[1.85] text-muted-foreground">{dict.line}</p>

        <motion.div
          style={reduce ? undefined : { scale }}
          className="relative mt-12 aspect-video w-full overflow-hidden border border-primary/[0.12] bg-[#1a1a1a]"
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group absolute inset-0 grid place-items-center"
            aria-label={dict.cta}
          >
            {/* Poster comes from YouTube itself — no extra asset to host */}
            <img
              src={`https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`}
              alt=""
              className="absolute inset-0 size-full object-cover opacity-45 transition-opacity duration-500 group-hover:opacity-60"
            />

            <span aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,transparent,rgba(0,0,0,.75))]" />

            <span className="relative z-10 flex flex-col items-center gap-5">
              <span
                className={cn(
                  'flex size-20 items-center justify-center rounded-full border border-primary/50',
                  'transition-all duration-500 group-hover:scale-110 group-hover:border-primary group-hover:bg-primary/10',
                )}
              >
                <Play className="size-6 fill-primary text-primary" />
              </span>
              <span className="condensed text-[13px] tracking-[0.4em] text-primary">{dict.cta}</span>
            </span>
          </button>
        </motion.div>

        <YouTubeTheatre
          videoId={youtubeId}
          open={open}
          onClose={() => setOpen(false)}
          title={dict.title}
        />
      </div>
    </section>
  );
}

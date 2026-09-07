// components/site/title-stage.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Play } from 'lucide-react';

import { VideoTheater, type TheaterDict } from '@/components/site/video-theater';
import { formatDuration } from '@/lib/youtube-player';
import type { TitleVideo } from '@/lib/queries/catalog';
import { cn } from '@/lib/utils';

/**
 * The screen.
 *
 * A title page that opens with a wall of metadata reads like a database row.
 * This puts the picture first: one large 16:9 plate, lit from beneath, that
 * behaves like a cinema screen — it is the biggest thing on the page and the
 * only thing asking to be clicked. The rest of the reel sits under it as a
 * rail, and everything opens into the same theatre.
 *
 * Client component because the theatre owns playback state; the surrounding
 * page stays a server component.
 */
export function TitleStage({
  videos,
  title,
  posterUrl,
  dict,
}: {
  videos: TitleVideo[];
  title: string;
  posterUrl: string | null;
  dict: TheaterDict & { videos: string; watchTrailer: string; noVideos: string };
}) {
  const reduce = useReducedMotion();
  const [openId, setOpenId] = React.useState<string | null>(null);

  const primary = React.useMemo(
    () => videos.find((v) => v.isPrimary) ?? videos[0] ?? null,
    [videos],
  );
  const rail = React.useMemo(
    () => videos.filter((v) => v.id !== primary?.id),
    [videos, primary],
  );

  if (!primary) return null;

  const label = (v: TitleVideo) => v.label || dict.kinds[v.kind] || dict.kinds.trailer;
  const plate = primary.thumbnailUrl ?? posterUrl;

  return (
    <section className="relative mx-auto w-full max-w-[1600px] px-6 pb-4 md:px-10 xl:px-16">
      {/* ---- The screen ---- */}
      <motion.button
        type="button"
        onClick={() => setOpenId(primary.id)}
        initial={reduce ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        aria-label={`${dict.watchTrailer} — ${title}`}
        className="group relative block w-full focus-visible:outline-none"
      >
        {/* Light spill: the glow a lit screen throws onto the wall behind it */}
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-x-6 -bottom-6 -top-4 -z-10 rounded-[2rem] bg-primary/10 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
        />

        <span className="relative block aspect-video w-full overflow-hidden rounded-lg bg-black ring-1 ring-white/10 transition-all duration-500 group-hover:ring-primary/40">
          {plate && (
            <Image
              src={plate}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1600px"
              className="object-cover opacity-80 transition-all duration-700 group-hover:scale-[1.03] group-hover:opacity-95"
            />
          )}

          {/* Vignette keeps the play control readable over any frame */}
          <span
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.75)_100%)]"
          />

          {/* Play control — a ring that breathes, a disc that fills on hover */}
          <span className="absolute inset-0 grid place-items-center">
            <span className="relative grid size-20 place-items-center md:size-24">
              {!reduce && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full border border-primary/50"
                  animate={{ scale: [1, 1.35], opacity: [0.55, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }}
                />
              )}
              <span className="absolute inset-0 rounded-full border border-white/25 backdrop-blur-[2px] transition-colors duration-500 group-hover:border-primary" />
              <span className="absolute inset-[6px] rounded-full bg-black/35 transition-colors duration-500 group-hover:bg-primary" />
              <Play className="relative size-7 translate-x-[2px] fill-white text-white transition-colors duration-500 group-hover:fill-primary-foreground group-hover:text-primary-foreground md:size-8" />
            </span>
          </span>

          {/* Caption strip */}
          <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/85 to-transparent px-5 pb-4 pt-14 md:px-7 md:pb-5">
            <span className="text-start">
              <span className="block text-[0.6rem] uppercase tracking-[0.24em] text-primary/90">
                {label(primary)}
              </span>
              <span className="mt-1 block text-sm text-white/85 md:text-base">{title}</span>
            </span>
            {formatDuration(primary.duration) && (
              <span className="shrink-0 rounded bg-black/60 px-2 py-1 text-[0.65rem] tabular-nums text-white/80">
                {formatDuration(primary.duration)}
              </span>
            )}
          </span>
        </span>
      </motion.button>

      {/* ---- The rail ---- */}
      {rail.length > 0 && (
        <div className="mt-10">
          <p className="text-[0.6rem] uppercase tracking-[0.24em] text-muted-foreground/70">
            {dict.videos}
            <span className="ms-2 text-muted-foreground/45">{rail.length}</span>
          </p>

          <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:thin]">
            {rail.map((v, i) => (
              <motion.button
                key={v.id}
                type="button"
                onClick={() => setOpenId(v.id)}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: reduce ? 0 : i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'group relative w-[230px] shrink-0 snap-start overflow-hidden rounded-md text-start',
                  'ring-1 ring-border transition-all hover:ring-primary/50',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                )}
              >
                <span className="relative block aspect-video w-full bg-muted/40">
                  {v.thumbnailUrl && (
                    <Image
                      src={v.thumbnailUrl}
                      alt=""
                      fill
                      sizes="230px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="grid size-11 place-items-center rounded-full bg-primary/90">
                      <Play className="size-4 translate-x-[1px] fill-primary-foreground text-primary-foreground" />
                    </span>
                  </span>
                  {formatDuration(v.duration) && (
                    <span className="absolute bottom-1.5 end-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[0.6rem] tabular-nums text-white/90">
                      {formatDuration(v.duration)}
                    </span>
                  )}
                </span>
                <span className="block px-3 py-2.5">
                  <span className="block text-[0.55rem] uppercase tracking-[0.2em] text-primary/80">
                    {dict.kinds[v.kind] ?? ''}
                  </span>
                  <span className="mt-1 block truncate text-xs text-foreground/85">{label(v)}</span>
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      <VideoTheater
        videos={videos}
        activeId={openId}
        open={openId !== null}
        onClose={() => setOpenId(null)}
        onSelect={setOpenId}
        title={title}
        dict={dict}
      />
    </section>
  );
}

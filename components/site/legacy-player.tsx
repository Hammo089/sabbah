// components/site/legacy-player.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Poster first, video only after an explicit click — never autoload a big file. */
export function LegacyPlayer({
  src,
  poster,
  label,
}: {
  src: string;
  poster: string | null;
  label: string;
}) {
  const [playing, setPlaying] = React.useState(false);
  const isYouTube = /youtube\.com|youtu\.be/.test(src);
  const youTubeId = isYouTube ? src.split(/v=|youtu\.be\//)[1]?.split(/[&?]/)[0] : null;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-neutral-900 ring-1 ring-white/[0.08]">
      {!playing ? (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 grid place-items-center"
          aria-label={label}
        >
          {poster && <Image src={poster} alt="" fill sizes="100vw" className="object-cover opacity-60" />}
          <span
            className={cn(
              'relative z-10 flex items-center gap-3 rounded-full bg-primary px-7 py-3.5',
              'text-sm font-medium text-primary-foreground transition-transform group-hover:scale-105',
            )}
          >
            <Play className="size-4 fill-current" />
            {label}
          </span>
        </button>
      ) : youTubeId ? (
        <iframe
          src={`https://www.youtube.com/embed/${youTubeId}?autoplay=1`}
          title={label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      ) : (
        <video src={src} poster={poster ?? undefined} controls autoPlay className="absolute inset-0 size-full object-cover">
          <track kind="captions" />
        </video>
      )}
    </div>
  );
}

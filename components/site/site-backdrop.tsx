'use client';

// components/site/site-backdrop.tsx
// The anniversary film, fixed behind the whole site, with the glass surfaces
// layered on top of it. Accepts a YouTube link or a direct file URL — the same
// field takes either.
//
// A fullscreen looping video on every page is the single most expensive thing a
// site can do to a visitor, so the rules here are strict:
//
//  - Phones get the POSTER IMAGE, not the video, unless the operator has
//    explicitly opted in. A looping background on mobile data, decoded behind
//    every page, is a battery and bandwidth bill the visitor did not agree to.
//  - `prefers-reduced-motion` and Save-Data always get the poster.
//  - The video pauses the moment the tab is hidden.
//  - Nothing is requested at all on a device that will never show it — the
//    <video> and the YouTube iframe are both mounted only after the checks pass.
//
// The poster is the BASE layer and the video is painted over it, not the other
// way round. There is never a black rectangle, and the design holds if the film
// never loads.
import * as React from 'react';
import { useMotionAllowed, useTabVisible } from '@/components/motion/use-motion-allowed';
import { resolveVideo, backdropEmbedUrl, youtubeThumb } from '@/lib/media/video-source';

export function SiteBackdrop({
  loopUrl,
  webmUrl,
  posterUrl,
  brightness,
  blur,
  allowOnMobile,
}: {
  /** YouTube link or direct MP4 URL. */
  loopUrl: string | null;
  webmUrl: string | null;
  posterUrl: string | null;
  brightness: number;
  blur: number;
  allowOnMobile: boolean;
}) {
  const { ambient } = useMotionAllowed();
  const visible = useTabVisible();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const frameRef = React.useRef<HTMLIFrameElement>(null);

  const [play, setPlay] = React.useState(false);

  const source = React.useMemo(() => resolveVideo(loopUrl), [loopUrl]);
  const still = posterUrl ?? (source?.kind === 'youtube' ? youtubeThumb(source.id) : null);

  React.useEffect(() => {
    if (!source || !ambient) return;

    const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const narrow = window.matchMedia('(max-width: 767px)').matches;
    if ((coarse || narrow) && !allowOnMobile) return;

    setPlay(true);
  }, [source, ambient, allowOnMobile]);

  // A hidden tab must not decode video. The file player is paused directly; the
  // YouTube iframe is asked over postMessage, which is why the embed carries
  // `enablejsapi=1`.
  React.useEffect(() => {
    if (!play) return;

    if (source?.kind === 'file') {
      const video = videoRef.current;
      if (!video) return;
      if (visible) void video.play().catch(() => undefined);
      else video.pause();
      return;
    }

    const win = frameRef.current?.contentWindow;
    win?.postMessage(
      JSON.stringify({ event: 'command', func: visible ? 'playVideo' : 'pauseVideo', args: [] }),
      '*',
    );
  }, [visible, play, source]);

  const filter = `brightness(${Math.min(Math.max(brightness, 10), 100) / 100})${
    blur > 0 ? ` blur(${Math.min(blur, 20)}px)` : ''
  }`;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black">
      {still && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={still}
          alt=""
          className="absolute inset-0 size-full object-cover"
          style={{ filter }}
        />
      )}

      {play && source?.kind === 'file' && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={still ?? undefined}
          className="absolute inset-0 size-full object-cover"
          style={{ filter }}
        >
          {webmUrl && <source src={webmUrl} type="video/webm" />}
          <source src={source.url} type="video/mp4" />
        </video>
      )}

      {play && source?.kind === 'youtube' && (
        // An iframe cannot object-fit, so the frame is overscanned past both
        // axes and centred: whichever side is short gets cropped rather than
        // letterboxed with black bars.
        <iframe
          ref={frameRef}
          src={backdropEmbedUrl(source.id)}
          title=""
          tabIndex={-1}
          allow="autoplay; encrypted-media"
          className="absolute left-1/2 top-1/2 aspect-video h-[calc(100vh+120px)] w-[calc(100vw+120px)] min-h-[56.25vw] min-w-[177.78vh] -translate-x-1/2 -translate-y-1/2 border-0"
          style={{ filter }}
        />
      )}

      {/* Contrast floor. Glass panels are translucent, so without this the film
          decides how readable the page is — a bright frame would wash it out. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/70" />
    </div>
  );
}

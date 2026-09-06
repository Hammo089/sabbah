'use client';

// components/site/site-backdrop.tsx
// The anniversary film, fixed behind the whole site, with the glass surfaces
// layered on top of it.
//
// A fullscreen looping video on every page is the single most expensive thing a
// site can do to a visitor, so the rules here are strict:
//
//  - Phones get the POSTER IMAGE, not the video, unless the operator has
//    explicitly opted in. A 15 MB loop on mobile data, decoded continuously
//    behind every page, is a battery and bandwidth bill the visitor did not
//    agree to.
//  - `prefers-reduced-motion` and Save-Data always get the poster.
//  - The video pauses the moment the tab is hidden.
//  - `preload="none"` until we have decided to play: the file is not even
//    requested on a device that will never show it.
//
// The poster is not a fallback bolted on afterwards — it is the base layer, and
// the video is an enhancement painted over it. That way there is never a black
// rectangle, and the design holds if the video never loads at all.
import * as React from 'react';
import { useMotionAllowed, useTabVisible } from '@/components/motion/use-motion-allowed';

export type BackdropConfig = {
  loopUrl: string | null;
  webmUrl: string | null;
  posterUrl: string | null;
  /** 10–100; the film is dimmed so foreground text keeps its contrast. */
  brightness: number;
  /** 0–20 px. */
  blur: number;
  allowOnMobile: boolean;
};

export function SiteBackdrop({
  loopUrl,
  webmUrl,
  posterUrl,
  brightness,
  blur,
  allowOnMobile,
}: BackdropConfig) {
  const { ambient } = useMotionAllowed();
  const visible = useTabVisible();
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const [playVideo, setPlayVideo] = React.useState(false);

  React.useEffect(() => {
    if (!loopUrl || !ambient) return;

    const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const narrow = window.matchMedia('(max-width: 767px)').matches;

    if ((coarse || narrow) && !allowOnMobile) return;

    setPlayVideo(true);
  }, [loopUrl, ambient, allowOnMobile]);

  // A hidden tab must not decode video.
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !playVideo) return;

    if (visible) void video.play().catch(() => undefined);
    else video.pause();
  }, [visible, playVideo]);

  const filter = `brightness(${Math.min(Math.max(brightness, 10), 100) / 100})${
    blur > 0 ? ` blur(${Math.min(blur, 20)}px)` : ''
  }`;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black">
      {/* Base layer: the still. Always painted, so the design never depends on
          the video arriving. */}
      {posterUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterUrl}
          alt=""
          className="absolute inset-0 size-full object-cover"
          style={{ filter }}
        />
      )}

      {playVideo && loopUrl && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={posterUrl ?? undefined}
          className="absolute inset-0 size-full object-cover"
          style={{ filter }}
        >
          {webmUrl && <source src={webmUrl} type="video/webm" />}
          <source src={loopUrl} type="video/mp4" />
        </video>
      )}

      {/* Contrast floor. Glass panels are translucent, so without this the film
          decides how readable the page is — and a bright frame would wash the
          text out completely. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/70" />
    </div>
  );
}

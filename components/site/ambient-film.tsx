// components/site/ambient-film.tsx
'use client';

import * as React from 'react';

/**
 * The anniversary film running as a living backdrop behind the site.
 *
 * A background video is the easiest way to make a site feel expensive and the
 * easiest way to make a phone hot, so every one of these guards is deliberate:
 *
 *  - never mounted on coarse-pointer/narrow viewports (phones and tablets),
 *  - never mounted for `prefers-reduced-motion` or Save-Data,
 *  - never mounted when the device reports <= 4 logical cores or <= 4 GB RAM,
 *  - paused whenever the tab is hidden, so a background tab costs nothing,
 *  - paused once the visitor scrolls past the first screen, because nothing is
 *    visible under the content anyway,
 *  - muted, loop, no controls, `pointer-events: none` — it can never steal a
 *    click or a scroll from the page.
 *
 * The iframe is only created after the checks pass, so on a phone YouTube is
 * never contacted at all.
 */
export function AmbientFilm({
  youtubeId,
  opacity,
}: {
  youtubeId: string;
  opacity: number;
}) {
  const [allowed, setAllowed] = React.useState(false);
  const [active, setActive] = React.useState(true);
  const frameRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    if (!youtubeId) return;

    const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const narrow = window.matchMedia('(max-width: 1023px)').matches;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
      deviceMemory?: number;
    };

    const saveData = nav.connection?.saveData === true;
    const slowLink = /(^|-)2g$/.test(nav.connection?.effectiveType ?? '');
    const weakCpu = (navigator.hardwareConcurrency ?? 8) <= 4;
    const weakRam = (nav.deviceMemory ?? 8) <= 4;

    if (coarse || narrow || calm || saveData || slowLink || weakCpu || weakRam) return;

    setAllowed(true);
  }, [youtubeId]);

  // A hidden tab must not decode video.
  React.useEffect(() => {
    if (!allowed) return;

    const onVisibility = () => setActive(!document.hidden && window.scrollY < window.innerHeight);
    const onScroll = () => setActive(!document.hidden && window.scrollY < window.innerHeight);

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('scroll', onScroll, { passive: true });
    onVisibility();

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('scroll', onScroll);
    };
  }, [allowed]);

  // postMessage rather than the full IFrame API: one command, no extra script.
  React.useEffect(() => {
    if (!allowed) return;
    const win = frameRef.current?.contentWindow;
    if (!win) return;

    win.postMessage(
      JSON.stringify({ event: 'command', func: active ? 'playVideo' : 'pauseVideo', args: [] }),
      '*',
    );
  }, [active, allowed]);

  if (!allowed) return null;

  const src =
    `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}` +
    `?autoplay=1&mute=1&controls=0&loop=1&playlist=${encodeURIComponent(youtubeId)}` +
    `&playsinline=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&enablejsapi=1`;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {/* 16:9 cover: whichever axis is short gets overscanned, never letterboxed. */}
      <iframe
        ref={frameRef}
        src={src}
        title=""
        tabIndex={-1}
        allow="autoplay; encrypted-media"
        className="absolute left-1/2 top-1/2 aspect-video h-[calc(100vh+8rem)] w-[calc(100vw+8rem)] min-h-[56.25vw] min-w-[177.78vh] -translate-x-1/2 -translate-y-1/2 border-0"
        style={{ opacity: Math.min(Math.max(opacity, 0), 60) / 100 }}
      />

      {/* Scrim so body copy keeps its contrast over any frame of the film. */}
      <div className="absolute inset-0 bg-background/70" />
    </div>
  );
}

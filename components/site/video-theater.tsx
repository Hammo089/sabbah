// components/site/video-theater.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, Volume2, VolumeX, Play, RotateCcw, Loader2 } from 'lucide-react';

import {
  loadYouTubeApi,
  isTouchDevice,
  formatDuration,
  ENDED,
  PLAYING,
  PAUSED,
  type PlayerState,
  type YTPlayer,
} from '@/lib/youtube-player';
import type { TitleVideo } from '@/lib/queries/catalog';
import { cn } from '@/lib/utils';

/**
 * Full-bleed video theatre for a title's whole reel — trailer, teasers, clips.
 *
 * The behaviour the page is built around: a viewer clicks one video, the room
 * goes dark, that video plays from the top with sound. When they pause it or it
 * runs out, the theatre does NOT dump them back to the page — it dims the
 * picture and lays the title's other videos over it, so the natural next move
 * is another video rather than an exit.
 *
 * Two playback backends behind one surface:
 *  - YouTube ids go through the IFrame API, because a plain embed cannot tell
 *    the page when the viewer paused, and pause is what raises the shelf.
 *  - Direct file URLs go through a plain <video>, which reports the same three
 *    events natively.
 *
 * Mobile constraints that shape the code:
 *  1. AUTOPLAY descends from a real user gesture. The player is constructed
 *     immediately on open — never inside a timer — and the cinematic curtain is
 *     drawn on top of an already-loading picture. If the browser still refuses,
 *     playback retries muted and an unmute control appears.
 *  2. SIZING uses dvh on both axes; `aspect-video` alone overflows a landscape
 *     phone and pushes the controls off-screen, and vh breaks when the iOS URL
 *     bar collapses.
 *  3. A PAUSE MUST BE DELIBERATE. Scrubbing and buffering both emit PAUSED for
 *     a fraction of a second; raising the shelf on those makes the film feel
 *     like it keeps interrupting itself.
 */

/** Locks the page behind the theatre; iOS ignores overflow:hidden on <body>. */
function useScrollLock(active: boolean) {
  React.useEffect(() => {
    if (!active) return;

    const { body } = document;
    const scrollY = window.scrollY;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}

export type TheaterDict = {
  /** "More from this title" */
  more: string;
  /** "Resume" */
  resume: string;
  /** "Replay" */
  replay: string;
  /** "Close" */
  close: string;
  /** Per-kind labels, e.g. { trailer: 'Trailer', teaser: 'Teaser' } */
  kinds: Record<string, string>;
};

export function VideoTheater({
  videos,
  activeId,
  open,
  onClose,
  onSelect,
  title,
  dict,
  /** Milliseconds the curtain holds before the picture is revealed. */
  startDelay = 800,
}: {
  videos: TitleVideo[];
  activeId: string | null;
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  title: string;
  dict: TheaterDict;
  startDelay?: number;
}) {
  const mountRef = React.useRef<HTMLDivElement>(null);
  const fileRef = React.useRef<HTMLVideoElement>(null);
  const playerRef = React.useRef<YTPlayer | null>(null);
  const pauseTimer = React.useRef<number | null>(null);
  const hasPlayed = React.useRef(false);

  const [revealed, setRevealed] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  /** The shelf of other videos, raised on a deliberate pause or on end. */
  const [shelf, setShelf] = React.useState<'hidden' | 'paused' | 'ended'>('hidden');

  const reduce = useReducedMotion();
  useScrollLock(open);

  const active = React.useMemo(
    () => videos.find((v) => v.id === activeId) ?? videos[0] ?? null,
    [videos, activeId],
  );
  const others = React.useMemo(
    () => videos.filter((v) => v.id !== active?.id),
    [videos, active],
  );

  const clearPauseTimer = React.useCallback(() => {
    if (pauseTimer.current) window.clearTimeout(pauseTimer.current);
    pauseTimer.current = null;
  }, []);

  const close = React.useCallback(() => {
    clearPauseTimer();
    hasPlayed.current = false;
    setRevealed(false);
    setFailed(false);
    setShelf('hidden');
    onClose();
  }, [onClose, clearPauseTimer]);

  /** A pause counts only once the film has actually run and the pause holds. */
  const armShelf = React.useCallback(
    (currentTime: number) => {
      if (!hasPlayed.current || currentTime < 1.5) return;
      clearPauseTimer();
      pauseTimer.current = window.setTimeout(() => setShelf('paused'), 650);
    },
    [clearPauseTimer],
  );

  // ---- YouTube backend ----------------------------------------------------
  React.useEffect(() => {
    if (!open || !active?.youtubeId) return;

    let cancelled = false;
    const startMuted = isTouchDevice();
    setMuted(startMuted);
    setShelf('hidden');
    hasPlayed.current = false;

    const revealTimer = window.setTimeout(
      () => !cancelled && setRevealed(true),
      reduce ? 0 : startDelay,
    );
    // Never leave the viewer staring at a black rectangle.
    const failTimer = window.setTimeout(() => {
      if (!cancelled && !hasPlayed.current) setFailed(true);
    }, 9000);

    void (async () => {
      await loadYouTubeApi();
      if (cancelled || !mountRef.current || !window.YT) return;

      playerRef.current = new window.YT.Player(mountRef.current, {
        videoId: active.youtubeId,
        playerVars: {
          autoplay: 1,
          mute: startMuted ? 1 : 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          controls: 1,
          fs: 1,
          iv_load_policy: 3,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: { target: YTPlayer }) => {
            if (cancelled) return;
            try {
              // start:0 is implicit for a fresh load, but an explicit seek makes
              // "always from the beginning" true even when the API restores a
              // remembered position.
              event.target.seekTo(0, true);
              event.target.playVideo();
            } catch {
              /* the state handler covers the refusal */
            }
          },
          onError: () => !cancelled && setFailed(true),
          onStateChange: (event: { data: PlayerState }) => {
            if (cancelled) return;
            clearPauseTimer();

            if (event.data === PLAYING) {
              hasPlayed.current = true;
              setFailed(false);
              setRevealed(true);
              setShelf('hidden');
              return;
            }
            if (event.data === ENDED) {
              setShelf('ended');
              return;
            }
            if (event.data === PAUSED) {
              armShelf(playerRef.current?.getCurrentTime?.() ?? 0);
            }
          },
        },
      });
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(revealTimer);
      window.clearTimeout(failTimer);
      clearPauseTimer();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [open, active?.youtubeId, startDelay, reduce, armShelf, clearPauseTimer]);

  // ---- File backend -------------------------------------------------------
  React.useEffect(() => {
    if (!open || active?.youtubeId || !active?.url) return;

    const el = fileRef.current;
    if (!el) return;

    let cancelled = false;
    setShelf('hidden');
    hasPlayed.current = false;

    const revealTimer = window.setTimeout(
      () => !cancelled && setRevealed(true),
      reduce ? 0 : startDelay,
    );

    el.currentTime = 0;
    el.muted = false;
    setMuted(false);

    el.play().catch(() => {
      // Unmuted autoplay refused — retry muted and surface the control.
      if (cancelled) return;
      el.muted = true;
      setMuted(true);
      el.play().catch(() => !cancelled && setFailed(true));
    });

    return () => {
      cancelled = true;
      window.clearTimeout(revealTimer);
      clearPauseTimer();
    };
  }, [open, active?.url, active?.youtubeId, startDelay, reduce, clearPauseTimer]);

  // Escape closes.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  function toggleSound() {
    if (active?.youtubeId) {
      const player = playerRef.current;
      if (!player) return;
      if (player.isMuted()) {
        player.unMute();
        player.playVideo();
        setMuted(false);
      } else {
        player.mute();
        setMuted(true);
      }
      return;
    }
    const el = fileRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
    if (!el.muted) void el.play();
  }

  function resume() {
    setShelf('hidden');
    if (active?.youtubeId) playerRef.current?.playVideo();
    else void fileRef.current?.play();
  }

  function replay() {
    setShelf('hidden');
    if (active?.youtubeId) {
      playerRef.current?.seekTo(0, true);
      playerRef.current?.playVideo();
    } else if (fileRef.current) {
      fileRef.current.currentTime = 0;
      void fileRef.current.play();
    }
  }

  const kindLabel = (v: TitleVideo) => v.label || dict.kinds[v.kind] || dict.kinds.trailer;

  if (!active) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[200] bg-black"
          style={{ height: '100dvh' }}
        >
          {/* Curtain: house lights going down before the picture starts */}
          <AnimatePresence>
            {!revealed && (
              <motion.div
                key="curtain"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55 }}
                className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-black"
              >
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: (reduce ? 0 : startDelay) / 1000, ease: 'linear' }}
                  className="h-px w-40 origin-left bg-primary/80"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stage — capped on both axes so a landscape phone keeps its controls */}
          <div className="absolute inset-0 grid place-items-center p-0 sm:p-6">
            <motion.div
              initial={reduce ? false : { scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : 0.1 }}
              className="relative w-full overflow-hidden bg-black sm:rounded-lg"
              style={{
                maxWidth: 'min(100vw, calc((100dvh - 6rem) * 16 / 9))',
                aspectRatio: '16 / 9',
                maxHeight: '100dvh',
              }}
            >
              {active.youtubeId ? (
                <div ref={mountRef} className="absolute inset-0 h-full w-full [&>iframe]:h-full [&>iframe]:w-full" />
              ) : (
                <video
                  ref={fileRef}
                  src={active.url ?? undefined}
                  poster={active.thumbnailUrl ?? undefined}
                  controls
                  playsInline
                  className="absolute inset-0 h-full w-full bg-black object-contain"
                  onPlaying={() => {
                    hasPlayed.current = true;
                    setRevealed(true);
                    setShelf('hidden');
                  }}
                  onPause={() => armShelf(fileRef.current?.currentTime ?? 0)}
                  onEnded={() => setShelf('ended')}
                  onError={() => setFailed(true)}
                />
              )}

              {failed && (
                <div className="absolute inset-0 z-10 grid place-items-center bg-black/90 text-center">
                  <div className="px-6">
                    <Loader2 className="mx-auto size-5 animate-spin text-primary/70" />
                    <p className="mt-4 text-sm text-white/70">{title}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* The shelf — the title's other videos, over a dimmed picture */}
          <AnimatePresence>
            {shelf !== 'hidden' && (
              <motion.div
                key="shelf"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 z-30 flex flex-col justify-end bg-gradient-to-t from-black via-black/90 to-black/60"
              >
                <div className="mx-auto w-full max-w-[1400px] px-6 pb-10 pt-8 md:px-10">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={shelf === 'ended' ? replay : resume}
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
                    >
                      {shelf === 'ended' ? (
                        <><RotateCcw className="size-4" />{dict.replay}</>
                      ) : (
                        <><Play className="size-4 fill-current" />{dict.resume}</>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={close}
                      className="inline-flex items-center gap-2 rounded-md border border-white/20 px-5 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <X className="size-4" />
                      {dict.close}
                    </button>
                  </div>

                  {others.length > 0 && (
                    <>
                      <p className="mt-8 text-[0.65rem] uppercase tracking-[0.22em] text-white/45">
                        {dict.more}
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {others.map((v, i) => (
                          <motion.button
                            key={v.id}
                            type="button"
                            initial={reduce ? false : { opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: reduce ? 0 : 0.05 + i * 0.05 }}
                            onClick={() => {
                              setShelf('hidden');
                              setRevealed(false);
                              onSelect(v.id);
                            }}
                            className="group relative overflow-hidden rounded-md text-start ring-1 ring-white/10 transition-all hover:ring-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <span className="relative block aspect-video w-full bg-white/5">
                              {v.thumbnailUrl && (
                                <Image
                                  src={v.thumbnailUrl}
                                  alt=""
                                  fill
                                  sizes="(max-width: 640px) 50vw, 20vw"
                                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              )}
                              <span className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                              <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
                                <Play className="size-7 fill-white text-white drop-shadow" />
                              </span>
                              {formatDuration(v.duration) && (
                                <span className="absolute bottom-1.5 end-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[0.6rem] tabular-nums text-white/90">
                                  {formatDuration(v.duration)}
                                </span>
                              )}
                            </span>
                            <span className="block px-2.5 py-2 text-xs leading-snug text-white/85 line-clamp-2">
                              {kindLabel(v)}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Persistent chrome */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-4 p-4 sm:p-5">
            <p className="pointer-events-none max-w-[60%] truncate text-xs uppercase tracking-[0.2em] text-white/55">
              {title}
              <span className="mx-2 text-white/25">/</span>
              <span className="text-white/80">{kindLabel(active)}</span>
            </p>
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSound}
                aria-label={muted ? 'Unmute' : 'Mute'}
                className={cn(
                  'grid size-9 place-items-center rounded-full border transition-colors',
                  muted
                    ? 'border-primary/60 bg-primary/20 text-primary'
                    : 'border-white/20 bg-black/40 text-white/80 hover:bg-white/10',
                )}
              >
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
              <button
                type="button"
                onClick={close}
                aria-label={dict.close}
                className="grid size-9 place-items-center rounded-full border border-white/20 bg-black/40 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// components/site/youtube-theatre.tsx
'use client';

import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, Volume2, VolumeX, Loader2 } from 'lucide-react';

import {
  loadYouTubeApi,
  isTouchDevice,
  ENDED,
  PLAYING,
  PAUSED,
  type PlayerState,
  type YTPlayer,
} from '@/lib/youtube-player';

/**
 * Full-bleed YouTube "theatre".
 *
 * Uses the IFrame Player API rather than a plain embed because a plain embed
 * cannot tell the page when the viewer pauses. Here the player reports its
 * state, so pausing or finishing dims the theatre back down and hands the
 * visitor to the page again.
 *
 * Mobile notes — the three things that make embedded players feel broken on a
 * phone, and what is done about each:
 *
 *  1. AUTOPLAY. iOS only honours playback that descends from a real user
 *     gesture. Building the player inside a setTimeout severs that chain, so
 *     the player is constructed IMMEDIATELY on open and the cinematic delay is
 *     purely a curtain drawn on top of it. If the browser still refuses, we
 *     retry muted and surface an unmute control instead of showing a dead frame.
 *  2. SIZING. `aspect-video` alone overflows a landscape phone and pushes the
 *     controls off-screen. The stage is capped by BOTH axes using dvh, which
 *     also survives the iOS URL-bar collapse that breaks vh.
 *  3. ACCIDENTAL CLOSE. Scrubbing and buffering both emit PAUSED. Closing on
 *     the first one makes the video "disappear" mid-watch. A pause must now be
 *     deliberate: the film must have run a moment, and the pause must hold.
 *
 * Nothing from youtube.com is requested until the theatre actually opens.
 */

/**
 * Locks the page behind the theatre. `overflow:hidden` on <body> is ignored by
 * iOS Safari, so the scroll position is frozen with position:fixed and put back
 * on close.
 */
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

export function YouTubeTheatre({
  videoId,
  open,
  onClose,
  title,
  /** Milliseconds the curtain holds before the picture is revealed. */
  startDelay = 900,
  /** Close the theatre when the viewer deliberately pauses. */
  closeOnPause = true,
}: {
  videoId: string;
  open: boolean;
  onClose: () => void;
  title: string;
  startDelay?: number;
  closeOnPause?: boolean;
}) {
  const mountRef = React.useRef<HTMLDivElement>(null);
  const playerRef = React.useRef<YTPlayer | null>(null);
  const pauseTimer = React.useRef<number | null>(null);
  const hasPlayed = React.useRef(false);

  const [revealed, setRevealed] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const reduce = useReducedMotion();

  useScrollLock(open);

  const close = React.useCallback(() => {
    if (pauseTimer.current) window.clearTimeout(pauseTimer.current);
    pauseTimer.current = null;
    hasPlayed.current = false;
    setRevealed(false);
    setFailed(false);
    onClose();
  }, [onClose]);

  // Build the player the moment the theatre opens — never inside a timer, or
  // mobile autoplay is refused.
  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const startMuted = isTouchDevice();
    setMuted(startMuted);

    // The curtain is a visual only; the film is already loading behind it.
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
        videoId,
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
              event.target.playVideo();
            } catch {
              /* the state handler covers the refusal */
            }
          },
          onError: () => !cancelled && setFailed(true),
          onStateChange: (event: { data: PlayerState }) => {
            if (cancelled) return;

            if (pauseTimer.current) {
              window.clearTimeout(pauseTimer.current);
              pauseTimer.current = null;
            }

            if (event.data === PLAYING) {
              hasPlayed.current = true;
              setFailed(false);
              setRevealed(true);
              return;
            }

            if (event.data === ENDED) {
              close();
              return;
            }

            // A pause counts only if the film actually ran and the pause holds:
            // scrubbing and buffering both emit PAUSED for a fraction of a second.
            if (event.data === PAUSED && closeOnPause && hasPlayed.current) {
              const at = playerRef.current?.getCurrentTime?.() ?? 0;
              if (at < 1.5) return;

              pauseTimer.current = window.setTimeout(close, 650);
            }
          },
        },
      });
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(revealTimer);
      window.clearTimeout(failTimer);
      if (pauseTimer.current) window.clearTimeout(pauseTimer.current);
      pauseTimer.current = null;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [open, videoId, startDelay, closeOnPause, reduce, close]);

  // Escape closes.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  function toggleSound() {
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
  }

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
          onClick={close}
        >
          {/* Curtain: the house lights going down before the picture starts */}
          <AnimatePresence>
            {!revealed && (
              <motion.div
                key="curtain"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55 }}
                className="absolute inset-0 z-10 grid place-items-center"
              >
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: (reduce ? 0 : startDelay) / 1000, ease: 'linear' }}
                  className="block h-px w-40 origin-left bg-primary"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stage — capped on BOTH axes so a landscape phone never crops the
              YouTube controls, and dvh so the iOS URL bar cannot steal height. */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 grid place-items-center p-3 sm:p-6 md:p-10"
          >
            <motion.div
              initial={reduce ? false : { scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: revealed ? 1 : 0 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="aspect-video w-full max-w-[1600px]"
              style={{ maxHeight: 'calc(100dvh - 6rem)', maxWidth: 'min(100%, calc((100dvh - 6rem) * 16 / 9))' }}
            >
              <div ref={mountRef} className="size-full [&>iframe]:size-full" />
            </motion.div>

            {failed && (
              <div className="pointer-events-auto absolute inset-x-0 bottom-24 mx-auto grid max-w-xs place-items-center gap-3 text-center">
                <Loader2 className="size-5 animate-spin text-primary" />
                <a
                  href={`https://www.youtube.com/watch?v=${videoId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs uppercase tracking-[0.2em] text-primary underline-offset-4 hover:underline"
                >
                  YouTube
                </a>
              </div>
            )}
          </div>

          {/* Controls sit inside the safe area — a notch or the home indicator
              must never swallow the close target. */}
          <div
            className="absolute end-3 top-3 z-20 flex items-center gap-2 sm:end-5 sm:top-5"
            style={{ paddingTop: 'env(safe-area-inset-top)', paddingInlineEnd: 'env(safe-area-inset-right)' }}
          >
            {muted && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSound();
                }}
                aria-label="Unmute"
                className="grid size-12 place-items-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition-colors hover:border-primary hover:text-primary sm:size-11"
              >
                <VolumeX className="size-5" />
              </button>
            )}
            {!muted && playerRef.current && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSound();
                }}
                aria-label="Mute"
                className="hidden size-11 place-items-center rounded-full border border-white/20 bg-black/50 text-white/70 backdrop-blur transition-colors hover:border-primary hover:text-primary sm:grid"
              >
                <Volume2 className="size-5" />
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                close();
              }}
              aria-label="Close"
              className="grid size-12 place-items-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition-colors hover:border-primary hover:text-primary sm:size-11"
            >
              <X className="size-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

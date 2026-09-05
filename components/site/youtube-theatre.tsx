// components/site/youtube-theatre.tsx
'use client';

import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Full-bleed YouTube "theatre".
 *
 * Uses the IFrame Player API rather than a plain embed because a plain embed
 * cannot tell the page when the viewer pauses. Here the player reports its
 * state, so pausing or finishing dims the theatre back down and hands the
 * visitor to the page again — which is the behaviour asked for.
 *
 * Nothing from youtube.com is requested until the theatre actually opens.
 */

type PlayerState = -1 | 0 | 1 | 2 | 3 | 5;
const ENDED: PlayerState = 0;
const PLAYING: PlayerState = 1;
const PAUSED: PlayerState = 2;

type YTPlayer = {
  destroy: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement | string, options: Record<string, unknown>) => YTPlayer;
      loaded?: number;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

/** Loads the IFrame API once per page, no matter how many theatres exist. */
function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();

  apiPromise ??= new Promise<void>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
  });

  return apiPromise;
}

export function YouTubeTheatre({
  videoId,
  open,
  onClose,
  title,
  /** Milliseconds the curtain holds before the film starts. */
  startDelay = 900,
  /** Close the theatre when the viewer pauses. */
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
  const [ready, setReady] = React.useState(false);
  const reduce = useReducedMotion();

  // Ignore the very first PAUSED the API emits while buffering into play.
  const hasPlayed = React.useRef(false);

  const close = React.useCallback(() => {
    hasPlayed.current = false;
    setReady(false);
    onClose();
  }, [onClose]);

  // Build the player when the theatre opens; tear it down when it closes.
  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const delay = reduce ? 0 : startDelay;

    const timer = window.setTimeout(async () => {
      await loadYouTubeApi();
      if (cancelled || !mountRef.current || !window.YT) return;

      playerRef.current = new window.YT.Player(mountRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          controls: 1,
          iv_load_policy: 3,
        },
        events: {
          onReady: () => {
            if (!cancelled) setReady(true);
          },
          onStateChange: (event: { data: PlayerState }) => {
            if (event.data === PLAYING) {
              hasPlayed.current = true;
              return;
            }
            if (event.data === ENDED) {
              close();
              return;
            }
            if (event.data === PAUSED && closeOnPause && hasPlayed.current) {
              close();
            }
          },
        },
      });
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [open, videoId, startDelay, closeOnPause, reduce, close]);

  // Escape closes; the page behind must not scroll.
  React.useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

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
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[200] bg-black"
          onClick={close}
        >
          {/* Curtain: the house lights going down before the picture starts */}
          <AnimatePresence>
            {!ready && (
              <motion.div
                key="curtain"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 grid place-items-center"
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

          <motion.div
            initial={reduce ? false : { scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: ready ? 1 : 0 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 grid place-items-center p-4 md:p-10"
          >
            <div className="aspect-video w-full max-w-[1600px]">
              <div ref={mountRef} className="size-full" />
            </div>
          </motion.div>

          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute end-5 top-5 z-10 grid size-11 place-items-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-primary hover:text-primary"
          >
            <X className="size-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

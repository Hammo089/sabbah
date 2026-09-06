'use client';

// components/site/anniversary-button.tsx
// The glass "71" and the fullscreen takeover behind it.
//
// A separate <video> element from the backdrop, on purpose. The backdrop is a
// short silent loop that every visitor downloads; the full film with sound is
// large and is fetched only when someone presses this button. Reusing one
// element would mean serving the whole film to everyone just in case.
import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, Loader2, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveVideo, filmEmbedUrl, youtubeThumb } from '@/lib/media/video-source';

/** Locks the page behind the takeover. position:fixed, because iOS ignores overflow:hidden. */
function useScrollLock(active: boolean) {
  React.useEffect(() => {
    if (!active) return;

    const { body } = document;
    const scrollY = window.scrollY;
    const prev = { position: body.style.position, top: body.style.top, width: body.style.width };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}

export function AnniversaryButton({
  filmUrl,
  posterUrl,
  label,
  cta,
  backLabel,
  className,
}: {
  /** YouTube link or direct MP4 URL — the same field takes either. */
  filmUrl: string;
  posterUrl: string | null;
  /** The number on the button — "71" today, "72" next year. */
  label: string;
  cta: string;
  backLabel: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();

  const source = React.useMemo(() => resolveVideo(filmUrl), [filmUrl]);
  const still = posterUrl ?? (source?.kind === 'youtube' ? youtubeThumb(source.id) : null);

  useScrollLock(open);

  const close = React.useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setReady(false);
    setOpen(false);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Play with sound. The click is a real user gesture, so this is allowed —
  // but if the browser still refuses (some iOS low-power states do), fall back
  // to muted playback with an unmute control rather than a frozen frame.
  React.useEffect(() => {
    if (!open || source?.kind !== 'file') return;
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    video.muted = false;
    setMuted(false);

    video.play().catch(() => {
      video.muted = true;
      setMuted(true);
      void video.play().catch(() => undefined);
    });
  }, [open, source]);

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted) void video.play().catch(() => undefined);
  }

  return (
    <>
      <div className={cn('flex items-center gap-5', className)}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={cta}
          className={cn(
            'grid size-[74px] shrink-0 place-items-center rounded-full',
            'border border-white/30 bg-white/10 backdrop-blur-md',
            'text-2xl font-bold text-white',
            'shadow-[0_10px_30px_rgba(0,0,0,0.35)]',
            'transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]',
            'hover:scale-110 hover:border-white hover:bg-white hover:text-black',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
          )}
        >
          {label}
        </button>

        <span className="text-[0.85rem] uppercase tracking-[0.2em] text-white/80">{cta}</span>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={cta}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[400] bg-black"
            style={{ height: '100dvh' }}
          >
            {source?.kind === 'youtube' ? (
              // autoplay=1 inside a window the visitor just opened by clicking:
              // the gesture carries, so the film starts with sound.
              <iframe
                src={filmEmbedUrl(source.id, typeof window !== 'undefined' ? window.location.origin : undefined)}
                title={cta}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                onLoad={() => setReady(true)}
                className="size-full border-0"
              />
            ) : source?.kind === 'file' ? (
              <video
                ref={videoRef}
                playsInline
                controls={ready}
                poster={still ?? undefined}
                onCanPlay={() => setReady(true)}
                onEnded={close}
                className="size-full object-contain"
              >
                <source src={source.url} type="video/mp4" />
              </video>
            ) : null}

            {!ready && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <Loader2 className="size-7 animate-spin text-white/70" />
              </div>
            )}

            <div
              className="absolute end-4 top-4 z-10 flex items-center gap-2 sm:end-8 sm:top-8"
              style={{ paddingTop: 'env(safe-area-inset-top)', paddingInlineEnd: 'env(safe-area-inset-right)' }}
            >
              {source?.kind === 'file' && muted && (
                <button
                  type="button"
                  onClick={toggleSound}
                  aria-label="Unmute"
                  className="grid size-12 place-items-center rounded-full border border-white/30 bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-white/20"
                >
                  <VolumeX className="size-5" />
                </button>
              )}
              {source?.kind === 'file' && !muted && ready && (
                <button
                  type="button"
                  onClick={toggleSound}
                  aria-label="Mute"
                  className="hidden size-12 place-items-center rounded-full border border-white/30 bg-black/50 text-white/70 backdrop-blur-md transition-colors hover:bg-white/20 sm:grid"
                >
                  <Volume2 className="size-5" />
                </button>
              )}

              <button
                type="button"
                onClick={close}
                className={cn(
                  'flex items-center gap-2 rounded-full border border-white/30 bg-black/60 px-5 py-3',
                  'text-[0.8rem] uppercase tracking-[0.1em] text-white backdrop-blur-md',
                  'transition-colors hover:bg-white/20',
                )}
              >
                {backLabel}
                <X className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

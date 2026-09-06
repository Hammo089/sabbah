'use client';

// components/site/anniversary-mark.tsx
// The 71 button itself — the round glass disc, its idle animation and its
// hover behaviour, separated from the fullscreen player that it opens.
//
// Split out for one reason: a custom artwork is coming for this button. When it
// arrives it becomes an <Image> inside the same shell and every bit of motion
// below keeps working untouched.
//
// The idle state is deliberately alive but quiet. A button that only reacts on
// hover is invisible to someone who never hovers — on a phone, that is
// everyone. The breathing halo says "this does something" without demanding
// attention, and the whole thing stops for `prefers-reduced-motion`.
import * as React from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AnniversaryMark({
  label,
  artworkUrl,
  onOpen,
  cta,
  size = 78,
}: {
  label: string;
  /** Custom artwork; falls back to the number set in type. */
  artworkUrl?: string | null;
  onOpen: () => void;
  cta: string;
  size?: number;
}) {
  const reduce = useReducedMotion();
  const [hover, setHover] = React.useState(false);

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      aria-label={cta}
      className="group relative grid shrink-0 place-items-center rounded-full focus-visible:outline-none"
      style={{ width: size, height: size }}
    >
      {/* Halo — two rings breathing out of phase, so the pulse never looks
          mechanical. Pure transform/opacity, so it costs no layout. */}
      {!reduce &&
        [0, 1].map((ring) => (
          <motion.span
            key={ring}
            aria-hidden
            className="absolute inset-0 rounded-full border border-primary/40"
            animate={{ scale: [1, 1.45, 1], opacity: [0.5, 0, 0.5] }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: 'easeOut',
              delay: ring * 1.6,
            }}
          />
        ))}

      {/* The travelling gold arc — the brand's film-reel motif, rotating. */}
      {!reduce && (
        <motion.span
          aria-hidden
          className="absolute inset-[-3px] rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg, transparent 260deg, hsl(var(--primary)) 330deg, hsl(var(--accent)) 352deg, transparent 360deg)',
            WebkitMask:
              'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: hover ? 2.4 : 7, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* The disc */}
      <motion.span
        className={cn(
          'relative grid size-full place-items-center overflow-hidden rounded-full',
          'border border-white/30 bg-white/10 backdrop-blur-md',
          'shadow-[0_10px_30px_rgba(0,0,0,0.35)]',
        )}
        animate={
          reduce
            ? undefined
            : { scale: hover ? 1.1 : 1, backgroundColor: hover ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.1)' }
        }
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {artworkUrl ? (
          <Image
            src={artworkUrl}
            alt=""
            fill
            sizes="96px"
            className="object-contain p-2.5"
          />
        ) : (
          <motion.span
            className="text-2xl font-bold leading-none"
            animate={{ color: hover && !reduce ? '#000000' : '#ffffff' }}
            transition={{ duration: 0.35 }}
          >
            {label}
          </motion.span>
        )}

        {/* On hover the number gives way to a play glyph — the button says
            what it does at the moment the visitor is about to press it. */}
        {!artworkUrl && (
          <motion.span
            aria-hidden
            className="absolute inset-0 grid place-items-center text-black"
            initial={false}
            animate={{ opacity: hover && !reduce ? 1 : 0, scale: hover ? 1 : 0.7 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Play className="size-6 fill-current" />
          </motion.span>
        )}
      </motion.span>
    </button>
  );
}

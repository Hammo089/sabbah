// components/site/brand-loader.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

type Style = 'ring' | 'sweep' | 'pulse' | 'none';

/**
 * Route-transition curtain: the Sabbah mark with a gold band travelling around
 * it. Next.js App Router transitions are streamed, so there is no "navigation
 * finished" event to hook — the curtain is instead raised by a pathname change
 * and lowered on a timer the operator controls from /admin/appearance.
 *
 * Falls back to the wordmark when no logo file is configured, so the curtain
 * never renders a broken image.
 */
export function BrandLoader({
  style = 'ring',
  speed = 1400,
  logoUrl,
  wordmark = 'SABBAH',
}: {
  style?: Style;
  speed?: number;
  logoUrl?: string | null;
  wordmark?: string;
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [visible, setVisible] = React.useState(false);
  const first = React.useRef(true);

  React.useEffect(() => {
    if (style === 'none' || reduce) return;

    // Do not curtain the first paint — that only delays the landing page.
    if (first.current) {
      first.current = false;
      return;
    }

    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), speed);
    return () => window.clearTimeout(timer);
  }, [pathname, style, speed, reduce]);

  if (style === 'none') return null;

  const duration = Math.max(speed, 600) / 1000;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="brand-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="pointer-events-none fixed inset-0 z-[300] grid place-items-center bg-background/92 backdrop-blur-sm"
          aria-hidden
        >
          <div className="relative grid size-40 place-items-center">
            {/* The travelling gold band */}
            {style === 'ring' && (
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    'conic-gradient(from 0deg, transparent 0deg, transparent 250deg, hsl(var(--primary)) 320deg, hsl(var(--accent)) 350deg, transparent 360deg)',
                  WebkitMask:
                    'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
                  mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: duration * 0.75, ease: 'linear', repeat: Infinity }}
              />
            )}

            {style === 'sweep' && (
              <span className="absolute inset-x-0 bottom-0 h-px overflow-hidden">
                <motion.span
                  className="block h-px w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{ duration: duration * 0.7, ease: 'easeInOut', repeat: Infinity }}
                />
              </span>
            )}

            {style === 'pulse' && (
              <motion.span
                className="absolute inset-4 rounded-full border border-primary/40"
                animate={{ scale: [0.9, 1.08, 0.9], opacity: [0.25, 0.7, 0.25] }}
                transition={{ duration: duration * 0.8, ease: 'easeInOut', repeat: Infinity }}
              />
            )}

            {/* The mark */}
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative grid size-24 place-items-center"
            >
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt=""
                  width={96}
                  height={96}
                  className="size-full object-contain"
                  priority
                />
              ) : (
                <span className="text-display text-lg tracking-[0.32em] text-primary">
                  {wordmark}
                </span>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

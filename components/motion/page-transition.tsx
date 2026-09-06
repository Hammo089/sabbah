'use client';

// components/motion/page-transition.tsx
import * as React from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useMotionAllowed } from './use-motion-allowed';

/**
 * The transition between routes.
 *
 * Keyed on the pathname so React remounts it on every navigation, which is what
 * makes the enter animation replay. There is no exit animation on purpose: the
 * App Router streams the next page in, so an exit would have to hold the old
 * page on screen and would fight the streaming rather than help it.
 *
 * The BrandLoader curtain runs over the top of this. Its default 1400 ms covers
 * the swap, so this stays short and subtle — the two are layered, not racing.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { reveal } = useMotionAllowed();

  if (!reveal) return <>{children}</>;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

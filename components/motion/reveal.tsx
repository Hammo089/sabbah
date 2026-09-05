// components/motion/reveal.tsx
'use client';

import * as React from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * "Bottom coming up" scroll reveal. Wrap any section; children with
 * `data-reveal-child` inherit the stagger.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  distance = 36,
  once = true,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  once?: boolean;
  as?: 'div' | 'section' | 'article' | 'li';
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[Tag] as typeof motion.div;

  const variants: Variants = React.useMemo(
    () => ({
      hidden: reduce ? { opacity: 1 } : { opacity: 0, y: distance, filter: 'blur(5px)' },
      show: reduce
        ? { opacity: 1 }
        : { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: EASE, delay } },
    }),
    [reduce, distance, delay],
  );

  return (
    <MotionTag
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.25, margin: '0px 0px -12% 0px' }}
      className={cn(className)}
    >
      {children}
    </MotionTag>
  );
}

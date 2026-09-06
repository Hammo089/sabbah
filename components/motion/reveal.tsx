'use client';

// components/motion/reveal.tsx
// The scroll-reveal used on every page: content fades and rises as it enters
// the viewport, once, never replaying on the way back up.
import * as React from 'react';
import { motion, type Variants } from 'framer-motion';
import { useMotionAllowed } from './use-motion-allowed';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

export type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'none';

function offset(direction: RevealDirection, distance: number) {
  switch (direction) {
    case 'up': return { y: distance };
    case 'down': return { y: -distance };
    case 'left': return { x: distance };
    case 'right': return { x: -distance };
    default: return {};
  }
}

/**
 * One block that reveals itself.
 *
 * `delay` staggers siblings by hand; for a list, wrap it in <RevealGroup> and
 * give each child <RevealItem> instead — the group drives the stagger so the
 * timings stay in step even as items are added.
 */
export function Reveal({
  children,
  direction = 'up',
  distance = 28,
  delay = 0,
  duration = 0.7,
  once = true,
  amount = 0.25,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  direction?: RevealDirection;
  distance?: number;
  delay?: number;
  duration?: number;
  once?: boolean;
  /** How much of the block must be visible before it plays (0–1). */
  amount?: number;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li' | 'header' | 'aside';
}) {
  const { reveal } = useMotionAllowed();
  const Motion = motion[Tag];

  if (!reveal) return <Tag className={className}>{children}</Tag>;

  return (
    <Motion
      initial={{ opacity: 0, ...offset(direction, distance) }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: EASE }}
      className={className}
    >
      {children}
    </Motion>
  );
}

const GROUP: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const ITEM: Variants = {
  hidden: { opacity: 0, y: 28 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

/** Parent for a list whose children should arrive one after another. */
export function RevealGroup({
  children,
  className,
  amount = 0.2,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  amount?: number;
  as?: 'div' | 'section' | 'ul' | 'ol';
}) {
  const { reveal } = useMotionAllowed();
  const Motion = motion[Tag];

  if (!reveal) return <Tag className={className}>{children}</Tag>;

  return (
    <Motion
      variants={GROUP}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount }}
      className={className}
    >
      {children}
    </Motion>
  );
}

export function RevealItem({
  children,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'li' | 'article';
}) {
  const { reveal } = useMotionAllowed();
  const Motion = motion[Tag];

  if (!reveal) return <Tag className={className}>{children}</Tag>;

  return (
    <Motion variants={ITEM} className={className}>
      {children}
    </Motion>
  );
}

/**
 * Headline that arrives word by word — the one flourish reserved for a section
 * title, never for body copy.
 */
export function RevealWords({
  text,
  className,
  wordClassName,
  delay = 0,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
}) {
  const { reveal } = useMotionAllowed();
  const words = text.split(/\s+/).filter(Boolean);

  if (!reveal) return <span className={className}>{text}</span>;

  return (
    <motion.span
      className={cn('inline-block', className)}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.5 }}
      variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.06, delayChildren: delay } } }}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className={cn('inline-block', wordClassName)}
          variants={{
            hidden: { opacity: 0, y: '0.4em' },
            shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
          }}
        >
          {word}
          {i < words.length - 1 && ' '}
        </motion.span>
      ))}
    </motion.span>
  );
}

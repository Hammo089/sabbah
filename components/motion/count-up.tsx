'use client';

// components/motion/count-up.tsx
import * as React from 'react';
import { animate, useInView } from 'framer-motion';
import { useMotionAllowed } from './use-motion-allowed';

/**
 * A number that counts up the first time it is scrolled into view.
 *
 * The final value is rendered on the server and is what sits in the DOM before
 * hydration, so the figure is correct for search engines, for reduced-motion
 * visitors, and in the split second before the animation starts. The count is
 * decoration layered on top of a correct number, never a replacement for it.
 */
export function CountUp({
  value,
  duration = 1.6,
  className,
  suffix,
}: {
  /** The real figure. Rendered as-is when motion is off. */
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const { reveal } = useMotionAllowed();
  const [display, setDisplay] = React.useState(value);
  const started = React.useRef(false);

  React.useEffect(() => {
    if (!inView || !reveal || started.current) return;
    started.current = true;

    // Start from a believable distance below, not from zero, so a large number
    // does not spend most of the animation reading as a different number.
    const from = value > 1000 ? Math.floor(value * 0.92) : 0;
    setDisplay(from);

    const controls = animate(from, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });

    return () => controls.stop();
  }, [inView, reveal, value, duration]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString('en-US')}
      {suffix}
    </span>
  );
}

/**
 * The same effect for a value that is not purely numeric — "70", "200+", "5".
 * Anything non-numeric is printed untouched rather than guessed at.
 */
export function CountUpText({
  value,
  className,
  duration,
}: {
  value: string;
  className?: string;
  duration?: number;
}) {
  const match = value.match(/^(\D*)(\d[\d,]*)(.*)$/);

  if (!match) return <span className={className}>{value}</span>;

  const [, prefix, digits, suffix] = match as unknown as [string, string, string, string];
  const numeric = Number(digits.replace(/,/g, ''));

  if (!Number.isFinite(numeric)) return <span className={className}>{value}</span>;

  return (
    <span className={className}>
      {prefix}
      <CountUp value={numeric} duration={duration} />
      {suffix}
    </span>
  );
}

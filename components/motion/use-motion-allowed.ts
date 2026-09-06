'use client';

// components/motion/use-motion-allowed.ts
import * as React from 'react';

/**
 * The single gate for every decorative animation on the site.
 *
 * Continuous motion — a drifting collage, two marquee rows, parallax — is what
 * makes a phone hot and a laptop fan spin. Rather than scatter that judgement
 * across components, every animated component asks here, and this one hook
 * decides:
 *
 *  - `prefers-reduced-motion: reduce` → no continuous motion, ever.
 *  - Save-Data or a 2G-class connection → the visitor is paying for bytes.
 *  - ≤4 logical cores or ≤4 GB RAM → a low-end phone drops frames instead.
 *
 * Reveal-on-scroll is cheap and stays on everywhere except reduced-motion,
 * so the two answers are returned separately.
 */
export type MotionAllowance = {
  /** One-shot entrance animations (fade + rise as a section scrolls in). */
  reveal: boolean;
  /** Never-ending animation: drifting cards, marquees, parallax. */
  ambient: boolean;
};

export function useMotionAllowed(): MotionAllowance {
  // Server render and first paint assume reveal-only: it is the safe middle —
  // no layout shift, and no continuous work started before we know the device.
  const [allowance, setAllowance] = React.useState<MotionAllowance>({
    reveal: true,
    ambient: false,
  });

  React.useEffect(() => {
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
      deviceMemory?: number;
    };

    function evaluate() {
      if (calm.matches) {
        setAllowance({ reveal: false, ambient: false });
        return;
      }

      const saveData = nav.connection?.saveData === true;
      const slowLink = /(^|-)2g$/.test(nav.connection?.effectiveType ?? '');
      const weakCpu = (navigator.hardwareConcurrency ?? 8) <= 4;
      const weakRam = (nav.deviceMemory ?? 8) <= 4;

      setAllowance({
        reveal: true,
        ambient: !(saveData || slowLink || weakCpu || weakRam),
      });
    }

    evaluate();
    calm.addEventListener('change', evaluate);
    return () => calm.removeEventListener('change', evaluate);
  }, []);

  return allowance;
}

/** Pauses continuous work while the tab is hidden — a background tab costs nothing. */
export function useTabVisible(): boolean {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    onChange();
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return visible;
}

// components/site/hero/hero-copy.tsx
'use client';

import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { localeDirection, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.085, delayChildren: 0.12 } },
};

const riseUp: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.85, ease: EASE } },
};

const hairline: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  show: { scaleX: 1, opacity: 1, transition: { duration: 1.1, ease: EASE } },
};

export function HeroCopy({
  lang,
  dict,
  libraryCount,
}: {
  lang: Locale;
  dict: Dictionary;
  libraryCount: number;
}) {
  const reduce = useReducedMotion();
  const isRtl = localeDirection[lang] === 'rtl';

  const variants = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : undefined;

  return (
    <motion.div
      variants={reduce ? variants : container}
      initial="hidden"
      animate="show"
      className={cn(
        'relative z-10 flex max-w-2xl flex-col',
        'py-10 lg:py-32',
        isRtl && 'text-right',
      )}
    >
      {/* Eyebrow */}
      <motion.div variants={reduce ? variants : riseUp} className="flex items-center gap-3">
        <span className="inline-block h-px w-8 bg-primary/70" />
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.32em] text-primary">
          {dict.hero.established}
        </span>
      </motion.div>

      {/* Headline — line-by-line reveal */}
      <h1 id="hero-heading" className="mt-7">
        <span className="sr-only">{dict.hero.title}</span>
        {[dict.hero.titlesLine1, dict.hero.titlesLine2, dict.hero.titlesLine3].map((line, i) => (
          <span key={i} className="block overflow-hidden">
            <motion.span
              aria-hidden
              variants={reduce ? variants : riseUp}
              className={cn(
                'block text-display text-[clamp(2.6rem,6.4vw,5.4rem)] font-light leading-[0.98] tracking-[-0.02em]',
                i === 2 ? 'text-primary' : 'text-neutral-50',
                lang === 'ar' && 'font-arabic font-medium leading-[1.25] tracking-normal',
              )}
            >
              {line}
            </motion.span>
          </span>
        ))}
      </h1>

      {/* Gold rule */}
      <motion.span
        variants={reduce ? variants : hairline}
        style={{ transformOrigin: isRtl ? 'right' : 'left' }}
        className="mt-9 block h-px w-40 bg-gradient-to-r from-primary via-primary/50 to-transparent rtl:bg-gradient-to-l"
      />

      {/* Subtitle */}
      <motion.p
        variants={reduce ? variants : riseUp}
        className="mt-8 max-w-xl text-balance text-[1.02rem] leading-relaxed text-neutral-300/90 md:text-lg"
      >
        {dict.hero.subtitle}
      </motion.p>

      {/* Offices */}
      <motion.p
        variants={reduce ? variants : riseUp}
        className="mt-6 text-[0.72rem] uppercase tracking-[0.26em] text-neutral-500"
      >
        {dict.hero.offices}
      </motion.p>

      {/* CTAs */}
      <motion.div
        variants={reduce ? variants : riseUp}
        className="mt-11 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <Button asChild variant="gold" size="lg" className="group">
          <Link href={`/${lang}/catalog`}>
            {dict.hero.ctaPrimary}
            <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </Link>
        </Button>

        <Button asChild variant="outline" size="lg" className="group text-neutral-200">
          <Link href={`/${lang}/legacy`}>
            <Play className="fill-primary text-primary transition-transform duration-300 group-hover:scale-110" />
            {dict.hero.ctaSecondary}
          </Link>
        </Button>
      </motion.div>

      {/* Library counter */}
      {libraryCount > 0 && (
        <motion.p
          variants={reduce ? variants : riseUp}
          className="mt-10 flex items-baseline gap-2 text-neutral-500"
        >
          <span className="text-display text-2xl text-primary">{libraryCount}+</span>
          <span className="text-xs uppercase tracking-[0.2em]">{dict.hero.featuredCount}</span>
        </motion.p>
      )}
    </motion.div>
  );
}

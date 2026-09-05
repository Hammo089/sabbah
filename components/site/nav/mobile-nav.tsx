// components/site/nav/mobile-nav.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function MobileNav({
  items,
  label,
}: {
  items: { href: string; label: string }[];
  label: string;
}) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        className={cn(
          'inline-flex size-9 items-center justify-center rounded-md border border-border',
          'text-muted-foreground transition-colors hover:text-foreground lg:hidden',
        )}
      >
        <Menu className="size-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-[#000000] lg:hidden"
          >
            <div className="flex h-16 items-center justify-end px-6">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="close"
                className="inline-flex size-9 items-center justify-center rounded-md border border-white/10 text-neutral-400"
              >
                <X className="size-4" />
              </button>
            </div>

            <nav className="flex flex-col gap-1 px-6 pt-6">
              {items.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-white/[0.06] py-4 text-display text-2xl font-light text-neutral-100"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

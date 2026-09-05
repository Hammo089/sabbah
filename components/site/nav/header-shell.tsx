// components/site/nav/header-shell.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/** Transparent over the hero, solid once the visitor scrolls past it. */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [solid, setSolid] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-colors duration-300',
        solid
          ? 'border-b border-white/[0.07] bg-[#000000]/85 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      {children}
    </header>
  );
}

// components/site/nav/header-shell.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/** Transparent over the hero, solid once the visitor scrolls past it. */
export function HeaderShell({
  children,
  alwaysSolid = false,
}: {
  children: React.ReactNode;
  alwaysSolid?: boolean;
}) {
  const [solid, setSolid] = React.useState(alwaysSolid);

  React.useEffect(() => {
    if (alwaysSolid) return;
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [alwaysSolid]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-colors duration-300',
        solid || alwaysSolid
          ? 'border-b border-border bg-background/85 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      {children}
    </header>
  );
}
